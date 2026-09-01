import { Request, Response } from 'express';
import {
  getUpcomingReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} from '../services/remindersService';

/**
 * GET /api/v1/reminders/upcoming
 * Get Upcoming Reminders
 * @access Private (requires authentication)
 */
export const getUpcomingRemindersController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      },
    });
    return;
  }

  const userRole = req.user!.role;

  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 3;
    const hoursAhead = req.query.hours_ahead ? parseInt(req.query.hours_ahead as string, 10) : 24;

    const result = await getUpcomingReminders(userId, userRole, limit, hoursAhead);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: {
          code: error.message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unknown error occurred',
        },
      });
    }
  }
};

/**
 * POST /api/v1/reminders
 * Create New Reminder
 * @access Private (requires authentication)
 */
export const createReminderController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      },
    });
    return;
  }

  try {
    const { lead_id, remind_at, message } = req.body;

    // Validate required fields
    if (!lead_id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            lead_id: ['lead_id is required'],
          },
        },
      });
      return;
    }

    if (!remind_at) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            remind_at: ['remind_at is required'],
          },
        },
      });
      return;
    }

    // Validate remind_at is a valid date
    const remindAtDate = new Date(remind_at);
    if (isNaN(remindAtDate.getTime())) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            remind_at: ['remind_at must be a valid ISO 8601 timestamp'],
          },
        },
      });
      return;
    }

    const reminder = await createReminder(
      {
        lead_id,
        remind_at: remindAtDate,
        message,
      },
      userId
    );

    res.status(201).json({
      success: true,
      data: {
        reminder: reminder,
      },
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('must be in the future')
        ? 400
        : error.message.includes('already exists')
          ? 409
          : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code:
          error.message.includes('not found') || error.message.includes('assigned to you')
            ? 'NOT_FOUND'
            : error.message.includes('must be in the future')
              ? 'VALIDATION_ERROR'
              : error.message.includes('already exists')
                ? 'CONFLICT'
                : 'INTERNAL_ERROR',
        message: error.message,
        details:
          error.message.includes('must be in the future') ||
          error.message.includes('already exists')
            ? {
                remind_at: error.message.includes('must be in the future')
                  ? ['remind_at must be in the future']
                  : ['Reminder already exists for this lead at the specified time'],
              }
            : undefined,
      },
    });
  }
};

/**
 * PUT /api/v1/reminders/:reminder_id
 * Update Reminder
 * @access Private (requires authentication)
 */
export const updateReminderController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;
  const { reminder_id } = req.params;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      },
    });
    return;
  }

  // Validate reminder_id is a string
  if (typeof reminder_id !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid reminder ID',
      },
    });
    return;
  }

  try {
    const { is_completed, remind_at, message } = req.body;

    // Validate at least one field is provided
    if (is_completed === undefined && !remind_at && !message) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one field (is_completed, remind_at, or message) must be provided',
        },
      });
      return;
    }

    // Validate remind_at is a valid date if provided
    let remindAtDate: Date | undefined;
    if (remind_at) {
      remindAtDate = new Date(remind_at);
      if (isNaN(remindAtDate.getTime())) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: {
              remind_at: ['remind_at must be a valid ISO 8601 timestamp'],
            },
          },
        });
        return;
      }
    }

    const reminder = await updateReminder(
      reminder_id,
      {
        is_completed,
        remind_at: remindAtDate,
        message,
      },
      userId
    );

    res.status(200).json({
      success: true,
      data: {
        reminder: reminder,
      },
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('must be in the future')
        ? 400
        : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code:
          error.message.includes('not found') || error.message.includes('owned by you')
            ? 'NOT_FOUND'
            : error.message.includes('must be in the future')
              ? 'VALIDATION_ERROR'
              : 'INTERNAL_ERROR',
        message: error.message,
        details: error.message.includes('must be in the future')
          ? {
              remind_at: ['remind_at must be in the future'],
            }
          : undefined,
      },
    });
  }
};

/**
 * DELETE /api/v1/reminders/:reminder_id
 * Delete Reminder
 * @access Private (requires authentication)
 */
export const deleteReminderController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;
  const { reminder_id } = req.params;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      },
    });
    return;
  }

  // Validate reminder_id is a string
  if (typeof reminder_id !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid reminder ID',
      },
    });
    return;
  }

  try {
    await deleteReminder(reminder_id, userId);

    res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error: any) {
    const statusCode =
      error.message.includes('not found') || error.message.includes('owned by you') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code:
          error.message.includes('not found') || error.message.includes('owned by you')
            ? 'NOT_FOUND'
            : 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};
