-- Ensure AppFiche base table exists for accounting features
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AppFicheType') THEN
        CREATE TYPE "AppFicheType" AS ENUM ('COMPTAPRO', 'COMPTASSO');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AppFiche'
    ) THEN
        CREATE TABLE "AppFiche" (
            "id" TEXT NOT NULL,
            "type" "AppFicheType" NOT NULL,
            "ownerId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "currency" TEXT NOT NULL DEFAULT 'EUR',
            "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 1,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "AppFiche_pkey" PRIMARY KEY ("id")
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AppFiche_ownerId_fkey'
    ) THEN
        ALTER TABLE "AppFiche" ADD CONSTRAINT "AppFiche_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AppFiche_ownerId_idx" ON "AppFiche"("ownerId");

-- CreateTable
CREATE TABLE "AccountingEntry" (
    "id" TEXT NOT NULL,
    "ficheId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "account" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingEntry_ficheId_ownerId_idx" ON "AccountingEntry"("ficheId", "ownerId");

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "AppFiche"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
