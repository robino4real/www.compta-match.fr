import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { prisma } from "../config/prisma";

const primaryColor = "#111827";
const accentColor = "#1f2937";
const lightGray = "#f8fafc";
const mediumGray = "#6b7280";
const subtleBorder = "#e5e7eb";

const pageMargin = 56.7; // 20mm

function formatCurrency(amount: number, currency = "EUR"): string {
  return `${(amount / 100).toFixed(2)} ${currency}`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR");
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

  const doc = new PDFDocument({ size: "A4", margin: pageMargin });
  const writeStream = fs.createWriteStream(absolutePath);
  doc.pipe(writeStream);

  let currentPage = 1;

  const addFooter = () => {
    const footerY = doc.page.height - pageMargin + 10;
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .text("Facture générée automatiquement", doc.page.margins.left, footerY, {
        width: doc.page.width - pageMargin * 2,
      })
      .text(`Page ${currentPage}`, doc.page.margins.left, footerY + 14, {
        align: "right",
        width: doc.page.width - pageMargin * 2,
      })
      .fillColor(primaryColor);
  };

  const goToNextPageWithHeader = () => {
    addFooter();
    doc.addPage({ size: "A4", margin: pageMargin });
    currentPage += 1;
    drawHeader();
  };

  const drawHeader = () => {
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;
    const startY = doc.page.margins.top;
    const logoMaxWidth = 140;
    const logoMaxHeight = 50;
    const spacing = 18;

    if (invoice.sellerLogoUrl) {
      try {
        doc.image(invoice.sellerLogoUrl, startX, startY, {
          fit: [logoMaxWidth, logoMaxHeight],
          valign: "top",
        });
      } catch (e) {
        console.warn("Logo introuvable pour la facture", invoice.id);
      }
    }

    const sellerInfoX = startX + logoMaxWidth + 16;
    const sellerInfoWidth = contentWidth - logoMaxWidth - 16;
    const sellerLines = [
      invoice.sellerName,
      invoice.sellerLegalForm,
      invoice.sellerAddress,
      [invoice.sellerPostalCode, invoice.sellerCity].filter(Boolean).join(" "),
      invoice.sellerCountry,
      invoice.sellerContactEmail,
      invoice.sellerWebsiteUrl,
      invoice.sellerSiret ? `SIRET : ${invoice.sellerSiret}` : "",
      invoice.sellerSiren ? `SIREN : ${invoice.sellerSiren}` : "",
      invoice.sellerVatNumber ? `TVA : ${invoice.sellerVatNumber}` : "",
      invoice.sellerRcsCity ? `RCS : ${invoice.sellerRcsCity}` : "",
      invoice.sellerCapital || "",
    ].filter(Boolean);

    doc
      .fontSize(12)
      .fillColor(primaryColor)
      .text(sellerLines.join("\n"), sellerInfoX, startY, {
        width: sellerInfoWidth,
        align: "right",
      });

    const sellerInfoHeight = doc.heightOfString(sellerLines.join("\n"), {
      width: sellerInfoWidth,
      align: "right",
    });
    const headerHeight = Math.max(logoMaxHeight, sellerInfoHeight);

    doc
      .moveTo(startX, startY + headerHeight + 8)
      .lineTo(startX + contentWidth, startY + headerHeight + 8)
      .lineWidth(1)
      .strokeColor(subtleBorder)
      .stroke();

    doc
      .fontSize(16)
      .fillColor(primaryColor)
      .text("Facture", startX, startY + headerHeight + spacing, {
        width: contentWidth,
        align: "right",
        characterSpacing: 0.2,
      })
      .fontSize(10)
      .fillColor(mediumGray)
      .text(`N° ${invoice.invoiceNumber}`, startX, doc.y + 4, {
        width: contentWidth,
        align: "right",
      })
      .text(`Émise le ${formatDate(invoice.issueDate)}`, startX, doc.y + 2, {
        width: contentWidth,
        align: "right",
      })
      .fillColor(primaryColor);

    doc.y = startY + headerHeight + spacing + 24;
  };

  const drawInfoColumns = () => {
    const startX = doc.page.margins.left;
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnWidth = contentWidth / 2 - 10;
    const padding = 14;
    const startY = doc.y + 12;

    const clientLines = [invoice.billingName, invoice.billingEmail, invoice.billingAddress].filter(Boolean);

    const invoiceLines = [
      `Facture n° ${invoice.invoiceNumber}`,
      `Date d'émission : ${formatDate(invoice.issueDate)}`,
      invoice.order?.orderNumber ? `Référence commande : ${invoice.order.orderNumber}` : "",
      invoice.sellerVatRegime ? `TVA : ${invoice.sellerVatRegime}` : "",
    ].filter(Boolean);

    const leftHeight =
      doc.heightOfString(["Client", "", ...clientLines].join("\n"), { width: columnWidth - padding * 2 }) +
      padding * 2;
    const rightHeight =
      doc.heightOfString(["Facturation", "", ...invoiceLines].join("\n"), { width: columnWidth - padding * 2 }) +
      padding * 2;
    const boxHeight = Math.max(leftHeight, rightHeight);

    doc
      .lineWidth(1)
      .strokeColor(subtleBorder)
      .roundedRect(startX, startY, contentWidth / 2 - 6, boxHeight, 8)
      .fillAndStroke(lightGray, subtleBorder);

    doc
      .roundedRect(startX + contentWidth / 2 + 6, startY, contentWidth / 2 - 6, boxHeight, 8)
      .fillAndStroke(lightGray, subtleBorder);

    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .text("Client", startX + padding, startY + padding)
      .fontSize(10)
      .fillColor(primaryColor)
      .text(clientLines.join("\n"), startX + padding, doc.y + 4, {
        width: columnWidth - padding * 2,
      });

    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .text("Facturation", startX + contentWidth / 2 + padding + 6, startY + padding)
      .fontSize(10)
      .fillColor(primaryColor)
      .text(invoiceLines.join("\n"), startX + contentWidth / 2 + padding + 6, doc.y + 4, {
        width: columnWidth - padding * 2,
      });

    doc.y = startY + boxHeight + 16;
  };

  const drawItemsTable = () => {
    const startX = doc.page.margins.left;
    let y = doc.y + 14;
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnWidths = [
      contentWidth * 0.48,
      contentWidth * 0.14,
      contentWidth * 0.18,
      contentWidth * 0.2,
    ];
    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const rowPadding = 12;

    const drawHeaderRow = () => {
      doc
        .fillColor(primaryColor)
        .rect(startX, y, tableWidth, 28)
        .fill(subtleBorder)
        .fontSize(10)
        .fillColor(primaryColor)
        .text("Désignation", startX + rowPadding, y + 9, { width: columnWidths[0] - rowPadding * 2 })
        .text("Quantité", startX + columnWidths[0] + rowPadding, y + 9, {
          width: columnWidths[1] - rowPadding * 2,
          align: "right",
        })
        .text("Prix unitaire HT", startX + columnWidths[0] + columnWidths[1] + rowPadding, y + 9, {
          width: columnWidths[2] - rowPadding * 2,
          align: "right",
        })
        .text("Total HT", startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + rowPadding, y + 9, {
          width: columnWidths[3] - rowPadding * 2,
          align: "right",
        });
      y += 28;
      doc.fillColor(primaryColor).lineWidth(0.5).strokeColor(subtleBorder);
    };

    drawHeaderRow();

    invoice.order.items.forEach((item, index) => {
      const designationHeight = doc.heightOfString(item.productNameSnapshot || "", {
        width: columnWidths[0] - rowPadding * 2,
      });
      const rowHeight = Math.max(28, designationHeight + rowPadding);

      if (y + rowHeight > doc.page.height - 120) {
        goToNextPageWithHeader();
        y = doc.y + 14;
        drawHeaderRow();
      }

      const isEven = index % 2 === 0;
      if (isEven) {
        doc.rect(startX, y, tableWidth, rowHeight).fill(lightGray);
        doc.fillColor(primaryColor);
      }

      doc
        .fontSize(10)
        .text(item.productNameSnapshot || "", startX + rowPadding, y + 8, {
          width: columnWidths[0] - rowPadding * 2,
        })
        .text(String(item.quantity), startX + columnWidths[0] + rowPadding, y + 8, {
          width: columnWidths[1] - rowPadding * 2,
          align: "right",
        })
        .text(formatCurrency(item.priceCents, invoice.currency), startX + columnWidths[0] + columnWidths[1] + rowPadding, y + 8, {
          width: columnWidths[2] - rowPadding * 2,
          align: "right",
        })
        .text(formatCurrency(item.lineTotal, invoice.currency),
          startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + rowPadding,
          y + 8,
          {
            width: columnWidths[3] - rowPadding * 2,
            align: "right",
          }
        );

      y += rowHeight;
    });

    doc.moveDown(1.5);

    if (invoice.order.promoCode) {
      doc
        .fontSize(10)
        .fillColor(mediumGray)
        .text(
          `Remise ${invoice.order.promoCode.code} appliquée : -${formatCurrency(invoice.order.discountAmount || 0, invoice.currency)}`,
          startX,
          y + 6
        )
        .fillColor(primaryColor)
        .moveDown(1);
    }
  };

  const drawTotals = () => {
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const valueWidth = 120;
    const labelWidth = 190;
    const startX = doc.page.margins.left + contentWidth - (labelWidth + valueWidth);
    let y = doc.y + 8;
    const rowHeight = 28;

    const rows = [
      { label: "Sous-total", value: formatCurrency(invoice.totalHT, invoice.currency) },
      { label: "TVA", value: formatCurrency(invoice.totalTVA, invoice.currency) },
      {
        label: "Total TTC",
        value: formatCurrency(invoice.totalTTC, invoice.currency),
        highlight: true,
      },
    ];

      rows.forEach((row) => {
        if (y + rowHeight > doc.page.height - 120) {
          goToNextPageWithHeader();
          y = doc.y + 8;
        }

      if (row.highlight) {
        doc
          .roundedRect(startX, y, labelWidth + valueWidth, rowHeight, 6)
          .fill(accentColor)
          .fillColor("white");
      } else {
        doc
          .roundedRect(startX, y, labelWidth + valueWidth, rowHeight, 6)
          .strokeColor(subtleBorder)
          .lineWidth(1)
          .stroke();
      }

      doc
        .fontSize(row.highlight ? 12 : 11)
        .fillColor(row.highlight ? "white" : primaryColor)
        .text(row.label, startX + 12, y + 8, { width: labelWidth - 24 })
        .text(row.value, startX + labelWidth, y + 8, {
          width: valueWidth - 24,
          align: "right",
        });

      if (!row.highlight) {
        doc.fillColor(primaryColor);
      }

      y += rowHeight + 6;
    });

    if (invoice.sellerVatMention) {
      doc.moveDown(0.8).fontSize(9).fillColor(mediumGray).text(invoice.sellerVatMention);
      doc.fillColor(primaryColor);
    }
  };

  drawHeader();
  drawInfoColumns();
  drawItemsTable();
  drawTotals();

  if (invoice.sellerInvoiceFooterText) {
    doc.moveDown(1).fontSize(9).fillColor(mediumGray).text(invoice.sellerInvoiceFooterText);
    doc.fillColor(primaryColor);
  }

  addFooter();

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
