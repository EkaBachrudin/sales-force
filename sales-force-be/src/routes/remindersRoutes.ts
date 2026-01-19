import { Router } from 'express';
import {
  getUpcomingRemindersController,
  createReminderController,
  updateReminderController,
  deleteReminderController,
} from '../controllers/remindersController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/reminders/upcoming
 * Get upcoming reminders for the authenticated user
 * @access Private (requires authentication)
 */
router.get('/upcoming', authenticate, getUpcomingRemindersController);

/**
 * POST /api/v1/reminders
 * Create a new reminder
 * @access Private (requires authentication)
 */
router.post('/', authenticate, createReminderController);

/**
 * PUT /api/v1/reminders/:reminder_id
 * Update an existing reminder
 * @access Private (requires authentication)
 */
router.put('/:reminder_id', authenticate, updateReminderController);

/**
 * DELETE /api/v1/reminders/:reminder_id
 * Delete a reminder
 * @access Private (requires authentication)
 */
router.delete('/:reminder_id', authenticate, deleteReminderController);

export default router;
