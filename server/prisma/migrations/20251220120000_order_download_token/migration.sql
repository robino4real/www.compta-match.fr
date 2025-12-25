-- Ensure downloadToken exists and is unique for orders
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "downloadToken" TEXT;

-- Populate missing tokens for existing rows
UPDATE "Order"
SET "downloadToken" = md5(random()::text || clock_timestamp()::text)
WHERE "downloadToken" IS NULL;

-- Enforce NOT NULL constraint
ALTER TABLE "Order" ALTER COLUMN "downloadToken" SET NOT NULL;

-- Unique index for tokens
CREATE UNIQUE INDEX IF NOT EXISTS "Order_downloadToken_key" ON "Order"("downloadToken");
