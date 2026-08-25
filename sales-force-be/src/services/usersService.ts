import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import { hashPassword } from '../utils/auth/password';
import {
  UserListItem,
  GetUsersQuery,
  CreateUserDto,
  UpdateUserDto,
} from '../types';

/**
 * Validate email format
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (10-20 digits, numeric only)
 */
const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\d{10,20}$/;
  return phoneRegex.test(phone.replace(/\+/g, '').replace(/\s/g, ''));
};

/**
 * GET /api/v1/users - List Users with Pagination & Filters
 * @param query - Query parameters for filtering and pagination
 */
export const getUsers = async (
  query: GetUsersQuery,
  viewerRole?: string
): Promise<{
  users: UserListItem[];
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
    search,
    is_active,
    role_id,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = query;

  // Build WHERE conditions
  const params: any[] = [];
  let paramIndex = 1;
  const conditions: string[] = ['u.id IS NOT NULL'];

  if (search) {
    conditions.push(`(u.full_name ILIKE $${paramIndex++} OR u.email ILIKE $${paramIndex++} OR u.phone ILIKE $${paramIndex++})`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (is_active !== undefined) {
    conditions.push(`u.is_active = $${paramIndex++}`);
    params.push(is_active);
  }

  if (role_id) {
    conditions.push(`u.role_id = $${paramIndex++}`);
    params.push(role_id);
  }

  // Non-Admin viewers (e.g. Supervisor) cannot see Admin accounts
  if (viewerRole !== 'Admin') {
    conditions.push(`(r.name IS NULL OR r.name <> 'Admin')`);
  }

  // Validate and set sort column
  const validSortColumns = ['created_at', 'full_name', 'email'];
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
  const sortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(DISTINCT u.id) as total
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Get users with pagination
  const offset = (page - 1) * limit;
  const usersQuery = `
    SELECT
      u.id,
      u.email,
      u.full_name,
      u.phone,
      u.is_active,
      u.role_id,
      r.name as role,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    ${whereClause}
    ORDER BY u.${sortColumn} ${sortOrder}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);
  const usersResult = await pool.query(usersQuery, params);

  const users: UserListItem[] = usersResult.rows.map((row) => ({
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    is_active: row.is_active,
    role_id: row.role_id,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * GET /api/v1/users/:id - Get User Detail
 * @param userId - The ID of the user to get details for
 */
export const getUserById = async (
  userId: string,
  viewerRole?: string
): Promise<UserListItem> => {
  const query = `
    SELECT
      u.id,
      u.email,
      u.full_name,
      u.phone,
      u.is_active,
      u.role_id,
      r.name as role,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = $1
  `;

  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const row = result.rows[0];

  // Non-Admin viewers (e.g. Supervisor) cannot view Admin accounts
  if (viewerRole !== 'Admin' && row.role === 'Admin') {
    throw new AppError('User not found', 404);
  }

  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    is_active: row.is_active,
    role_id: row.role_id,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Helper function to get role_id from role name or role_id
 */
const getRoleId = async (roleNameOrId: string | undefined): Promise<string | null> => {
  if (!roleNameOrId) {
    return null;
  }

  // First, try to find by name
  const nameCheck = await pool.query('SELECT id FROM roles WHERE name = $1', [roleNameOrId]);
  if (nameCheck.rows.length > 0) {
    return nameCheck.rows[0].id;
  }

  // If not found by name, try to find by ID (UUID)
  const idCheck = await pool.query('SELECT id FROM roles WHERE id = $1', [roleNameOrId]);
  if (idCheck.rows.length > 0) {
    return idCheck.rows[0].id;
  }

  throw new AppError('Role not found', 404);
};

/**
 * POST /api/v1/users - Create New User
 * @param dto - User data to create
 */
export const createUser = async (dto: CreateUserDto): Promise<UserListItem> => {
  // Validate required fields
  if (!dto.email || dto.email.trim().length === 0) {
    throw new AppError('Email is required', 400);
  }

  if (!validateEmail(dto.email)) {
    throw new AppError('Invalid email format', 400);
  }

  if (!dto.password || dto.password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  if (!dto.full_name || dto.full_name.trim().length === 0) {
    throw new AppError('Full name is required', 400);
  }

  if (dto.phone && !validatePhoneNumber(dto.phone)) {
    throw new AppError('Phone number must be 10-20 digits', 400);
  }

  // Check if email already exists
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [dto.email]);
  if (existingUser.rows.length > 0) {
    throw new AppError('Email already exists', 400);
  }

  // Get role_id from role name or role_id
  let roleId: string | null = null;
  if (dto.role || dto.role_id) {
    const roleValue = dto.role || dto.role_id;
    roleId = await getRoleId(roleValue);
  }

  // Hash password
  const passwordHash = await hashPassword(dto.password);

  // Insert user
  const query = `
    INSERT INTO users (email, password_hash, full_name, phone, role_id, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, full_name, phone, is_active, role_id, created_at, updated_at
  `;

  const values = [
    dto.email,
    passwordHash,
    dto.full_name,
    dto.phone || null,
    roleId,
    dto.is_active !== undefined ? dto.is_active : true,
  ];

  const result = await pool.query(query, values);
  const newUser = result.rows[0];

  // Get role name
  let role: string | undefined;
  if (newUser.role_id) {
    const roleResult = await pool.query('SELECT name FROM roles WHERE id = $1', [newUser.role_id]);
    if (roleResult.rows.length > 0) {
      role = roleResult.rows[0].name;
    }
  }

  return {
    id: newUser.id,
    email: newUser.email,
    full_name: newUser.full_name,
    phone: newUser.phone,
    is_active: newUser.is_active,
    role_id: newUser.role_id,
    role: role,
    created_at: newUser.created_at,
    updated_at: newUser.updated_at,
  };
};

/**
 * PUT /api/v1/users/:id - Update User
 * @param userId - The ID of the user to update
 * @param dto - User data to update
 */
export const updateUser = async (userId: string, dto: UpdateUserDto): Promise<UserListItem> => {
  // Check if user exists
  const existingUser = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (existingUser.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Validate fields if provided
  if (dto.email && !validateEmail(dto.email)) {
    throw new AppError('Invalid email format', 400);
  }

  if (dto.password && dto.password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  if (dto.phone && !validatePhoneNumber(dto.phone)) {
    throw new AppError('Phone number must be 10-20 digits', 400);
  }

  // Check if email already exists for another user
  if (dto.email) {
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [dto.email, userId]);
    if (emailCheck.rows.length > 0) {
      throw new AppError('Email already exists', 400);
    }
  }

  // Get role_id from role name or role_id
  let roleId: string | null | undefined = undefined;
  if (dto.role || dto.role_id !== undefined) {
    // If explicitly set to null/empty string, keep it null
    if (dto.role === '' || dto.role_id === null) {
      roleId = null;
    } else if (dto.role === undefined && dto.role_id === undefined) {
      roleId = undefined;
    } else {
      const roleValue = dto.role || dto.role_id;
      roleId = await getRoleId(roleValue);
    }
  }

  // Hash password if provided
  let passwordHash: string | undefined;
  if (dto.password) {
    passwordHash = await hashPassword(dto.password);
  }

  // Build update query dynamically
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (dto.email !== undefined) {
    updateFields.push(`email = $${paramIndex++}`);
    values.push(dto.email);
  }
  if (passwordHash !== undefined) {
    updateFields.push(`password_hash = $${paramIndex++}`);
    values.push(passwordHash);
  }
  if (dto.full_name !== undefined) {
    updateFields.push(`full_name = $${paramIndex++}`);
    values.push(dto.full_name);
  }
  if (dto.phone !== undefined) {
    updateFields.push(`phone = $${paramIndex++}`);
    values.push(dto.phone);
  }
  if (roleId !== undefined) {
    updateFields.push(`role_id = $${paramIndex++}`);
    values.push(roleId);
  }
  if (dto.is_active !== undefined) {
    updateFields.push(`is_active = $${paramIndex++}`);
    values.push(dto.is_active);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updateFields.push(`updated_at = NOW()`);
  values.push(userId);

  const query = `
    UPDATE users
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, email, full_name, phone, is_active, role_id, created_at, updated_at
  `;

  const result = await pool.query(query, values);
  const updatedUser = result.rows[0];

  // Get role name
  let role: string | undefined;
  if (updatedUser.role_id) {
    const roleResult = await pool.query('SELECT name FROM roles WHERE id = $1', [updatedUser.role_id]);
    if (roleResult.rows.length > 0) {
      role = roleResult.rows[0].name;
    }
  }

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    full_name: updatedUser.full_name,
    phone: updatedUser.phone,
    is_active: updatedUser.is_active,
    role_id: updatedUser.role_id,
    role: role,
    created_at: updatedUser.created_at,
    updated_at: updatedUser.updated_at,
  };
};

/**
 * DELETE /api/v1/users/:id - Delete User
 * @param userId - The ID of the user to delete
 */
export const deleteUser = async (userId: string): Promise<void> => {
  // Check if user exists
  const existingUser = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (existingUser.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Delete user (CASCADE will handle related records)
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
};
