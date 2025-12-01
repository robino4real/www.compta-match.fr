-- CreateTable
CREATE TABLE "PaidServicePlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "priceAmount" DECIMAL(65,30) NOT NULL,
    "priceCurrency" TEXT NOT NULL,
    "pricePeriod" TEXT NOT NULL,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "stripePriceId" TEXT,

    CONSTRAINT "PaidServicePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaidServiceFeatureRow" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "planAId" TEXT,
    "planBId" TEXT,
    "planAIncluded" BOOLEAN NOT NULL DEFAULT false,
    "planBIncluded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PaidServiceFeatureRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaidServiceSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PaidServiceSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaidServicePlan_slug_key" ON "PaidServicePlan"("slug");

-- AddForeignKey
ALTER TABLE "PaidServiceFeatureRow" ADD CONSTRAINT "PaidServiceFeatureRow_planAId_fkey" FOREIGN KEY ("planAId") REFERENCES "PaidServicePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaidServiceFeatureRow" ADD CONSTRAINT "PaidServiceFeatureRow_planBId_fkey" FOREIGN KEY ("planBId") REFERENCES "PaidServicePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
