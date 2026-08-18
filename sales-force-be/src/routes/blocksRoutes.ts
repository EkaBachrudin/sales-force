import { Router } from 'express';
import {
  createBlockController,
  updateBlockController,
  deleteBlockController,
} from '../controllers/blocksController';
import { authenticate, subscriptionCheck } from '../middleware';

const router = Router();

/**
 * POST /api/v1/properties/:propertyId/blocks
 * Create a new block in a property
 * @access Private (requires authentication and active subscription)
 */
router.post('/properties/:propertyId/blocks', authenticate, subscriptionCheck, createBlockController);

/**
 * PUT /api/v1/blocks/:id
 * Update block name
 * @access Private (requires authentication and active subscription)
 */
router.put('/blocks/:id', authenticate, subscriptionCheck, updateBlockController);

/**
 * DELETE /api/v1/blocks/:id
 * Delete block (cascade delete units)
 * @access Private (requires authentication and active subscription)
 */
router.delete('/blocks/:id', authenticate, subscriptionCheck, deleteBlockController);

export default router;