-- DropIndex
DROP INDEX "public"."Schedule_medicineId_idx";

-- RenameColumn
ALTER TABLE "Schedule" RENAME COLUMN "medicineId" TO "medicationId";

-- CreateIndex
CREATE INDEX "Schedule_medicationId_idx" ON "Schedule"("medicationId");
