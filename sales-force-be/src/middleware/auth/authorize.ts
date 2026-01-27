import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError';

// Extend Express Request type to include user role
declare global {
  namespace Express {
    interface Request {
      userRole?: string;
    }
  }
}

/**
 * Authorization middleware factory - checks if user has required role
 * Reads role from JWT token (no database query)
 * @param allowedRoles - Array of role names that are allowed to access the route
 * @returns Middleware function
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        throw new AppError('User has no role assigned. Please contact administrator.', 403);
      }

      // Attach role to request for potential use in controllers
      req.userRole = userRole;

      // Check if user's role is in the allowed roles list
      if (!allowedRoles.includes(userRole)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Authorization failed', 500);
    }
  };
};

/**
 * Convenience middleware for admin-only routes
 */
export const adminOnly = authorize('Admin');

/**
 * Convenience middleware for supervisor and admin routes
 */
export const supervisorOrAdmin = authorize('Admin', 'Supervisor');
