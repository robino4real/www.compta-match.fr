-- Add structured hero sections and default features array
ALTER TABLE "HomepageSettings"
ADD COLUMN IF NOT EXISTS "heroSections" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "HomepageSettings"
ALTER COLUMN "features" SET DEFAULT '[]';

UPDATE "HomepageSettings" SET "features" = '[]'::jsonb WHERE "features" IS NULL;
UPDATE "HomepageSettings" SET "heroSections" = '[]'::jsonb WHERE "heroSections" IS NULL;
