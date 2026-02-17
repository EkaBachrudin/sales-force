import { Request, Response } from 'express';
import {
  getLeads,
  getLeadDetail,
  createLead,
  updateLead,
  addActivity,
  getProperties,
  exportLeads,
} from '../services/leadsService';
import {
  CrmCreateLeadDto as CreateLeadDto,
  CrmUpdateLeadDto as UpdateLeadDto,
  CrmAddActivityDto as AddActivityDto,
  GetLeadsQuery,
  GetPropertiesQuery,
  CrmLeadStatus as LeadStatusEnum,
  CrmLeadSource as LeadSourceEnum,
} from '../types';

/**
 * GET /api/v1/leads - List Leads with Pagination & Filters
 */
export const getLeadsController = async (req: Request, res: Response): Promise<void> => {
  const query: GetLeadsQuery = {
    page: req.query.page ? Number.parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? Number.parseInt(req.query.limit as string) : undefined,
    status: req.query.status as LeadStatusEnum | undefined,
    search: req.query.search as string | undefined,
    start_date: req.query.start_date as string | undefined,
    end_date: req.query.end_date as string | undefined,
    property_id: req.query.property_id as string | undefined,
    source: req.query.source as LeadSourceEnum | undefined,
    sort_by: req.query.sort_by as any,
    sort_order: req.query.sort_order as any,
  };
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  const result = await getLeads(query, userId);

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * GET /api/v1/leads/:id - Get Lead Detail
 */
export const getLeadDetailController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  const result = await getLeadDetail(id as string, userId);

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * POST /api/v1/leads - Create New Lead
 */
export const createLeadController = async (req: Request, res: Response): Promise<void> => {
  const dto: CreateLeadDto = req.body;
  const userId = req.user?.sub;

  const result = await createLead(dto, userId);

  res.status(201).json({
    success: true,
    message: 'Lead created successfully',
    data: {
      lead: result,
    },
  });
};

/**
 * PUT /api/v1/leads/:id - Update Lead
 */
export const updateLeadController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const dto: UpdateLeadDto = req.body;
  const userId = req.user?.sub;

  const result = await updateLead(id as string, dto, userId);

  res.status(200).json({
    success: true,
    message: 'Lead updated successfully',
    data: {
      lead: result,
    },
  });
};

/**
 * POST /api/v1/leads/:id/activities - Add Activity/Note
 */
export const addActivityController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const dto: AddActivityDto = req.body;
  const userId = req.user?.sub;

  const result = await addActivity(id as string, dto, userId);

  res.status(201).json({
    success: true,
    message: 'Activity added successfully',
    data: {
      activity: result,
    },
  });
};

/**
 * GET /api/v1/properties - Get Properties List
 */
export const getPropertiesController = async (req: Request, res: Response): Promise<void> => {
  const query: GetPropertiesQuery = {
    assigned_to: req.query.assigned_to as string | undefined,
  };

  const result = await getProperties(query);

  res.status(200).json({
    success: true,
    data: {
      properties: result,
    },
  });
};

/**
 * GET /api/v1/leads/export - Export Leads to Excel
 */
export const exportLeadsController = async (req: Request, res: Response): Promise<void> => {
  const query: GetLeadsQuery = {
    status: req.query.status as LeadStatusEnum | undefined,
    search: req.query.search as string | undefined,
    start_date: req.query.start_date as string | undefined,
    end_date: req.query.end_date as string | undefined,
    property_id: req.query.property_id as string | undefined,
    source: req.query.source as LeadSourceEnum | undefined,
  };
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  const buffer = await exportLeads(query, userId);

  // Set headers for Excel file download
  const filename = `leads-export-${new Date().toISOString().split('T')[0]}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);

  res.send(buffer);
};
