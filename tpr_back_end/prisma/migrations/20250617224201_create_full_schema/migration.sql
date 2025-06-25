-- CreateTable
CREATE TABLE "HistoricalSites" (
    "id" SERIAL NOT NULL,
    "site_name" TEXT,
    "description" TEXT,
    "location_id" INTEGER,

    CONSTRAINT "HistoricalSites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservations" (
    "id" SERIAL NOT NULL,
    "reservation" TEXT NOT NULL,
    "gis_territory" INTEGER,

    CONSTRAINT "Reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pillars" (
    "id" SERIAL NOT NULL,
    "pillar" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Pillars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vision2035" (
    "id" SERIAL NOT NULL,
    "vision" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Vision2035_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projects" (
    "id" SERIAL NOT NULL,
    "project_name" TEXT,
    "description" TEXT,
    "start_date" TIMESTAMP(3),
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "reservation_id" INTEGER NOT NULL,
    "pillar_id" INTEGER NOT NULL,
    "vision2035_id" INTEGER NOT NULL,

    CONSTRAINT "Projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactCategories" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "ImpactCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactMetrics" (
    "id" SERIAL NOT NULL,
    "metric" TEXT NOT NULL,
    "unit" TEXT,

    CONSTRAINT "ImpactMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidCategoryMetrics" (
    "category_id" INTEGER NOT NULL,
    "metric_id" INTEGER NOT NULL,

    CONSTRAINT "ValidCategoryMetrics_pkey" PRIMARY KEY ("category_id","metric_id")
);

-- CreateTable
CREATE TABLE "ImpactData" (
    "id" SERIAL NOT NULL,
    "value" INTEGER,
    "category_id" INTEGER NOT NULL,
    "metric_id" INTEGER NOT NULL,

    CONSTRAINT "ImpactData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservations_reservation_key" ON "Reservations"("reservation");

-- CreateIndex
CREATE UNIQUE INDEX "Pillars_pillar_key" ON "Pillars"("pillar");

-- CreateIndex
CREATE UNIQUE INDEX "Vision2035_vision_key" ON "Vision2035"("vision");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactCategories_category_key" ON "ImpactCategories"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactMetrics_metric_key" ON "ImpactMetrics"("metric");

-- AddForeignKey
ALTER TABLE "Projects" ADD CONSTRAINT "Projects_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projects" ADD CONSTRAINT "Projects_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "Pillars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projects" ADD CONSTRAINT "Projects_vision2035_id_fkey" FOREIGN KEY ("vision2035_id") REFERENCES "Vision2035"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidCategoryMetrics" ADD CONSTRAINT "ValidCategoryMetrics_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ImpactCategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidCategoryMetrics" ADD CONSTRAINT "ValidCategoryMetrics_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "ImpactMetrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactData" ADD CONSTRAINT "ImpactData_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ImpactCategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactData" ADD CONSTRAINT "ImpactData_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "ImpactMetrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactData" ADD CONSTRAINT "ImpactData_category_id_metric_id_fkey" FOREIGN KEY ("category_id", "metric_id") REFERENCES "ValidCategoryMetrics"("category_id", "metric_id") ON DELETE RESTRICT ON UPDATE CASCADE;
