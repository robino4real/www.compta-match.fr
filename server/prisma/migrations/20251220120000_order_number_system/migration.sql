DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderType') THEN
        CREATE TYPE "OrderType" AS ENUM ('DOWNLOADABLE', 'SUBSCRIPTION');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionBrand') THEN
        CREATE TYPE "SubscriptionBrand" AS ENUM ('CP', 'CA');
    END IF;
END $$;

-- AddColumns
ALTER TABLE "Order" ADD COLUMN     "orderNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'DOWNLOADABLE';
ALTER TABLE "Order" ADD COLUMN     "subscriptionBrand" "SubscriptionBrand";

-- Backfill legacy order numbers to preserve NOT NULL constraint
UPDATE "Order"
SET "orderNumber" = CONCAT('LEGACY-', REPLACE("id", '-', ''))
WHERE "orderNumber" IS NULL;

-- Make orderNumber mandatory and unique
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
