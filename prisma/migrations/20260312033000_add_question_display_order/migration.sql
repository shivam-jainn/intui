-- Add displayOrder for deterministic episode sequencing.
ALTER TABLE "Question" ADD COLUMN "displayOrder" INTEGER;

WITH ordered_questions AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "id" ASC) AS row_num
  FROM "Question"
)
UPDATE "Question" q
SET "displayOrder" = oq.row_num
FROM ordered_questions oq
WHERE q."id" = oq."id";

ALTER TABLE "Question" ALTER COLUMN "displayOrder" SET NOT NULL;

CREATE UNIQUE INDEX "Question_displayOrder_key" ON "Question"("displayOrder");
