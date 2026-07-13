import { Router } from 'express';
import {
  getPropertiesController,
  getPropertyDetailController,
  getPropertySiteplanController,
  createPropertyController,
  updatePropertyController,
  deletePropertyController,
} from '../controllers/propertiesController';
import { authenticate, subscriptionCheck } from '../middleware';

const router = Router();

/**
 * GET /api/v1/properties
 * Get list of properties for logged in user
 * @access Private (requires authentication and active subscription)
 */
router.get('/', authenticate, subscriptionCheck, getPropertiesController);

/**
 * GET /api/v1/properties/:id
 * Get property detail with blocks list
 * @access Private (requires authentication and active subscription)
 */
router.get('/:id', authenticate, subscriptionCheck, getPropertyDetailController);

/**
 * GET /api/v1/properties/:id/siteplan
 * Get property siteplan image and all units for mapping
 * @access Private (requires authentication and active subscription)
 */
router.get('/:id/siteplan', authenticate, subscriptionCheck, getPropertySiteplanController);

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
 * Delete property (cascade delete blocks and units)
 * @access Private (requires authentication and active subscription)
 */
router.delete('/:id', authenticate, subscriptionCheck, deletePropertyController);

export default router;