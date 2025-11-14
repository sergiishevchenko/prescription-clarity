/*
  Warnings:

  - Added the required column `units` to the `Medication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Medication" ADD COLUMN "units" VARCHAR(50) NOT NULL DEFAULT 'dose';
