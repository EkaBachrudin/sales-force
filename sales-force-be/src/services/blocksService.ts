import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import { Block, CreateBlockDto, UpdateBlockDto } from '../types';

/**
 * POST /api/v1/properties/:propertyId/blocks - Create New Block
 */
export const createBlock = async (
  propertyId: string,
  dto: CreateBlockDto,
  userId: string
): Promise<Block> => {
  // Validate name
  if (!dto.name || dto.name.trim().length === 0) {
    throw new AppError('Block name is required', 400);
  }

  if (dto.name.length > 100) {
    throw new AppError('Block name must be maximum 100 characters', 400);
  }

  // Check if property exists and belongs to user
  const propertyCheck = await pool.query(
    'SELECT id FROM properties WHERE id = $1 AND assigned_to = $2',
    [propertyId, userId]
  );

  if (propertyCheck.rows.length === 0) {
    throw new AppError('Property not found', 404);
  }

  // Check if block name already exists in this property
  const existingBlock = await pool.query(
    'SELECT id FROM blocks WHERE property_id = $1 AND name = $2',
    [propertyId, dto.name.trim()]
  );

  if (existingBlock.rows.length > 0) {
    throw new AppError('Block name already exists in this property', 409);
  }

  // Insert block
  const queryStr = `
    INSERT INTO blocks (
      id, property_id, name, is_active, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1, $2, true, NOW(), NOW()
    ) RETURNING *
  `;

  const result = await pool.query(queryStr, [propertyId, dto.name.trim()]);
  const row = result.rows[0];

  return {
    id: row.id,
    property_id: row.property_id,
    name: row.name,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * PUT /api/v1/blocks/:id - Update Block
 */
export const updateBlock = async (
  blockId: string,
  dto: UpdateBlockDto,
  userId: string
): Promise<Block> => {
  // Validate name
  if (!dto.name || dto.name.trim().length === 0) {
    throw new AppError('Block name is required', 400);
  }

  if (dto.name.length > 100) {
    throw new AppError('Block name must be maximum 100 characters', 400);
  }

  // Check if block exists and belongs to user's property
  const existingBlock = await pool.query(
    `
    SELECT b.*, p.id as property_id
    FROM blocks b
    JOIN properties p ON p.id = b.property_id
    WHERE b.id = $1 AND p.assigned_to = $2
    `,
    [blockId, userId]
  );

  if (existingBlock.rows.length === 0) {
    throw new AppError('Block not found', 404);
  }

  const propertyId = existingBlock.rows[0].property_id;

  // Check if block name already exists in this property (excluding current block)
  const nameCheck = await pool.query(
    'SELECT id FROM blocks WHERE property_id = $1 AND name = $2 AND id != $3',
    [propertyId, dto.name.trim(), blockId]
  );

  if (nameCheck.rows.length > 0) {
    throw new AppError('Block name already exists in this property', 409);
  }

  // Update block
  const queryStr = `
    UPDATE blocks
    SET name = $1,
        updated_at = NOW()
    WHERE id = $2
      AND property_id IN (
        SELECT id FROM properties WHERE assigned_to = $3
      )
    RETURNING *
  `;

  const result = await pool.query(queryStr, [dto.name.trim(), blockId, userId]);
  const row = result.rows[0];

  return {
    id: row.id,
    property_id: row.property_id,
    name: row.name,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * DELETE /api/v1/blocks/:id - Delete Block (Cascade)
 */
export const deleteBlock = async (blockId: string, userId: string): Promise<void> => {
  // Check if block exists and belongs to user's property
  const existingBlock = await pool.query(
    `
    SELECT b.id
    FROM blocks b
    JOIN properties p ON p.id = b.property_id
    WHERE b.id = $1 AND p.assigned_to = $2
    `,
    [blockId, userId]
  );

  if (existingBlock.rows.length === 0) {
    throw new AppError('Block not found', 404);
  }

  // Delete block (cascade will delete units)
  await pool.query(
    `
    DELETE FROM blocks
    WHERE id = $1
      AND property_id IN (
        SELECT id FROM properties WHERE assigned_to = $2
      )
    `,
    [blockId, userId]
  );
};