import { Router } from 'express';
import {
  getUpcomingRemindersController,
  createReminderController,
  updateReminderController,
  deleteReminderController,
} from '../controllers/remindersController';
import { authenticate, subscriptionCheck } from '../middleware';

const router = Router();

/**
 * GET /api/v1/reminders/upcoming
 * Get upcoming reminders for the authenticated user
 * @access Private (requires authentication and active subscription)
 */
router.get('/upcoming', authenticate, subscriptionCheck, getUpcomingRemindersController);

/**
 * POST /api/v1/reminders
 * Create a new reminder
 * @access Private (requires authentication and active subscription)
 */
router.post('/', authenticate, subscriptionCheck, createReminderController);

/**
 * PUT /api/v1/reminders/:reminder_id
 * Update an existing reminder
 * @access Private (requires authentication and active subscription)
 */
router.put('/:reminder_id', authenticate, subscriptionCheck, updateReminderController);

/**
 * DELETE /api/v1/reminders/:reminder_id
 * Delete a reminder
 * @access Private (requires authentication and active subscription)
 */
router.delete('/:reminder_id', authenticate, subscriptionCheck, deleteReminderController);

export default router;
