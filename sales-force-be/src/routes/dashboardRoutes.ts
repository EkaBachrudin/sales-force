import { Router } from 'express';
import { getDashboardOverviewController } from '../controllers/dashboardController';
import { authenticate, subscriptionCheck } from '../middleware';

const router = Router();

/**
 * GET /api/v1/dashboard/overview
 * Get dashboard overview metrics for the authenticated user
 * @access Private (requires authentication and active subscription)
 */
router.get('/overview', authenticate, subscriptionCheck, getDashboardOverviewController);

export default router;
