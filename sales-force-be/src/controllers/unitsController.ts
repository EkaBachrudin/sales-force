import { Request, Response } from 'express';
import {
  getUnits as getUnitsService,
  createUnit as createUnitService,
  updateUnit as updateUnitService,
  deleteUnit as deleteUnitService,
  getUnitDetail as getUnitDetailService,
  assignLeadToUnit as assignLeadToUnitService,
  unassignLeadFromUnit as unassignLeadFromUnitService,
} from '../services/unitsService';
import { GetUnitsQuery, CreateUnitDto, UpdateUnitDto, AssignLeadToUnitDto } from '../types';

/**
 * GET /api/v1/blocks/:blockId/units - Get Units List
 */
export const getUnitsController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const blockId = req.params.blockId as string;

  const query: GetUnitsQuery = {
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    status: req.query.status as any,
    search: req.query.search as string | undefined,
  };

  const result = await getUnitsService(blockId, query, userId);

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * POST /api/v1/blocks/:blockId/units - Create New Unit
 */
export const createUnitController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const blockId = req.params.blockId as string;
  const dto: CreateUnitDto = req.body;

  const result = await createUnitService(blockId, dto, userId);

  res.status(201).json({
    success: true,
    message: 'Unit created successfully',
    data: {
      unit: result,
    },
  });
};

/**
 * PUT /api/v1/units/:id - Update Unit
 */
export const updateUnitController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const id = req.params.id as string;
  const dto: UpdateUnitDto = req.body;

  const result = await updateUnitService(id, dto, userId);

  res.status(200).json({
    success: true,
    message: 'Unit updated successfully',
    data: {
      unit: result,
    },
  });
};

/**
 * DELETE /api/v1/units/:id - Delete Unit
 */
export const deleteUnitController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const id = req.params.id as string;

  await deleteUnitService(id, userId);

  res.status(200).json({
    success: true,
    message: 'Unit deleted successfully',
  });
};

/**
 * GET /api/v1/units/:id - Get Unit Detail with Leads
 */
export const getUnitDetailController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const id = req.params.id as string;

  const result = await getUnitDetailService(id, userId);

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * POST /api/v1/units/:id/leads - Assign Lead to Unit
 */
export const assignLeadToUnitController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const userRole = req.user!.role;
  const id = req.params.id as string;
  const dto: AssignLeadToUnitDto = req.body;

  const result = await assignLeadToUnitService(id, dto.lead_id, userId, userRole);

  res.status(200).json({
    success: true,
    message: 'Lead assigned to unit successfully',
    data: result,
  });
};

/**
 * DELETE /api/v1/units/:id/leads/:leadId - Unassign Lead from Unit
 */
export const unassignLeadFromUnitController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const userRole = req.user!.role;
  const id = req.params.id as string;
  const leadId = req.params.leadId as string;

  const result = await unassignLeadFromUnitService(id, leadId, userId, userRole);

  res.status(200).json({
    success: true,
    message: 'Lead unassigned from unit successfully',
    data: result,
  });
};