-- AlterTable
ALTER TABLE "submission" ADD COLUMN     "incidentSlug" VARCHAR(160),
ADD COLUMN     "memoryUsed" DOUBLE PRECISION,
ADD COLUMN     "timeTaken" DOUBLE PRECISION,
ALTER COLUMN "questionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_incidentSlug_fkey" FOREIGN KEY ("incidentSlug") REFERENCES "Incident"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
