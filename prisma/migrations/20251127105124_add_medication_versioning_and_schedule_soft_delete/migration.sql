-- AlterTable
ALTER TABLE "Medication" ADD COLUMN     "previousMedicationId" VARCHAR(32);

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Medication_previousMedicationId_idx" ON "Medication"("previousMedicationId");

-- CreateIndex
CREATE INDEX "Schedule_userId_deletedAt_idx" ON "Schedule"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_previousMedicationId_fkey" FOREIGN KEY ("previousMedicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
