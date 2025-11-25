import { Order, User } from "@prisma/client";
import { prisma } from "../config/prisma";

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
  const invoiceNumber = await generateInvoiceNumber();
  const resolvedName = billingName || buildBillingName(user);
  const resolvedEmail = billingEmail || user.email;
  const issueDate = order.paidAt || new Date();

  const totals = {
    totalTTC: order.totalPaid,
    totalHT: order.totalPaid,
    totalTVA: 0,
  };

  const pdfPath = `/invoices/${invoiceNumber}.pdf`;

  return prisma.invoice.create({
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
      pdfPath,
    },
  });
}
