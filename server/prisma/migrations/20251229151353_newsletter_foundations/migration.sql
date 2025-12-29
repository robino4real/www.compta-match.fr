-- CreateEnum
CREATE TYPE "NewsletterSubscriberStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED');

-- CreateEnum
CREATE TYPE "NewsletterSubscriberSource" AS ENUM ('CHECKOUT', 'POPUP', 'ACCOUNT', 'ADMIN_IMPORT', 'ADMIN_MANUAL');

-- CreateEnum
CREATE TYPE "NewsletterConsentAction" AS ENUM ('OPT_IN', 'OPT_OUT', 'DOUBLE_OPTIN_CONFIRMED');

-- CreateEnum
CREATE TYPE "CustomerActivityEventType" AS ENUM ('USER_REGISTERED', 'USER_LOGIN', 'ORDER_CREATED', 'ORDER_PAID', 'DOWNLOAD_CREATED', 'DOWNLOAD_USED', 'PAGE_VIEW');

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "status" "NewsletterSubscriberStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "NewsletterSubscriberSource" NOT NULL DEFAULT 'ADMIN_MANUAL',
    "consentAt" TIMESTAMP(3) NOT NULL,
    "consentSource" TEXT NOT NULL,
    "consentProof" JSONB,
    "userId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterConsentLog" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "action" "NewsletterConsentAction" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "NewsletterConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerActivityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "type" "CustomerActivityEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "CustomerActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerMetrics" (
    "userId" TEXT NOT NULL,
    "lastActivityAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "lastOrderAt" TIMESTAMP(3),
    "downloadsCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerMetrics_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "CustomerActivityEvent_userId_idx" ON "CustomerActivityEvent"("userId");

-- CreateIndex
CREATE INDEX "CustomerActivityEvent_email_idx" ON "CustomerActivityEvent"("email");

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterConsentLog" ADD CONSTRAINT "NewsletterConsentLog_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "NewsletterSubscriber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerActivityEvent" ADD CONSTRAINT "CustomerActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMetrics" ADD CONSTRAINT "CustomerMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

