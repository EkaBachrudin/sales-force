import { Router } from 'express';
import {
  getSubscriptionsController,
  getSubscriptionDetailController,
  createSubscriptionController,
  updateSubscriptionController,
  deleteSubscriptionController,
} from '../controllers/subscriptionsController';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/subscriptions
 * List all subscriptions with pagination and filters
 * @access Admin only
 */
router.get('/', authenticate, adminOnly, getSubscriptionsController);

/**
 * GET /api/v1/subscriptions/:id
 * Get detailed subscription information
 * @access Admin only
 */
router.get('/:id', authenticate, adminOnly, getSubscriptionDetailController);

/**
 * POST /api/v1/subscriptions
 * Create a new subscription
 * @access Admin only
 */
router.post('/', authenticate, adminOnly, createSubscriptionController);

/**
 * PUT /api/v1/subscriptions/:id
 * Update existing subscription
 * @access Admin only
 */
router.put('/:id', authenticate, adminOnly, updateSubscriptionController);

/**
 * DELETE /api/v1/subscriptions/:id
 * Delete subscription
 * @access Admin only
 */
router.delete('/:id', authenticate, adminOnly, deleteSubscriptionController);

export default router;
