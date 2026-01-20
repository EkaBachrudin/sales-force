import { Router } from 'express';
import {
  getAnalyticsMetricsController,
  getAnalyticsFunnelController,
  getAnalyticsTrendController,
  getAnalyticsSourcesController,
  getAnalyticsDashboardController,
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/analytics/metrics
 * Get analytics metrics (conversion rate, avg time to close, response time, follow-up rate)
 * Query params:
 *  - period: 'today' | 'week' | 'month' | 'year' (default: 'month')
 *  - compare_with: 'previous_period' | 'last_year' (default: 'previous_period')
 * @access Private (requires authentication)
 */
router.get('/metrics', authenticate, getAnalyticsMetricsController);

/**
 * GET /api/v1/analytics/funnel
 * Get funnel data by stage
 * Query params:
 *  - period: 'today' | 'week' | 'month' | 'year' (default: 'month')
 * @access Private (requires authentication)
 */
router.get('/funnel', authenticate, getAnalyticsFunnelController);

/**
 * GET /api/v1/analytics/trend
 * Get monthly closing trend
 * Query params:
 *  - months: number (default: 6, max: 12)
 * @access Private (requires authentication)
 */
router.get('/trend', authenticate, getAnalyticsTrendController);

/**
 * GET /api/v1/analytics/sources
 * Get source breakdown
 * Query params:
 *  - period: 'today' | 'week' | 'month' | 'year' (default: 'month')
 * @access Private (requires authentication)
 */
router.get('/sources', authenticate, getAnalyticsSourcesController);

/**
 * GET /api/v1/analytics/dashboard
 * Get complete analytics dashboard (all endpoints combined)
 * Query params:
 *  - period: 'today' | 'week' | 'month' | 'year' (default: 'month')
 *  - trend_months: number (default: 6)
 * @access Private (requires authentication)
 */
router.get('/dashboard', authenticate, getAnalyticsDashboardController);

export default router;
