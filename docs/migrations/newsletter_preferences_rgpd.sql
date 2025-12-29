-- Newsletter preferences, RGPD, scoring & deliverability
-- Apply on PostgreSQL

ALTER TYPE "NewsletterSubscriberStatus" ADD VALUE IF NOT EXISTS 'ANONYMIZED';

CREATE TYPE IF NOT EXISTS "NewsletterPreferenceSource" AS ENUM ('EMAIL','PUBLIC_PAGE','ADMIN');
CREATE TYPE IF NOT EXISTS "RGPDAction" AS ENUM ('EXPORT','ANONYMIZE','DELETE');
CREATE TYPE IF NOT EXISTS "DeliverabilityStatusEnum" AS ENUM ('OK','NOK','UNKNOWN');
CREATE TYPE IF NOT EXISTS "NewsletterAlertType" AS ENUM ('BOUNCE_RATE','COMPLAINT_RATE','LOW_OPEN_RATE','SEND_FREQUENCY');
CREATE TYPE IF NOT EXISTS "NewsletterAlertSeverity" AS ENUM ('INFO','WARNING','CRITICAL');

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
