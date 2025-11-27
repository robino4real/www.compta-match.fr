-- CreateTable
CREATE TABLE "HomepageSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "heroTitle" TEXT NOT NULL,
    "heroSubtitle" TEXT NOT NULL,
    "heroButtonLabel" TEXT NOT NULL,
    "heroButtonUrl" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "heroBackgroundImageUrl" TEXT,
    "features" JSONB,
    "highlightedProductIds" JSONB,
    "testimonials" JSONB,
    "contentBlockTitle" TEXT,
    "contentBlockBody" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageSettings_pkey" PRIMARY KEY ("id")
);
