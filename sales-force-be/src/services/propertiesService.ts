import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import { deleteFile } from '../utils/fileCleanup';
import { naturalCompare } from '../utils/naturalSort';
import {
  PropertyListItem,
  Property,
  PropertyDetail,
  BlockListItem,
  SiteplanData,
  SiteplanUnit,
  GetPropertiesQuery,
  CreatePropertyDto,
  UpdatePropertyDto,
  PaginationMeta,
} from '../types';

/**
 * GET /api/v1/properties - Get All Properties List with Pagination
 */
export const getProperties = async (
  query: GetPropertiesQuery
): Promise<{ properties: PropertyListItem[]; pagination: PaginationMeta }> => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, query.limit || 10);
  const offset = (page - 1) * limit;
  const search = query.search?.trim();
  const cityFilter = query.city?.trim();

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`p.name ILIKE $${paramIndex++}`);
    params.push(`%${search}%`);
  }

  if (cityFilter) {
    conditions.push(`p.city ILIKE $${paramIndex++}`);
    params.push(`%${cityFilter}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM properties p
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(totalItems / limit);

  // Get properties with pagination
  const queryStr = `
    SELECT
      p.id,
      p.name,
      p.city,
      p.land_area,
      p.address,
      p.description,
      p.siteplan_assets,
      p.is_active,
      p.created_at,
      p.updated_at,
      COALESCE(bc.block_count, 0) AS total_blocks,
      COALESCE(uc.unit_count, 0) AS total_units
    FROM properties p
    LEFT JOIN (
      SELECT property_id, COUNT(id) AS block_count
      FROM blocks
      WHERE is_active = true
      GROUP BY property_id
    ) bc ON bc.property_id = p.id
    LEFT JOIN (
      SELECT b.property_id, COUNT(u.id) AS unit_count
      FROM blocks b
      JOIN units u ON u.block_id = b.id
      GROUP BY b.property_id
    ) uc ON uc.property_id = p.id
    ${whereClause}
    ORDER BY p.name ASC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);

  const result = await pool.query(queryStr, params);

  const properties: PropertyListItem[] = result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    land_area: row.land_area,
    address: row.address,
    description: row.description,
    siteplan_assets: row.siteplan_assets,
    is_active: row.is_active,
    total_blocks: row.total_blocks,
    total_units: row.total_units,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return {
    properties,
    pagination: {
      page,
      limit,
      total_items: totalItems,
      total_pages: totalPages,
    },
  };
};

/**
 * GET /api/v1/properties/:id - Get Property Detail with Blocks
 */
export const getPropertyDetail = async (propertyId: string): Promise<PropertyDetail> => {
  // Get property
  const propertyResult = await pool.query(
    'SELECT * FROM properties WHERE id = $1',
    [propertyId]
  );

  if (propertyResult.rows.length === 0) {
    throw new AppError('Property not found', 404);
  }

  const propertyRow = propertyResult.rows[0];
  const property: Property = {
    id: propertyRow.id,
    name: propertyRow.name,
    city: propertyRow.city,
    land_area: propertyRow.land_area,
    address: propertyRow.address,
    description: propertyRow.description,
    siteplan_assets: propertyRow.siteplan_assets,
    is_active: propertyRow.is_active,
    created_at: propertyRow.created_at,
    updated_at: propertyRow.updated_at,
  };

  // Get blocks with unit count
  const blocksResult = await pool.query(
    `
    SELECT
      b.id,
      b.name,
      b.is_active,
      b.created_at,
      b.updated_at,
      COALESCE(uc.unit_count, 0) AS total_units
    FROM blocks b
    LEFT JOIN (
      SELECT block_id, COUNT(id) AS unit_count
      FROM units
      GROUP BY block_id
    ) uc ON uc.block_id = b.id
    WHERE b.property_id = $1
    ORDER BY b.name ASC
    `,
    [propertyId]
  );

  const blocks: BlockListItem[] = blocksResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    is_active: row.is_active,
    total_units: row.total_units,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return { property, blocks };
};

/**
 * GET /api/v1/properties/:id/siteplan - Get Property Siteplan with All Units
 */
export const getPropertySiteplan = async (propertyId: string): Promise<SiteplanData> => {
  // Get property siteplan
  const propertyResult = await pool.query(
    'SELECT id, name, siteplan_assets FROM properties WHERE id = $1',
    [propertyId]
  );

  if (propertyResult.rows.length === 0) {
    throw new AppError('Property not found', 404);
  }

  const propertyRow = propertyResult.rows[0];

  // Get all units across all blocks
  const unitsResult = await pool.query(
    `
    SELECT
      u.id,
      u.block_id,
      b.name AS block_name,
      u.name,
      u.land_area,
      u.status
    FROM units u
    JOIN blocks b ON b.id = u.block_id
    JOIN properties p ON p.id = b.property_id
    WHERE p.id = $1
    ORDER BY b.name ASC
    `,
    [propertyId]
  );

  const units: SiteplanUnit[] = unitsResult.rows.map((row) => ({
    id: row.id,
    block_id: row.block_id,
    block_name: row.block_name,
    name: row.name,
    land_area: row.land_area,
    status: row.status,
  }));

  units.sort((a, b) => {
    const blockCmp = naturalCompare(a.block_name, b.block_name);
    return blockCmp !== 0 ? blockCmp : naturalCompare(a.name, b.name);
  });

  return {
    property: {
      id: propertyRow.id,
      name: propertyRow.name,
      siteplan_assets: propertyRow.siteplan_assets,
    },
    units,
  };
};

/**
 * POST /api/v1/properties - Create New Property
 */
export const createProperty = async (
  dto: CreatePropertyDto,
  userId: string,
  siteplanPath: string | null
): Promise<Property> => {
  // Validate required fields
  if (!dto.name || dto.name.trim().length === 0) {
    throw new AppError('Property name is required', 400);
  }

  if (dto.name.length > 255) {
    throw new AppError('Property name must be maximum 255 characters', 400);
  }

  if (!dto.city || dto.city.trim().length === 0) {
    throw new AppError('City is required', 400);
  }

  if (dto.city.length > 100) {
    throw new AppError('City must be maximum 100 characters', 400);
  }

  if (dto.land_area !== undefined) {
    if (typeof dto.land_area !== 'number' || dto.land_area < 0) {
      throw new AppError('Land area must be a non-negative number', 400);
    }
  }

  // Insert property
  const queryStr = `
    INSERT INTO properties (
      id, name, city, land_area, address, description,
      siteplan_assets, assigned_to, is_active, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()
    ) RETURNING *
  `;

  let result;
  try {
    result = await pool.query(queryStr, [
      dto.name.trim(),
      dto.city.trim(),
      dto.land_area || null,
      dto.address || null,
      dto.description || null,
      siteplanPath,
      userId,
    ]);
  } catch (error) {
    // Rollback file upload if DB insert fails
    if (siteplanPath) {
      await deleteFile(siteplanPath);
    }
    throw error;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    name: row.name,
    city: row.city,
    land_area: row.land_area,
    address: row.address,
    description: row.description,
    siteplan_assets: row.siteplan_assets,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * PUT /api/v1/properties/:id - Update Property
 */
export const updateProperty = async (
  propertyId: string,
  dto: UpdatePropertyDto,
  userId: string,
  userRole: string,
  newSiteplanPath: string | null,
  deleteSiteplan: boolean = false
): Promise<Property> => {
  // Check if property exists
  // RBAC: Admin & Supervisor can edit any property (bypass ownership);
  // other roles are restricted to properties they created
  const isPrivilegedRole = userRole === 'Admin' || userRole === 'Supervisor';

  const existingProperty = await pool.query(
    `SELECT * FROM properties
     WHERE id = $1
       AND (assigned_to = $2 OR $3::boolean)`,
    [propertyId, userId, isPrivilegedRole]
  );

  if (existingProperty.rows.length === 0) {
    throw new AppError('Property not found', 404);
  }

  const oldSiteplanPath = existingProperty.rows[0].siteplan_assets;

  // Validate name if provided
  if (dto.name !== undefined) {
    if (dto.name.trim().length === 0) {
      throw new AppError('Property name cannot be empty', 400);
    }

    if (dto.name.length > 255) {
      throw new AppError('Property name must be maximum 255 characters', 400);
    }
  }

  // Validate city if provided
  if (dto.city !== undefined) {
    if (dto.city.trim().length === 0) {
      throw new AppError('City cannot be empty', 400);
    }

    if (dto.city.length > 100) {
      throw new AppError('City must be maximum 100 characters', 400);
    }
  }

  // Validate land_area if provided
  if (dto.land_area !== undefined) {
    if (typeof dto.land_area !== 'number' || dto.land_area < 0) {
      throw new AppError('Land area must be a non-negative number', 400);
    }
  }

  // Check if at least one field is being updated
  if (
    dto.name === undefined &&
    dto.city === undefined &&
    dto.land_area === undefined &&
    dto.address === undefined &&
    dto.description === undefined &&
    newSiteplanPath === null &&
    !deleteSiteplan
  ) {
    throw new AppError('At least one field must be provided', 400);
  }

  // Handle siteplan operations
  let finalSiteplanPath = oldSiteplanPath;
  
  if (deleteSiteplan) {
    // Delete siteplan flow
    if (oldSiteplanPath) {
      try {
        await deleteFile(oldSiteplanPath);
      } catch (error) {
        // Graceful no-op if file not found
        console.log(`Warning: Siteplan file not found or could not be deleted: ${oldSiteplanPath}`);
      }
    }
    finalSiteplanPath = null; // Set to NULL in DB
  } else if (newSiteplanPath !== null) {
    // File replacement flow
    if (oldSiteplanPath) {
      try {
        await deleteFile(oldSiteplanPath);
      } catch (error) {
        // Ignore errors if file not found, continue with new file
        console.log(`Warning: Old siteplan file not found or could not be deleted: ${oldSiteplanPath}`);
      }
    }
    finalSiteplanPath = newSiteplanPath;
  }
  // else: preserve existing siteplan (finalSiteplanPath = oldSiteplanPath)

  // Update property
  const queryStr = `
    UPDATE properties
    SET name = COALESCE($2, name),
        city = COALESCE($3, city),
        land_area = COALESCE($4, land_area),
        address = COALESCE($5, address),
        description = COALESCE($6, description),
        siteplan_assets = $7,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;

  let result;
  try {
    result = await pool.query(queryStr, [
      propertyId,
      dto.name?.trim(),
      dto.city?.trim(),
      dto.land_area ?? null,
      dto.address ?? null,
      dto.description ?? null,
      finalSiteplanPath,
    ]);
  } catch (error) {
    // Rollback file upload if DB update fails
    if (newSiteplanPath && newSiteplanPath !== oldSiteplanPath) {
      await deleteFile(newSiteplanPath);
    }
    throw error;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    name: row.name,
    city: row.city,
    land_area: row.land_area,
    address: row.address,
    description: row.description,
    siteplan_assets: row.siteplan_assets,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * DELETE /api/v1/properties/:id - Delete Property (Cascade)
 */
export const deleteProperty = async (propertyId: string): Promise<void> => {
  // Get property siteplan path
  const existingProperty = await pool.query(
    'SELECT id, siteplan_assets FROM properties WHERE id = $1',
    [propertyId]
  );

  if (existingProperty.rows.length === 0) {
    throw new AppError('Property not found', 404);
  }

  const siteplanPath = existingProperty.rows[0].siteplan_assets;

  // Delete property (cascade will delete blocks and units)
  await pool.query('DELETE FROM properties WHERE id = $1', [propertyId]);

  // Cleanup siteplan file if exists
  if (siteplanPath) {
    try {
      await deleteFile(siteplanPath);
    } catch (error) {
      // Log warning but don't throw error - delete was successful
      console.log(`Warning: Siteplan file not found or could not be deleted: ${siteplanPath}`);
    }
  }
};