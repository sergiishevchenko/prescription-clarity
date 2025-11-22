-- Make dose and form optional on Medication
ALTER TABLE "Medication"
  ALTER COLUMN "dose" DROP NOT NULL,
  ALTER COLUMN "form" DROP NOT NULL;

