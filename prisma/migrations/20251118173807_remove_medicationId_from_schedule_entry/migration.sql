-- DropUniqueConstraint
DROP INDEX IF EXISTS "ScheduleEntry_medicationId_dateTime_key";

-- DropForeignKey
ALTER TABLE "ScheduleEntry" DROP CONSTRAINT IF EXISTS "ScheduleEntry_medicationId_fkey";

-- AlterTable
ALTER TABLE "ScheduleEntry" DROP COLUMN IF EXISTS "medicationId";

-- CreateUniqueConstraint
CREATE UNIQUE INDEX "ScheduleEntry_scheduleId_dateTime_key" ON "ScheduleEntry"("scheduleId", "dateTime");

-- AddForeignKey for Schedule to Medication relation
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

