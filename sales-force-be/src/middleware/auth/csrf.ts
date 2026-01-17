import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError';

/**
 * CSRF protection middleware - validates CSRF token for state-changing operations
 */
export const validateCsrf = (req: Request, _res: Response, next: NextFunction): void => {
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  // Get CSRF token from cookie and header
  const tokenCookie = req.cookies?.csrf_token;
  const tokenHeader = req.headers['x-csrf-token'] as string;

  if (!tokenCookie || !tokenHeader || tokenCookie !== tokenHeader) {
    throw new AppError('Invalid CSRF token', 403);
  }

  next();
};
