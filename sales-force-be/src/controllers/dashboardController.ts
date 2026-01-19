import { Request, Response } from 'express';
import { getDashboardOverview } from '../services/dashboardService';

/**
 * GET /api/v1/dashboard/overview
 * Get Dashboard Overview Metrics
 * @access Private (requires authentication)
 */
export const getDashboardOverviewController = async (req: Request, res: Response): Promise<void> => {
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
    const metrics = await getDashboardOverview(userId);

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
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
