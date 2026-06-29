-- CreateEnum
CREATE TYPE "MixerSessionStatus" AS ENUM ('active', 'banned', 'cleared');

-- CreateTable
CREATE TABLE "mixer_session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" INTEGER,
    "incidentId" INTEGER,
    "status" "MixerSessionStatus" NOT NULL DEFAULT 'active',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bannedAt" TIMESTAMP(3),
    "macMasked" TEXT,
    "referredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mixer_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mixer_consequence" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "scriptName" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "revertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mixer_consequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mixer_session_userId_idx" ON "mixer_session"("userId");

-- CreateIndex
CREATE INDEX "mixer_session_status_idx" ON "mixer_session"("status");

-- CreateIndex
CREATE INDEX "mixer_consequence_sessionId_idx" ON "mixer_consequence"("sessionId");

-- AddForeignKey
ALTER TABLE "mixer_session" ADD CONSTRAINT "mixer_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mixer_consequence" ADD CONSTRAINT "mixer_consequence_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "mixer_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
