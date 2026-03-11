/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Question` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Question_name_key";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "slug" VARCHAR(160) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Question_slug_key" ON "Question"("slug");
