import { Router } from 'express';
import {
  getLeadsController,
  getLeadDetailController,
  createLeadController,
  updateLeadController,
  addActivityController,
  getPropertiesController,
} from '../controllers/leadsController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/leads
 * List all leads with pagination and filters
 * @access Private (requires authentication)
 */
router.get('/', authenticate, getLeadsController);

/**
 * GET /api/v1/leads/:id
 * Get detailed lead information
 * @access Private (requires authentication)
 */
router.get('/:id', authenticate, getLeadDetailController);

/**
 * POST /api/v1/leads
 * Create a new lead
 * @access Private (requires authentication)
 */
router.post('/', authenticate, createLeadController);

/**
 * PUT /api/v1/leads/:id
 * Update existing lead
 * @access Private (requires authentication)
 */
router.put('/:id', authenticate, updateLeadController);

/**
 * POST /api/v1/leads/:id/activities
 * Add activity or note to lead
 * @access Private (requires authentication)
 */
router.post('/:id/activities', authenticate, addActivityController);

/**
 * GET /api/v1/properties
 * Get list of properties for filter dropdown
 * @access Private (requires authentication)
 */
router.get('/properties/list', authenticate, getPropertiesController);

export default router;
