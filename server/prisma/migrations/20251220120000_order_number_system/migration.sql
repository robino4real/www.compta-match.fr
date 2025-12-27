-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DOWNLOADABLE', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "SubscriptionBrand" AS ENUM ('CP', 'CA');

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
