-- AlterTable
-- Optional per-initiative icon for the floating impact-stats button.
-- References Icon.name by convention (same pattern as DynamicPoint.markerImage);
-- nullable, so existing rows are untouched.
ALTER TABLE "Story" ADD COLUMN "impactIcon" TEXT;
