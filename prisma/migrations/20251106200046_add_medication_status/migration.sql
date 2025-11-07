-- CreateEnum
CREATE TYPE "MedicationStatus" AS ENUM ('ACTIVE', 'DELETED');

-- AlterTable
ALTER TABLE "Medication" ADD COLUMN "status" "MedicationStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Medication_userId_status_idx" ON "Medication"("userId", "status");