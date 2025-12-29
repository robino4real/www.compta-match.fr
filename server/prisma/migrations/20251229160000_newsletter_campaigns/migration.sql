-- Newsletter campaigns/models
CREATE TYPE "NewsletterCampaignStatus" AS ENUM ('DRAFT','SCHEDULED','SENDING','SENT','PAUSED','CANCELLED','FAILED');
CREATE TYPE "NewsletterSendBatchStatus" AS ENUM ('QUEUED','SENDING','DONE','FAILED');
CREATE TYPE "NewsletterSendLogStatus" AS ENUM ('QUEUED','SENT','DELIVERED','OPENED','CLICKED','BOUNCED','COMPLAINED','UNSUBSCRIBED','FAILED');

CREATE TABLE "NewsletterTemplate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "subjectDefault" TEXT NOT NULL,
  "previewTextDefault" TEXT,
  "html" TEXT NOT NULL,
  "designJson" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "NewsletterCampaign" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "previewText" TEXT,
  "status" "NewsletterCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "audienceJson" JSONB NOT NULL,
  "templateId" TEXT,
  "htmlSnapshot" TEXT,
  "scheduledAt" TIMESTAMP WITH TIME ZONE,
  "startedAt" TIMESTAMP WITH TIME ZONE,
  "finishedAt" TIMESTAMP WITH TIME ZONE,
  "totalRecipients" INTEGER NOT NULL DEFAULT 0,
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "deliveredCount" INTEGER NOT NULL DEFAULT 0,
  "openCount" INTEGER NOT NULL DEFAULT 0,
  "clickCount" INTEGER NOT NULL DEFAULT 0,
  "bounceCount" INTEGER NOT NULL DEFAULT 0,
  "complaintCount" INTEGER NOT NULL DEFAULT 0,
  "unsubCount" INTEGER NOT NULL DEFAULT 0,
  "createdByAdminId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "NewsletterCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NewsletterTemplate"("id") ON DELETE SET NULL
);

CREATE TABLE "NewsletterSendBatch" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" TEXT NOT NULL,
  "status" "NewsletterSendBatchStatus" NOT NULL DEFAULT 'QUEUED',
  "scheduledAt" TIMESTAMP WITH TIME ZONE,
  "startedAt" TIMESTAMP WITH TIME ZONE,
  "finishedAt" TIMESTAMP WITH TIME ZONE,
  "total" INTEGER NOT NULL DEFAULT 0,
  "sent" INTEGER NOT NULL DEFAULT 0,
  "failed" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "NewsletterSendBatch_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE
);

CREATE TABLE "NewsletterSendLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" TEXT NOT NULL,
  "subscriberId" TEXT,
  "email" TEXT NOT NULL,
  "status" "NewsletterSendLogStatus" NOT NULL DEFAULT 'QUEUED',
  "error" TEXT,
  "providerMessageId" TEXT,
  "sentAt" TIMESTAMP WITH TIME ZONE,
  "deliveredAt" TIMESTAMP WITH TIME ZONE,
  "openedAt" TIMESTAMP WITH TIME ZONE,
  "clickedAt" TIMESTAMP WITH TIME ZONE,
  "meta" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "NewsletterSendLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE,
  CONSTRAINT "NewsletterSendLog_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "NewsletterSubscriber"("id") ON DELETE SET NULL
);

CREATE INDEX "NewsletterSendLog_campaignId_idx" ON "NewsletterSendLog" ("campaignId");
CREATE INDEX "NewsletterSendLog_email_idx" ON "NewsletterSendLog" ("email");
CREATE INDEX "NewsletterSendLog_status_idx" ON "NewsletterSendLog" ("status");

CREATE TABLE "NewsletterLink" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" TEXT NOT NULL,
  "originalUrl" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "clickCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "NewsletterLink_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE
);
