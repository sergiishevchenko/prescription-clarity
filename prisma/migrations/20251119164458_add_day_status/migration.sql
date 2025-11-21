-- CreateEnum
CREATE TYPE "DayStatusType" AS ENUM ('NONE', 'SCHEDULED', 'ALL_TAKEN', 'PARTIAL', 'MISSED');

-- CreateTable
CREATE TABLE "DayStatus" (
    "id" VARCHAR(32) NOT NULL,
    "userId" VARCHAR(32) NOT NULL,
    "date" DATE NOT NULL,
    "status" "DayStatusType" NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "plannedCount" INTEGER NOT NULL DEFAULT 0,
    "takenCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DayStatus_userId_date_idx" ON "DayStatus"("userId", "date");

-- CreateIndex
CREATE INDEX "DayStatus_userId_status_idx" ON "DayStatus"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DayStatus_userId_date_key" ON "DayStatus"("userId", "date");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayStatus" ADD CONSTRAINT "DayStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
