-- Prompt 4 migration: preferences, RGPD, scoring, deliverability
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NewsletterPreferenceSource') THEN
    CREATE TYPE "NewsletterPreferenceSource" AS ENUM ('EMAIL','PUBLIC_PAGE','ADMIN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RGPDAction') THEN
    CREATE TYPE "RGPDAction" AS ENUM ('EXPORT','ANONYMIZE','DELETE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliverabilityStatusEnum') THEN
    CREATE TYPE "DeliverabilityStatusEnum" AS ENUM ('OK','NOK','UNKNOWN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NewsletterAlertType') THEN
    CREATE TYPE "NewsletterAlertType" AS ENUM ('BOUNCE_RATE','COMPLAINT_RATE','LOW_OPEN_RATE','SEND_FREQUENCY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NewsletterAlertSeverity') THEN
    CREATE TYPE "NewsletterAlertSeverity" AS ENUM ('INFO','WARNING','CRITICAL');
  END IF;
  BEGIN
    ALTER TYPE "NewsletterSubscriberStatus" ADD VALUE IF NOT EXISTS 'ANONYMIZED';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END$$;

ALTER TABLE "NewsletterSubscriber"
  ADD COLUMN IF NOT EXISTS "preferencesJson" JSONB,
  ADD COLUMN IF NOT EXISTS "unsubscribedAt" TIMESTAMP;

CREATE TABLE IF NOT EXISTS "NewsletterPreferenceLog" (
  "id" TEXT PRIMARY KEY,
  "subscriberId" TEXT NOT NULL REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE,
  "previousPreferences" JSONB,
  "newPreferences" JSONB,
  "changedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "source" "NewsletterPreferenceSource" NOT NULL
);
CREATE INDEX IF NOT EXISTS "NewsletterPreferenceLog_subscriberId_idx" ON "NewsletterPreferenceLog"("subscriberId");

CREATE TABLE IF NOT EXISTS "RGPDLog" (
  "id" TEXT PRIMARY KEY,
  "subscriberId" TEXT NOT NULL REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE,
  "action" "RGPDAction" NOT NULL,
  "performedByAdminId" TEXT,
  "performedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "meta" JSONB
);

CREATE TABLE IF NOT EXISTS "NewsletterScore" (
  "subscriberId" TEXT PRIMARY KEY REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE,
  "score" INT NOT NULL,
  "breakdownJson" JSONB,
  "lastComputedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "NewsletterDeliverabilityStatus" (
  "id" TEXT PRIMARY KEY,
  "domain" TEXT UNIQUE NOT NULL,
  "spfStatus" "DeliverabilityStatusEnum" DEFAULT 'UNKNOWN',
  "dkimStatus" "DeliverabilityStatusEnum" DEFAULT 'UNKNOWN',
  "dmarcStatus" "DeliverabilityStatusEnum" DEFAULT 'UNKNOWN',
  "lastCheckedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "NewsletterAlert" (
  "id" TEXT PRIMARY KEY,
  "type" "NewsletterAlertType" NOT NULL,
  "severity" "NewsletterAlertSeverity" DEFAULT 'WARNING',
  "message" TEXT NOT NULL,
  "relatedCampaignId" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "acknowledgedAt" TIMESTAMP
);
