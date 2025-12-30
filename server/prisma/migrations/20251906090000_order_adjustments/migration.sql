-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'EN_ATTENTE_DE_PAIEMENT';

-- CreateEnum
CREATE TYPE "OrderAdjustmentType" AS ENUM ('PARTIAL_REFUND', 'EXTRA_PAYMENT');

CREATE TYPE "OrderAdjustmentStatus" AS ENUM ('PENDING', 'SENT', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "OrderAdjustment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "OrderAdjustmentType" NOT NULL,
    "status" "OrderAdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "clientNote" TEXT,
    "adminNote" TEXT,
    "stripePaymentLinkId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripeRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderAdjustment_orderId_createdAt_idx" ON "OrderAdjustment"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "OrderAdjustment" ADD CONSTRAINT "OrderAdjustment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
