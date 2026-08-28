import { Request, Response } from 'express';
import {
  createBlock as createBlockService,
  updateBlock as updateBlockService,
  deleteBlock as deleteBlockService,
} from '../services/blocksService';
import { CreateBlockDto, UpdateBlockDto } from '../types';

/**
 * POST /api/v1/properties/:propertyId/blocks - Create New Block
 */
export const createBlockController = async (req: Request, res: Response): Promise<void> => {
  const propertyId = req.params.propertyId as string;
  const dto: CreateBlockDto = req.body;

  const result = await createBlockService(propertyId, dto);

  res.status(201).json({
    success: true,
    message: 'Block created successfully',
    data: {
      block: result,
    },
  });
};

/**
 * PUT /api/v1/blocks/:id - Update Block
 */
export const updateBlockController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const dto: UpdateBlockDto = req.body;

  const result = await updateBlockService(id, dto);

  res.status(200).json({
    success: true,
    message: 'Block updated successfully',
    data: {
      block: result,
    },
  });
};

/**
 * DELETE /api/v1/blocks/:id - Delete Block
 */
export const deleteBlockController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  await deleteBlockService(id);

  res.status(200).json({
    success: true,
    message: 'Block deleted successfully',
  });
};
