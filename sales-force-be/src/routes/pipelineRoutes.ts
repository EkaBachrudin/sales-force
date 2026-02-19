import { Router } from 'express';
import {
  getPipelineController,
  updateLeadStatusController,
  getPipelineMetricsController,
} from '../controllers/pipelineController';
import { authenticate, subscriptionCheck } from '../middleware';

const router = Router();

/**
 * GET /api/v1/pipeline
 * Get all leads grouped by pipeline stage for kanban board rendering
 * @access Private (requires authentication and active subscription)
 */
router.get('/', authenticate, subscriptionCheck, getPipelineController);

/**
 * GET /api/v1/pipeline/metrics
 * Get summary metrics for pipeline overview
 * @access Private (requires authentication and active subscription)
 */
router.get('/metrics', authenticate, subscriptionCheck, getPipelineMetricsController);

/**
 * PUT /api/v1/leads/:id/status
 * Update lead status when dragging between kanban columns
 * @access Private (requires authentication and active subscription)
 */
router.put('/leads/:id/status', authenticate, subscriptionCheck, updateLeadStatusController);

export default router;
