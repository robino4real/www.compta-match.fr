-- Add billing snapshots and acceptance flags to orders
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "billingNameSnapshot" TEXT,
ADD COLUMN IF NOT EXISTS "billingEmailSnapshot" TEXT,
ADD COLUMN IF NOT EXISTS "billingAddressSnapshot" TEXT,
ADD COLUMN IF NOT EXISTS "acceptedTerms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "acceptedLicense" BOOLEAN NOT NULL DEFAULT false;
