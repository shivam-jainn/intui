-- CreateTable
CREATE TABLE "Incident" (
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

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Incident_slug_key" ON "Incident"("slug");
