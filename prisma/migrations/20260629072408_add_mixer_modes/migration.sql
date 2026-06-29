-- CreateEnum
CREATE TYPE "MixerMode" AS ENUM ('normal', 'hardcore', 'brick');

-- AlterTable
ALTER TABLE "mixer_session" ADD COLUMN     "deviceFingerprint" TEXT,
ADD COLUMN     "mode" "MixerMode" NOT NULL DEFAULT 'normal';
