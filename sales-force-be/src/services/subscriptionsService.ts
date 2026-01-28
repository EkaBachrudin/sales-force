import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import {
  SubscriptionListItem,
  GetSubscriptionsQuery,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionType,
} from '../types';

/**
 * GET /api/v1/subscriptions - List Subscriptions with Pagination & Filters
 * @param query - Query parameters for filtering and pagination
 */
export const getSubscriptions = async (query: GetSubscriptionsQuery): Promise<{
  subscriptions: SubscriptionListItem[];
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
    user_id,
    status,
    subscription_type,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = query;

  // Build WHERE conditions
  const params: any[] = [];
  let paramIndex = 1;
  const conditions: string[] = ['s.id IS NOT NULL'];

  if (user_id) {
    conditions.push(`s.user_id = $${paramIndex++}`);
    params.push(user_id);
  }

  if (status) {
    conditions.push(`s.status = $${paramIndex++}`);
    params.push(status);
  }

  if (subscription_type) {
    conditions.push(`s.subscription_type = $${paramIndex++}`);
    params.push(subscription_type);
  }

  // Validate and set sort column
  const validSortColumns = ['created_at', 'due_date', 'amount'];
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
  const sortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(DISTINCT s.id) as total
    FROM subscriptions s
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Get subscriptions with pagination
  const offset = (page - 1) * limit;
  const subscriptionsQuery = `
    SELECT
      s.id,
      s.user_id,
      u.full_name as user_name,
      u.email as user_email,
      s.subscription_type,
      s.amount,
      s.period_start,
      s.period_end,
      s.due_date,
      s.status,
      s.notes,
      s.created_at
    FROM subscriptions s
    LEFT JOIN users u ON s.user_id = u.id
    ${whereClause}
    ORDER BY s.${sortColumn} ${sortOrder}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);
  const subscriptionsResult = await pool.query(subscriptionsQuery, params);

  const subscriptions: SubscriptionListItem[] = subscriptionsResult.rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    user_name: row.user_name,
    user_email: row.user_email,
    subscription_type: row.subscription_type,
    amount: parseFloat(row.amount),
    period_start: row.period_start,
    period_end: row.period_end,
    due_date: row.due_date,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
  }));

  return {
    subscriptions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * GET /api/v1/subscriptions/:id - Get Subscription Detail
 * @param subscriptionId - The ID of the subscription to get details for
 */
export const getSubscriptionById = async (subscriptionId: string): Promise<SubscriptionListItem> => {
  const query = `
    SELECT
      s.id,
      s.user_id,
      u.full_name as user_name,
      u.email as user_email,
      s.subscription_type,
      s.amount,
      s.period_start,
      s.period_end,
      s.due_date,
      s.status,
      s.notes,
      s.created_at
    FROM subscriptions s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.id = $1
  `;

  const result = await pool.query(query, [subscriptionId]);

  if (result.rows.length === 0) {
    throw new AppError('Subscription not found', 404);
  }

  const row = result.rows[0];

  return {
    id: row.id,
    user_id: row.user_id,
    user_name: row.user_name,
    user_email: row.user_email,
    subscription_type: row.subscription_type,
    amount: parseFloat(row.amount),
    period_start: row.period_start,
    period_end: row.period_end,
    due_date: row.due_date,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
  };
};

/**
 * POST /api/v1/subscriptions - Create New Subscription
 * @param dto - Subscription data to create
 */
export const createSubscription = async (dto: CreateSubscriptionDto): Promise<SubscriptionListItem> => {
  // Validate required fields
  if (!dto.user_id || dto.user_id.trim().length === 0) {
    throw new AppError('User is required', 400);
  }

  if (!dto.subscription_type) {
    throw new AppError('Subscription type is required', 400);
  }

  if (!dto.amount || dto.amount <= 0) {
    throw new AppError('Amount must be greater than 0', 400);
  }

  if (!dto.due_date) {
    throw new AppError('Due date is required', 400);
  }

  // Validate subscription type
  const validSubscriptionTypes = [SubscriptionType.MONTHLY, SubscriptionType.QUARTERLY, SubscriptionType.ANNUAL];
  if (!validSubscriptionTypes.includes(dto.subscription_type)) {
    throw new AppError('Invalid subscription type. Must be monthly, quarterly, or annual', 400);
  }

  // Check if user exists
  const existingUser = await pool.query('SELECT id FROM users WHERE id = $1', [dto.user_id]);
  if (existingUser.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Calculate period start and end based on subscription type
  const dueDate = new Date(dto.due_date);
  const periodStart = new Date(dueDate);
  let periodEnd: Date | null = null;

  switch (dto.subscription_type) {
    case SubscriptionType.MONTHLY:
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      break;
    case SubscriptionType.QUARTERLY:
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 3);
      break;
    case SubscriptionType.ANNUAL:
      periodEnd = new Date(periodStart);
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      break;
  }

  // Insert subscription
  const query = `
    INSERT INTO subscriptions (user_id, subscription_type, amount, period_start, period_end, due_date, notes, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
    RETURNING id, user_id, subscription_type, amount, period_start, period_end, due_date, status, notes, created_at
  `;

  const values = [
    dto.user_id,
    dto.subscription_type,
    dto.amount,
    periodStart,
    periodEnd,
    dueDate,
    dto.notes || null,
  ];

  const result = await pool.query(query, values);
  const newSubscription = result.rows[0];

  // Get user details
  const userResult = await pool.query('SELECT full_name, email FROM users WHERE id = $1', [dto.user_id]);
  const user = userResult.rows[0];

  return {
    id: newSubscription.id,
    user_id: newSubscription.user_id,
    user_name: user?.full_name,
    user_email: user?.email,
    subscription_type: newSubscription.subscription_type,
    amount: parseFloat(newSubscription.amount),
    period_start: newSubscription.period_start,
    period_end: newSubscription.period_end,
    due_date: newSubscription.due_date,
    status: newSubscription.status,
    notes: newSubscription.notes,
    created_at: newSubscription.created_at,
  };
};

/**
 * PUT /api/v1/subscriptions/:id - Update Subscription
 * @param subscriptionId - The ID of the subscription to update
 * @param dto - Subscription data to update
 */
export const updateSubscription = async (subscriptionId: string, dto: UpdateSubscriptionDto): Promise<SubscriptionListItem> => {
  // Check if subscription exists
  const existingSubscription = await pool.query('SELECT * FROM subscriptions WHERE id = $1', [subscriptionId]);
  if (existingSubscription.rows.length === 0) {
    throw new AppError('Subscription not found', 404);
  }

  // Validate amount if provided
  if (dto.amount !== undefined && dto.amount <= 0) {
    throw new AppError('Amount must be greater than 0', 400);
  }

  // Validate subscription type if provided
  if (dto.subscription_type) {
    const validSubscriptionTypes = [SubscriptionType.MONTHLY, SubscriptionType.QUARTERLY, SubscriptionType.ANNUAL];
    if (!validSubscriptionTypes.includes(dto.subscription_type)) {
      throw new AppError('Invalid subscription type. Must be monthly, quarterly, or annual', 400);
    }
  }

  // Build update query dynamically
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (dto.subscription_type !== undefined) {
    updateFields.push(`subscription_type = $${paramIndex++}`);
    values.push(dto.subscription_type);
  }
  if (dto.amount !== undefined) {
    updateFields.push(`amount = $${paramIndex++}`);
    values.push(dto.amount);
  }
  if (dto.due_date !== undefined) {
    updateFields.push(`due_date = $${paramIndex++}`);
    values.push(dto.due_date);
  }
  if (dto.status !== undefined) {
    updateFields.push(`status = $${paramIndex++}`);
    values.push(dto.status);
  }
  if (dto.notes !== undefined) {
    updateFields.push(`notes = $${paramIndex++}`);
    values.push(dto.notes);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updateFields.push(`updated_at = NOW()`);
  values.push(subscriptionId);

  const query = `
    UPDATE subscriptions
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, user_id, subscription_type, amount, period_start, period_end, due_date, status, notes, created_at
  `;

  const result = await pool.query(query, values);
  const updatedSubscription = result.rows[0];

  // Get user details
  const userResult = await pool.query('SELECT full_name, email FROM users WHERE id = $1', [updatedSubscription.user_id]);
  const user = userResult.rows[0];

  return {
    id: updatedSubscription.id,
    user_id: updatedSubscription.user_id,
    user_name: user?.full_name,
    user_email: user?.email,
    subscription_type: updatedSubscription.subscription_type,
    amount: parseFloat(updatedSubscription.amount),
    period_start: updatedSubscription.period_start,
    period_end: updatedSubscription.period_end,
    due_date: updatedSubscription.due_date,
    status: updatedSubscription.status,
    notes: updatedSubscription.notes,
    created_at: updatedSubscription.created_at,
  };
};

/**
 * DELETE /api/v1/subscriptions/:id - Delete Subscription
 * @param subscriptionId - The ID of the subscription to delete
 */
export const deleteSubscription = async (subscriptionId: string): Promise<void> => {
  // Check if subscription exists
  const existingSubscription = await pool.query('SELECT id FROM subscriptions WHERE id = $1', [subscriptionId]);
  if (existingSubscription.rows.length === 0) {
    throw new AppError('Subscription not found', 404);
  }

  // Delete subscription
  await pool.query('DELETE FROM subscriptions WHERE id = $1', [subscriptionId]);
};
