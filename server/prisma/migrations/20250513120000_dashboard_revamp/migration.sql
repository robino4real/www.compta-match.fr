-- Add stripe fee tracking on orders
ALTER TABLE "Order" ADD COLUMN "stripeFeeAmount" INTEGER NOT NULL DEFAULT 0;

-- Track product level analytics (views, add_to_cart)
CREATE TABLE "ProductAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductAnalyticsEvent_productId_type_createdAt_idx" ON "ProductAnalyticsEvent"("productId", "type", "createdAt");

ALTER TABLE "ProductAnalyticsEvent" ADD CONSTRAINT "ProductAnalyticsEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DownloadableProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
