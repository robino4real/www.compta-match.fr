import { Order, User } from "@prisma/client";
import path from "path";
import fs from "fs";
import { prisma } from "../config/prisma";
import {
  buildSellerAddress,
  buildVatMention,
  getOrCreateCompanySettings,
} from "./companySettingsService";
import { generateInvoicePdf } from "./pdfService";

function buildBillingName(user: User): string {
  const parts = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return parts || user.email;
}

export async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const prefix = `${year}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
  });

  const lastSequence = lastInvoice
    ? parseInt(lastInvoice.invoiceNumber.split("-")[1] || "0", 10)
    : 0;

  const nextSequence = String(lastSequence + 1).padStart(4, "0");
  return `${prefix}${nextSequence}`;
}

interface InvoiceCreationInput {
  order: Order;
  user: User;
  billingEmail?: string;
  billingName?: string;
  billingAddress?: string | null;
}

export async function createInvoiceForOrder({
  order,
  user,
  billingEmail,
  billingName,
  billingAddress,
}: InvoiceCreationInput) {
  const companySettings = await getOrCreateCompanySettings();
  const invoiceNumber = await generateInvoiceNumber();
  const resolvedName = billingName || buildBillingName(user);
  const resolvedEmail = billingEmail || user.email;
  const issueDate = order.paidAt || new Date();

  const sellerVatMention = buildVatMention(companySettings);
  const sellerAddress = buildSellerAddress(companySettings);

  const totals = {
    totalTTC: order.totalPaid,
    totalHT:
      companySettings.vatRegime === "NO_VAT_293B"
        ? order.totalPaid
        : order.totalPaid,
    totalTVA: companySettings.vatRegime === "NO_VAT_293B" ? 0 : 0,
  };

  const pdfRelativePath = path.join(
    "uploads",
    "invoices",
    `${invoiceNumber}.pdf`
  );

  const invoice = await prisma.invoice.create({
    data: {
      orderId: order.id,
      invoiceNumber,
      issueDate,
      billingName: resolvedName,
      billingEmail: resolvedEmail,
      billingAddress: billingAddress || null,
      totalHT: totals.totalHT,
      totalTVA: totals.totalTVA,
      totalTTC: totals.totalTTC,
      currency: order.currency,
      pdfPath: pdfRelativePath,
      sellerName: companySettings.companyName,
      sellerLegalForm: companySettings.legalForm,
      sellerAddress,
      sellerPostalCode: companySettings.postalCode,
      sellerCity: companySettings.city,
      sellerCountry: companySettings.country,
      sellerSiren: companySettings.siren,
      sellerSiret: companySettings.siret,
      sellerRcsCity: companySettings.rcsCity,
      sellerVatNumber: companySettings.vatNumber,
      sellerVatRegime: companySettings.vatRegime,
      sellerVatMention,
      sellerCapital: companySettings.capital,
      sellerWebsiteUrl: companySettings.websiteUrl,
      sellerContactEmail: companySettings.contactEmail,
      sellerInvoiceFooterText: companySettings.invoiceFooterText,
      sellerLogoUrl: companySettings.logoUrl,
    },
  });

  const invoiceDir = path.join(__dirname, "../../", "uploads", "invoices");
  fs.mkdirSync(invoiceDir, { recursive: true });
  await generateInvoicePdf(invoice.id);

  return invoice;
}
