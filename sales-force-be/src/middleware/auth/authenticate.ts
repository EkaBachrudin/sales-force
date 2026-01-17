import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/auth/jwt';
import { JwtPayload } from '../../types';
import { AppError } from '../../utils/AppError';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authentication middleware - verifies JWT access token
 */
export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // Debug: log cookies
    console.log('[authenticate] Cookies:', req.cookies);
    console.log('[authenticate] Cookie header:', req.get('cookie'));

    // Get access token from httpOnly cookie
    const accessToken = req.cookies?.access_token;

    if (!accessToken) {
      throw new AppError('Authentication required. Please login.', 401);
    }

    // Verify token
    const payload = verifyAccessToken(accessToken);

    if (!payload) {
      throw new AppError('Invalid or expired token. Please login again.', 401);
    }

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Authentication failed', 401);
  }
};

/**
 * Optional authentication - doesn't throw if no token
 */
export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const accessToken = req.cookies?.access_token;

    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch {
    next();
  }
};
