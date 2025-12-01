-- Add Codex-friendly homepage fields
ALTER TABLE "HomepageSettings"
  ADD COLUMN IF NOT EXISTS "logoText" TEXT,
  ADD COLUMN IF NOT EXISTS "logoSquareText" TEXT,
  ADD COLUMN IF NOT EXISTS "navLinks" JSONB,
  ADD COLUMN IF NOT EXISTS "primaryNavButton" JSONB,
  ADD COLUMN IF NOT EXISTS "heroPrimaryCtaLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "heroPrimaryCtaHref" TEXT,
  ADD COLUMN IF NOT EXISTS "heroIllustrationUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "featureCards" JSONB;
