import { Router } from 'express';
import {
  getUnitsController,
  createUnitController,
  updateUnitController,
  deleteUnitController,
  getUnitDetailController,
  assignLeadToUnitController,
  unassignLeadFromUnitController,
} from '../controllers/unitsController';
import { authenticate, subscriptionCheck, supervisorOrAdmin } from '../middleware';

const router = Router();

/**
 * GET /api/v1/blocks/:blockId/units
 * Get units list in a block with pagination
 * @access Private (requires authentication and active subscription, allowed roles: admin, supervisor)
 */
router.get('/blocks/:blockId/units', authenticate, subscriptionCheck, supervisorOrAdmin, getUnitsController);

/**
 * POST /api/v1/blocks/:blockId/units
 * Create a new unit in a block
 * @access Private (requires authentication and active subscription, allowed roles: admin, supervisor)
 */
router.post('/blocks/:blockId/units', authenticate, subscriptionCheck, supervisorOrAdmin, createUnitController);

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
 * DELETE /api/v1/units/:id/leads/:leadId
 * Unassign lead from unit
 * @access Private (requires authentication and active subscription)
 */
router.delete('/units/:id/leads/:leadId', authenticate, subscriptionCheck, unassignLeadFromUnitController);

/**
 * PUT /api/v1/units/:id
 * Update unit (name, land_area - status auto-updated via trigger)
 * @access Private (requires authentication and active subscription, allowed roles: admin, supervisor)
 */
router.put('/units/:id', authenticate, subscriptionCheck, supervisorOrAdmin, updateUnitController);

/**
 * DELETE /api/v1/units/:id
 * Delete unit (leads.unit_id will be set to NULL)
 * @access Private (requires authentication and active subscription, allowed roles: admin, supervisor)
 */
router.delete('/units/:id', authenticate, subscriptionCheck, supervisorOrAdmin, deleteUnitController);

export default router;