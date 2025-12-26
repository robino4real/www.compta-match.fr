-- Minimal idempotent SQL for Stripe webhook logging changes
-- Apply directly on production PostgreSQL via phpPgAdmin.

-- 1) Add nullable stripeEventId column on "Order" (if missing)
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "stripeEventId" TEXT;

-- Ensure stripeEventId is unique when present
CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripeEventId_key" ON "Order"("stripeEventId");

-- 2) Create WebhookEventStatus enum if it does not already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WebhookEventStatus') THEN
        CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'ERROR');
    END IF;
END $$;

-- 3) Create WebhookEventLog table if it does not already exist
CREATE TABLE IF NOT EXISTS "WebhookEventLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "sessionId" TEXT,
    "paymentIntentId" TEXT,
    "orderId" TEXT,
    "message" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebhookEventLog_pkey" PRIMARY KEY ("id")
);

-- 4) Enforce uniqueness on eventId for webhook logs
CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEventLog_eventId_key" ON "WebhookEventLog"("eventId");
