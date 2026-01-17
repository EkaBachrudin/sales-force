import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import {
  CrmLead as Lead,
  CrmLeadActivity as LeadActivity,
  CrmWhatsAppMessage as WhatsAppMessage,
  CrmReminderSchedule as ReminderSchedule,
  CrmProperty as Property,
  CrmLeadDetailResponse as LeadDetailResponse,
  GetLeadsQuery,
  GetLeadsResponse,
  CrmCreateLeadDto as CreateLeadDto,
  CrmUpdateLeadDto as UpdateLeadDto,
  CrmAddActivityDto as AddActivityDto,
  GetPropertiesQuery,
  CrmLeadStatus as LeadStatusEnum,
  CrmLeadSource as LeadSourceEnum,
  CrmActivityType as ActivityTypeEnum,
} from '../types';

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
 */
export const getLeads = async (query: GetLeadsQuery): Promise<GetLeadsResponse> => {
  const {
    page = 1,
    limit = 50,
    status,
    search,
    start_date,
    end_date,
    property_id,
    source,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = query;

  // Build WHERE conditions
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Default date range: 1 year ago to today
  const defaultStartDate = new Date();
  defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);

  const startDate = start_date ? new Date(start_date) : defaultStartDate;
  const endDate = end_date ? new Date(end_date) : new Date();

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
    conditions.push(`l.property_id = $${paramIndex++}`);
    params.push(property_id);
  }

  if (source) {
    conditions.push(`l.source = $${paramIndex++}`);
    params.push(source);
  }

  // Validate and set sort column
  const validSortColumns = ['created_at', 'name', 'status', 'next_follow_up_at'];
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
  const sortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(DISTINCT l.id) as total
    FROM leads l
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
      l.email,
      l.status,
      l.source,
      l.property_id,
      l.property_url,
      l.property_price,
      l.budget_range,
      l.down_payment_percentage,
      l.interest_rate,
      l.loan_term_years,
      l.estimated_monthly_payment,
      l.assigned_to,
      u.full_name as assigned_to_name,
      l.next_follow_up_at,
      l.created_at,
      l.updated_at,
      p.id as property_detail_id,
      p.name as property_name,
      p.property_type,
      p.price as property_detail_price,
      p.city
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    LEFT JOIN properties p ON l.property_id = p.id
    ${whereClause}
    ORDER BY l.${sortColumn} ${sortOrder}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);
  const leadsResult = await pool.query(leadsQuery, params);

  const leads: Lead[] = leadsResult.rows.map((row) => {
    const property = row.property_detail_id
      ? {
          id: row.property_detail_id,
          name: row.property_name,
          property_type: row.property_type,
          price: row.property_detail_price,
          city: row.city,
        }
      : undefined;

    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      status: row.status,
      source: row.source,
      property_id: row.property_id,
      property_url: row.property_url,
      property_price: row.property_price,
      budget_range: row.budget_range,
      assigned_to: row.assigned_to,
      assigned_to_name: row.assigned_to_name,
      next_follow_up_at: row.next_follow_up_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      property,
      down_payment_percentage: row.down_payment_percentage,
      interest_rate: row.interest_rate,
      loan_term_years: row.loan_term_years,
      estimated_monthly_payment: row.estimated_monthly_payment,
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
 */
export const getLeadDetail = async (leadId: string): Promise<LeadDetailResponse> => {
  // Get lead details
  const leadQuery = `
    SELECT
      l.*,
      u.full_name as assigned_to_name,
      p.id as property_id_detail,
      p.name as property_name,
      p.property_type,
      p.price as property_price_detail,
      p.city,
      p.province,
      p.developer
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    LEFT JOIN properties p ON l.property_id = p.id
    WHERE l.id = $1
  `;

  const leadResult = await pool.query(leadQuery, [leadId]);

  if (leadResult.rows.length === 0) {
    throw new AppError('Lead not found', 404);
  }

  const row = leadResult.rows[0];

  const property = row.property_id_detail
    ? {
        id: row.property_id_detail,
        name: row.property_name,
        property_type: row.property_type,
        price: row.property_price_detail,
        city: row.city,
        province: row.province,
        developer: row.developer,
      }
    : undefined;

  const kpr_simulation =
    row.property_price && row.down_payment_percentage && row.interest_rate && row.loan_term_years
      ? {
          property_price: row.property_price,
          down_payment_percentage: row.down_payment_percentage,
          down_payment: row.property_price * (row.down_payment_percentage / 100),
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
    property_id: row.property_id,
    property_url: row.property_url,
    property_price: row.property_price,
    budget_range: row.budget_range,
    kpr_simulation,
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
    property,
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
    SELECT *
    FROM whatsapp_messages
    WHERE lead_id = $1
    ORDER BY sent_at DESC
  `;
  const whatsappResult = await pool.query(whatsappQuery, [leadId]);
  const whatsapp_messages: WhatsAppMessage[] = whatsappResult.rows.map((r) => ({
    id: r.id,
    lead_id: r.lead_id,
    message_type: r.message_type,
    content: r.content,
    sent_at: r.sent_at,
    created_at: r.created_at,
  }));

  // Get reminders
  const remindersQuery = `
    SELECT *
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
    updated_at: r.updated_at,
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

  // Validate property_id if provided
  if (dto.property_id) {
    const propertyCheck = await pool.query('SELECT id FROM properties WHERE id = $1', [dto.property_id]);
    if (propertyCheck.rows.length === 0) {
      throw new AppError('Property not found', 404);
    }
  }

  // Validate KPR simulation if provided
  let estimatedMonthlyPayment: number | undefined;
  if (dto.kpr_simulation) {
    const kpr = dto.kpr_simulation;
    if (!kpr.property_price || kpr.property_price <= 0) {
      throw new AppError('Property price must be greater than 0', 400);
    }
    if (!kpr.down_payment_percentage || kpr.down_payment_percentage < 10 || kpr.down_payment_percentage > 50) {
      throw new AppError('Down payment percentage must be between 10 and 50', 400);
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
        id, assigned_to, name, nik, npwp, phone, email, source,
        property_id, property_url, budget_range, status, notes,
        property_price, down_payment_percentage, interest_rate, loan_term_years,
        estimated_monthly_payment
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *
    `;

    const leadValues = [
      userId || null,
      dto.name,
      dto.nik || null,
      dto.npwp || null,
      dto.phone,
      dto.email || null,
      dto.source || LeadSourceEnum.MANUAL,
      dto.property_id || null,
      dto.property_url || null,
      dto.budget_range ? JSON.stringify(dto.budget_range) : null,
      dto.status || LeadStatusEnum.NEW,
      dto.notes || null,
      dto.kpr_simulation?.property_price || null,
      dto.kpr_simulation?.down_payment_percentage || null,
      dto.kpr_simulation?.interest_rate || null,
      dto.kpr_simulation?.loan_term_years || null,
      estimatedMonthlyPayment || null,
    ];

    const leadResult = await client.query(leadQuery, leadValues);
    const newLead = leadResult.rows[0];

    // Insert activity log
    await client.query(
      `INSERT INTO lead_activities (id, lead_id, user_id, activity_type, new_status, notes)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
      [newLead.id, userId || null, ActivityTypeEnum.LEAD_CREATED, dto.status || LeadStatusEnum.NEW, `Lead created via ${dto.source || LeadSourceEnum.MANUAL}`]
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

    // Get property details if property_id exists
    let property;
    if (newLead.property_id) {
      const propertyResult = await client.query('SELECT id, name, property_type, price, city FROM properties WHERE id = $1', [newLead.property_id]);
      if (propertyResult.rows.length > 0) {
        const propRow = propertyResult.rows[0];
        property = {
          id: propRow.id,
          name: propRow.name,
          property_type: propRow.property_type,
          price: propRow.price,
          city: propRow.city,
        };
      }
    }

    return {
      id: newLead.id,
      name: newLead.name,
      phone: newLead.phone,
      email: newLead.email,
      status: newLead.status,
      source: newLead.source,
      property_id: newLead.property_id,
      property_url: newLead.property_url,
      property_price: newLead.property_price,
      budget_range: newLead.budget_range,
      assigned_to: newLead.assigned_to,
      next_follow_up_at: newLead.next_follow_up_at,
      created_at: newLead.created_at,
      updated_at: newLead.updated_at,
      property,
      down_payment_percentage: newLead.down_payment_percentage,
      interest_rate: newLead.interest_rate,
      loan_term_years: newLead.loan_term_years,
      estimated_monthly_payment: newLead.estimated_monthly_payment,
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

  // Validate property_id if provided
  if (dto.property_id) {
    const propertyCheck = await pool.query('SELECT id FROM properties WHERE id = $1', [dto.property_id]);
    if (propertyCheck.rows.length === 0) {
      throw new AppError('Property not found', 404);
    }
  }

  // Calculate new monthly payment if KPR fields are updated
  let estimatedMonthlyPayment: number | null = null;
  if (dto.kpr_simulation) {
    const kpr = dto.kpr_simulation;
    if (!kpr.property_price || kpr.property_price <= 0) {
      throw new AppError('Property price must be greater than 0', 400);
    }
    if (!kpr.down_payment_percentage || kpr.down_payment_percentage < 10 || kpr.down_payment_percentage > 50) {
      throw new AppError('Down payment percentage must be between 10 and 50', 400);
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
  }

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
        property_id = COALESCE($7, property_id),
        property_url = COALESCE($8, property_url),
        budget_range = COALESCE($9, budget_range),
        status = COALESCE($10, status),
        notes = COALESCE($11, notes),
        last_followed_up_at = COALESCE($12, last_followed_up_at),
        next_follow_up_at = COALESCE($13, next_follow_up_at),
        property_price = COALESCE($14, property_price),
        down_payment_percentage = COALESCE($15, down_payment_percentage),
        interest_rate = COALESCE($16, interest_rate),
        loan_term_years = COALESCE($17, loan_term_years),
        estimated_monthly_payment = COALESCE($18, estimated_monthly_payment),
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
      dto.property_id,
      dto.property_url,
      dto.budget_range ? JSON.stringify(dto.budget_range) : null,
      dto.status,
      dto.notes,
      dto.last_followed_up_at ? new Date(dto.last_followed_up_at) : null,
      dto.next_follow_up_at ? new Date(dto.next_follow_up_at) : null,
      dto.kpr_simulation?.property_price,
      dto.kpr_simulation?.down_payment_percentage,
      dto.kpr_simulation?.interest_rate,
      dto.kpr_simulation?.loan_term_years,
      estimatedMonthlyPayment,
    ];

    const updateResult = await client.query(updateQuery, updateValues);
    const updatedLead = updateResult.rows[0];

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
            is_completed = COALESCE($4, is_completed),
            updated_at = NOW()
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

    // Get property details if property_id exists
    let property;
    if (updatedLead.property_id) {
      const propertyResult = await client.query('SELECT id, name, property_type, price, city FROM properties WHERE id = $1', [updatedLead.property_id]);
      if (propertyResult.rows.length > 0) {
        const propRow = propertyResult.rows[0];
        property = {
          id: propRow.id,
          name: propRow.name,
          property_type: propRow.property_type,
          price: propRow.price,
          city: propRow.city,
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

    return {
      id: updatedLead.id,
      name: updatedLead.name,
      phone: updatedLead.phone,
      email: updatedLead.email,
      status: updatedLead.status,
      source: updatedLead.source,
      property_id: updatedLead.property_id,
      property_url: updatedLead.property_url,
      property_price: updatedLead.property_price,
      budget_range: updatedLead.budget_range,
      assigned_to: updatedLead.assigned_to,
      assigned_to_name,
      next_follow_up_at: updatedLead.next_follow_up_at,
      last_followed_up_at: updatedLead.last_followed_up_at,
      created_at: updatedLead.created_at,
      updated_at: updatedLead.updated_at,
      property,
      down_payment_percentage: updatedLead.down_payment_percentage,
      interest_rate: updatedLead.interest_rate,
      loan_term_years: updatedLead.loan_term_years,
      estimated_monthly_payment: updatedLead.estimated_monthly_payment,
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
      p.property_type,
      p.price,
      p.city,
      p.province,
      p.developer
    FROM properties p
    ${whereClause}
    ORDER BY p.name ASC
  `;

  const result = await pool.query(queryStr, params);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    property_type: row.property_type,
    price: row.price,
    city: row.city,
    province: row.province,
    developer: row.developer,
  }));
};
