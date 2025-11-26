import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { prisma } from "../config/prisma";

function formatCurrency(amount: number, currency = "EUR"): string {
  return `${(amount / 100).toFixed(2)} ${currency}`;
}

export async function generateInvoicePdf(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      order: {
        include: {
          items: true,
          promoCode: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error("Facture introuvable");
  }

  const pdfPath = invoice.pdfPath || path.join("uploads", "invoices", `${invoice.invoiceNumber}.pdf`);
  const absolutePath = path.join(__dirname, "../../", pdfPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  const doc = new PDFDocument({ margin: 40 });
  const writeStream = fs.createWriteStream(absolutePath);
  doc.pipe(writeStream);

  // Header
  if (invoice.sellerLogoUrl) {
    try {
      doc.image(invoice.sellerLogoUrl, { width: 120, align: "left" });
    } catch (e) {
      console.warn("Logo introuvable pour la facture", invoice.id);
    }
  }

  doc
    .fontSize(16)
    .text(invoice.sellerName || "", { continued: false })
    .fontSize(12)
    .text(invoice.sellerLegalForm || "")
    .moveDown(0.5);

  doc
    .fontSize(10)
    .text(invoice.sellerAddress || "")
    .text([invoice.sellerPostalCode, invoice.sellerCity].filter(Boolean).join(" "))
    .text(invoice.sellerCountry || "")
    .text(invoice.sellerWebsiteUrl || "")
    .text(invoice.sellerContactEmail || "")
    .moveDown(0.5);

  if (invoice.sellerSiret) doc.text(`SIRET : ${invoice.sellerSiret}`);
  if (invoice.sellerSiren) doc.text(`SIREN : ${invoice.sellerSiren}`);
  if (invoice.sellerRcsCity) doc.text(`RCS : ${invoice.sellerRcsCity}`);
  if (invoice.sellerVatNumber) doc.text(`TVA : ${invoice.sellerVatNumber}`);
  if (invoice.sellerVatMention) doc.text(invoice.sellerVatMention);
  if (invoice.sellerCapital) doc.text(invoice.sellerCapital);

  doc.moveDown(1);

  // Invoice info
  doc
    .fontSize(14)
    .text(`Facture ${invoice.invoiceNumber}`, { align: "right" })
    .fontSize(10)
    .text(`Date : ${new Date(invoice.issueDate).toLocaleDateString("fr-FR")}`, {
      align: "right",
    })
    .moveDown(1);

  // Client block
  doc
    .fontSize(12)
    .text("Client", { underline: true })
    .fontSize(10)
    .text(invoice.billingName)
    .text(invoice.billingEmail)
    .text(invoice.billingAddress || "");

  doc.moveDown(1);

  // Items table
  doc.fontSize(12).text("Détails", { underline: true }).moveDown(0.5);
  invoice.order.items.forEach((item) => {
    doc
      .fontSize(10)
      .text(`${item.productNameSnapshot} x${item.quantity}`, { continued: true })
      .text(formatCurrency(item.priceCents, invoice.currency), {
        align: "right",
      })
      .text(`Total ligne : ${formatCurrency(item.lineTotal, invoice.currency)}`)
      .moveDown(0.2);
  });

  doc.moveDown(0.5);
  if (invoice.order.promoCode) {
    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Remise ${invoice.order.promoCode.code} appliquée : -${formatCurrency(invoice.order.discountAmount || 0, invoice.currency)}`)
      .fillColor("black")
      .moveDown(0.5);
  }

  // Totals
  doc
    .fontSize(12)
    .text(`Total HT : ${formatCurrency(invoice.totalHT, invoice.currency)}`)
    .text(`TVA : ${formatCurrency(invoice.totalTVA, invoice.currency)}`)
    .text(`Total TTC : ${formatCurrency(invoice.totalTTC, invoice.currency)}`)
    .moveDown(1);

  if (invoice.sellerVatMention) {
    doc.fontSize(10).text(invoice.sellerVatMention);
  }

  if (invoice.sellerInvoiceFooterText) {
    doc.moveDown(1).fontSize(9).fillColor("gray").text(invoice.sellerInvoiceFooterText);
  }

  doc.end();

  await new Promise<void>((resolve) => writeStream.on("finish", () => resolve()));

  if (invoice.pdfPath !== pdfPath) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfPath },
    });
  }

  return { ...invoice, pdfPath };
}
