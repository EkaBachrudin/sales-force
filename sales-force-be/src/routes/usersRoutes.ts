import { Router } from 'express';
import {
  getUsersController,
  getUserDetailController,
  createUserController,
  updateUserController,
  deleteUserController,
} from '../controllers/usersController';
import { authenticate, supervisorOrAdmin } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/users
 * List all users with pagination and filters
 * @access Supervisor or Admin only
 */
router.get('/', authenticate, supervisorOrAdmin, getUsersController);

/**
 * GET /api/v1/users/:id
 * Get detailed user information
 * @access Supervisor or Admin only
 */
router.get('/:id', authenticate, supervisorOrAdmin, getUserDetailController);

/**
 * POST /api/v1/users
 * Create a new user
 * @access Supervisor or Admin only
 */
router.post('/', authenticate, supervisorOrAdmin, createUserController);

/**
 * PUT /api/v1/users/:id
 * Update existing user
 * @access Supervisor or Admin only
 */
router.put('/:id', authenticate, supervisorOrAdmin, updateUserController);

/**
 * DELETE /api/v1/users/:id
 * Delete user
 * @access Supervisor or Admin only
 */
router.delete('/:id', authenticate, supervisorOrAdmin, deleteUserController);

export default router;
