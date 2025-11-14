-- DropForeignKey
ALTER TABLE "public"."ScheduleEntry" DROP CONSTRAINT "ScheduleEntry_medicationId_fkey";

-- AlterTable
ALTER TABLE "ScheduleEntry" ADD COLUMN     "scheduleId" VARCHAR(32),
ALTER COLUMN "medicationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Schedule" (
    "id" VARCHAR(32) NOT NULL,
    "medicineId" VARCHAR(32) NOT NULL,
    "userId" VARCHAR(32) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "units" VARCHAR(50) NOT NULL DEFAULT 'pill',
    "frequencyDays" JSONB NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3),
    "timeOfDay" JSONB NOT NULL,
    "mealTiming" VARCHAR(20) NOT NULL DEFAULT 'anytime',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Schedule_userId_idx" ON "Schedule"("userId");

-- CreateIndex
CREATE INDEX "Schedule_medicineId_idx" ON "Schedule"("medicineId");

-- CreateIndex
CREATE INDEX "Schedule_dateStart_idx" ON "Schedule"("dateStart");

-- CreateIndex
CREATE INDEX "ScheduleEntry_scheduleId_dateTime_idx" ON "ScheduleEntry"("scheduleId", "dateTime");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
