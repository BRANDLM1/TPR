-- Give staff a way to control draw order of points and polygons from Studio.
-- Existing rows default to 0 so ordering is stable until they populate the field.
ALTER TABLE "DynamicPoint"   ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DynamicPolygon" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
