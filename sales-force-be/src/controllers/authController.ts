import { Request, Response } from 'express';
import { register, login, refresh, logout, revokeAllSessions, getCurrentUser, isTokenRevoked } from '../services/authService';
import { LoginDto, RegisterDto } from '../types';

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
export const registerController = async (req: Request, res: Response): Promise<void> => {
  const dto: RegisterDto = req.body;

  await register(dto);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please login.',
  });
};

/**
 * POST /api/v1/auth/login
 * Login user and create session
 */
export const loginController = async (req: Request, res: Response): Promise<void> => {
  const dto: LoginDto = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'];

  const result = await login(dto, ipAddress, userAgent || '');

  // Set HTTP-only cookies
  res.cookie('access_token', result.tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: result.tokens.accessTokenMaxAge,
  });

  res.cookie('refresh_token', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh',
    maxAge: result.tokens.refreshTokenMaxAge,
  });

  res.cookie('csrf_token', result.tokens.csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: result.tokens.accessTokenMaxAge,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      session: {
        id: result.session.id,
        device_info: result.session.device_info,
        expires_at: result.session.expires_at.toISOString(),
      },
    },
  });
};

/**
 * POST /api/v1/auth/refresh
 * Rotate access token using refresh token
 */
export const refreshController = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.refresh_token;
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'];

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
    return;
  }

  const tokens = await refresh(refreshToken, ipAddress, userAgent || '');

  // Set new HTTP-only cookies
  res.cookie('access_token', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: tokens.accessTokenMaxAge,
  });

  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh',
    maxAge: tokens.refreshTokenMaxAge,
  });

  res.cookie('csrf_token', tokens.csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: tokens.accessTokenMaxAge,
  });

  res.status(200).json({
    success: true,
    data: {
      csrf_token: tokens.csrfToken,
    },
  });
};

/**
 * POST /api/v1/auth/logout
 * Terminate current session
 */
export const logoutController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  await logout(req.user.sub, req.user.jti);

  // Clear cookies
  res.clearCookie('access_token', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.clearCookie('refresh_token', {
    path: '/api/v1/auth/refresh',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.clearCookie('csrf_token', {
    path: '/',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * GET /api/v1/auth/me
 * Get current user session info
 */
export const meController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  // Check if token is revoked
  const isRevoked = await isTokenRevoked(req.user.jti);
  if (isRevoked) {
    res.status(401).json({
      success: false,
      message: 'Token has been revoked. Please login again.',
    });
    return;
  }

  const user = await getCurrentUser(req.user.sub);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    },
  });
};

/**
 * POST /api/v1/auth/revoke-all
 * Revoke all active sessions
 */
export const revokeAllController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const revokedCount = await revokeAllSessions(req.user.sub);

  res.status(200).json({
    success: true,
    message: 'All sessions revoked successfully',
    data: {
      revoked_count: revokedCount,
    },
  });
};
