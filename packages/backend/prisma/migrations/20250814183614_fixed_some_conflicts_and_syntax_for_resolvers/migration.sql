/*
  Warnings:

  - The primary key for the `DynamicPoint` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `DynamicPoint` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `DynamicPolygon` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `latitude` on the `DynamicPolygon` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `DynamicPolygon` table. All the data in the column will be lost.
  - The `id` column on the `DynamicPolygon` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `centerPointId` column on the `DynamicPolygon` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `dynamicPointId` column on the `MediaItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `dynamicPolygonId` column on the `MediaItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `geometry` to the `DynamicPolygon` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DynamicPolygon" DROP CONSTRAINT "DynamicPolygon_centerPointId_fkey";

-- DropForeignKey
ALTER TABLE "MediaItem" DROP CONSTRAINT "MediaItem_dynamicPointId_fkey";

-- DropForeignKey
ALTER TABLE "MediaItem" DROP CONSTRAINT "MediaItem_dynamicPolygonId_fkey";

-- AlterTable
ALTER TABLE "DynamicPoint" DROP CONSTRAINT "DynamicPoint_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "DynamicPoint_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DynamicPolygon" DROP CONSTRAINT "DynamicPolygon_pkey",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "geometry" JSONB NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "centerPointId",
ADD COLUMN     "centerPointId" INTEGER,
ADD CONSTRAINT "DynamicPolygon_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MediaItem" DROP COLUMN "dynamicPointId",
ADD COLUMN     "dynamicPointId" INTEGER,
DROP COLUMN "dynamicPolygonId",
ADD COLUMN     "dynamicPolygonId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "DynamicPolygon_centerPointId_key" ON "DynamicPolygon"("centerPointId");

-- AddForeignKey
ALTER TABLE "DynamicPolygon" ADD CONSTRAINT "DynamicPolygon_centerPointId_fkey" FOREIGN KEY ("centerPointId") REFERENCES "DynamicPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_dynamicPolygonId_fkey" FOREIGN KEY ("dynamicPolygonId") REFERENCES "DynamicPolygon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_dynamicPointId_fkey" FOREIGN KEY ("dynamicPointId") REFERENCES "DynamicPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
