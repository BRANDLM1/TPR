-- This is an empty migration.-- Add a geometry column to the Projects table.
-- The '4326' is the standard SRID for GPS coordinates (WGS 84).
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE "Projects" ADD COLUMN "location" GEOMETRY(Point, 4326);
-- Create a spatial index for fast queries.
CREATE INDEX "projects_location_idx" ON "Projects" USING GIST ("location");