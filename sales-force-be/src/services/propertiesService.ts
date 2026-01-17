import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import { Property, GetPropertiesQueryV2, CreatePropertyDto, UpdatePropertyDto } from '../types';

/**
 * GET /api/v1/properties - Get User Properties (Dropdown Filter)
 */
export const getProperties = async (query: GetPropertiesQueryV2, userId: string): Promise<Property[]> => {
  const { search } = query;

  const conditions: string[] = ['created_by = $1', 'deleted_at IS NULL'];
  const params: any[] = [userId];
  let paramIndex = 2;

  if (search) {
    conditions.push(`name ILIKE $${paramIndex++}`);
    params.push(`%${search}%`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const queryStr = `
    SELECT
      id,
      name,
      property_type,
      created_at
    FROM properties
    ${whereClause}
    ORDER BY name ASC
  `;

  const result = await pool.query(queryStr, params);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    property_type: row.property_type,
    created_at: row.created_at,
  }));
};

/**
 * POST /api/v1/properties - Create New Property
 */
export const createProperty = async (dto: CreatePropertyDto, userId: string): Promise<Property> => {
  // Validate required fields
  if (!dto.name || dto.name.trim().length === 0) {
    throw new AppError('Property name is required', 400);
  }

  if (dto.name.length > 100) {
    throw new AppError('Property name must be maximum 100 characters', 400);
  }

  if (!dto.property_type || dto.property_type.trim().length === 0) {
    throw new AppError('Property type is required', 400);
  }

  if (dto.property_type.length > 50) {
    throw new AppError('Property type must be maximum 50 characters', 400);
  }

  // Check if property name already exists for this user
  const existingProperty = await pool.query(
    'SELECT id FROM properties WHERE created_by = $1 AND name = $2 AND deleted_at IS NULL',
    [userId, dto.name.trim()]
  );

  if (existingProperty.rows.length > 0) {
    throw new AppError('Property name already exists', 400);
  }

  // Insert property
  const queryStr = `
    INSERT INTO properties (
      id, name, property_type, created_by, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, NOW(), NOW()
    ) RETURNING *
  `;

  const result = await pool.query(queryStr, [dto.name.trim(), dto.property_type.trim(), userId]);
  const row = result.rows[0];

  return {
    id: row.id,
    name: row.name,
    property_type: row.property_type,
    created_at: row.created_at,
  };
};

/**
 * PUT /api/v1/properties/:id - Update Property
 */
export const updateProperty = async (propertyId: string, dto: UpdatePropertyDto, userId: string): Promise<Property> => {
  // Check if property exists and belongs to user
  const existingProperty = await pool.query(
    'SELECT * FROM properties WHERE id = $1 AND created_by = $2 AND deleted_at IS NULL',
    [propertyId, userId]
  );

  if (existingProperty.rows.length === 0) {
    throw new AppError('Property not found', 404);
  }

  // Validate name if provided
  if (dto.name !== undefined) {
    if (dto.name.trim().length === 0) {
      throw new AppError('Property name cannot be empty', 400);
    }

    if (dto.name.length > 100) {
      throw new AppError('Property name must be maximum 100 characters', 400);
    }

    // Check if property name already exists for this user (excluding current property)
    const nameCheck = await pool.query(
      'SELECT id FROM properties WHERE created_by = $1 AND name = $2 AND id != $3 AND deleted_at IS NULL',
      [userId, dto.name.trim(), propertyId]
    );

    if (nameCheck.rows.length > 0) {
      throw new AppError('Property name already exists', 400);
    }
  }

  // Validate property_type if provided
  if (dto.property_type !== undefined) {
    if (dto.property_type.trim().length === 0) {
      throw new AppError('Property type cannot be empty', 400);
    }

    if (dto.property_type.length > 50) {
      throw new AppError('Property type must be maximum 50 characters', 400);
    }
  }

  // Update property
  const queryStr = `
    UPDATE properties
    SET name = COALESCE($2, name),
        property_type = COALESCE($3, property_type),
        updated_at = NOW()
    WHERE id = $1
      AND created_by = $4
      AND deleted_at IS NULL
    RETURNING *
  `;

  const result = await pool.query(queryStr, [
    propertyId,
    dto.name?.trim(),
    dto.property_type?.trim(),
    userId,
  ]);

  const row = result.rows[0];

  return {
    id: row.id,
    name: row.name,
    property_type: row.property_type,
    created_at: row.created_at,
  };
};

/**
 * DELETE /api/v1/properties/:id - Delete Property (Soft Delete)
 */
export const deleteProperty = async (propertyId: string, userId: string): Promise<void> => {
  // Check if property exists and belongs to user
  const existingProperty = await pool.query(
    'SELECT id FROM properties WHERE id = $1 AND created_by = $2 AND deleted_at IS NULL',
    [propertyId, userId]
  );

  if (existingProperty.rows.length === 0) {
    throw new AppError('Property not found', 404);
  }

  // Soft delete property
  await pool.query(
    'UPDATE properties SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
    [propertyId]
  );
};
