-- Added card image and detailed slides for downloadable products
ALTER TABLE "DownloadableProduct" ADD COLUMN "cardImageUrl" TEXT;
ALTER TABLE "DownloadableProduct" ADD COLUMN "detailSlides" JSONB;
