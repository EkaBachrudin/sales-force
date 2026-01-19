import { pool } from '../config/database';
import { AppError } from '../utils/AppError';

/**
 * Reminder Lead Info Interface
 */
export interface ReminderLeadInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  property?: {
    id: string;
    name: string;
    property_type: string;
    price: number;
  };
}

/**
 * Reminder Item Interface
 */
export interface ReminderItem {
  id: string;
  remind_at: Date;
  remind_at_formatted: string;
  message?: string;
  is_completed: boolean;
  lead: ReminderLeadInfo;
}

/**
 * Upcoming Reminders Response Interface
 */
export interface UpcomingRemindersResponse {
  reminders: ReminderItem[];
  meta: {
    total: number;
    limit: number;
    hours_ahead: number;
  };
}

/**
 * Create Reminder DTO Interface
 */
export interface CreateReminderDto {
  lead_id: string;
  remind_at: Date;
  message?: string;
}

/**
 * Update Reminder DTO Interface
 */
export interface UpdateReminderDto {
  is_completed?: boolean;
  remind_at?: Date;
  message?: string;
}

/**
 * Get Upcoming Reminders
 * @param userId - The ID of the user to get reminders for
 * @param limit - Maximum number of reminders to return (default: 3)
 * @param hoursAhead - Filter reminders within X hours from now (default: 168 = 7 days)
 * @returns Upcoming reminders with lead information
 */
export const getUpcomingReminders = async (
  userId: string,
  limit: number = 3,
  hoursAhead: number = 168
): Promise<UpcomingRemindersResponse> => {
  // Validate user exists
  const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userCheck.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Get reminders with lead and property information
  const remindersQuery = `
    SELECT
      rs.id,
      rs.remind_at,
      rs.message,
      rs.is_completed,
      l.id as lead_id,
      l.name as lead_name,
      l.phone as lead_phone,
      l.email as lead_email,
      p.id as property_id,
      p.name as property_name,
      p.property_type,
      p.price
    FROM reminder_schedules rs
    INNER JOIN leads l ON rs.lead_id = l.id
    LEFT JOIN properties p ON l.property_id = p.id
    WHERE rs.user_id = $1
      AND rs.remind_at BETWEEN NOW() AND (NOW() + INTERVAL '1 hour' * $2)
      AND rs.is_completed = false
    ORDER BY rs.remind_at ASC
    LIMIT $3
  `;

  const remindersResult = await pool.query(remindersQuery, [userId, hoursAhead, limit]);

  // Format remind_at for display
  const formatRemindAt = (date: Date): string => {
    const now = new Date();
    const reminderDate = new Date(date);
    const diffMs = reminderDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0 && diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 0 ? 'Now' : `In ${diffMins} minutes`;
    } else if (diffDays === 0) {
      return `Today, ${reminderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } else if (diffDays === 1) {
      return `Tomorrow, ${reminderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } else {
      return reminderDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  const reminders: ReminderItem[] = remindersResult.rows.map((row) => {
    const lead: ReminderLeadInfo = {
      id: row.lead_id,
      name: row.lead_name,
      phone: row.lead_phone,
      email: row.email || undefined,
    };

    if (row.property_id) {
      lead.property = {
        id: row.property_id,
        name: row.property_name,
        property_type: row.property_type,
        price: row.price,
      };
    }

    return {
      id: row.id,
      remind_at: row.remind_at,
      remind_at_formatted: formatRemindAt(row.remind_at),
      message: row.message || undefined,
      is_completed: row.is_completed,
      lead,
    };
  });

  // Get total count for meta
  const countQuery = `
    SELECT COUNT(*) as total
    FROM reminder_schedules
    WHERE user_id = $1
      AND remind_at BETWEEN NOW() AND (NOW() + INTERVAL '1 hour' * $2)
      AND is_completed = false
  `;
  const countResult = await pool.query(countQuery, [userId, hoursAhead]);
  const total = parseInt(countResult.rows[0].total, 10);

  return {
    reminders,
    meta: {
      total,
      limit,
      hours_ahead: hoursAhead,
    },
  };
};

/**
 * Create New Reminder
 * @param dto - Reminder creation data
 * @param userId - The ID of the user creating the reminder
 * @returns Created reminder
 */
export const createReminder = async (dto: CreateReminderDto, userId: string): Promise<ReminderItem> => {
  // Validate lead_id exists and is assigned to the user
  const leadCheck = await pool.query(
    'SELECT id, name, phone, email, property_id FROM leads WHERE id = $1 AND assigned_to = $2',
    [dto.lead_id, userId]
  );

  if (leadCheck.rows.length === 0) {
    throw new AppError('Lead not found or not assigned to you', 404);
  }

  const lead = leadCheck.rows[0];

  // Validate remind_at is in the future
  if (new Date(dto.remind_at) <= new Date()) {
    throw new AppError('Reminder date must be in the future', 400);
  }

  // Check for duplicate reminders for the same lead at the same time
  const duplicateCheck = await pool.query(
    `SELECT id FROM reminder_schedules
     WHERE lead_id = $1 AND remind_at = $2 AND is_completed = false`,
    [dto.lead_id, dto.remind_at]
  );

  if (duplicateCheck.rows.length > 0) {
    throw new AppError('Reminder already exists for this lead at the specified time', 409);
  }

  // Create reminder
  const insertQuery = `
    INSERT INTO reminder_schedules (id, user_id, lead_id, remind_at, message, is_completed)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
    RETURNING *
  `;

  const reminderResult = await pool.query(insertQuery, [
    userId,
    dto.lead_id,
    dto.remind_at,
    dto.message || null,
    false,
  ]);

  const reminderRow = reminderResult.rows[0];

  // Get property details if property_id exists
  let property;
  if (lead.property_id) {
    const propertyResult = await pool.query(
      'SELECT id, name, property_type, price FROM properties WHERE id = $1',
      [lead.property_id]
    );
    if (propertyResult.rows.length > 0) {
      const propRow = propertyResult.rows[0];
      property = {
        id: propRow.id,
        name: propRow.name,
        property_type: propRow.property_type,
        price: propRow.price,
      };
    }
  }

  const leadInfo: ReminderLeadInfo = {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email || undefined,
  };

  if (property) {
    leadInfo.property = property;
  }

  return {
    id: reminderRow.id,
    remind_at: reminderRow.remind_at,
    remind_at_formatted: formatRemindAt(reminderRow.remind_at),
    message: reminderRow.message || undefined,
    is_completed: reminderRow.is_completed,
    lead: leadInfo,
  };
};

/**
 * Update Reminder
 * @param reminderId - The ID of the reminder to update
 * @param dto - Update data
 * @param userId - The ID of the user updating the reminder
 * @returns Updated reminder
 */
export const updateReminder = async (
  reminderId: string,
  dto: UpdateReminderDto,
  userId: string
): Promise<ReminderItem> => {
  // Check if reminder exists and belongs to user
  const existingReminder = await pool.query(
    `SELECT rs.*, l.id as lead_id, l.name as lead_name, l.phone as lead_phone, l.email as lead_email, l.property_id
     FROM reminder_schedules rs
     INNER JOIN leads l ON rs.lead_id = l.id
     WHERE rs.id = $1 AND rs.user_id = $2`,
    [reminderId, userId]
  );

  if (existingReminder.rows.length === 0) {
    throw new AppError('Reminder not found or not owned by you', 404);
  }

  const reminder = existingReminder.rows[0];

  // If updating remind_at, validate it's in the future
  if (dto.remind_at && new Date(dto.remind_at) <= new Date()) {
    throw new AppError('Reminder date must be in the future', 400);
  }

  // Update reminder
  const updateQuery = `
    UPDATE reminder_schedules
    SET
      is_completed = COALESCE($1, is_completed),
      remind_at = COALESCE($2, remind_at),
      message = COALESCE($3, message),
      updated_at = NOW()
    WHERE id = $4 AND user_id = $5
    RETURNING *
  `;

  const updateResult = await pool.query(updateQuery, [
    dto.is_completed ?? null,
    dto.remind_at ?? null,
    dto.message ?? null,
    reminderId,
    userId,
  ]);

  const updatedReminder = updateResult.rows[0];

  // Get property details if property_id exists
  let property;
  if (reminder.property_id) {
    const propertyResult = await pool.query(
      'SELECT id, name, property_type, price FROM properties WHERE id = $1',
      [reminder.property_id]
    );
    if (propertyResult.rows.length > 0) {
      const propRow = propertyResult.rows[0];
      property = {
        id: propRow.id,
        name: propRow.name,
        property_type: propRow.property_type,
        price: propRow.price,
      };
    }
  }

  const leadInfo: ReminderLeadInfo = {
    id: reminder.lead_id,
    name: reminder.lead_name,
    phone: reminder.lead_phone,
    email: reminder.lead_email || undefined,
  };

  if (property) {
    leadInfo.property = property;
  }

  return {
    id: updatedReminder.id,
    remind_at: updatedReminder.remind_at,
    remind_at_formatted: formatRemindAt(updatedReminder.remind_at),
    message: updatedReminder.message || undefined,
    is_completed: updatedReminder.is_completed,
    lead: leadInfo,
  };
};

/**
 * Delete Reminder
 * @param reminderId - The ID of the reminder to delete
 * @param userId - The ID of the user deleting the reminder
 * @returns Deleted reminder ID
 */
export const deleteReminder = async (reminderId: string, userId: string): Promise<{ id: string; deleted: boolean }> => {
  // Check if reminder exists and belongs to user
  const existingReminder = await pool.query(
    'SELECT id FROM reminder_schedules WHERE id = $1 AND user_id = $2',
    [reminderId, userId]
  );

  if (existingReminder.rows.length === 0) {
    throw new AppError('Reminder not found or not owned by you', 404);
  }

  // Delete reminder
  await pool.query('DELETE FROM reminder_schedules WHERE id = $1 AND user_id = $2', [reminderId, userId]);

  return {
    id: reminderId,
    deleted: true,
  };
};

/**
 * Helper function to format remind_at date
 */
function formatRemindAt(date: Date): string {
  const now = new Date();
  const reminderDate = new Date(date);
  const diffMs = reminderDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 0 && diffHours === 0) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins <= 0 ? 'Now' : `In ${diffMins} minutes`;
  } else if (diffDays === 0) {
    return `Today, ${reminderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  } else if (diffDays === 1) {
    return `Tomorrow, ${reminderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  } else {
    return reminderDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}
