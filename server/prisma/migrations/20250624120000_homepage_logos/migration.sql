-- Ensure logo columns exist on HomepageSettings
ALTER TABLE "HomepageSettings"
ADD COLUMN IF NOT EXISTS "siteLogoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "navbarLogoUrl" TEXT;
