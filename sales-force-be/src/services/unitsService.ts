import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import {
  Unit,
  UnitListItem,
  UnitDetail,
  GetUnitsQuery,
  CreateUnitDto,
  UpdateUnitDto,
  PaginatedUnitsResponse,
  PaginationMeta,
  UnassignLeadResponse,
} from '../types';
import { CrmLead, CrmLeadStatus } from '../types';
import { findBookedLeadOnUnit } from './leadUnitRules';
import { naturalCompare } from '../utils/naturalSort';

/**
 * GET /api/v1/blocks/:blockId/units - Get Units List
 */
export const getUnits = async (
  blockId: string,
  query: GetUnitsQuery,
  _userId: string
): Promise<PaginatedUnitsResponse> => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, query.limit || 20);
  const offset = (page - 1) * limit;
  const statusFilter = query.status;
  const search = query.search?.trim();

  // Get block info
  const blockInfoQuery = `
    SELECT
      b.id,
      b.name,
      b.property_id,
      p.name AS property_name
    FROM blocks b
    JOIN properties p ON p.id = b.property_id
    WHERE b.id = $1
  `;

  const blockInfoResult = await pool.query(blockInfoQuery, [blockId]);

  if (blockInfoResult.rows.length === 0) {
    throw new AppError('Block not found', 404);
  }

  const blockInfo = blockInfoResult.rows[0];

  // Build query conditions
  const conditions: string[] = ['u.block_id = $1'];
  const params: any[] = [blockId];
  let paramIndex = 2;

  if (statusFilter) {
    conditions.push(`u.status = $${paramIndex++}`);
    params.push(statusFilter);
  }

  if (search) {
    conditions.push(`u.name ILIKE $${paramIndex++}`);
    params.push(`%${search}%`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM units u
    JOIN blocks b ON b.id = u.block_id
    JOIN properties p ON p.id = b.property_id
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(totalItems / limit);

  // Get units with pagination
  const queryStr = `
    SELECT
      u.id,
      u.name,
      u.land_area,
      u.status,
      u.created_at,
      u.updated_at
    FROM units u
    JOIN blocks b ON b.id = u.block_id
    JOIN properties p ON p.id = b.property_id
    ${whereClause}
  `;

  const result = await pool.query(queryStr, params);

  const units: UnitListItem[] = result.rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      land_area: row.land_area,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
    .sort((a, b) => naturalCompare(a.name, b.name));

  const pagedUnits = units.slice(offset, offset + limit);

  const pagination: PaginationMeta = {
    page,
    limit,
    total_items: totalItems,
    total_pages: totalPages,
  };

  return {
    block: {
      id: blockInfo.id,
      name: blockInfo.name,
      property_id: blockInfo.property_id,
      property_name: blockInfo.property_name,
    },
    units: pagedUnits,
    pagination,
  };
};

/**
 * POST /api/v1/blocks/:blockId/units - Create New Unit
 */
export const createUnit = async (
  blockId: string,
  dto: CreateUnitDto,
  _userId: string
): Promise<Unit> => {
  // Validate name
  if (!dto.name || dto.name.trim().length === 0) {
    throw new AppError('Unit name is required', 400);
  }

  if (dto.name.length > 100) {
    throw new AppError('Unit name must be maximum 100 characters', 400);
  }

  // Validate land_area if provided
  if (dto.land_area !== undefined) {
    if (typeof dto.land_area !== 'number' || dto.land_area < 0) {
      throw new AppError('Land area must be a non-negative number', 400);
    }
  }

  // Check if block exists
  const blockCheck = await pool.query(
    `
    SELECT b.id
    FROM blocks b
    WHERE b.id = $1
    `,
    [blockId]
  );

  if (blockCheck.rows.length === 0) {
    throw new AppError('Block not found', 404);
  }

  // Check if unit name already exists in this block
  const existingUnit = await pool.query(
    'SELECT id FROM units WHERE block_id = $1 AND name = $2',
    [blockId, dto.name.trim()]
  );

  if (existingUnit.rows.length > 0) {
    throw new AppError('Unit name already exists in this block', 409);
  }

  // Insert unit
  const queryStr = `
    INSERT INTO units (
      id, block_id, name, land_area, status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, 'available', NOW(), NOW()
    ) RETURNING *
  `;

  const result = await pool.query(queryStr, [blockId, dto.name.trim(), dto.land_area ?? null]);
  const row = result.rows[0];

  return {
    id: row.id,
    block_id: row.block_id,
    name: row.name,
    land_area: row.land_area,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * PUT /api/v1/units/:id - Update Unit
 */
export const updateUnit = async (
  unitId: string,
  dto: UpdateUnitDto,
  _userId: string
): Promise<Unit> => {
  // Validate name if provided
  if (dto.name !== undefined) {
    if (dto.name.trim().length === 0) {
      throw new AppError('Unit name cannot be empty', 400);
    }

    if (dto.name.length > 100) {
      throw new AppError('Unit name must be maximum 100 characters', 400);
    }
  }

  // Validate land_area if provided
  if (dto.land_area !== undefined) {
    if (typeof dto.land_area !== 'number' || dto.land_area < 0) {
      throw new AppError('Land area must be a non-negative number', 400);
    }
  }

  // Check if at least one field is being updated
  if (dto.name === undefined && dto.land_area === undefined) {
    throw new AppError('At least one field must be provided', 400);
  }

  // Check if unit exists
  const existingUnit = await pool.query(
    `
    SELECT u.*, b.id as block_id
    FROM units u
    JOIN blocks b ON b.id = u.block_id
    WHERE u.id = $1
    `,
    [unitId]
  );

  if (existingUnit.rows.length === 0) {
    throw new AppError('Unit not found', 404);
  }

  const blockId = existingUnit.rows[0].block_id;

  // Check if unit name already exists in this block (excluding current unit)
  if (dto.name !== undefined) {
    const nameCheck = await pool.query(
      'SELECT id FROM units WHERE block_id = $1 AND name = $2 AND id != $3',
      [blockId, dto.name.trim(), unitId]
    );

    if (nameCheck.rows.length > 0) {
      throw new AppError('Unit name already exists in this block', 409);
    }
  }

  // Update unit (status cannot be updated directly)
  const queryStr = `
    UPDATE units
    SET name = COALESCE($1, name),
        land_area = COALESCE($2, land_area),
        updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;

  const result = await pool.query(queryStr, [
    dto.name?.trim(),
    dto.land_area ?? null,
    unitId,
  ]);
  const row = result.rows[0];

  return {
    id: row.id,
    block_id: row.block_id,
    name: row.name,
    land_area: row.land_area,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * DELETE /api/v1/units/:id - Delete Unit
 */
export const deleteUnit = async (unitId: string, _userId: string): Promise<void> => {
  // Check if unit exists
  const existingUnit = await pool.query(
    'SELECT u.id, u.status FROM units u WHERE u.id = $1',
    [unitId]
  );

  if (existingUnit.rows.length === 0) {
    throw new AppError('Unit not found', 404);
  }

  const unitStatus = existingUnit.rows[0].status;

  // Business rule: Cannot delete sold units
  if (unitStatus === 'sold') {
    throw new AppError('Cannot delete sold units', 409);
  }

  // Delete unit (leads.unit_id will be set to NULL via ON DELETE SET NULL)
  await pool.query('DELETE FROM units WHERE id = $1', [unitId]);
};

/**
 * GET /api/v1/units/:id - Get Unit Detail with Leads
 */
export const getUnitDetail = async (unitId: string, _userId: string): Promise<UnitDetail> => {
  // Get unit detail
  const unitQuery = `
    SELECT
      u.*,
      b.name AS block_name,
      p.id AS property_id,
      p.name AS property_name
    FROM units u
    JOIN blocks b ON b.id = u.block_id
    JOIN properties p ON p.id = b.property_id
    WHERE u.id = $1
  `;

  const unitResult = await pool.query(unitQuery, [unitId]);

  if (unitResult.rows.length === 0) {
    throw new AppError('Unit not found', 404);
  }

  const unitRow = unitResult.rows[0];

  const unit = {
    id: unitRow.id,
    block_id: unitRow.block_id,
    block_name: unitRow.block_name,
    property_id: unitRow.property_id,
    property_name: unitRow.property_name,
    name: unitRow.name,
    land_area: unitRow.land_area,
    status: unitRow.status,
    created_at: unitRow.created_at,
    updated_at: unitRow.updated_at,
  };

  // Get leads assigned to this unit
  const leadsQuery = `
    SELECT
      l.id,
      l.name,
      l.phone,
      l.email,
      l.status,
      l.assigned_to,
      u.full_name AS assigned_to_name,
      l.created_at
    FROM leads l
    LEFT JOIN users u ON u.id = l.assigned_to
    WHERE l.unit_id = $1
    ORDER BY l.created_at DESC
  `;

  const leadsResult = await pool.query(leadsQuery, [unitId]);

  const leads: CrmLead[] = leadsResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    status: row.status as CrmLeadStatus,
    source: 'manual' as any,
    assigned_to: row.assigned_to,
    assigned_to_name: row.assigned_to_name,
    created_at: row.created_at,
    updated_at: row.created_at,
  }));

  return { unit, leads };
};

/**
 * POST /api/v1/units/:id/leads - Assign Lead to Unit
 */
export const assignLeadToUnit = async (
  unitId: string,
  leadId: string,
  userId: string,
  userRole: string
): Promise<{ lead: any; unit: any }> => {
  // RBAC: Admin & Supervisor bypass ownership & sold-unit validation
  const isPrivilegedRole = userRole === 'Admin' || userRole === 'Supervisor';

  // Check if unit exists
  const unitQuery = `
    SELECT u.*, b.name AS block_name
    FROM units u
    JOIN blocks b ON b.id = u.block_id
    JOIN properties p ON p.id = b.property_id
    WHERE u.id = $1
  `;

  const unitResult = await pool.query(unitQuery, [unitId]);

  if (unitResult.rows.length === 0) {
    throw new AppError('Unit not found', 404);
  }

  const unitRow = unitResult.rows[0];

  // Sold-unit check — bypassed for Admin/Supervisor
  if (!isPrivilegedRole && unitRow.status === 'sold') {
    throw new AppError('Cannot assign lead to sold unit', 409);
  }

  const bookedLeadId = await findBookedLeadOnUnit(pool, unitId);

  if (bookedLeadId) {
    throw new AppError('Unit already has a booked lead', 409);
  }

  // Check if lead exists
  const leadQuery = `
    SELECT l.*
    FROM leads l
    WHERE l.id = $1
  `;

  const leadResult = await pool.query(leadQuery, [leadId]);

  if (leadResult.rows.length === 0) {
    throw new AppError('Lead not found', 404);
  }

  const leadRow = leadResult.rows[0];

  // Ownership check — bypassed for Admin/Supervisor
  if (!isPrivilegedRole && leadRow.assigned_to !== userId) {
    throw new AppError('Lead does not belong to you', 403);
  }

  if (leadRow.unit_id !== null) {
    throw new AppError('Lead already assigned to a unit', 409);
  }

  // Assign lead to unit
  const updateLeadQuery = `
    UPDATE leads
    SET unit_id = $1,
        updated_at = NOW()
    WHERE id = $2
      AND (assigned_to = $3 OR $4::boolean)
      AND unit_id IS NULL
    RETURNING *
  `;

  const updateLeadResult = await pool.query(updateLeadQuery, [unitId, leadId, userId, isPrivilegedRole]);
  const updatedLead = updateLeadResult.rows[0];

  // Get updated unit (status should have changed via trigger)
  const updatedUnitResult = await pool.query('SELECT * FROM units WHERE id = $1', [unitId]);
  const updatedUnit = updatedUnitResult.rows[0];

  return {
    lead: {
      id: updatedLead.id,
      name: updatedLead.name,
      unit_id: updatedLead.unit_id,
      unit_name: unitRow.name,
      status: updatedLead.status,
      updated_at: updatedLead.updated_at,
    },
    unit: {
      id: updatedUnit.id,
      name: updatedUnit.name,
      status: updatedUnit.status,
      updated_at: updatedUnit.updated_at,
    },
  };
};

/**
 * DELETE /api/v1/units/:id/leads/:leadId - Unassign Lead from Unit
 */
export const unassignLeadFromUnit = async (
  unitId: string,
  leadId: string,
  userId: string,
  userRole: string
): Promise<UnassignLeadResponse> => {
  // RBAC: Admin & Supervisor bypass ownership validation
  const isPrivilegedRole = userRole === 'Admin' || userRole === 'Supervisor';

  // Check if unit exists
  const unitQuery = `
    SELECT u.id, u.name
    FROM units u
    JOIN blocks b ON b.id = u.block_id
    JOIN properties p ON p.id = b.property_id
    WHERE u.id = $1
  `;

  const unitResult = await pool.query(unitQuery, [unitId]);

  if (unitResult.rows.length === 0) {
    throw new AppError('Unit not found', 404);
  }

  // Check if lead exists — ownership filter bypassed for Admin/Supervisor
  const leadQuery = `
    SELECT l.id, l.name, l.status, l.unit_id
    FROM leads l
    WHERE l.id = $1 AND (l.assigned_to = $2 OR $3::boolean)
  `;

  const leadResult = await pool.query(leadQuery, [leadId, userId, isPrivilegedRole]);

  if (leadResult.rows.length === 0) {
    throw new AppError('Lead not found', 404);
  }

  const leadRow = leadResult.rows[0];

  if (leadRow.unit_id !== unitId) {
    throw new AppError('Lead is not assigned to this unit', 409);
  }

  // Unassign lead from unit (unit status recomputed via DB trigger)
  const updateLeadQuery = `
    UPDATE leads
    SET unit_id = NULL,
        updated_at = NOW()
    WHERE id = $1
      AND (assigned_to = $2 OR $3::boolean)
      AND unit_id = $4
    RETURNING *
  `;

  const updateLeadResult = await pool.query(updateLeadQuery, [leadId, userId, isPrivilegedRole, unitId]);
  const updatedLead = updateLeadResult.rows[0];

  // Get updated unit (status should have changed via trigger)
  const updatedUnitResult = await pool.query('SELECT * FROM units WHERE id = $1', [unitId]);
  const updatedUnit = updatedUnitResult.rows[0];

  return {
    lead: {
      id: updatedLead.id,
      name: updatedLead.name,
      unit_id: updatedLead.unit_id,
      unit_name: null,
      status: updatedLead.status,
      updated_at: updatedLead.updated_at,
    },
    unit: {
      id: updatedUnit.id,
      name: updatedUnit.name,
      status: updatedUnit.status,
      updated_at: updatedUnit.updated_at,
    },
  };
};