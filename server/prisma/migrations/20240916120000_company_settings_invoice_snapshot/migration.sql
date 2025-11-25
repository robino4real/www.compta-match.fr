-- CreateEnum
CREATE TYPE "VatRegime" AS ENUM ('NO_VAT_293B', 'STANDARD_VAT', 'OTHER');

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "companyName" TEXT NOT NULL,
    "legalForm" TEXT NOT NULL,
    "tradeName" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "siren" TEXT,
    "siret" TEXT,
    "rcsCity" TEXT,
    "vatNumber" TEXT,
    "vatRegime" "VatRegime" NOT NULL DEFAULT 'NO_VAT_293B',
    "vatCustomMention" TEXT,
    "capital" TEXT,
    "contactEmail" TEXT NOT NULL,
    "supportEmail" TEXT,
    "websiteUrl" TEXT,
    "invoiceFooterText" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "sellerAddress" TEXT,
ADD COLUMN     "sellerCapital" TEXT,
ADD COLUMN     "sellerCity" TEXT,
ADD COLUMN     "sellerContactEmail" TEXT,
ADD COLUMN     "sellerCountry" TEXT,
ADD COLUMN     "sellerInvoiceFooterText" TEXT,
ADD COLUMN     "sellerLegalForm" TEXT,
ADD COLUMN     "sellerLogoUrl" TEXT,
ADD COLUMN     "sellerName" TEXT,
ADD COLUMN     "sellerPostalCode" TEXT,
ADD COLUMN     "sellerRcsCity" TEXT,
ADD COLUMN     "sellerSiren" TEXT,
ADD COLUMN     "sellerSiret" TEXT,
ADD COLUMN     "sellerVatMention" TEXT,
ADD COLUMN     "sellerVatNumber" TEXT,
ADD COLUMN     "sellerVatRegime" TEXT,
ADD COLUMN     "sellerWebsiteUrl" TEXT;

-- Add default update trigger compatibility (Prisma uses updatedAt)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS company_settings_updated_at ON "CompanySettings";
CREATE TRIGGER company_settings_updated_at
BEFORE UPDATE ON "CompanySettings"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
