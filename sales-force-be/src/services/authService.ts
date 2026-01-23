import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import {
  hashPassword,
  verifyPassword,
  generateRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
} from '../utils/auth/password';
import { generateAccessToken, getRefreshTokenMaxAge, getAccessTokenMaxAge } from '../utils/auth/jwt';
import { generateCsrfToken } from '../utils/auth/csrf';
import { User, LoginDto, RegisterDto, UserRole, DeviceInfo, ChangePasswordDto } from '../types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  accessTokenMaxAge: number;
  refreshTokenMaxAge: number;
}

export interface LoginResult {
  user: {
    full_name: string;
    email: string;
    role: UserRole;
  };
  session: {
    id: string;
    device_info: DeviceInfo;
    expires_at: Date;
  };
  tokens: AuthTokens;
}

/**
 * Find user by email
 */
const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query(
    'SELECT id, full_name, email, phone, password_hash, is_active, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    role: UserRole.SALES, // Default role since it's not in DB yet
    password_hash: row.password_hash,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Parse User-Agent header to extract device info
 */
const parseDeviceInfo = (userAgent: string | undefined): DeviceInfo => {
  if (!userAgent) {
    return { type: 'unknown', os: 'unknown', browser: 'unknown' };
  }

  let type = 'desktop';
  let os = 'unknown';
  let browser = 'unknown';

  // Detect device type
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    type = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    type = 'tablet';
  }

  // Detect OS
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad|ios/i.test(userAgent)) os = 'iOS';

  // Detect browser
  if (/chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/edge/i.test(userAgent)) browser = 'Edge';
  else if (/opera/i.test(userAgent)) browser = 'Opera';

  return { type, os, browser };
};

/**
 * Register a new user
 */
export const register = async (dto: RegisterDto): Promise<void> => {
  const { email, password, full_name, phone } = dto;

  // Check if user already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Insert new user
  await pool.query(
    'INSERT INTO users (email, password_hash, full_name, phone) VALUES ($1, $2, $3, $4)',
    [email, password_hash, full_name, phone || null]
  );
};

/**
 * Login user and create session
 */
export const login = async (dto: LoginDto, ipAddress: string, userAgent: string): Promise<LoginResult> => {
  const { email, password } = dto;

  // Find user
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.password_hash || '');
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.is_active) {
    throw new AppError('Account is inactive. Please contact administrator.', 403);
  }

  const deviceInfo = parseDeviceInfo(userAgent);

  // Start transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Deactivate existing sessions for this user (single device login)
    await client.query('UPDATE user_sessions SET is_active = false WHERE user_id = $1 AND is_active = true', [user.id]);

    // Calculate expiration
    const expiresAt = new Date(Date.now() + getRefreshTokenMaxAge());

    // Create new session first
    const sessionResult = await client.query(
      `INSERT INTO user_sessions (user_id, refresh_token_hash, device_info, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, expires_at`,
      [user.id, '', JSON.stringify(deviceInfo), ipAddress, userAgent, expiresAt]
    );

    const session = sessionResult.rows[0];

    // Generate tokens with session_id
    const plainRefreshToken = generateRefreshToken();
    const refreshTokenHash = await hashRefreshToken(plainRefreshToken);
    const csrfToken = generateCsrfToken();

    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      session_id: session.id, // Include session_id in JWT
    });

    // Update session with refresh token hash
    await client.query(
      'UPDATE user_sessions SET refresh_token_hash = $1 WHERE id = $2',
      [refreshTokenHash, session.id]
    );

    await client.query('COMMIT');

    return {
      user: {
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
      session: {
        id: session.id,
        device_info: deviceInfo,
        expires_at: session.expires_at,
      },
      tokens: {
        accessToken,
        refreshToken: plainRefreshToken,
        csrfToken,
        accessTokenMaxAge: getAccessTokenMaxAge(),
        refreshTokenMaxAge: getRefreshTokenMaxAge(),
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Refresh access token using refresh token
 */
export const refresh = async (refreshToken: string, ipAddress: string, userAgent: string): Promise<AuthTokens> => {
  // Get all active sessions (we need to verify hash since it's one-way)
  const sessionResult = await pool.query(
    `SELECT s.*, u.id as user_id, u.email
     FROM user_sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.is_active = true AND s.expires_at > NOW()`
  );

  // Find matching session by verifying refresh token hash
  let matchedSession: any = null;
  for (const row of sessionResult.rows) {
    const isValid = await verifyRefreshToken(refreshToken, row.refresh_token_hash);
    if (isValid) {
      matchedSession = row;
      break;
    }
  }

  if (!matchedSession) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (!matchedSession.is_active) {
    throw new AppError('Session was revoked. Please login again.', 403);
  }

  // Generate new refresh token and CSRF token
  const plainRefreshToken = generateRefreshToken();
  const refreshTokenHash = await hashRefreshToken(plainRefreshToken);
  const csrfToken = generateCsrfToken();

  const deviceInfo = parseDeviceInfo(userAgent);
  const expiresAt = new Date(Date.now() + getRefreshTokenMaxAge());

  // Update session with new refresh token
  await pool.query(
    `UPDATE user_sessions
     SET refresh_token_hash = $1, device_info = $2, ip_address = $3, user_agent = $4, expires_at = $5, last_activity_at = NOW()
     WHERE id = $6`,
    [refreshTokenHash, JSON.stringify(deviceInfo), ipAddress, userAgent, expiresAt, matchedSession.id]
  );

  // Generate new access token with session_id
  const newAccessToken = generateAccessToken({
    sub: matchedSession.user_id,
    email: matchedSession.email,
    role: UserRole.SALES, // Default role since it's not in DB
    session_id: matchedSession.id, // Include session_id in JWT
  });

  return {
    accessToken: newAccessToken,
    refreshToken: plainRefreshToken,
    csrfToken,
    accessTokenMaxAge: getAccessTokenMaxAge(),
    refreshTokenMaxAge: getRefreshTokenMaxAge(),
  };
};

/**
 * Logout user (deactivate session)
 */
export const logout = async (userId: string, jti: string): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Deactivate session
    await client.query('UPDATE user_sessions SET is_active = false WHERE user_id = $1 AND is_active = true', [userId]);

    // Add JWT to blacklist
    const jtiParts = jti.split('-');
    const timestamp = parseInt(jtiParts[0] || '0', 10);
    const expiresAt = new Date(timestamp + 15 * 60 * 1000);

    await client.query('INSERT INTO revoked_tokens (jti, user_id, expires_at) VALUES ($1, $2, $3)', [jti, userId, expiresAt]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Revoke all sessions for a user
 */
export const revokeAllSessions = async (userId: string): Promise<number> => {
  const result = await pool.query('UPDATE user_sessions SET is_active = false WHERE user_id = $1 AND is_active = true RETURNING id', [userId]);
  return result.rowCount || 0;
};

/**
 * Get current user by ID
 */
export const getCurrentUser = async (userId: string): Promise<Omit<User, 'password_hash'>> => {
  const result = await pool.query(
    'SELECT id, full_name, email, phone, is_active, created_at, updated_at FROM users WHERE id = $1 AND is_active = true',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const row = result.rows[0];
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    role: UserRole.SALES,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Check if JWT is revoked
 */
export const isTokenRevoked = async (jti: string): Promise<boolean> => {
  const result = await pool.query('SELECT id FROM revoked_tokens WHERE jti = $1 AND expires_at > NOW()', [jti]);
  return result.rows.length > 0;
};

/**
 * Check if user's session is still active (for single session enforcement)
 * @param userId - User ID from JWT
 * @param sessionId - Session ID from JWT (user_sessions.id) - cannot be manipulated by client
 */
export const isSessionActive = async (userId: string, sessionId: string): Promise<boolean> => {
  // Validate session using session_id from JWT (cannot be manipulated by client)
  const result = await pool.query(
    'SELECT id FROM user_sessions WHERE user_id = $1 AND id = $2 AND is_active = true AND expires_at > NOW()',
    [userId, sessionId]
  );
  return result.rows.length > 0;
};

/**
 * Change user password
 * @param userId - User ID from JWT
 * @param dto - ChangePasswordDto containing current_password and new_password
 */
export const changePassword = async (userId: string, dto: ChangePasswordDto): Promise<void> => {
  const { current_password, new_password } = dto;

  // Get user with password hash
  const result = await pool.query(
    'SELECT id, email, password_hash, is_active FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = result.rows[0];

  // Verify current password
  const isPasswordValid = await verifyPassword(current_password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Check if user is active
  if (!user.is_active) {
    throw new AppError('Account is inactive. Please contact administrator.', 403);
  }

  // Hash new password
  const newPasswordHash = await hashPassword(new_password);

  // Update password
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  );

  // Revoke all sessions for security (force user to login again)
  await pool.query('UPDATE user_sessions SET is_active = false WHERE user_id = $1', [userId]);
};
