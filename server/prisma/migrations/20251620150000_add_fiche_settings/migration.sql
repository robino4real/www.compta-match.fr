-- Add fiche settings fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'AppFiche' AND column_name = 'currency') THEN
    ALTER TABLE "AppFiche" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'AppFiche' AND column_name = 'fiscalYearStartMonth') THEN
    ALTER TABLE "AppFiche" ADD COLUMN "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;
