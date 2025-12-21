-- Add account type enum and column for user profiles
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'PROFESSIONAL', 'ASSOCIATION');

ALTER TABLE "UserProfile"
ADD COLUMN IF NOT EXISTS "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL';
