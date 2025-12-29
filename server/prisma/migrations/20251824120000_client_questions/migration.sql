-- CreateTable
CREATE TABLE "ClientQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientQuestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClientQuestion" ADD CONSTRAINT "ClientQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ClientQuestion_userId_createdAt_idx" ON "ClientQuestion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ClientQuestion_published_createdAt_idx" ON "ClientQuestion"("published", "createdAt");
