import { Router } from 'express';
import {
  getPipelineController,
  updateLeadStatusController,
  getPipelineMetricsController,
} from '../controllers/pipelineController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/pipeline
 * Get all leads grouped by pipeline stage for kanban board rendering
 * @access Private (requires authentication)
 */
router.get('/', authenticate, getPipelineController);

/**
 * GET /api/v1/pipeline/metrics
 * Get summary metrics for pipeline overview
 * @access Private (requires authentication)
 */
router.get('/metrics', authenticate, getPipelineMetricsController);

/**
 * PUT /api/v1/leads/:id/status
 * Update lead status when dragging between kanban columns
 * @access Private (requires authentication)
 */
router.put('/leads/:id/status', authenticate, updateLeadStatusController);

export default router;
