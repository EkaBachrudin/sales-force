import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import {
  CrmLeadStatus,
  CrmActivityType,
  PipelineStage,
  PipelineLeadItem,
  GetPipelineQuery,
  PipelineStagesSummary,
  PipelineResponse,
  UpdateLeadStatusDto,
  UpdateLeadStatusResponse,
  PipelineMetricsResponse,
  CrmLead,
  CrmLeadActivity,
} from '../types';

/**
 * Pipeline Stage Configuration
 * Hardcoded stage definitions based on API spec
 */
const PIPELINE_STAGES: Omit<PipelineStage, 'lead_count' | 'leads'>[] = [
  {
    id: CrmLeadStatus.NEW,
    name: 'Baru Masuk',
    name_en: 'New',
    order: 1,
    color: '#6B7280',
  },
  {
    id: CrmLeadStatus.CONTACTED,
    name: 'Dikontak',
    name_en: 'Contacted',
    order: 2,
    color: '#3B82F6',
  },
  {
    id: CrmLeadStatus.SURVEYED,
    name: 'Survey',
    name_en: 'Surveyed',
    order: 3,
    color: '#8B5CF6',
  },
  {
    id: CrmLeadStatus.NEGOTIATING,
    name: 'Negosiasi',
    name_en: 'Negotiating',
    order: 4,
    color: '#F59E0B',
  },
  {
    id: CrmLeadStatus.CLOSED,
    name: 'Closing',
    name_en: 'Closed',
    order: 5,
    color: '#10B981',
  },
  {
    id: CrmLeadStatus.CANCELLED,
    name: 'Batal',
    name_en: 'Cancelled',
    order: 6,
    color: '#EF4444',
  },
];

/**
 * Validate status value
 */
const validateStatus = (status: string): status is CrmLeadStatus => {
  return Object.values(CrmLeadStatus).includes(status as CrmLeadStatus);
};

/**
 * GET /api/v1/pipeline - Get Pipeline Data
 * Retrieves all leads grouped by pipeline stage for kanban board rendering
 */
export const getPipelineData = async (query: GetPipelineQuery, userId: string): Promise<PipelineResponse> => {
  const { page = 1, limit = 20, search } = query;

  // Validate limit (max 50)
  const validatedLimit = Math.min(Math.max(1, limit), 50);
  const offset = (page - 1) * validatedLimit;

  // Build search filter for name
  const searchFilter = search ? ` AND l.name ILIKE $3` : '';
  const searchParams = search ? [`%${search}%`] : [];

  // Build stages with leads
  const stages: PipelineStage[] = [];
  let totalLeads = 0;
  const stagesSummary: PipelineStagesSummary = {
    new: 0,
    contacted: 0,
    surveyed: 0,
    negotiating: 0,
    booked: 0,
    closed: 0,
    cancelled: 0,
  };

  for (const stage of PIPELINE_STAGES) {
    // Get lead count for this stage
    const countQuery = `
      SELECT COUNT(*) as count
      FROM leads l
      WHERE l.status = $1 AND l.assigned_to = $2${searchFilter}
    `;
    const countResult = await pool.query(countQuery, [stage.id, userId, ...searchParams]);
    const leadCount = parseInt(countResult.rows[0].count, 10);
    stagesSummary[stage.id] = leadCount;
    totalLeads += leadCount;

    // Get leads for this stage with pagination and search
    const leadsQuery = `
      SELECT
        l.id,
        l.name,
        l.next_follow_up_at,
        l.created_at,
        l.updated_at,
        p.name as property_name
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      WHERE l.status = $1 AND l.assigned_to = $2${searchFilter}
      ORDER BY l.updated_at DESC
      LIMIT $${search ? '4' : '3'} OFFSET $${search ? '5' : '4'}
    `;
    const leadsResult = await pool.query(leadsQuery, [stage.id, userId, ...searchParams, validatedLimit, offset]);

    const leads: PipelineLeadItem[] = leadsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      property_name: row.property_name || undefined,
      next_follow_up_at: row.next_follow_up_at || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    stages.push({
      ...stage,
      lead_count: leadCount,
      leads,
    });
  }

  return {
    stages,
    meta: {
      total_leads: totalLeads,
      stages_summary: stagesSummary,
    },
  };
};

/**
 * PUT /api/v1/leads/:id/status - Update Lead Status (Drag & Drop)
 * Updates lead status when dragging between kanban columns
 */
export const updateLeadStatus = async (
  leadId: string,
  dto: UpdateLeadStatusDto,
  userId: string
): Promise<UpdateLeadStatusResponse> => {
  // Validate status
  if (!validateStatus(dto.status)) {
    throw new AppError(
      'Status must be one of: new, contacted, surveyed, negotiating, closed, cancelled',
      422
    );
  }


  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if lead exists and is assigned to this user
    const leadCheck = await client.query(
      'SELECT * FROM leads WHERE id = $1 AND assigned_to = $2',
      [leadId, userId]
    );

    if (leadCheck.rows.length === 0) {
      throw new AppError('Lead not found or access denied', 404);
    }

    const currentLead = leadCheck.rows[0];
    const oldStatus = currentLead.status;

    // Update lead status
    const updateQuery = `
      UPDATE leads
      SET
        status = $2,
        updated_at = NOW()
      WHERE id = $1 AND assigned_to = $3
      RETURNING *
    `;
    const updateResult = await client.query(updateQuery, [leadId, dto.status, userId]);
    const updatedLead = updateResult.rows[0];

    // Insert activity log
    const notes = dto.reason || (dto.status === CrmLeadStatus.CANCELLED ? 'cancelled' : `Status changed from ${oldStatus} to ${dto.status}`);

    const activityQuery = `
      INSERT INTO lead_activities (id, lead_id, user_id, activity_type, old_status, new_status, notes)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const activityResult = await client.query(activityQuery, [
      leadId,
      userId,
      CrmActivityType.STATUS_CHANGE,
      oldStatus,
      dto.status,
      notes,
    ]);
    const activity = activityResult.rows[0];

    await client.query('COMMIT');

    // Get unit details if unit_id exists
    let unit;
    if (updatedLead.unit_id) {
      const unitResult = await client.query(
        `SELECT
          u.id,
          u.name,
          u.land_area,
          u.status,
          b.id as block_id,
          b.name as block_name,
          p.id as property_id,
          p.name as property_name,
          p.city
        FROM units u
        JOIN blocks b ON u.block_id = b.id
        JOIN properties p ON b.property_id = p.id
        WHERE u.id = $1`,
        [updatedLead.unit_id]
      );
      if (unitResult.rows.length > 0) {
        const unitRow = unitResult.rows[0];
        unit = {
          id: unitRow.id,
          name: unitRow.name,
          land_area: unitRow.land_area,
          status: unitRow.status,
          block: {
            id: unitRow.block_id,
            name: unitRow.block_name,
          },
          property: {
            id: unitRow.property_id,
            name: unitRow.property_name,
            city: unitRow.city,
          },
        };
      }
    }

    // Build lead response
    const lead: CrmLead = {
      id: updatedLead.id,
      name: updatedLead.name,
      phone: updatedLead.phone,
      email: updatedLead.email || undefined,
      status: updatedLead.status,
      source: updatedLead.source,
      unit_id: updatedLead.unit_id || undefined,
      budget_range: updatedLead.budget_range || undefined,
      down_payment: updatedLead.down_payment || undefined,
      down_payment_percentage: updatedLead.down_payment_percentage || undefined,
      interest_rate: updatedLead.interest_rate || undefined,
      loan_term_years: updatedLead.loan_term_years || undefined,
      estimated_monthly_payment: updatedLead.estimated_monthly_payment || undefined,
      assigned_to: updatedLead.assigned_to || undefined,
      next_follow_up_at: updatedLead.next_follow_up_at || undefined,
      created_at: updatedLead.created_at,
      updated_at: updatedLead.updated_at,
      unit,
    };

    // Build activity response
    const activityResponse: CrmLeadActivity = {
      id: activity.id,
      lead_id: activity.lead_id,
      user_id: activity.user_id,
      activity_type: activity.activity_type as CrmActivityType,
      old_status: activity.old_status as CrmLeadStatus,
      new_status: activity.new_status as CrmLeadStatus,
      notes: activity.notes,
      created_at: activity.created_at,
    };

    return {
      lead,
      activity: activityResponse,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * GET /api/v1/pipeline/metrics - Get Pipeline Metrics
 * Retrieves summary metrics for pipeline overview
 */
export const getPipelineMetrics = async (userId: string): Promise<PipelineMetricsResponse> => {
  const metricsQuery = `
    WITH metrics AS (
      SELECT
        COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
        COUNT(*) FILTER (WHERE status = 'surveyed') as surveyed_count,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as this_month_count,
        COUNT(*) as total_count,
        AVG(EXTRACT(DAY FROM (updated_at - created_at))) FILTER (WHERE status = 'closed') as avg_days_to_close
      FROM leads
      WHERE assigned_to = $1
    )
    SELECT
      total_count as total_leads,
      this_month_count as this_month,
      surveyed_count as surveyed,
      closed_count as closed,
      CASE
        WHEN total_count > 0 THEN ROUND((closed_count::NUMERIC / total_count::NUMERIC) * 100, 2)
        ELSE 0
      END as conversion_rate,
      COALESCE(ROUND(avg_days_to_close::NUMERIC, 1), 0) as avg_time_to_close
    FROM metrics
  `;

  const result = await pool.query(metricsQuery, [userId]);
  const row = result.rows[0];

  return {
    total_leads: parseInt(row.total_leads, 10),
    this_month: parseInt(row.this_month, 10),
    surveyed: parseInt(row.surveyed, 10),
    closed: parseInt(row.closed, 10),
    conversion_rate: parseFloat(row.conversion_rate),
    avg_time_to_close: parseFloat(row.avg_time_to_close),
  };
};
