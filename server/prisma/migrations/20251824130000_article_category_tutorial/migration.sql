-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('ARTICLE', 'TUTORIAL');

-- Ensure existing categories are compatible
UPDATE "Article"
SET "category" = CASE WHEN "category" = 'TUTORIAL' THEN 'TUTORIAL' ELSE 'ARTICLE' END;

-- AlterTable
ALTER TABLE "Article"
  ADD COLUMN "youtubeUrl" TEXT,
  ALTER COLUMN "category" TYPE "ArticleCategory" USING (
    CASE WHEN "category" = 'TUTORIAL' THEN 'TUTORIAL' ELSE 'ARTICLE' END::"ArticleCategory"
  ),
  ALTER COLUMN "category" SET DEFAULT 'ARTICLE',
  ALTER COLUMN "category" SET NOT NULL;
