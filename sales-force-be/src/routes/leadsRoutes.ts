import { Router } from 'express';
import {
  getLeadsController,
  getLeadDetailController,
  createLeadController,
  updateLeadController,
  addActivityController,
  getPropertiesController,
  exportLeadsController,
} from '../controllers/leadsController';
import { authenticate, subscriptionCheck } from '../middleware';

const router = Router();

/**
 * GET /api/v1/leads
 * List all leads with pagination and filters
 * @access Private (requires authentication and active subscription)
 */
router.get('/', authenticate, subscriptionCheck, getLeadsController);

/**
 * GET /api/v1/leads/export
 * Export leads to Excel file
 * @access Private (requires authentication and active subscription)
 */
router.get('/export', authenticate, subscriptionCheck, exportLeadsController);

/**
 * GET /api/v1/leads/:id
 * Get detailed lead information
 * @access Private (requires authentication and active subscription)
 */
router.get('/:id', authenticate, subscriptionCheck, getLeadDetailController);

/**
 * POST /api/v1/leads
 * Create a new lead
 * @access Private (requires authentication and active subscription)
 */
router.post('/', authenticate, subscriptionCheck, createLeadController);

/**
 * PUT /api/v1/leads/:id
 * Update existing lead
 * @access Private (requires authentication and active subscription)
 */
router.put('/:id', authenticate, subscriptionCheck, updateLeadController);

/**
 * POST /api/v1/leads/:id/activities
 * Add activity or note to lead
 * @access Private (requires authentication and active subscription)
 */
router.post('/:id/activities', authenticate, subscriptionCheck, addActivityController);

/**
 * GET /api/v1/properties
 * Get list of properties for filter dropdown
 * @access Private (requires authentication and active subscription)
 */
router.get('/properties/list', authenticate, subscriptionCheck, getPropertiesController);

export default router;
