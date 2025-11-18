/*
  Warnings:

  - You are about to drop the column `endDate` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `units` on the `Medication` table. All the data in the column will be lost.
  - Changed the type of `dose` on the `Medication` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `form` to the `Medication` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add new columns as nullable
ALTER TABLE "Medication" ADD COLUMN "form" VARCHAR(50);
ALTER TABLE "Medication" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Medication" ADD COLUMN "dose_new" INTEGER;

-- Step 2: Migrate data from old columns to new columns
-- Copy units to form
UPDATE "Medication" SET "form" = "units" WHERE "form" IS NULL;

-- Convert dose from string to integer (extract numeric part)
-- This assumes dose values are like "100mg" or "100"
UPDATE "Medication"
SET "dose_new" = CAST(regexp_replace("dose", '[^0-9]', '', 'g') AS INTEGER)
WHERE "dose_new" IS NULL AND regexp_replace("dose", '[^0-9]', '', 'g') != '';

-- Set default dose if conversion failed
UPDATE "Medication" SET "dose_new" = 1 WHERE "dose_new" IS NULL;

-- Step 3: Drop old dose column and rename dose_new to dose
ALTER TABLE "Medication" DROP COLUMN "dose";
ALTER TABLE "Medication" RENAME COLUMN "dose_new" TO "dose";

-- Step 4: Make form and dose NOT NULL
ALTER TABLE "Medication" ALTER COLUMN "form" SET NOT NULL;
ALTER TABLE "Medication" ALTER COLUMN "dose" SET NOT NULL;

-- Step 5: Drop old columns
ALTER TABLE "Medication" DROP COLUMN "units";
ALTER TABLE "Medication" DROP COLUMN "frequency";
ALTER TABLE "Medication" DROP COLUMN "startDate";
ALTER TABLE "Medication" DROP COLUMN "endDate";
ALTER TABLE "Medication" DROP COLUMN "status";

-- Step 6: Drop old indexes
DROP INDEX IF EXISTS "Medication_userId_status_idx";
DROP INDEX IF EXISTS "Medication_startDate_idx";
DROP INDEX IF EXISTS "Medication_endDate_idx";

-- Step 7: Create new index
CREATE INDEX "Medication_userId_deletedAt_idx" ON "Medication"("userId", "deletedAt");

-- Step 8: Drop MedicationStatus enum (if no other tables use it)
DROP TYPE IF EXISTS "MedicationStatus";