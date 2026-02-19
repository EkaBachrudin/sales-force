import { Request, Response } from 'express';
import {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from '../services/subscriptionsService';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  GetSubscriptionsQuery,
} from '../types';

/**
 * GET /api/v1/subscriptions - List Subscriptions with Pagination & Filters
 */
export const getSubscriptionsController = async (req: Request, res: Response): Promise<void> => {
  const query: GetSubscriptionsQuery = {
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    user_id: req.query.user_id as string | undefined,
    status: req.query.status as any,
    subscription_type: req.query.subscription_type as any,
    sort_by: req.query.sort_by as any,
    sort_order: req.query.sort_order as any,
  };

  const result = await getSubscriptions(query);

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * GET /api/v1/subscriptions/:id - Get Subscription Detail
 */
export const getSubscriptionDetailController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await getSubscriptionById(id as string);

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * POST /api/v1/subscriptions - Create New Subscription
 */
export const createSubscriptionController = async (req: Request, res: Response): Promise<void> => {
  const dto: CreateSubscriptionDto = req.body;

  const result = await createSubscription(dto);

  res.status(201).json({
    success: true,
    message: 'Subscription created successfully',
    data: {
      subscription: result,
    },
  });
};

/**
 * PUT /api/v1/subscriptions/:id - Update Subscription
 */
export const updateSubscriptionController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const dto: UpdateSubscriptionDto = req.body;

  const result = await updateSubscription(id as string, dto);

  res.status(200).json({
    success: true,
    message: 'Subscription updated successfully',
    data: {
      subscription: result,
    },
  });
};

/**
 * DELETE /api/v1/subscriptions/:id - Delete Subscription
 */
export const deleteSubscriptionController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  await deleteSubscription(id as string);

  res.status(200).json({
    success: true,
    message: 'Subscription deleted successfully',
  });
};
