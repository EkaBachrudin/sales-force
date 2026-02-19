import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  meController,
  revokeAllController,
  changePasswordController,
} from '../controllers/authController';
import { authenticate, validateCsrf, optionalSubscriptionCheck } from '../middleware';
import { authLimiter, registerLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', registerLimiter, registerController);

/**
 * POST /api/v1/auth/login
 * Login user and create session
 */
router.post('/login', authLimiter, loginController);

/**
 * POST /api/v1/auth/refresh
 * Rotate access token using refresh token
 */
router.post('/refresh', refreshController);

/**
 * POST /api/v1/auth/logout
 * Terminate current session
 * Note: Allows cancelled users to logout
 */
router.post('/logout', authenticate, optionalSubscriptionCheck, validateCsrf, logoutController);

/**
 * GET /api/v1/auth/me
 * Get current user session info
 * Note: Allows cancelled users to fetch their subscription status
 */
router.get('/me', authenticate, optionalSubscriptionCheck, meController);

/**
 * POST /api/v1/auth/revoke-all
 * Revoke all active sessions
 * Note: Allows cancelled users to revoke sessions
 */
router.post('/revoke-all', authenticate, optionalSubscriptionCheck, validateCsrf, revokeAllController);

/**
 * POST /api/v1/auth/change-password
 * Change user password
 * Note: Allows cancelled users to change password
 */
router.post('/change-password', authenticate, optionalSubscriptionCheck, validateCsrf, changePasswordController);

export default router;
