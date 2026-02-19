import { Router } from 'express';
import {
  getAnalyticsMetricsController,
  getAnalyticsFunnelController,
  getAnalyticsTrendController,
  getAnalyticsSourcesController,
  getAnalyticsDashboardController,
} from '../controllers/analyticsController';
import { authenticate, subscriptionCheck } from '../middleware';

const router = Router();

/**
 * GET /api/v1/analytics/metrics
 * Get analytics metrics (conversion rate, avg time to close, response time, follow-up rate)
 * Query params:
 *  - period: 'today' | 'week' | 'month' | 'year' (default: 'month')
 *  - compare_with: 'previous_period' | 'last_year' (default: 'previous_period')
 * @access Private (requires authentication and active subscription)
 */
router.get('/metrics', authenticate, subscriptionCheck, getAnalyticsMetricsController);

/**
 * GET /api/v1/analytics/funnel
 * Get funnel data by stage
 * Query params:
 *  - period: 'today' | 'week' | 'month' | 'year' (default: 'month')
 * @access Private (requires authentication and active subscription)
 */
router.get('/funnel', authenticate, subscriptionCheck, getAnalyticsFunnelController);

/**
 * GET /api/v1/analytics/trend
 * Get monthly closing trend
 * Query params:
 *  - months: number (default: 6, max: 12)
 * @access Private (requires authentication and active subscription)
 */
router.get('/trend', authenticate, subscriptionCheck, getAnalyticsTrendController);

/**
 * GET /api/v1/analytics/sources
 * Get source breakdown
 * Query params:
 *  - period: 'today' | 'week' | 'month' | 'year' (default: 'month')
 * @access Private (requires authentication and active subscription)
 */
router.get('/sources', authenticate, subscriptionCheck, getAnalyticsSourcesController);

/**
 * GET /api/v1/analytics/dashboard
 * Get complete analytics dashboard (all endpoints combined)
 * Query params:
 *  - period: 'today' | 'week' | 'month' | 'year' (default: 'month')
 *  - trend_months: number (default: 6)
 * @access Private (requires authentication and active subscription)
 */
router.get('/dashboard', authenticate, subscriptionCheck, getAnalyticsDashboardController);

export default router;
