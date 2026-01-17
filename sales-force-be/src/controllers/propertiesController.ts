import { Request, Response } from 'express';
import {
  getProperties as getPropertiesService,
  createProperty as createPropertyService,
  updateProperty as updatePropertyService,
  deleteProperty as deletePropertyService,
} from '../services/propertiesService';
import {
  GetPropertiesQueryV2,
  CreatePropertyDto,
  UpdatePropertyDto,
} from '../types';

/**
 * GET /api/v1/properties - Get User Properties (Dropdown Filter)
 */
export const getPropertiesController = async (req: Request, res: Response): Promise<void> => {
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

  const query: GetPropertiesQueryV2 = {
    search: req.query.search as string | undefined,
  };

  const result = await getPropertiesService(query, userId);

  res.status(200).json({
    success: true,
    data: {
      properties: result,
    },
  });
};

/**
 * POST /api/v1/properties - Create New Property
 */
export const createPropertyController = async (req: Request, res: Response): Promise<void> => {
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

  const dto: CreatePropertyDto = req.body;

  const result = await createPropertyService(dto, userId);

  res.status(201).json({
    success: true,
    message: 'Property created successfully',
    data: {
      property: result,
    },
  });
};

/**
 * PUT /api/v1/properties/:id - Update Property
 */
export const updatePropertyController = async (req: Request, res: Response): Promise<void> => {
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

  const { id } = req.params;
  const dto: UpdatePropertyDto = req.body;

  const result = await updatePropertyService(id as string, dto, userId);

  res.status(200).json({
    success: true,
    message: 'Property updated successfully',
    data: {
      property: result,
    },
  });
};

/**
 * DELETE /api/v1/properties/:id - Delete Property
 */
export const deletePropertyController = async (req: Request, res: Response): Promise<void> => {
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

  const { id } = req.params;

  await deletePropertyService(id as string, userId);

  res.status(200).json({
    success: true,
    message: 'Property deleted successfully',
  });
};
