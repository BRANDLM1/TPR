-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactStat" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "statistic" INTEGER NOT NULL,
    "content" TEXT,
    "link" TEXT,
    "storyId" TEXT NOT NULL,

    CONSTRAINT "ImpactStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryStep" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "link" TEXT,
    "layersToShow" TEXT[],
    "layersToHide" TEXT[],
    "nextButtonText" TEXT,
    "zoom" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "pitch" DOUBLE PRECISION,
    "bearing" DOUBLE PRECISION,
    "storyId" TEXT NOT NULL,

    CONSTRAINT "StoryStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicPoint" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT,
    "markerImage" TEXT,
    "storyStepId" INTEGER NOT NULL,

    CONSTRAINT "DynamicPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "source" TEXT NOT NULL,
    "alt" TEXT,
    "caption" TEXT,
    "storyStepId" INTEGER,
    "dynamicPointId" INTEGER,
    "impactStatId" INTEGER,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ImpactStat" ADD CONSTRAINT "ImpactStat_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryStep" ADD CONSTRAINT "StoryStep_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicPoint" ADD CONSTRAINT "DynamicPoint_storyStepId_fkey" FOREIGN KEY ("storyStepId") REFERENCES "StoryStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_storyStepId_fkey" FOREIGN KEY ("storyStepId") REFERENCES "StoryStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_dynamicPointId_fkey" FOREIGN KEY ("dynamicPointId") REFERENCES "DynamicPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_impactStatId_fkey" FOREIGN KEY ("impactStatId") REFERENCES "ImpactStat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
