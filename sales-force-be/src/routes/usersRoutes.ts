import { Router } from 'express';
import {
  getUsersController,
  getUserDetailController,
  createUserController,
  updateUserController,
  deleteUserController,
} from '../controllers/usersController';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/users
 * List all users with pagination and filters
 * @access Admin only
 */
router.get('/', authenticate, adminOnly, getUsersController);

/**
 * GET /api/v1/users/:id
 * Get detailed user information
 * @access Admin only
 */
router.get('/:id', authenticate, adminOnly, getUserDetailController);

/**
 * POST /api/v1/users
 * Create a new user
 * @access Admin only
 */
router.post('/', authenticate, adminOnly, createUserController);

/**
 * PUT /api/v1/users/:id
 * Update existing user
 * @access Admin only
 */
router.put('/:id', authenticate, adminOnly, updateUserController);

/**
 * DELETE /api/v1/users/:id
 * Delete user
 * @access Admin only
 */
router.delete('/:id', authenticate, adminOnly, deleteUserController);

export default router;
