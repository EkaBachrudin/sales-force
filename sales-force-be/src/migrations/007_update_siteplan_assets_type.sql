-- Migration: Update siteplan_assets column type
-- Description: Change siteplan_assets from VARCHAR(255) to VARCHAR(500) to accommodate file paths
-- Created: 2026-07-13

ALTER TABLE properties
ALTER COLUMN siteplan_assets TYPE VARCHAR(500);

COMMENT ON COLUMN properties.siteplan_assets IS 'Relative path to SVG siteplan file (e.g., /uploads/siteplans/{uuid}-{timestamp}.svg)';