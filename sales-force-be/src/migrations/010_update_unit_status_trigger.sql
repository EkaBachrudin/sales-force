-- Migration: 010_update_unit_status_trigger
-- Description: Rework unit status trigger to be aggregate-aware (support multiple leads per unit)
-- Created: 2026-08-17
-- Database: PostgreSQL 15+

-- ============================================================================
-- Rework update_unit_status_from_lead trigger
-- Purpose:
--   - Allow multiple leads to be assigned to a single unit.
--   - Recompute unit status from ALL leads currently assigned to the unit.
--   - Priority: closed -> sold, booked -> booked, active -> reserved, else available.
--   - Fix dead DELETE branch and unconditional "unit_id change -> available".
-- ============================================================================

DROP TRIGGER IF EXISTS trg_lead_status_change ON leads;

CREATE OR REPLACE FUNCTION update_unit_status_from_lead()
RETURNS TRIGGER AS $$
DECLARE
    uid uuid;
    target_units uuid[] := '{}';
    new_status text;
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.unit_id IS NOT NULL THEN
        target_units := array_append(target_units, OLD.unit_id);
    END IF;

    IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.unit_id IS NOT NULL THEN
        target_units := array_append(target_units, NEW.unit_id);
    END IF;

    FOREACH uid IN ARRAY target_units LOOP
        SELECT CASE
            WHEN EXISTS (SELECT 1 FROM leads WHERE unit_id = uid AND status = 'closed') THEN 'sold'
            WHEN EXISTS (SELECT 1 FROM leads WHERE unit_id = uid AND status = 'booked') THEN 'booked'
            WHEN EXISTS (SELECT 1 FROM leads WHERE unit_id = uid AND status IN ('new', 'contacted', 'surveyed', 'negotiating')) THEN 'reserved'
            ELSE 'available'
        END INTO new_status;

        UPDATE units
        SET status = new_status,
            updated_at = NOW()
        WHERE id = uid;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lead_status_change
AFTER INSERT OR UPDATE OR DELETE ON leads
FOR EACH ROW EXECUTE FUNCTION update_unit_status_from_lead();
