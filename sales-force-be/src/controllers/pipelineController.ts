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
  };
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  const result = await getPipelineData(query, userId);

  res.status(200).json({
    success: true,
    data: result,
  });
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
      message: 'Unauthorized',
    });
    return;
  }

  const result = await updateLeadStatus(id as string, dto, userId);

  res.status(200).json({
    success: true,
    message: 'Lead status updated successfully',
    data: result,
  });
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
      message: 'Unauthorized',
    });
    return;
  }

  const result = await getPipelineMetrics(userId);

  res.status(200).json({
    success: true,
    data: result,
  });
};
