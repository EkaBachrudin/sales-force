import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import ExcelJS from 'exceljs';
import {
  CrmLead as Lead,
  CrmLeadListItem,
  CrmLeadActivity as LeadActivity,
  CrmWhatsAppMessage as WhatsAppMessage,
  CrmReminderSchedule as ReminderSchedule,
  CrmProperty as Property,
  CrmLeadDetailResponse as LeadDetailResponse,
  GetLeadsQuery,
  CrmCreateLeadDto as CreateLeadDto,
  CrmUpdateLeadDto as UpdateLeadDto,
  CrmAddActivityDto as AddActivityDto,
  GetPropertiesQuery,
  CrmLeadStatus as LeadStatusEnum,
  CrmActivityType as ActivityTypeEnum,
} from '../types';
import { lockUnitForBooking, findBookedLeadOnUnit, revokeOtherLeadsOnUnit } from './leadUnitRules';

/**
 * Calculate estimated monthly payment for KPR simulation
 */
const calculateMonthlyPayment = (
  propertyPrice: number,
  downPaymentPercentage: number,
  interestRate: number,
  loanTermYears: number
): number => {
  const principal = propertyPrice * (1 - downPaymentPercentage / 100);
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;

  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }

  const monthlyPayment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return Math.round(monthlyPayment);
};

/**
 * Validate phone number format (10-20 digits, numeric only)
 */
const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\d{10,20}$/;
  return phoneRegex.test(phone.replace(/\+/g, '').replace(/\s/g, ''));
};

/**
 * Validate email format
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate NIK (16 digits if provided)
 */
const validateNIK = (nik?: string): boolean => {
  if (!nik) return true;
  return /^\d{16}$/.test(nik);
};

/**
 * Validate NPWP (15-20 digits if provided)
 */
const validateNPWP = (npwp?: string): boolean => {
  if (!npwp) return true;
  return /^\d{15,20}$/.test(npwp.replace(/[-.]/g, ''));
};

/**
 * GET /api/v1/leads - List Leads with Pagination & Filters
 * @param query - Query parameters for filtering and pagination
 * @param userId - The ID of the user to get leads for
 */
export const getLeads = async (query: GetLeadsQuery, userId: string, userRole: string): Promise<{
  leads: CrmLeadListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  const {
    page = 1,
    limit = 50,
    status,
    statuses,
    search,
    start_date,
    end_date,
    property_id,
    source,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = query;

  // RBAC: Admin & Supervisor see ALL leads; Sales only their own
  const isPrivilegedRole = userRole === 'Admin' || userRole === 'Supervisor';

  // Build WHERE conditions
  const params: any[] = [userId, isPrivilegedRole];
  let paramIndex = 3;
  const conditions: string[] = ['(l.assigned_to = $1 OR $2::boolean)'];

  // Default date range: 1 year ago to today
  const defaultStartDate = new Date();
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);

  const startDate = start_date ? new Date(start_date + 'T00:00:00') : defaultStartDate;
  const endDate = end_date ? new Date(end_date + 'T23:59:59') : new Date();

  conditions.push(`l.created_at >= $${paramIndex++}`);
  params.push(startDate);

  conditions.push(`l.created_at <= $${paramIndex++}`);
  params.push(endDate);

  if (statuses && statuses.length > 0) {
    const validStatuses = statuses.filter((s) => Object.values(LeadStatusEnum).includes(s));
    if (validStatuses.length > 0) {
      const placeholders = validStatuses.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`l.status IN (${placeholders})`);
      params.push(...validStatuses);
    }
  } else if (status) {
    conditions.push(`l.status = $${paramIndex++}`);
    params.push(status);
  }

  if (search) {
    conditions.push(`(l.name ILIKE $${paramIndex++} OR l.phone ILIKE $${paramIndex++})`);
    params.push(`%${search}%`, `%${search}%`);
  }

  if (property_id) {
    conditions.push(`p.id = $${paramIndex++}`);
    params.push(property_id);
  }

  if (source) {
    conditions.push(`l.source ILIKE $${paramIndex++}`);
    params.push(`%${source}%`);
  }

  // Validate and set sort column
  const validSortColumns = ['created_at', 'updated_at', 'name', 'status', 'next_follow_up_at'];
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
  const sortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(DISTINCT l.id) as total
    FROM leads l
    LEFT JOIN units u ON l.unit_id = u.id
    LEFT JOIN blocks b ON u.block_id = b.id
    LEFT JOIN properties p ON b.property_id = p.id
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Get leads with pagination
  const offset = (page - 1) * limit;
  const leadsQuery = `
    SELECT
      l.id,
      l.name,
      l.phone,
      l.status,
      l.source,
      l.created_at,
      l.updated_at,
      u.id AS unit_id_detail,
      u.name AS unit_name,
      b.name AS block_name,
      p.id AS property_id,
      p.name AS property_name
    FROM leads l
    LEFT JOIN units u ON l.unit_id = u.id
    LEFT JOIN blocks b ON u.block_id = b.id
    LEFT JOIN properties p ON b.property_id = p.id
    ${whereClause}
    ORDER BY l.${sortColumn} ${sortOrder}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);
  const leadsResult = await pool.query(leadsQuery, params);

  const leads: CrmLeadListItem[] = leadsResult.rows.map((row) => {
    const unit = row.unit_id_detail
      ? {
          id: row.unit_id_detail,
          name: row.unit_name,
          block_name: row.block_name,
          property_name: row.property_name,
          property_id: row.property_id,
        }
      : undefined;

    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      status: row.status,
      source: row.source,
      unit,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * GET /api/v1/leads/:id - Get Lead Detail
 * @param leadId - The ID of the lead to get details for
 * @param userId - The ID of the user requesting the lead details
 */
export const getLeadDetail = async (leadId: string, userId: string, userRole: string): Promise<LeadDetailResponse> => {
  // RBAC: Admin & Supervisor see ALL leads; Sales only their own
  const isPrivilegedRole = userRole === 'Admin' || userRole === 'Supervisor';

  // Get lead details - also filter by assigned user (with RBAC)
  const leadQuery = `
    SELECT
      l.*,
      u.full_name as assigned_to_name,
      un.id AS unit_detail_id,
      un.name AS unit_name,
      un.land_area AS unit_land_area,
      un.status AS unit_status,
      b.id AS block_id,
      b.name AS block_name,
      p.id AS property_detail_id,
      p.name AS property_name,
      p.city AS property_city
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    LEFT JOIN units un ON l.unit_id = un.id
    LEFT JOIN blocks b ON un.block_id = b.id
    LEFT JOIN properties p ON b.property_id = p.id
    WHERE l.id = $1 AND (l.assigned_to = $2 OR $3::boolean)
  `;

  const leadResult = await pool.query(leadQuery, [leadId, userId, isPrivilegedRole]);

  if (leadResult.rows.length === 0) {
    throw new AppError('Lead not found', 404);
  }

  const row = leadResult.rows[0];

  const unit = row.unit_detail_id
    ? {
        id: row.unit_detail_id,
        name: row.unit_name,
        land_area: row.unit_land_area,
        status: row.unit_status,
        block: {
          id: row.block_id,
          name: row.block_name,
        },
        property: {
          id: row.property_detail_id,
          name: row.property_name,
          city: row.property_city,
        },
      }
    : undefined;

  const kpr_simulation =
    row.property_price && row.down_payment_percentage && row.interest_rate && row.loan_term_years
      ? {
          property_price: row.property_price,
          down_payment_percentage: row.down_payment_percentage,
          down_payment: row.down_payment,
          interest_rate: row.interest_rate,
          loan_term_years: row.loan_term_years,
          estimated_monthly_payment: row.estimated_monthly_payment,
        }
      : undefined;

  const lead: Lead = {
    id: row.id,
    name: row.name,
    nik: row.nik,
    npwp: row.npwp,
    phone: row.phone,
    email: row.email,
    status: row.status,
    source: row.source,
    unit_id: row.unit_id,
    budget_range: row.budget_range,
    kpr_simulation,
    down_payment: row.down_payment,
    down_payment_percentage: row.down_payment_percentage,
    interest_rate: row.interest_rate,
    loan_term_years: row.loan_term_years,
    estimated_monthly_payment: row.estimated_monthly_payment,
    assigned_to: row.assigned_to,
    assigned_to_name: row.assigned_to_name,
    notes: row.notes,
    next_follow_up_at: row.next_follow_up_at,
    last_followed_up_at: row.last_followed_up_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    unit,
  };

  // Get activities
  const activitiesQuery = `
    SELECT
      la.*,
      u.full_name as user_name
    FROM lead_activities la
    LEFT JOIN users u ON la.user_id = u.id
    WHERE la.lead_id = $1
    ORDER BY la.created_at DESC
  `;
  const activitiesResult = await pool.query(activitiesQuery, [leadId]);
  const activities: LeadActivity[] = activitiesResult.rows.map((r) => ({
    id: r.id,
    lead_id: r.lead_id,
    user_id: r.user_id,
    user_name: r.user_name,
    activity_type: r.activity_type,
    old_status: r.old_status,
    new_status: r.new_status,
    notes: r.notes,
    metadata: r.metadata,
    created_at: r.created_at,
  }));

  // Get WhatsApp messages
  const whatsappQuery = `
    SELECT
      wm.id,
      wm.lead_id,
      wm.user_id,
      wm.direction,
      wm.message_text,
      wm.message_id,
      wm.status,
      wm.sent_at,
      wm.created_at
    FROM whatsapp_messages wm
    WHERE wm.lead_id = $1
    ORDER BY wm.sent_at DESC
  `;
  const whatsappResult = await pool.query(whatsappQuery, [leadId]);
  const whatsapp_messages: WhatsAppMessage[] = whatsappResult.rows.map((r) => ({
    id: r.id,
    lead_id: r.lead_id,
    user_id: r.user_id,
    direction: r.direction,
    message_text: r.message_text,
    message_id: r.message_id,
    status: r.status,
    sent_at: r.sent_at,
    created_at: r.created_at,
  }));

  // Get reminders
  const remindersQuery = `
    SELECT
      id,
      user_id,
      lead_id,
      remind_at,
      message,
      is_completed,
      created_at
    FROM reminder_schedules
    WHERE lead_id = $1 AND is_completed = false
    ORDER BY remind_at ASC
  `;
  const remindersResult = await pool.query(remindersQuery, [leadId]);
  const reminders: ReminderSchedule[] = remindersResult.rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    lead_id: r.lead_id,
    remind_at: r.remind_at,
    message: r.message,
    is_completed: r.is_completed,
    created_at: r.created_at,
  }));

  return {
    lead,
    activities,
    whatsapp_messages,
    reminders,
  };
};

/**
 * POST /api/v1/leads - Create New Lead
 */
export const createLead = async (dto: CreateLeadDto, userId?: string): Promise<Lead> => {
  // Validate required fields
  if (!dto.name || dto.name.trim().length === 0) {
    throw new AppError('Name is required', 400);
  }

  if (!dto.phone || !validatePhoneNumber(dto.phone)) {
    throw new AppError('Phone number must be 10-20 digits', 400);
  }

  if (dto.email && !validateEmail(dto.email)) {
    throw new AppError('Invalid email format', 400);
  }

  if (!validateNIK(dto.nik)) {
    throw new AppError('NIK must be 16 digits', 400);
  }

  if (!validateNPWP(dto.npwp)) {
    throw new AppError('NPWP must be 15-20 digits', 400);
  }

  // Validate unit_id if provided
  if (dto.unit_id) {
    const unitCheck = await pool.query(
      `SELECT u.id, p.id as property_id
       FROM units u
       JOIN blocks b ON u.block_id = b.id
       JOIN properties p ON b.property_id = p.id
       WHERE u.id = $1 AND p.assigned_to = $2`,
      [dto.unit_id, userId]
    );
    if (unitCheck.rows.length === 0) {
      throw new AppError('Unit not found or not owned by user', 404);
    }
    if (unitCheck.rows[0].status === 'sold') {
      throw new AppError('Unit is already sold', 409);
    }
    if (await findBookedLeadOnUnit(pool, dto.unit_id)) {
      throw new AppError('Unit already has a booked lead', 409);
    }
  }

  // Validate KPR simulation if provided
  let estimatedMonthlyPayment: number | undefined;
  let downPayment: number | undefined;
  if (dto.kpr_simulation) {
    const kpr = dto.kpr_simulation;
    if (!kpr.property_price || kpr.property_price <= 0) {
      throw new AppError('Property price must be greater than 0', 400);
    }
    if (!kpr.down_payment_percentage || kpr.down_payment_percentage < 1 || kpr.down_payment_percentage > 100) {
      throw new AppError('Down payment percentage must be between 1 and 100', 400);
    }
    if (!kpr.interest_rate || kpr.interest_rate <= 0) {
      throw new AppError('Interest rate must be greater than 0', 400);
    }
    if (![5, 10, 15, 20, 25].includes(kpr.loan_term_years)) {
      throw new AppError('Loan term must be 5, 10, 15, 20, or 25 years', 400);
    }

    estimatedMonthlyPayment = calculateMonthlyPayment(
      kpr.property_price,
      kpr.down_payment_percentage,
      kpr.interest_rate,
      kpr.loan_term_years
    );
    downPayment = kpr.property_price * (kpr.down_payment_percentage / 100);
  }

  // Validate reminder if provided
  if (dto.reminder && dto.reminder.remind_at && new Date(dto.reminder.remind_at) <= new Date()) {
    throw new AppError('Reminder date must be in the future', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert lead
    const leadQuery = `
      INSERT INTO leads (
        id, assigned_to, unit_id, name, nik, npwp, phone, email, source,
        budget_range, status, notes,
        property_price, down_payment, down_payment_percentage, interest_rate, loan_term_years,
        estimated_monthly_payment
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *
    `;

    const leadValues = [
      userId || null,
      dto.unit_id || null,
      dto.name,
      dto.nik || null,
      dto.npwp || null,
      dto.phone,
      dto.email || null,
      dto.source || 'Visit',
      dto.budget_range ? JSON.stringify(dto.budget_range) : null,
      dto.status || LeadStatusEnum.NEW,
      dto.notes || null,
      dto.kpr_simulation?.property_price || null,
      downPayment || null,
      dto.kpr_simulation?.down_payment_percentage || null,
      dto.kpr_simulation?.interest_rate || null,
      dto.kpr_simulation?.loan_term_years || null,
      estimatedMonthlyPayment || null,
    ];

    const leadResult = await client.query(leadQuery, leadValues);
    const newLead = leadResult.rows[0];

    // Booked business rule: the booked lead claims the unit exclusively
    if (newLead.status === LeadStatusEnum.BOOKED && newLead.unit_id) {
      const unit = await lockUnitForBooking(client, newLead.unit_id);

      if (!unit) {
        throw new AppError('Unit not found', 404);
      }

      const existingBooked = await findBookedLeadOnUnit(client, newLead.unit_id, newLead.id);

      if (existingBooked) {
        throw new AppError('Unit already has a booked lead', 409);
      }

      await revokeOtherLeadsOnUnit(client, newLead.unit_id, newLead.id);
    }

    // Insert activity log
    await client.query(
      `INSERT INTO lead_activities (id, lead_id, user_id, activity_type, new_status, notes)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
      [newLead.id, userId || null, ActivityTypeEnum.NOTE_ADDED, dto.status || LeadStatusEnum.NEW, `Lead created via ${dto.source || 'manual'}`]
    );

    // Insert reminder if provided
    if (dto.reminder) {
      await client.query(
        `INSERT INTO reminder_schedules (id, user_id, lead_id, remind_at, message, is_completed)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
        [userId || null, newLead.id, dto.reminder.remind_at, dto.reminder.message || null, dto.reminder.is_completed || false]
      );
    }

    await client.query('COMMIT');

    // Get unit details if unit_id exists
    let unit;
    if (newLead.unit_id) {
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
        [newLead.unit_id]
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

    const kpr_simulation =
      newLead.property_price && newLead.down_payment_percentage && newLead.interest_rate && newLead.loan_term_years
        ? {
            property_price: newLead.property_price,
            down_payment_percentage: newLead.down_payment_percentage,
            down_payment: newLead.down_payment,
            interest_rate: newLead.interest_rate,
            loan_term_years: newLead.loan_term_years,
            estimated_monthly_payment: newLead.estimated_monthly_payment,
          }
        : undefined;

    return {
      id: newLead.id,
      name: newLead.name,
      phone: newLead.phone,
      email: newLead.email,
      status: newLead.status,
      source: newLead.source,
      unit_id: newLead.unit_id,
      budget_range: newLead.budget_range,
      kpr_simulation,
      down_payment: newLead.down_payment,
      down_payment_percentage: newLead.down_payment_percentage,
      interest_rate: newLead.interest_rate,
      loan_term_years: newLead.loan_term_years,
      estimated_monthly_payment: newLead.estimated_monthly_payment,
      assigned_to: newLead.assigned_to,
      next_follow_up_at: newLead.next_follow_up_at,
      created_at: newLead.created_at,
      updated_at: newLead.updated_at,
      unit,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * PUT /api/v1/leads/:id - Update Lead
 */
export const updateLead = async (leadId: string, dto: UpdateLeadDto, userId?: string): Promise<Lead> => {
  // Check if lead exists
  const existingLead = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
  if (existingLead.rows.length === 0) {
    throw new AppError('Lead not found', 404);
  }

  const currentLead = existingLead.rows[0];

  // Validate fields if provided
  if (dto.phone && !validatePhoneNumber(dto.phone)) {
    throw new AppError('Phone number must be 10-20 digits', 400);
  }

  if (dto.email && !validateEmail(dto.email)) {
    throw new AppError('Invalid email format', 400);
  }

  if (!validateNIK(dto.nik)) {
    throw new AppError('NIK must be 16 digits', 400);
  }

  if (!validateNPWP(dto.npwp)) {
    throw new AppError('NPWP must be 15-20 digits', 400);
  }

  // Validate unit_id if provided
  if (dto.unit_id) {
    const unitCheck = await pool.query(
      `SELECT u.id, u.status
       FROM units u
       JOIN blocks b ON u.block_id = b.id
       JOIN properties p ON b.property_id = p.id
       WHERE u.id = $1 AND p.assigned_to = $2`,
      [dto.unit_id, userId]
    );
    if (unitCheck.rows.length === 0) {
      throw new AppError('Unit not found or not owned by user', 404);
    }
    if (unitCheck.rows[0].status === 'sold') {
      throw new AppError('Unit is already sold', 409);
    }
    if (await findBookedLeadOnUnit(pool, dto.unit_id, leadId)) {
      throw new AppError('Unit already has a booked lead', 409);
    }
  }

  // Calculate new monthly payment if KPR fields are updated
  let estimatedMonthlyPayment: number | null = null;
  let downPayment: number | null = null;
  if (dto.kpr_simulation) {
    const kpr = dto.kpr_simulation;
    if (!kpr.property_price || kpr.property_price <= 0) {
      throw new AppError('Property price must be greater than 0', 400);
    }
    if (!kpr.down_payment_percentage || kpr.down_payment_percentage < 1 || kpr.down_payment_percentage > 100) {
      throw new AppError('Down payment percentage must be between 1 and 100', 400);
    }
    if (!kpr.interest_rate || kpr.interest_rate <= 0) {
      throw new AppError('Interest rate must be greater than 0', 400);
    }
    if (![5, 10, 15, 20, 25].includes(kpr.loan_term_years)) {
      throw new AppError('Loan term must be 5, 10, 15, 20, or 25 years', 400);
    }

    estimatedMonthlyPayment = calculateMonthlyPayment(
      kpr.property_price,
      kpr.down_payment_percentage,
      kpr.interest_rate,
      kpr.loan_term_years
    );
    downPayment = kpr.property_price * (kpr.down_payment_percentage / 100);
  }

  // Special handling for unit_id:
  // - omitted (undefined): keep existing value
  // - string: assign to that unit
  // - explicit null: clear assignment
  const unitIdValue = dto.unit_id === undefined ? currentLead.unit_id : dto.unit_id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update lead
    const updateQuery = `
      UPDATE leads SET
        name = COALESCE($2, name),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        nik = COALESCE($5, nik),
        npwp = COALESCE($6, npwp),
        source = COALESCE($7, source),
        unit_id = $8::uuid,
        budget_range = COALESCE($9, budget_range),
        status = COALESCE($10, status),
        notes = COALESCE($11, notes),
        last_followed_up_at = COALESCE($12, last_followed_up_at),
        next_follow_up_at = COALESCE($13, next_follow_up_at),
        property_price = COALESCE($14, property_price),
        down_payment = COALESCE($15, down_payment),
        down_payment_percentage = COALESCE($16, down_payment_percentage),
        interest_rate = COALESCE($17, interest_rate),
        loan_term_years = COALESCE($18, loan_term_years),
        estimated_monthly_payment = COALESCE($19, estimated_monthly_payment),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const updateValues = [
      leadId,
      dto.name,
      dto.phone,
      dto.email,
      dto.nik,
      dto.npwp,
      dto.source,
      unitIdValue,
      dto.budget_range ? JSON.stringify(dto.budget_range) : null,
      dto.status,
      dto.notes,
      dto.last_followed_up_at ? new Date(dto.last_followed_up_at) : null,
      dto.next_follow_up_at ? new Date(dto.next_follow_up_at) : null,
      dto.kpr_simulation?.property_price,
      downPayment,
      dto.kpr_simulation?.down_payment_percentage,
      dto.kpr_simulation?.interest_rate,
      dto.kpr_simulation?.loan_term_years,
      estimatedMonthlyPayment,
    ];

    const updateResult = await client.query(updateQuery, updateValues);
    const updatedLead = updateResult.rows[0];

    // Booked business rule: the booked lead claims the unit exclusively
    if (updatedLead.status === LeadStatusEnum.BOOKED && updatedLead.unit_id) {
      const unit = await lockUnitForBooking(client, updatedLead.unit_id);

      if (!unit) {
        throw new AppError('Unit not found', 404);
      }

      const existingBooked = await findBookedLeadOnUnit(client, updatedLead.unit_id, leadId);

      if (existingBooked) {
        throw new AppError('Unit already has a booked lead', 409);
      }

      await revokeOtherLeadsOnUnit(client, updatedLead.unit_id, leadId);
    }

    // Log activity if status changed
    if (dto.status && dto.status !== currentLead.status) {
      await client.query(
        `INSERT INTO lead_activities (id, lead_id, user_id, activity_type, old_status, new_status, notes)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
        [
          leadId,
          userId || null,
          ActivityTypeEnum.STATUS_CHANGE,
          currentLead.status,
          dto.status,
          `Status changed from ${currentLead.status} to ${dto.status}`,
        ]
      );
    }

    // Update or insert reminder
    if (dto.reminder) {
      if (dto.reminder.id) {
        // Update existing reminder
        await client.query(
          `UPDATE reminder_schedules SET
            remind_at = COALESCE($2, remind_at),
            message = COALESCE($3, message),
            is_completed = COALESCE($4, is_completed)
          WHERE id = $1 AND lead_id = $5`,
          [
            dto.reminder.id,
            dto.reminder.remind_at,
            dto.reminder.message,
            dto.reminder.is_completed ?? false,
            leadId,
          ]
        );
      } else {
        // Insert new reminder
        await client.query(
          `INSERT INTO reminder_schedules (id, user_id, lead_id, remind_at, message, is_completed)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
          [userId || null, leadId, dto.reminder.remind_at, dto.reminder.message || null, dto.reminder.is_completed || false]
        );
      }
    }

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

    // Get assigned user name
    let assigned_to_name;
    if (updatedLead.assigned_to) {
      const userResult = await client.query('SELECT full_name FROM users WHERE id = $1', [updatedLead.assigned_to]);
      if (userResult.rows.length > 0) {
        assigned_to_name = userResult.rows[0].full_name;
      }
    }

    const kpr_simulation =
      updatedLead.property_price && updatedLead.down_payment_percentage && updatedLead.interest_rate && updatedLead.loan_term_years
        ? {
            property_price: updatedLead.property_price,
            down_payment_percentage: updatedLead.down_payment_percentage,
            down_payment: updatedLead.down_payment,
            interest_rate: updatedLead.interest_rate,
            loan_term_years: updatedLead.loan_term_years,
            estimated_monthly_payment: updatedLead.estimated_monthly_payment,
          }
        : undefined;

    return {
      id: updatedLead.id,
      name: updatedLead.name,
      phone: updatedLead.phone,
      email: updatedLead.email,
      status: updatedLead.status,
      source: updatedLead.source,
      unit_id: updatedLead.unit_id,
      budget_range: updatedLead.budget_range,
      kpr_simulation,
      down_payment: updatedLead.down_payment,
      down_payment_percentage: updatedLead.down_payment_percentage,
      interest_rate: updatedLead.interest_rate,
      loan_term_years: updatedLead.loan_term_years,
      estimated_monthly_payment: updatedLead.estimated_monthly_payment,
      assigned_to: updatedLead.assigned_to,
      assigned_to_name,
      next_follow_up_at: updatedLead.next_follow_up_at,
      last_followed_up_at: updatedLead.last_followed_up_at,
      created_at: updatedLead.created_at,
      updated_at: updatedLead.updated_at,
      unit,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * POST /api/v1/leads/:id/activities - Add Activity/Note
 */
export const addActivity = async (leadId: string, dto: AddActivityDto, userId?: string): Promise<LeadActivity> => {
  // Check if lead exists
  const leadCheck = await pool.query('SELECT id FROM leads WHERE id = $1', [leadId]);
  if (leadCheck.rows.length === 0) {
    throw new AppError('Lead not found', 404);
  }

  // Validate activity_type
  const validActivityTypes = [ActivityTypeEnum.STATUS_CHANGE, ActivityTypeEnum.NOTE_ADDED, ActivityTypeEnum.CALL, ActivityTypeEnum.WHATSAPP];
  if (!validActivityTypes.includes(dto.activity_type)) {
    throw new AppError('Invalid activity type', 400);
  }

  // Insert activity
  const query = `
    INSERT INTO lead_activities (id, lead_id, user_id, activity_type, old_status, new_status, notes, metadata)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const result = await pool.query(query, [
    leadId,
    userId || null,
    dto.activity_type,
    dto.old_status || null,
    dto.new_status || null,
    dto.notes || null,
    dto.metadata ? JSON.stringify(dto.metadata) : null,
  ]);

  const row = result.rows[0];

  return {
    id: row.id,
    lead_id: row.lead_id,
    user_id: row.user_id,
    activity_type: row.activity_type,
    old_status: row.old_status,
    new_status: row.new_status,
    notes: row.notes,
    metadata: row.metadata,
    created_at: row.created_at,
  };
};

/**
 * GET /api/v1/properties - Get Properties List
 */
export const getProperties = async (query: GetPropertiesQuery): Promise<Property[]> => {
  const { assigned_to } = query;

  let conditions: string[] = ['p.id IS NOT NULL'];
  const params: any[] = [];
  let paramIndex = 1;

  if (assigned_to) {
    conditions.push(`p.assigned_to = $${paramIndex++}`);
    params.push(assigned_to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const queryStr = `
    SELECT
      p.id,
      p.name,
      p.city
    FROM properties p
    ${whereClause}
    ORDER BY p.name ASC
  `;

  const result = await pool.query(queryStr, params);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
  }));
};

/**
 * DELETE /api/v1/leads/:id - Delete Lead
 * @param leadId - The ID of the lead to delete
 * @param userId - The ID of the user deleting the lead
 */
export const deleteLead = async (leadId: string, userId: string): Promise<void> => {
  // Check if lead exists and belongs to the user
  const leadCheck = await pool.query('SELECT * FROM leads WHERE id = $1 AND assigned_to = $2', [leadId, userId]);
  if (leadCheck.rows.length === 0) {
    throw new AppError('Lead not found', 404);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete related records first (due to foreign key constraints)
    // Delete lead activities
    await client.query('DELETE FROM lead_activities WHERE lead_id = $1', [leadId]);

    // Delete WhatsApp messages
    await client.query('DELETE FROM whatsapp_messages WHERE lead_id = $1', [leadId]);

    // Delete reminders
    await client.query('DELETE FROM reminder_schedules WHERE lead_id = $1', [leadId]);

    // Delete the lead
    await client.query('DELETE FROM leads WHERE id = $1', [leadId]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * GET /api/v1/leads/export - Export Leads to Excel
 * @param query - Query parameters for filtering
 * @param userId - The ID of the user exporting leads
 */
export const exportLeads = async (query: GetLeadsQuery, userId: string, userRole: string): Promise<Buffer> => {
  const {
    status,
    search,
    start_date,
    end_date,
    property_id,
    source,
  } = query;

  // RBAC: Admin & Supervisor see ALL leads; Sales only their own
  const isPrivilegedRole = userRole === 'Admin' || userRole === 'Supervisor';

  // Build WHERE conditions
  const params: any[] = [userId, isPrivilegedRole];
  let paramIndex = 3;
  const conditions: string[] = ['(l.assigned_to = $1 OR $2::boolean)'];

  // Default date range: 1 year ago to today
  const defaultStartDate = new Date();
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);

  const startDate = start_date ? new Date(start_date + 'T00:00:00') : defaultStartDate;
  const endDate = end_date ? new Date(end_date + 'T23:59:59') : new Date();

  conditions.push(`l.created_at >= $${paramIndex++}`);
  params.push(startDate);

  conditions.push(`l.created_at <= $${paramIndex++}`);
  params.push(endDate);

  if (status) {
    conditions.push(`l.status = $${paramIndex++}`);
    params.push(status);
  }

  if (search) {
    conditions.push(`(l.name ILIKE $${paramIndex++} OR l.phone ILIKE $${paramIndex++})`);
    params.push(`%${search}%`, `%${search}%`);
  }

  if (property_id) {
    conditions.push(`p.id = $${paramIndex++}`);
    params.push(property_id);
  }

  if (source) {
    conditions.push(`l.source ILIKE $${paramIndex++}`);
    params.push(`%${source}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get leads with full details for export
  const leadsQuery = `
    SELECT
      l.id,
      l.name,
      l.phone,
      l.email,
      l.nik,
      l.npwp,
      l.status,
      l.source,
      l.budget_range,
      l.notes,
      l.property_price,
      l.down_payment,
      l.down_payment_percentage,
      l.interest_rate,
      l.loan_term_years,
      l.estimated_monthly_payment,
      l.created_at,
      l.updated_at,
      u.full_name as assigned_to_name,
      p.name as property_name
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    LEFT JOIN units un ON l.unit_id = un.id
    LEFT JOIN blocks b ON un.block_id = b.id
    LEFT JOIN properties p ON b.property_id = p.id
    ${whereClause}
    ORDER BY l.created_at DESC
  `;

  const leadsResult = await pool.query(leadsQuery, params);
  const leads = leadsResult.rows;

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Leads');

  // Define columns
  worksheet.columns = [
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Phone', key: 'phone', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'NIK', key: 'nik', width: 20 },
    { header: 'NPWP', key: 'npwp', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Source', key: 'source', width: 15 },
    { header: 'Property', key: 'property_name', width: 25 },
    { header: 'Budget Range', key: 'budget_range', width: 20 },
    { header: 'Property Price', key: 'property_price', width: 20 },
    { header: 'Down Payment', key: 'down_payment', width: 20 },
    { header: 'Down Payment %', key: 'down_payment_percentage', width: 15 },
    { header: 'Interest Rate %', key: 'interest_rate', width: 15 },
    { header: 'Loan Term (Years)', key: 'loan_term_years', width: 15 },
    { header: 'Est. Monthly Payment', key: 'estimated_monthly_payment', width: 20 },
    { header: 'Notes', key: 'notes', width: 40 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data rows
  leads.forEach((lead) => {
    let budgetRange = '';
    if (lead.budget_range) {
      try {
        const budget = JSON.parse(lead.budget_range);
        budgetRange = `Rp ${budget.min?.toLocaleString('id-ID')} - Rp ${budget.max?.toLocaleString('id-ID')}`;
      } catch {
        budgetRange = lead.budget_range;
      }
    }

    let propertyPrice = '';
    if (lead.property_price) {
      propertyPrice = `Rp ${Number(lead.property_price).toLocaleString('id-ID')}`;
    }

    let downPayment = '';
    if (lead.down_payment) {
      downPayment = `Rp ${Number(lead.down_payment).toLocaleString('id-ID')}`;
    }

    let estimatedPayment = '';
    if (lead.estimated_monthly_payment) {
      estimatedPayment = `Rp ${Number(lead.estimated_monthly_payment).toLocaleString('id-ID')}`;
    }

    worksheet.addRow({
      name: lead.name,
      phone: lead.phone || '',
      email: lead.email || '',
      nik: lead.nik || '',
      npwp: lead.npwp || '',
      status: lead.status,
      source: lead.source || '',
      property_name: lead.property_name || '',
      budget_range: budgetRange,
      property_price: propertyPrice,
      down_payment: downPayment,
      down_payment_percentage: lead.down_payment_percentage || '',
      interest_rate: lead.interest_rate || '',
      loan_term_years: lead.loan_term_years || '',
      estimated_monthly_payment: estimatedPayment,
      notes: lead.notes || '',
    });
  });

  // Auto-fit column widths based on content
  worksheet.columns.forEach((column: any) => {
    if (column.eachCell) {
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, (cell: any) => {
        const value = cell.value;
        let length = 0;
        if (value) {
          // Handle different cell value types from ExcelJS
          if (typeof value === 'object') {
            if ('text' in value) {
              length = String(value.text).length;
            } else if ('richText' in value) {
              length = String(value.richText).length;
            } else if ('formula' in value) {
              length = String(value.formula).length;
            } else {
              length = String(value).length;
            }
          } else if (typeof value === 'string' || typeof value === 'number') {
            length = String(value).length;
          }
        }
        if (length > maxLength) {
          maxLength = length;
        }
      });
      column.width = Math.max(Math.min(maxLength + 2, 50), 15);
    }
  });

  // Add borders to all cells
  worksheet.eachRow((row: any) => {
    row.eachCell((cell: any) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
