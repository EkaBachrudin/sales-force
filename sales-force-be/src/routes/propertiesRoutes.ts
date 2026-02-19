import { Router } from 'express';
import {
  getPropertiesController,
  createPropertyController,
  updatePropertyController,
  deletePropertyController,
} from '../controllers/propertiesController';
import { authenticate, subscriptionCheck } from '../middleware';

const router = Router();

/**
 * GET /api/v1/properties
 * Get list of properties for dropdown filter
 * @access Private (requires authentication and active subscription)
 */
router.get('/', authenticate, subscriptionCheck, getPropertiesController);

/**
 * POST /api/v1/properties
 * Create a new property
 * @access Private (requires authentication and active subscription)
 */
router.post('/', authenticate, subscriptionCheck, createPropertyController);

/**
 * PUT /api/v1/properties/:id
 * Update existing property
 * @access Private (requires authentication and active subscription)
 */
router.put('/:id', authenticate, subscriptionCheck, updatePropertyController);

/**
 * DELETE /api/v1/properties/:id
 * Delete property (soft delete)
 * @access Private (requires authentication and active subscription)
 */
router.delete('/:id', authenticate, subscriptionCheck, deletePropertyController);

export default router;
