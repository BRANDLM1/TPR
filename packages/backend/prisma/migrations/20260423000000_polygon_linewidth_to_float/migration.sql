-- Coerce DynamicPolygon.lineWidth from String to Float so GraphQL Float resolution succeeds.
-- Strips any non-numeric characters (e.g. "2px" -> "2") before casting; rows that can't be
-- coerced will surface as NULL rather than aborting the migration.
ALTER TABLE "DynamicPolygon"
  ALTER COLUMN "lineWidth" TYPE DOUBLE PRECISION
  USING NULLIF(regexp_replace("lineWidth", '[^0-9.\-]', '', 'g'), '')::double precision;
