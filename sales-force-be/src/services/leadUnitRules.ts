import { Pool, PoolClient } from 'pg';

type Queryable = Pool | PoolClient;

/**
 * Unassign all other leads attached to a unit (keep the given lead).
 * Used when a lead reaches `booked` status to claim the unit exclusively.
 */
export const revokeOtherLeadsOnUnit = async (
  client: Queryable,
  unitId: string,
  keepLeadId: string
): Promise<number> => {
  const result = await client.query(
    `UPDATE leads
     SET unit_id = NULL,
         updated_at = NOW()
     WHERE unit_id = $1
       AND id <> $2`,
    [unitId, keepLeadId]
  );
  return result.rowCount ?? 0;
};

/**
 * Lock the unit row to prevent concurrent booking races.
 * Returns the unit row (id, status) or null if not found.
 */
export const lockUnitForBooking = async (
  client: Queryable,
  unitId: string
): Promise<{ id: string; status: string } | null> => {
  const result = await client.query(
    `SELECT id, status FROM units WHERE id = $1 FOR UPDATE`,
    [unitId]
  );
  return result.rows[0] ?? null;
};

/**
 * Check whether the unit already has a `booked` lead (optionally excluding a lead).
 * Returns the booked lead id, or null if none.
 */
export const findBookedLeadOnUnit = async (
  client: Queryable,
  unitId: string,
  excludeLeadId?: string
): Promise<string | null> => {
  if (excludeLeadId) {
    const result = await client.query(
      `SELECT id FROM leads WHERE unit_id = $1 AND status = 'booked' AND id <> $2 LIMIT 1`,
      [unitId, excludeLeadId]
    );
    return result.rows[0]?.id ?? null;
  }

  const result = await client.query(
    `SELECT id FROM leads WHERE unit_id = $1 AND status = 'booked' LIMIT 1`,
    [unitId]
  );
  return result.rows[0]?.id ?? null;
};
