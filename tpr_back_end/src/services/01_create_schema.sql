DROP TABLE IF EXISTS "impact_data" CASCADE;
DROP TABLE IF EXISTS "valid_catagory_metrics" CASCADE;
DROP TABLE IF EXISTS "projects" CASCADE;
DROP TABLE IF EXISTS "impact_metrics" CASCADE;

CREATE TABLE "historical_sites" (
  "id" serial PRIMARY KEY,
  "site_name" varchar,
  "description" text,
  "location_id" integer
);

CREATE TABLE "reservations" (
  "id" serial PRIMARY KEY,
  "reservation" varchar UNIQUE NOT NULL,
  "gis_territory" integer
);

CREATE TABLE "pillars" (
  "id" serial PRIMARY KEY,
  "pillar" varchar UNIQUE NOT NULL,
  "description" text
);

CREATE TABLE "vision2035" (
  "id" serial PRIMARY KEY,
  "vision" varchar UNIQUE NOT NULL,
  "description" text
);

CREATE TABLE "impact_categories" (
  "id" serial PRIMARY KEY,
  "category" varchar UNIQUE NOT NULL
);

CREATE TABLE "impact_metrics" (
  "id" serial PRIMARY KEY,
  "metric" varchar UNIQUE NOT NULL,
  "unit" varchar
);

CREATE TABLE "valid_category_metrics" (
  "category_id" INTEGER NOT NULL,
  "metric_id" INTEGER NOT NULL,
  PRIMARY KEY ("category_id", "metric_id")
);

CREATE TABLE "impact_data" (
  "id" serial PRIMARY KEY,
  "category_id" integer NOT NULL,
  "metric_id" integer NOT NULL,
  "value" integer
);

CREATE TABLE "projects" (
  "id" serial PRIMARY KEY,
  "project_name" varchar,
  "description" text,
  "start_date" timestamp,
  "reservation_id" integer NOT NULL,
  "pillar_id" integer NOT NULL,
  "vision2035_id" integer NOT NULL
);

COMMENT ON COLUMN "historical_sites"."description" IS 'Mission of the project';

COMMENT ON COLUMN "pillars"."description" IS 'Overview of vision';

COMMENT ON COLUMN "vision2035"."description" IS 'Overview of vision';

COMMENT ON COLUMN "projects"."description" IS 'Mission of the project';

ALTER TABLE "projects" ADD CONSTRAINT "reservation_projects" FOREIGN KEY ("reservation_id") REFERENCES "reservations" ("id");

ALTER TABLE "projects" ADD CONSTRAINT "pillar_projects" FOREIGN KEY ("pillar_id") REFERENCES "pillars" ("id");

ALTER TABLE "projects" ADD CONSTRAINT "vision2035_projects" FOREIGN KEY ("vision2035_id") REFERENCES "vision2035" ("id");

ALTER TABLE "valid_category_metrics" ADD FOREIGN KEY ("category_id") REFERENCES "impact_categories" ("id");

ALTER TABLE "valid_category_metrics" ADD FOREIGN KEY ("metric_id") REFERENCES "impact_metrics" ("id");

ALTER TABLE "impact_data" ADD FOREIGN KEY ("category_id") REFERENCES "impact_categories" ("id");

ALTER TABLE "impact_data" ADD FOREIGN KEY ("metric_id") REFERENCES "impact_metrics" ("id");

ALTER TABLE "impact_data" ADD FOREIGN KEY ("category_id", "metric_id") REFERENCES "valid_category_metrics" ("category_id", "metric_id");
