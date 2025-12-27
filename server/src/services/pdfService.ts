import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { prisma } from "../config/prisma";

const primaryColor = "#0f172a";
const accentColor = "#2563eb";
const lightGray = "#f3f4f6";
const mediumGray = "#6b7280";

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

  const doc = new PDFDocument({ margin: 40 });
  const writeStream = fs.createWriteStream(absolutePath);
  doc.pipe(writeStream);

  let currentPage = 1;

  const addFooter = () => {
    const footerY = doc.page.height - 60;
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .text("Facture générée automatiquement", 40, footerY, {
        width: doc.page.width - 80,
      })
      .text(`Page ${currentPage}`, 40, footerY + 14, {
        align: "right",
        width: doc.page.width - 80,
      })
      .fillColor(primaryColor);
  };

  const goToNextPageWithHeader = () => {
    addFooter();
    doc.addPage({ margin: 40 });
    currentPage += 1;
  };

  const drawHeader = () => {
    const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const headerTop = doc.y;

    if (invoice.sellerLogoUrl) {
      try {
        doc.image(invoice.sellerLogoUrl, doc.page.margins.left, headerTop, {
          fit: [140, 60],
        });
      } catch (e) {
        console.warn("Logo introuvable pour la facture", invoice.id);
      }
    }

    doc
      .fontSize(22)
      .fillColor(primaryColor)
      .text("FACTURE", doc.page.margins.left, headerTop, {
        align: "right",
        width: availableWidth,
      })
      .moveDown(0.2)
      .fontSize(11)
      .fillColor(mediumGray)
      .text(`N° ${invoice.invoiceNumber}`, doc.page.margins.left, doc.y, {
        align: "right",
        width: availableWidth,
      })
      .text(`Date : ${formatDate(invoice.issueDate)}`, doc.page.margins.left, doc.y, {
        align: "right",
        width: availableWidth,
      })
      .moveDown(1.5)
      .fillColor(primaryColor);
  };

  const drawInfoColumns = () => {
    const startY = doc.y;
    const columnWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right - 20) / 2;

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
      invoice.sellerRcsCity ? `RCS : ${invoice.sellerRcsCity}` : "",
      invoice.sellerVatNumber ? `TVA : ${invoice.sellerVatNumber}` : "",
      invoice.sellerCapital || "",
    ].filter(Boolean);

    const clientLines = [
      invoice.billingName,
      invoice.billingEmail,
      invoice.billingAddress,
    ].filter(Boolean);

    const boxY = startY;
    const boxHeight = Math.max(
      doc.heightOfString(sellerLines.join("\n"), { width: columnWidth }),
      doc.heightOfString(clientLines.join("\n"), { width: columnWidth })
    ) + 30;

    doc
      .roundedRect(doc.page.margins.left, boxY, columnWidth, boxHeight, 8)
      .fill(lightGray);
    doc
      .roundedRect(doc.page.margins.left + columnWidth + 20, boxY, columnWidth, boxHeight, 8)
      .fill(lightGray);

    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .text("Entreprise", doc.page.margins.left + 14, boxY + 12)
      .fontSize(10)
      .fillColor(primaryColor)
      .text(sellerLines.join("\n"), { width: columnWidth - 28 })
      .fontSize(12)
      .fillColor(primaryColor)
      .text("Client", doc.page.margins.left + columnWidth + 34, boxY + 12)
      .fontSize(10)
      .fillColor(primaryColor)
      .text(clientLines.join("\n"), doc.page.margins.left + columnWidth + 34, doc.y, {
        width: columnWidth - 28,
      });

    doc.moveDown(2);
  };

  const drawItemsTable = () => {
    const startX = doc.page.margins.left;
    let y = doc.y + 10;
    const columnWidths = [
      220,
      70,
      90,
      90,
    ];
    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const rowPadding = 10;

    const drawHeaderRow = () => {
      doc
        .fillColor("white")
        .rect(startX, y, tableWidth, 26)
        .fill(primaryColor)
        .fontSize(10)
        .text("Désignation", startX + rowPadding, y + 8, { width: columnWidths[0] - rowPadding })
        .text("Quantité", startX + columnWidths[0] + rowPadding, y + 8, {
          width: columnWidths[1] - rowPadding,
          align: "right",
        })
        .text("Prix unitaire", startX + columnWidths[0] + columnWidths[1] + rowPadding, y + 8, {
          width: columnWidths[2] - rowPadding,
          align: "right",
        })
        .text("Total", startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + rowPadding, y + 8, {
          width: columnWidths[3] - rowPadding,
          align: "right",
        });
      y += 26;
      doc.fillColor(primaryColor);
    };

    drawHeaderRow();

    invoice.order.items.forEach((item, index) => {
      const designationHeight = doc.heightOfString(item.productNameSnapshot || "", {
        width: columnWidths[0] - rowPadding * 2,
      });
      const rowHeight = Math.max(26, designationHeight + rowPadding);

      if (y + rowHeight > doc.page.height - 120) {
        goToNextPageWithHeader();
        doc.y = doc.page.margins.top;
        y = doc.y + 10;
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
    const startX = doc.page.margins.left + 190;
    let y = doc.y;
    const rowHeight = 26;
    const labelWidth = 180;
    const valueWidth = 120;

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
        doc.y = doc.page.margins.top;
        y = doc.y;
      }

      if (row.highlight) {
        doc
          .roundedRect(startX, y, labelWidth + valueWidth, rowHeight, 6)
          .fill(accentColor)
          .fillColor("white");
      }

      doc
        .fontSize(11)
        .text(row.label, startX + 10, y + 7, { width: labelWidth - 20 })
        .text(row.value, startX + labelWidth, y + 7, {
          width: valueWidth - 20,
          align: "right",
        });

      if (row.highlight) {
        doc.fillColor(primaryColor);
      }

      y += rowHeight + 4;
    });

    if (invoice.sellerVatMention) {
      doc.moveDown(0.5).fontSize(9).fillColor(mediumGray).text(invoice.sellerVatMention);
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
