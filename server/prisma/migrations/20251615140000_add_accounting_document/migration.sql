-- CreateTable
CREATE TABLE "AccountingDocument" (
    "id" TEXT NOT NULL,
    "ficheId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingDocument_ficheId_ownerId_idx" ON "AccountingDocument"("ficheId", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingDocument_ownerId_storagePath_key" ON "AccountingDocument"("ownerId", "storagePath");

-- AddForeignKey
ALTER TABLE "AccountingDocument" ADD CONSTRAINT "AccountingDocument_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "AppFiche"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingDocument" ADD CONSTRAINT "AccountingDocument_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
