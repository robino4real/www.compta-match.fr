-- Newsletter segments, automations, analytics
CREATE TYPE "NewsletterAutomationStatus" AS ENUM ('ACTIVE','PAUSED');
CREATE TYPE "NewsletterAutomationTrigger" AS ENUM ('USER_REGISTERED','ORDER_PAID','NO_LOGIN_X_DAYS','NO_ORDER_X_DAYS','DOWNLOAD_NOT_USED');
CREATE TYPE "NewsletterAutomationRunStatus" AS ENUM ('RUNNING','COMPLETED','CANCELLED');

ALTER TABLE "CustomerMetrics"
  ADD COLUMN "lastEmailOpenAt" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN "lastEmailClickAt" TIMESTAMP WITH TIME ZONE;

CREATE TABLE "NewsletterSegment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "rulesJson" JSONB NOT NULL,
  "previewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "NewsletterSegmentCache" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "segmentId" TEXT NOT NULL,
  "subscriberId" TEXT NOT NULL,
  "computedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "NewsletterSegmentCache_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "NewsletterSegment"("id") ON DELETE CASCADE,
  CONSTRAINT "NewsletterSegmentCache_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE
);
CREATE INDEX "NewsletterSegmentCache_segmentId_idx" ON "NewsletterSegmentCache" ("segmentId");
CREATE INDEX "NewsletterSegmentCache_subscriberId_idx" ON "NewsletterSegmentCache" ("subscriberId");

CREATE TABLE "NewsletterAutomation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "status" "NewsletterAutomationStatus" NOT NULL DEFAULT 'ACTIVE',
  "trigger" "NewsletterAutomationTrigger" NOT NULL,
  "triggerConfig" JSONB,
  "segmentId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "NewsletterAutomation_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "NewsletterSegment"("id") ON DELETE SET NULL
);

CREATE TABLE "NewsletterAutomationStep" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "automationId" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "delayMinutes" INTEGER NOT NULL DEFAULT 0,
  "conditionsJson" JSONB,
  "exitOnEvent" JSONB,
  CONSTRAINT "NewsletterAutomationStep_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "NewsletterAutomation"("id") ON DELETE CASCADE,
  CONSTRAINT "NewsletterAutomationStep_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NewsletterTemplate"("id") ON DELETE RESTRICT
);
CREATE INDEX "NewsletterAutomationStep_automationId_idx" ON "NewsletterAutomationStep" ("automationId");
CREATE INDEX "NewsletterAutomationStep_templateId_idx" ON "NewsletterAutomationStep" ("templateId");

CREATE TABLE "NewsletterAutomationRun" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "automationId" TEXT NOT NULL,
  "subscriberId" TEXT NOT NULL,
  "status" "NewsletterAutomationRunStatus" NOT NULL DEFAULT 'RUNNING',
  "currentStep" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "stepStartedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "finishedAt" TIMESTAMP WITH TIME ZONE,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "NewsletterAutomationRun_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "NewsletterAutomation"("id") ON DELETE CASCADE,
  CONSTRAINT "NewsletterAutomationRun_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE
);
CREATE INDEX "NewsletterAutomationRun_automationId_idx" ON "NewsletterAutomationRun" ("automationId");
CREATE INDEX "NewsletterAutomationRun_subscriberId_idx" ON "NewsletterAutomationRun" ("subscriberId");

CREATE TABLE "NewsletterRevenueAttribution" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "revenue" INTEGER NOT NULL DEFAULT 0,
  "attributedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "NewsletterRevenueAttribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE,
  CONSTRAINT "NewsletterRevenueAttribution_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE
);
CREATE INDEX "NewsletterRevenueAttribution_campaignId_idx" ON "NewsletterRevenueAttribution" ("campaignId");
CREATE INDEX "NewsletterRevenueAttribution_orderId_idx" ON "NewsletterRevenueAttribution" ("orderId");
