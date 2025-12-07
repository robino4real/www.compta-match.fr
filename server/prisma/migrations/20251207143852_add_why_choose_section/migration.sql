-- CreateTable
CREATE TABLE "WhyChooseItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "iconType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhyChooseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhyChooseItem_sectionId_idx" ON "WhyChooseItem"("sectionId");

-- AddForeignKey
ALTER TABLE "WhyChooseItem" ADD CONSTRAINT "WhyChooseItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "PageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
