import { DownloadLink, Order, User } from "@prisma/client";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { sendEmail } from "./mailer";
import {
  ensureDefaultEmailTemplates,
  getEmailTemplateByKey,
  getTemplatePlaceholders,
} from "./emailTemplateService";
import { getOrCreateEmailSettings } from "./emailSettingsService";

function renderTemplateString(
  template: string,
  variables: Record<string, string | number | null | undefined>
): string {
  return template.replace(/{{\s*([^}\s]+)\s*}}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined && value !== null ? String(value) : "";
  });
}

function formatAmount(amountCents: number, currency: string) {
  return (amountCents / 100).toFixed(2) + ` ${currency}`;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildUserDisplayName(user: User) {
  const display = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return display || user.email;
}

function buildOrderSummaryHtml(order: Order & { items: any[]; currency: string }) {
  const lines = order.items.map((item) => {
    const line = `<strong>${item.productNameSnapshot}</strong> x${item.quantity} - ${formatAmount(
      item.lineTotal,
      order.currency
    )}`;
    const downloadLink = (item.downloadLinks as DownloadLink[] | undefined)?.[0];
    const downloadUrl = downloadLink
      ? `${env.apiBaseUrl}/downloads/${downloadLink.token}`
      : null;
    const downloadHtml = downloadUrl
      ? `<div><a href="${downloadUrl}">Télécharger</a> (lien unique)</div>`
      : "";

    return `<li>${line}${downloadHtml}</li>`;
  });

  return `<ul>${lines.join("")}</ul>`;
}

interface TransactionalEmailInput {
  to: string;
  templateKey: string;
  context: Record<string, string>;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string | null;
}

export async function sendTransactionalEmail({
  to,
  templateKey,
  context,
  fromEmail,
  fromName,
  replyTo,
}: TransactionalEmailInput): Promise<boolean> {
  await ensureDefaultEmailTemplates();
  const template = await getEmailTemplateByKey(templateKey);

  if (!template) {
    console.warn(`[transactionalEmails] Template introuvable pour ${templateKey}`);
    return false;
  }

  if (!template.isActive) {
    console.info(
      `[transactionalEmails] Template ${templateKey} désactivé, envoi ignoré.`
    );
    return false;
  }

  const settings = await getOrCreateEmailSettings();
  const resolvedFromEmail =
    fromEmail ||
    (templateKey === "ORDER_CONFIRMATION" && settings.ordersFromEmail
      ? settings.ordersFromEmail
      : null) ||
    settings.fromEmailDefault;
  const resolvedFromName = fromName || settings.fromNameDefault;

  if (!resolvedFromEmail) {
    console.warn("[transactionalEmails] Adresse d'expédition manquante.");
    return false;
  }

  const renderedSubject = renderTemplateString(template.subject, context);
  const renderedHtml = renderTemplateString(template.bodyHtml, context);
  const renderedText = template.bodyText
    ? renderTemplateString(template.bodyText, context)
    : undefined;

  return sendEmail({
    to,
    subject: renderedSubject,
    html: renderedHtml,
    text: renderedText,
    fromEmail: resolvedFromEmail,
    fromName: resolvedFromName,
    replyTo: replyTo ?? settings.replyToEmailDefault ?? null,
  });
}

export async function sendOrderConfirmationEmail(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      invoice: true,
      items: { include: { product: true, downloadLinks: true } },
    },
  });

  if (!order || !order.user) {
    console.warn(`[transactionalEmails] Commande introuvable pour l'envoi ${orderId}`);
    return false;
  }

  const orderNumber = order.invoice?.invoiceNumber || order.id;
  const orderDate = formatDate(order.paidAt || order.createdAt);
  const accountOrdersUrl = `${env.frontendBaseUrl}/mon-compte`;
  const orderSummaryHtml = buildOrderSummaryHtml(order as any);

  const context = {
    customerName: buildUserDisplayName(order.user),
    customerEmail: order.user.email,
    orderNumber,
    orderDate,
    orderTotal: (order.totalPaid / 100).toFixed(2),
    orderCurrency: order.currency,
    orderSummaryHtml,
    accountOrdersUrl,
  } as Record<string, string>;

  return sendTransactionalEmail({
    to: order.user.email,
    templateKey: "ORDER_CONFIRMATION",
    context,
  });
}

export async function sendDownloadLinkEmail(
  downloadLinkId: string
): Promise<boolean> {
  const link = await prisma.downloadLink.findUnique({
    where: { id: downloadLinkId },
    include: {
      orderItem: {
        include: {
          product: true,
          order: { include: { user: true } },
        },
      },
    },
  });

  if (!link || !link.orderItem?.order?.user) {
    console.warn(
      `[transactionalEmails] Lien ${downloadLinkId} introuvable pour notification.`
    );
    return false;
  }

  const user = link.orderItem.order.user;
  const productName =
    link.orderItem.product?.name || link.orderItem.productNameSnapshot;
  const downloadUrl = `${env.apiBaseUrl}/downloads/${link.token}`;

  return sendTransactionalEmail({
    to: user.email,
    templateKey: "DOWNLOAD_LINK",
    context: {
      customerName: buildUserDisplayName(user),
      productName,
      downloadUrl,
      linkExpiryInfo:
        "Ce lien est valable pour un téléchargement unique et expirera une heure après le premier clic.",
    },
  });
}

export async function sendDownloadLinkRegeneratedEmail(
  downloadLinkId: string
): Promise<boolean> {
  const link = await prisma.downloadLink.findUnique({
    where: { id: downloadLinkId },
    include: {
      orderItem: {
        include: {
          product: true,
          order: { include: { user: true } },
        },
      },
    },
  });

  if (!link || !link.orderItem?.order?.user) {
    console.warn(
      `[transactionalEmails] Lien ${downloadLinkId} introuvable pour notification de régénération.`
    );
    return false;
  }

  const user = link.orderItem.order.user;
  const productName =
    link.orderItem.product?.name || link.orderItem.productNameSnapshot;
  const downloadUrl = `${env.apiBaseUrl}/downloads/${link.token}`;

  return sendTransactionalEmail({
    to: user.email,
    templateKey: "DOWNLOAD_LINK_REGEN",
    context: {
      customerName: buildUserDisplayName(user),
      productName,
      downloadUrl,
      linkExpiryInfo:
        "Ce lien remplace le précédent. Il est valable pour un téléchargement unique et expirera une heure après le premier clic.",
    },
  });
}

export async function sendAdminLoginOtpEmail(
  code: string,
  toEmail: string,
  expiresAt?: Date
): Promise<boolean> {
  const settings = await getOrCreateEmailSettings();

  return sendTransactionalEmail({
    to: toEmail,
    templateKey: "ADMIN_LOGIN_OTP",
    context: {
      code,
      expiresAt: expiresAt ? expiresAt.toISOString() : "",
    },
    fromEmail: settings.technicalContactEmail || "admin-user@compta-match.fr",
    replyTo: settings.replyToEmailDefault || settings.supportEmail || null,
  });
}

export async function sendInvoiceAvailableEmail(
  invoiceId: string
): Promise<boolean> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { order: { include: { user: true } } },
  });

  if (!invoice || !invoice.order?.user) {
    console.warn(
      `[transactionalEmails] Facture ${invoiceId} introuvable pour notification.`
    );
    return false;
  }

  const downloadUrl = `${env.apiBaseUrl}/invoices/${invoice.id}/download`;

  return sendTransactionalEmail({
    to: invoice.order.user.email,
    templateKey: "INVOICE_AVAILABLE",
    context: {
      customerName: buildUserDisplayName(invoice.order.user),
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: formatDate(invoice.issueDate),
      invoiceDownloadUrl: downloadUrl,
      orderNumber: invoice.order.id,
    },
  });
}

export function listPlaceholdersForKey(key: string) {
  return getTemplatePlaceholders(key);
}
