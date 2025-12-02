-- Homepage editable content blocks
ALTER TABLE "HomepageSettings"
  ADD COLUMN IF NOT EXISTS "blocks" JSONB DEFAULT '[]';
