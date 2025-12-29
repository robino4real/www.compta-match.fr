-- Newsletter foundations (schema bootstrap)

CREATE TYPE "NewsletterSubscriberStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED');
CREATE TYPE "NewsletterSubscriberSource" AS ENUM ('CHECKOUT', 'POPUP', 'ACCOUNT', 'ADMIN_IMPORT', 'ADMIN_MANUAL');
CREATE TYPE "NewsletterConsentAction" AS ENUM ('OPT_IN', 'OPT_OUT', 'DOUBLE_OPTIN_CONFIRMED');
CREATE TYPE "CustomerActivityEventType" AS ENUM (
  'USER_REGISTERED',
  'USER_LOGIN',
  'ORDER_CREATED',
  'ORDER_PAID',
  'DOWNLOAD_CREATED',
  'DOWNLOAD_USED',
  'PAGE_VIEW'
);

CREATE TABLE "NewsletterSubscriber" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "firstName" TEXT,
  "lastName" TEXT,
  "status" "NewsletterSubscriberStatus" NOT NULL DEFAULT 'ACTIVE',
  "source" "NewsletterSubscriberSource" NOT NULL DEFAULT 'ADMIN_MANUAL',
  "consentAt" TIMESTAMP(3) NOT NULL,
  "consentSource" TEXT NOT NULL,
  "consentProof" JSONB,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");

CREATE TABLE "NewsletterConsentLog" (
  "id" TEXT PRIMARY KEY,
  "subscriberId" TEXT NOT NULL REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE,
  "action" "NewsletterConsentAction" NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "meta" JSONB
);

CREATE TABLE "CustomerActivityEvent" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "email" TEXT,
  "type" "CustomerActivityEventType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "meta" JSONB
);

CREATE INDEX "CustomerActivityEvent_userId_idx" ON "CustomerActivityEvent"("userId");
CREATE INDEX "CustomerActivityEvent_email_idx" ON "CustomerActivityEvent"("email");

CREATE TABLE "CustomerMetrics" (
  "userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "lastActivityAt" TIMESTAMP(3),
  "lastLoginAt" TIMESTAMP(3),
  "ordersCount" INTEGER NOT NULL DEFAULT 0,
  "totalSpent" INTEGER NOT NULL DEFAULT 0,
  "lastOrderAt" TIMESTAMP(3),
  "downloadsCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
