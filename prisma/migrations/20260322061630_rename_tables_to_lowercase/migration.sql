/*
  Warnings:

  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Incident` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuestionCompany` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuestionTopic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Topic` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_userId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionCompany" DROP CONSTRAINT "QuestionCompany_companyId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionCompany" DROP CONSTRAINT "QuestionCompany_questionId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionTopic" DROP CONSTRAINT "QuestionTopic_questionId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionTopic" DROP CONSTRAINT "QuestionTopic_topicId_fkey";

-- DropForeignKey
ALTER TABLE "submission" DROP CONSTRAINT "submission_incidentSlug_fkey";

-- DropForeignKey
ALTER TABLE "submission" DROP CONSTRAINT "submission_questionId_fkey";

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "Incident";

-- DropTable
DROP TABLE "Question";

-- DropTable
DROP TABLE "QuestionCompany";

-- DropTable
DROP TABLE "QuestionTopic";

-- DropTable
DROP TABLE "Topic";

-- CreateTable
CREATE TABLE "question" (
    "id" SERIAL NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,

    CONSTRAINT "topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_topic" (
    "questionId" INTEGER NOT NULL,
    "topicId" INTEGER NOT NULL,

    CONSTRAINT "question_topic_pkey" PRIMARY KEY ("questionId","topicId")
);

-- CreateTable
CREATE TABLE "question_company" (
    "questionId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "question_company_pkey" PRIMARY KEY ("questionId","companyId")
);

-- CreateTable
CREATE TABLE "incident" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "severity" VARCHAR(10) NOT NULL DEFAULT 'P0',
    "difficulty" "Difficulty" NOT NULL,
    "service" VARCHAR(200) NOT NULL,
    "summary" TEXT NOT NULL,
    "slaMinutes" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_displayOrder_key" ON "question"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "question_slug_key" ON "question"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "topic_name_key" ON "topic"("name");

-- CreateIndex
CREATE UNIQUE INDEX "company_name_key" ON "company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "incident_slug_key" ON "incident"("slug");

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_topic" ADD CONSTRAINT "question_topic_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_topic" ADD CONSTRAINT "question_topic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_company" ADD CONSTRAINT "question_company_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_company" ADD CONSTRAINT "question_company_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_incidentSlug_fkey" FOREIGN KEY ("incidentSlug") REFERENCES "incident"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
