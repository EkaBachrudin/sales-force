import { Request, Response } from 'express';
import {
  getAnalyticsMetrics,
  getAnalyticsFunnel,
  getAnalyticsTrend,
  getAnalyticsSources,
  getAnalyticsDashboard,
} from '../services/analyticsService';
import { AppError } from '../utils/AppError';
import { AnalyticsPeriod } from '../types';

/**
 * GET /api/v1/analytics/metrics
 * Get Analytics Metrics
 * @access Private (requires authentication)
 */
export const getAnalyticsMetricsController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';
    const compareWith = (req.query.compare_with as 'previous_period' | 'last_year') || 'previous_period';

    // Validate period parameter
    const validPeriods: AnalyticsPeriod[] = ['today', 'week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      throw new AppError("Invalid period parameter. Allowed: today, week, month, year", 400);
    }

    const metrics = await getAnalyticsMetrics(userId, period, compareWith);

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'An unknown error occurred',
      });
    }
  }
};

/**
 * GET /api/v1/analytics/funnel
 * Get Funnel Data
 * @access Private (requires authentication)
 */
export const getAnalyticsFunnelController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    // Validate period parameter
    const validPeriods: AnalyticsPeriod[] = ['today', 'week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      throw new AppError("Invalid period parameter. Allowed: today, week, month, year", 400);
    }

    const funnel = await getAnalyticsFunnel(userId, period);

    res.status(200).json({
      success: true,
      data: funnel,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'An unknown error occurred',
      });
    }
  }
};

/**
 * GET /api/v1/analytics/trend
 * Get Monthly Closing Trend
 * @access Private (requires authentication)
 */
export const getAnalyticsTrendController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  try {
    const months = parseInt(req.query.months as string) || 6;

    // Validate months parameter
    if (isNaN(months) || months < 1 || months > 12) {
      throw new AppError('Months parameter must be between 1 and 12', 400);
    }

    const trend = await getAnalyticsTrend(userId, months);

    res.status(200).json({
      success: true,
      data: trend,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'An unknown error occurred',
      });
    }
  }
};

/**
 * GET /api/v1/analytics/sources
 * Get Source Breakdown
 * @access Private (requires authentication)
 */
export const getAnalyticsSourcesController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    // Validate period parameter
    const validPeriods: AnalyticsPeriod[] = ['today', 'week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      throw new AppError("Invalid period parameter. Allowed: today, week, month, year", 400);
    }

    const sources = await getAnalyticsSources(userId, period);

    res.status(200).json({
      success: true,
      data: sources,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'An unknown error occurred',
      });
    }
  }
};

/**
 * GET /api/v1/analytics/dashboard
 * Get Complete Analytics Dashboard
 * @access Private (requires authentication)
 */
export const getAnalyticsDashboardController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';
    const trendMonths = parseInt(req.query.trend_months as string) || 6;

    // Validate period parameter
    const validPeriods: AnalyticsPeriod[] = ['today', 'week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      throw new AppError("Invalid period parameter. Allowed: today, week, month, year", 400);
    }

    // Validate trend_months parameter
    if (isNaN(trendMonths) || trendMonths < 1 || trendMonths > 12) {
      throw new AppError('Trend months parameter must be between 1 and 12', 400);
    }

    const dashboard = await getAnalyticsDashboard(userId, period, trendMonths);

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'An unknown error occurred',
      });
    }
  }
};
