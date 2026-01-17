import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  meController,
  revokeAllController,
} from '../controllers/authController';
import { authenticate, validateCsrf } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', registerController);

/**
 * POST /api/v1/auth/login
 * Login user and create session
 */
router.post('/login', loginController);

/**
 * POST /api/v1/auth/refresh
 * Rotate access token using refresh token
 */
router.post('/refresh', refreshController);

/**
 * POST /api/v1/auth/logout
 * Terminate current session
 */
router.post('/logout', authenticate, validateCsrf, logoutController);

/**
 * GET /api/v1/auth/me
 * Get current user session info
 */
router.get('/me', authenticate, meController);

/**
 * POST /api/v1/auth/revoke-all
 * Revoke all active sessions
 */
router.post('/revoke-all', authenticate, validateCsrf, revokeAllController);

export default router;
