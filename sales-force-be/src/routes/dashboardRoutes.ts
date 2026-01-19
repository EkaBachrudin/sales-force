import { Router } from 'express';
import { getDashboardOverviewController } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/dashboard/overview
 * Get dashboard overview metrics for the authenticated user
 * @access Private (requires authentication)
 */
router.get('/overview', authenticate, getDashboardOverviewController);

export default router;
