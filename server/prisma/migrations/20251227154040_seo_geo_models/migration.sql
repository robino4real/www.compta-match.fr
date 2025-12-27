DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BrandTone') THEN
        CREATE TYPE "BrandTone" AS ENUM ('PROFESSIONAL', 'PEDAGOGICAL', 'DIRECT');
    END IF;
END $$;

-- CreateTable
CREATE TABLE "SeoSettingsV2" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'global',
    "siteName" TEXT,
    "defaultTitle" TEXT,
    "defaultDescription" TEXT,
    "defaultOgImageUrl" TEXT,
    "canonicalBaseUrl" TEXT,
    "defaultRobotsIndex" BOOLEAN NOT NULL DEFAULT true,
    "defaultRobotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "robotsTxt" TEXT,
    "sitemapEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sitemapIncludePages" BOOLEAN NOT NULL DEFAULT true,
    "sitemapIncludeProducts" BOOLEAN NOT NULL DEFAULT true,
    "sitemapIncludeArticles" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoSettingsV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSeo" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "ogImageUrl" TEXT,
    "canonicalUrl" TEXT,
    "robotsIndex" BOOLEAN,
    "robotsFollow" BOOLEAN,
    "jsonLdOverride" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageSeo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSeo" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "ogImageUrl" TEXT,
    "canonicalUrl" TEXT,
    "robotsIndex" BOOLEAN,
    "robotsFollow" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSeo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoIdentity" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'global',
    "shortDescription" TEXT,
    "longDescription" TEXT,
    "targetAudience" TEXT,
    "positioning" TEXT,
    "differentiation" TEXT,
    "brandTone" "BrandTone",
    "language" TEXT DEFAULT 'fr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoFaqItem" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoFaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoAnswer" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "question" TEXT NOT NULL,
    "shortAnswer" TEXT,
    "longAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeoSettingsV2_singletonKey_key" ON "SeoSettingsV2"("singletonKey");

-- CreateIndex
CREATE UNIQUE INDEX "PageSeo_pageId_key" ON "PageSeo"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSeo_productId_key" ON "ProductSeo"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "GeoIdentity_singletonKey_key" ON "GeoIdentity"("singletonKey");

-- AddForeignKey
ALTER TABLE "PageSeo" ADD CONSTRAINT "PageSeo_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CustomPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSeo" ADD CONSTRAINT "ProductSeo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DownloadableProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

