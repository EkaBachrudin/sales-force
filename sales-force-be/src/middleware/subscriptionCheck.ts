import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { getUserSubscriptionStatus } from '../services/authService';

// Extend Express Request type to include subscription status
declare global {
  namespace Express {
    interface Request {
      subscriptionStatus?: string | null;
    }
  }
}

/**
 * Subscription check middleware - validates user subscription status
 * Blocks access for users with 'cancelled' subscription status
 * Use this after authenticate middleware
 */
export const subscriptionCheck = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.sub;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get subscription status
    const subscriptionStatus = await getUserSubscriptionStatus(userId);

    // Attach subscription status to request for potential use in controllers
    req.subscriptionStatus = subscriptionStatus;

    // Block access if subscription is cancelled
    if (subscriptionStatus === 'cancelled') {
      throw new AppError(
        'Your subscription has been cancelled. Please contact admin to reactivate your account.',
        403
      );
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Subscription check failed', 500);
  }
};

/**
 * Optional subscription check - doesn't throw if no subscription
 * Attaches subscription status to request
 */
export const optionalSubscriptionCheck = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.sub;

    if (userId) {
      const subscriptionStatus = await getUserSubscriptionStatus(userId);
      req.subscriptionStatus = subscriptionStatus;
    }

    next();
  } catch {
    next();
  }
};
