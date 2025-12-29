-- Newsletter segments, automations & analytics
-- Enum types
CREATE TYPE "NewsletterAutomationStatus" AS ENUM ('ACTIVE','PAUSED');
CREATE TYPE "NewsletterAutomationTrigger" AS ENUM ('USER_REGISTERED','ORDER_PAID','NO_LOGIN_X_DAYS','NO_ORDER_X_DAYS','DOWNLOAD_NOT_USED');
CREATE TYPE "NewsletterAutomationRunStatus" AS ENUM ('RUNNING','COMPLETED','CANCELLED');

-- Metrics extension
ALTER TABLE "CustomerMetrics"
  ADD COLUMN IF NOT EXISTS "lastEmailOpenAt" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "lastEmailClickAt" TIMESTAMP WITH TIME ZONE;

-- Segments
CREATE TABLE IF NOT EXISTS "NewsletterSegment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "rulesJson" JSONB NOT NULL,
  "previewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "NewsletterSegmentCache" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "segmentId" TEXT NOT NULL REFERENCES "NewsletterSegment"("id") ON DELETE CASCADE,
  "subscriberId" TEXT NOT NULL REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE,
  "computedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "NewsletterSegmentCache_segmentId_idx" ON "NewsletterSegmentCache" ("segmentId");
CREATE INDEX IF NOT EXISTS "NewsletterSegmentCache_subscriberId_idx" ON "NewsletterSegmentCache" ("subscriberId");

-- Automations
CREATE TABLE IF NOT EXISTS "NewsletterAutomation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "status" "NewsletterAutomationStatus" NOT NULL DEFAULT 'ACTIVE',
  "trigger" "NewsletterAutomationTrigger" NOT NULL,
  "triggerConfig" JSONB,
  "segmentId" TEXT REFERENCES "NewsletterSegment"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "NewsletterAutomationStep" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "automationId" TEXT NOT NULL REFERENCES "NewsletterAutomation"("id") ON DELETE CASCADE,
  "stepOrder" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "templateId" TEXT NOT NULL REFERENCES "NewsletterTemplate"("id") ON DELETE RESTRICT,
  "delayMinutes" INTEGER NOT NULL DEFAULT 0,
  "conditionsJson" JSONB,
  "exitOnEvent" JSONB
);
CREATE INDEX IF NOT EXISTS "NewsletterAutomationStep_automationId_idx" ON "NewsletterAutomationStep" ("automationId");
CREATE INDEX IF NOT EXISTS "NewsletterAutomationStep_templateId_idx" ON "NewsletterAutomationStep" ("templateId");

CREATE TABLE IF NOT EXISTS "NewsletterAutomationRun" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "automationId" TEXT NOT NULL REFERENCES "NewsletterAutomation"("id") ON DELETE CASCADE,
  "subscriberId" TEXT NOT NULL REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE,
  "status" "NewsletterAutomationRunStatus" NOT NULL DEFAULT 'RUNNING',
  "currentStep" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "stepStartedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "finishedAt" TIMESTAMP WITH TIME ZONE,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "NewsletterAutomationRun_automationId_idx" ON "NewsletterAutomationRun" ("automationId");
CREATE INDEX IF NOT EXISTS "NewsletterAutomationRun_subscriberId_idx" ON "NewsletterAutomationRun" ("subscriberId");

-- Revenue attribution
CREATE TABLE IF NOT EXISTS "NewsletterRevenueAttribution" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" TEXT NOT NULL REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "revenue" INTEGER NOT NULL DEFAULT 0,
  "attributedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "NewsletterRevenueAttribution_campaignId_idx" ON "NewsletterRevenueAttribution" ("campaignId");
CREATE INDEX IF NOT EXISTS "NewsletterRevenueAttribution_orderId_idx" ON "NewsletterRevenueAttribution" ("orderId");
