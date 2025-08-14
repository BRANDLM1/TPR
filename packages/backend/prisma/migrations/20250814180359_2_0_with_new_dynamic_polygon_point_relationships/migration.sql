/*
  Warnings:

  - The primary key for the `DynamicPoint` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "MediaItem" DROP CONSTRAINT "MediaItem_dynamicPointId_fkey";

-- AlterTable
ALTER TABLE "DynamicPoint" DROP CONSTRAINT "DynamicPoint_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "DynamicPoint_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DynamicPoint_id_seq";

-- AlterTable
ALTER TABLE "MediaItem" ADD COLUMN     "dynamicPolygonId" TEXT,
ALTER COLUMN "dynamicPointId" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "DynamicPolygon" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "name" TEXT NOT NULL,
    "fillColor" TEXT NOT NULL,
    "fillOpacity" DOUBLE PRECISION NOT NULL,
    "lineColor" TEXT NOT NULL,
    "lineWidth" TEXT NOT NULL,
    "centerPointId" TEXT,
    "storyStepId" INTEGER NOT NULL,

    CONSTRAINT "DynamicPolygon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DynamicPolygon_centerPointId_key" ON "DynamicPolygon"("centerPointId");

-- AddForeignKey
ALTER TABLE "DynamicPolygon" ADD CONSTRAINT "DynamicPolygon_centerPointId_fkey" FOREIGN KEY ("centerPointId") REFERENCES "DynamicPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicPolygon" ADD CONSTRAINT "DynamicPolygon_storyStepId_fkey" FOREIGN KEY ("storyStepId") REFERENCES "StoryStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_dynamicPolygonId_fkey" FOREIGN KEY ("dynamicPolygonId") REFERENCES "DynamicPolygon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_dynamicPointId_fkey" FOREIGN KEY ("dynamicPointId") REFERENCES "DynamicPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
