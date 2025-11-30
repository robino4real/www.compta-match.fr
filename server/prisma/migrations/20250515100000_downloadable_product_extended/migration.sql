-- Extend DownloadableProduct with richer presentation and archiving
ALTER TABLE "DownloadableProduct" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "DownloadableProduct" ADD COLUMN "featureBullets" JSONB;
ALTER TABLE "DownloadableProduct" ADD COLUMN "detailHtml" TEXT;
ALTER TABLE "DownloadableProduct" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "DownloadableProduct" ADD COLUMN "archivedAt" TIMESTAMP(3);
