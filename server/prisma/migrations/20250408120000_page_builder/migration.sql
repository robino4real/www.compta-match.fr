-- Create CustomPage table
CREATE TABLE "CustomPage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomPage_pkey" PRIMARY KEY ("id")
);

-- Unique constraints for CustomPage
CREATE UNIQUE INDEX "CustomPage_key_key" ON "CustomPage"("key");
CREATE UNIQUE INDEX "CustomPage_route_key" ON "CustomPage"("route");

-- Create PageSection table
CREATE TABLE "PageSection" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT,
    "type" TEXT NOT NULL,
    "backgroundColor" TEXT,
    "backgroundImageUrl" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageSection_pkey" PRIMARY KEY ("id")
);

-- Create PageBlock table
CREATE TABLE "PageBlock" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageBlock_pkey" PRIMARY KEY ("id")
);

-- Relations
ALTER TABLE "PageSection"
ADD CONSTRAINT "PageSection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CustomPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PageBlock"
ADD CONSTRAINT "PageBlock_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "PageSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
