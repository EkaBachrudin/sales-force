import { Request, Response } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../services/usersService';
import {
  CreateUserDto,
  UpdateUserDto,
  GetUsersQuery,
} from '../types';

/**
 * GET /api/v1/users - List Users with Pagination & Filters
 */
export const getUsersController = async (req: Request, res: Response): Promise<void> => {
  const query: GetUsersQuery = {
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: req.query.search as string | undefined,
    is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
    role_id: req.query.role_id as string | undefined,
    role: req.query.role as string | undefined,
    sort_by: req.query.sort_by as any,
    sort_order: req.query.sort_order as any,
  };

  const result = await getUsers(query, req.user?.role);

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * GET /api/v1/users/:id - Get User Detail
 */
export const getUserDetailController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await getUserById(id as string, req.user?.role);

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * POST /api/v1/users - Create New User
 */
export const createUserController = async (req: Request, res: Response): Promise<void> => {
  const dto: CreateUserDto = req.body;

  const result = await createUser(dto, req.user?.role);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: result,
    },
  });
};

/**
 * PUT /api/v1/users/:id - Update User
 */
export const updateUserController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const dto: UpdateUserDto = req.body;

  const result = await updateUser(id as string, dto, req.user?.role, req.user?.sub);

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: result,
    },
  });
};

/**
 * DELETE /api/v1/users/:id - Delete User
 */
export const deleteUserController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  await deleteUser(id as string, req.user?.role);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
};
