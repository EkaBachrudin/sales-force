import { Router } from 'express';
import {
  getUnitsController,
  createUnitController,
  updateUnitController,
  deleteUnitController,
  getUnitDetailController,
  assignLeadToUnitController,
} from '../controllers/unitsController';
import { authenticate, subscriptionCheck } from '../middleware';

const router = Router();

/**
 * GET /api/v1/blocks/:blockId/units
 * Get units list in a block with pagination
 * @access Private (requires authentication and active subscription)
 */
router.get('/blocks/:blockId/units', authenticate, subscriptionCheck, getUnitsController);

/**
 * POST /api/v1/blocks/:blockId/units
 * Create a new unit in a block
 * @access Private (requires authentication and active subscription)
 */
router.post('/blocks/:blockId/units', authenticate, subscriptionCheck, createUnitController);

/**
 * GET /api/v1/units/:id
 * Get unit detail with assigned leads
 * @access Private (requires authentication and active subscription)
 */
router.get('/units/:id', authenticate, subscriptionCheck, getUnitDetailController);

/**
 * POST /api/v1/units/:id/leads
 * Assign lead to unit
 * @access Private (requires authentication and active subscription)
 */
router.post('/units/:id/leads', authenticate, subscriptionCheck, assignLeadToUnitController);

/**
 * PUT /api/v1/units/:id
 * Update unit (name, land_area - status auto-updated via trigger)
 * @access Private (requires authentication and active subscription)
 */
router.put('/units/:id', authenticate, subscriptionCheck, updateUnitController);

/**
 * DELETE /api/v1/units/:id
 * Delete unit (leads.unit_id will be set to NULL)
 * @access Private (requires authentication and active subscription)
 */
router.delete('/units/:id', authenticate, subscriptionCheck, deleteUnitController);

export default router;