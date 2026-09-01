import { Request, Response } from 'express';
import {
  getPipelineData,
  updateLeadStatus,
  getPipelineMetrics,
} from '../services/pipelineService';
import {
  GetPipelineQuery,
  UpdateLeadStatusDto,
} from '../types';

/**
 * GET /api/v1/pipeline - Get Pipeline Data
 * Retrieves all leads grouped by pipeline stage for kanban board rendering
 */
export const getPipelineController = async (req: Request, res: Response): Promise<void> => {
  const query: GetPipelineQuery = {
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: req.query.search as string | undefined,
  };
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        details: {}
      }
    });
    return;
  }

  const userRole = req.user!.role;

  try {
    const result = await getPipelineData(query, userId, userRole);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = (error as any).statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 404 ? 'NOT_FOUND' : statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
          message: error.message,
          details: {}
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: {}
        }
      });
    }
  }
};

/**
 * PUT /api/v1/leads/:id/status - Update Lead Status (Drag & Drop)
 * Updates lead status when dragging between kanban columns
 */
export const updateLeadStatusController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const dto: UpdateLeadStatusDto = req.body;
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        details: {}
      }
    });
    return;
  }

  try {
    const result = await updateLeadStatus(id as string, dto, userId);
    res.status(200).json({
      success: true,
      message: 'Lead status updated successfully',
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = (error as any).statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 404 ? 'NOT_FOUND' : statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
          message: error.message,
          details: {}
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: {}
        }
      });
    }
  }
};

/**
 * GET /api/v1/pipeline/metrics - Get Pipeline Metrics
 * Retrieves summary metrics for pipeline overview
 */
export const getPipelineMetricsController = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        details: {}
      }
    });
    return;
  }

  const userRole = req.user!.role;

  try {
    const result = await getPipelineMetrics(userId, userRole);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = (error as any).statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 404 ? 'NOT_FOUND' : statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
          message: error.message,
          details: {}
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: {}
        }
      });
    }
  }
};
