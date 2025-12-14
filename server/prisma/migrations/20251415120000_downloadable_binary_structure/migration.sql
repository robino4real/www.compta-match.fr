-- Ensure DownloadPlatform enum exists
DO $$
BEGIN
    CREATE TYPE "DownloadPlatform" AS ENUM ('WINDOWS', 'MACOS');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

-- Create DownloadableBinary table if missing
CREATE TABLE IF NOT EXISTS "DownloadableBinary" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "platform" "DownloadPlatform" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileMimeType" TEXT,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DownloadableBinary_pkey" PRIMARY KEY ("id")
);

-- Add missing columns on OrderItem
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "platform" "DownloadPlatform";
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "binaryId" TEXT;

-- Link binaries to products
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DownloadableBinary_productId_fkey'
    ) THEN
        ALTER TABLE "DownloadableBinary" ADD CONSTRAINT "DownloadableBinary_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "DownloadableProduct"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END$$;

-- Link order items to selected binary
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_binaryId_fkey'
    ) THEN
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_binaryId_fkey"
            FOREIGN KEY ("binaryId") REFERENCES "DownloadableBinary"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;
