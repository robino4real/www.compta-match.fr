-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "providerType" TEXT NOT NULL DEFAULT 'OTHER',
    "fromNameDefault" TEXT NOT NULL,
    "fromEmailDefault" TEXT NOT NULL,
    "replyToEmailDefault" TEXT,
    "ordersFromEmail" TEXT,
    "billingEmail" TEXT,
    "supportEmail" TEXT,
    "technicalContactEmail" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUsername" TEXT,
    "smtpPassword" TEXT,
    "apiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_key_key" ON "EmailTemplate"("key");

-- Ensure updatedAt is refreshed on updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS email_settings_updated_at ON "EmailSettings";
CREATE TRIGGER email_settings_updated_at
BEFORE UPDATE ON "EmailSettings"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS email_template_updated_at ON "EmailTemplate";
CREATE TRIGGER email_template_updated_at
BEFORE UPDATE ON "EmailTemplate"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
