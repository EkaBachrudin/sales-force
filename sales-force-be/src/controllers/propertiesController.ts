import { Request, Response } from 'express';
import {
  getProperties as getPropertiesService,
  getPropertyDetail as getPropertyDetailService,
  getPropertySiteplan as getPropertySiteplanService,
  createProperty as createPropertyService,
  updateProperty as updatePropertyService,
  deleteProperty as deletePropertyService,
} from '../services/propertiesService';
import {
  GetPropertiesQuery,
  CreatePropertyDto,
  UpdatePropertyDto,
} from '../types';

/**
 * GET /api/v1/properties - Get User Properties List
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

  const query: GetPropertiesQuery = {
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: req.query.search as string | undefined,
    city: req.query.city as string | undefined,
  };

  const result = await getPropertiesService(query, userId);

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * GET /api/v1/properties/:id - Get Property Detail with Blocks
 */
export const getPropertyDetailController = async (req: Request, res: Response): Promise<void> => {
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

  const result = await getPropertyDetailService(id, userId);

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * GET /api/v1/properties/:id/siteplan - Get Property Siteplan with All Units
 */
export const getPropertySiteplanController = async (req: Request, res: Response): Promise<void> => {
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

  const result = await getPropertySiteplanService(id, userId);

  res.status(200).json({
    success: true,
    data: result,
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

  const dto: CreatePropertyDto = {
    name: req.body.name,
    city: req.body.city,
    land_area: req.body.land_area ? parseFloat(req.body.land_area) : undefined,
    address: req.body.address,
    description: req.body.description,
  };
  const siteplanPath = req.file ? `/uploads/siteplans/${req.file.filename}` : null;

  const result = await createPropertyService(dto, userId, siteplanPath);

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

  const id = req.params.id as string;
  const dto: UpdatePropertyDto = {
    name: req.body.name,
    city: req.body.city,
    land_area: req.body.land_area ? parseFloat(req.body.land_area) : undefined,
    address: req.body.address,
    description: req.body.description,
  };
  const siteplanPath = req.file ? `/uploads/siteplans/${req.file.filename}` : null;

  const result = await updatePropertyService(id, dto, userId, siteplanPath);

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

  const id = req.params.id as string;

  await deletePropertyService(id, userId);

  res.status(200).json({
    success: true,
    message: 'Property deleted successfully',
  });
};