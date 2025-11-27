-- CreateTable
CREATE TABLE "AdminTwoFactorCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AdminTwoFactorCode_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdminTwoFactorCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AdminTwoFactorCode_userId_idx" ON "AdminTwoFactorCode"("userId");

-- Align default email addresses
UPDATE "EmailSettings"
SET
    "fromEmailDefault" = 'no-reply@compta-match.fr',
    "replyToEmailDefault" = 'contact@compta-match.fr',
    "ordersFromEmail" = 'no-reply@compta-match.fr',
    "billingEmail" = 'contact@compta-match.fr',
    "supportEmail" = 'contact@compta-match.fr',
    "technicalContactEmail" = 'admin-user@compta-match.fr',
    "updatedAt" = NOW()
WHERE "id" = 1;

-- Align company contact email defaults
UPDATE "CompanySettings"
SET
    "contactEmail" = 'contact@compta-match.fr',
    "supportEmail" = COALESCE("supportEmail", 'contact@compta-match.fr'),
    "updatedAt" = NOW()
WHERE "id" = 1;
