-- CreateTable: mixer_run
CREATE TABLE "mixer_run" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "mixer_run_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mixer_run_userId_idx" ON "mixer_run"("userId");

-- CreateTable: shadowban
CREATE TABLE "shadowban" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "bannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referralCode" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "unlockedBy" TEXT,
    "unlockedAt" TIMESTAMP(3),

    CONSTRAINT "shadowban_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shadowban_userId_key" ON "shadowban"("userId");
CREATE UNIQUE INDEX "shadowban_referralCode_key" ON "shadowban"("referralCode");

-- CreateTable: referral
CREATE TABLE "referral" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "referral_code_idx" ON "referral"("code");

-- CreateTable: mixer_verification
CREATE TABLE "mixer_verification" (
    "uuid" TEXT NOT NULL,
    "userId" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mixer_verification_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable: incident_submission
CREATE TABLE "incident_submission" (
    "id" SERIAL NOT NULL,
    "incidentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timeTaken" DOUBLE PRECISION,
    "spaceTaken" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_submission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "shadowban" ADD CONSTRAINT "shadowban_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_submission" ADD CONSTRAINT "incident_submission_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_submission" ADD CONSTRAINT "incident_submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
