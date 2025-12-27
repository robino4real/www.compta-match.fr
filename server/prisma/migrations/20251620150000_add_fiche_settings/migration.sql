-- Add fiche settings fields
ALTER TABLE "AppFiche"
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 1;
