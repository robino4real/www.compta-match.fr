-- Create SeoSettings singleton
CREATE TABLE "SeoSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "siteName" TEXT NOT NULL,
    "siteTagline" TEXT,
    "defaultTitle" TEXT,
    "titleTemplate" TEXT,
    "defaultMetaDescription" TEXT,
    "defaultOgImageUrl" TEXT,
    "twitterHandle" TEXT,
    "facebookPageUrl" TEXT,
    "linkedinPageUrl" TEXT,
    "indexSite" BOOLEAN NOT NULL DEFAULT TRUE,
    "defaultRobotsIndex" TEXT DEFAULT 'index',
    "defaultRobotsFollow" TEXT DEFAULT 'follow',
    "canonicalBaseUrl" TEXT,
    "customRobotsTxt" TEXT,
    "enableSitemap" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoSettings_pkey" PRIMARY KEY ("id")
);

-- Create SeoStaticPage
CREATE TABLE "SeoStaticPage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "title" TEXT,
    "metaDescription" TEXT,
    "index" BOOLEAN NOT NULL DEFAULT TRUE,
    "follow" BOOLEAN NOT NULL DEFAULT TRUE,
    "ogImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoStaticPage_pkey" PRIMARY KEY ("id")
);

-- Ensure SeoStaticPage key uniqueness
CREATE UNIQUE INDEX "SeoStaticPage_key_key" ON "SeoStaticPage"("key");

-- Extend DownloadableProduct with SEO fields
ALTER TABLE "DownloadableProduct"
  ADD COLUMN     "seoTitle" TEXT,
  ADD COLUMN     "seoDescription" TEXT,
  ADD COLUMN     "index" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN     "follow" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN     "ogImageUrl" TEXT;

-- Extend LegalPage with SEO fields
ALTER TABLE "LegalPage"
  ADD COLUMN     "seoTitle" TEXT,
  ADD COLUMN     "seoDescription" TEXT,
  ADD COLUMN     "index" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN     "follow" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN     "ogImageUrl" TEXT;

-- Extend Article with SEO fields
ALTER TABLE "Article"
  ADD COLUMN     "index" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN     "follow" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN     "ogImageUrl" TEXT;
