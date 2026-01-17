import { Router } from 'express';
import {
  getPropertiesController,
  createPropertyController,
  updatePropertyController,
  deletePropertyController,
} from '../controllers/propertiesController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/properties
 * Get list of properties for dropdown filter
 * @access Private (requires authentication)
 */
router.get('/', authenticate, getPropertiesController);

/**
 * POST /api/v1/properties
 * Create a new property
 * @access Private (requires authentication)
 */
router.post('/', authenticate, createPropertyController);

/**
 * PUT /api/v1/properties/:id
 * Update existing property
 * @access Private (requires authentication)
 */
router.put('/:id', authenticate, updatePropertyController);

/**
 * DELETE /api/v1/properties/:id
 * Delete property (soft delete)
 * @access Private (requires authentication)
 */
router.delete('/:id', authenticate, deletePropertyController);

export default router;
