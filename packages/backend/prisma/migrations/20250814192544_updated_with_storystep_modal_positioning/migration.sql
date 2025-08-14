-- CreateEnum
CREATE TYPE "ModalPosition" AS ENUM ('CENTER', 'TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT');

-- AlterTable
ALTER TABLE "StoryStep" ADD COLUMN     "modalPosition" "ModalPosition" DEFAULT 'CENTER';
