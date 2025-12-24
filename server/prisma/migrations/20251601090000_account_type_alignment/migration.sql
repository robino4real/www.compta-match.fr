-- Align user and profile account types with shared enum and defaults
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountType') THEN
    CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'PROFESSIONAL', 'ASSOCIATION');
  END IF;
END $$;

DO $$
BEGIN
  -- Ensure User.accountType column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'accountType'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "accountType" "AccountType";
  END IF;

  -- Normalize existing values to valid enum entries
  UPDATE "User"
  SET "accountType" = 'INDIVIDUAL'
  WHERE "accountType" IS NULL
    OR UPPER("accountType"::text) NOT IN ('INDIVIDUAL', 'PROFESSIONAL', 'ASSOCIATION');

  -- Convert text columns to enum while protecting data
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User'
      AND column_name = 'accountType'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "User"
    ALTER COLUMN "accountType" TYPE "AccountType"
    USING CASE
      WHEN UPPER("accountType"::text) IN ('INDIVIDUAL', 'PROFESSIONAL', 'ASSOCIATION') THEN UPPER("accountType"::text)::"AccountType"
      ELSE 'INDIVIDUAL'::"AccountType"
    END;
  END IF;

  ALTER TABLE "User"
    ALTER COLUMN "accountType" SET DEFAULT 'INDIVIDUAL',
    ALTER COLUMN "accountType" SET NOT NULL;
END $$;

DO $$
BEGIN
  -- Ensure UserProfile.accountType column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'UserProfile' AND column_name = 'accountType'
  ) THEN
    ALTER TABLE "UserProfile" ADD COLUMN "accountType" "AccountType";
  END IF;

  -- Normalize existing values to valid enum entries
  UPDATE "UserProfile"
  SET "accountType" = 'INDIVIDUAL'
  WHERE "accountType" IS NULL
    OR UPPER("accountType"::text) NOT IN ('INDIVIDUAL', 'PROFESSIONAL', 'ASSOCIATION');

  -- Convert text columns to enum while protecting data
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'UserProfile'
      AND column_name = 'accountType'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "UserProfile"
    ALTER COLUMN "accountType" TYPE "AccountType"
    USING CASE
      WHEN UPPER("accountType"::text) IN ('INDIVIDUAL', 'PROFESSIONAL', 'ASSOCIATION') THEN UPPER("accountType"::text)::"AccountType"
      ELSE 'INDIVIDUAL'::"AccountType"
    END;
  END IF;

  ALTER TABLE "UserProfile"
    ALTER COLUMN "accountType" SET DEFAULT 'INDIVIDUAL',
    ALTER COLUMN "accountType" SET NOT NULL;
END $$;
