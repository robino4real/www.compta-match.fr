import { EmailTemplate } from "@prisma/client";
import { prisma } from "../config/prisma";

export const TEMPLATE_PLACEHOLDERS: Record<string, string[]> = {
  ORDER_CONFIRMATION: [
    "{{customerName}}",
    "{{customerEmail}}",
    "{{orderNumber}}",
    "{{orderDate}}",
    "{{orderTotal}}",
    "{{orderCurrency}}",
    "{{orderSummaryHtml}}",
    "{{accountOrdersUrl}}",
  ],
  DOWNLOAD_LINK: [
    "{{customerName}}",
    "{{productName}}",
    "{{downloadUrl}}",
    "{{linkExpiryInfo}}",
  ],
  DOWNLOAD_LINK_REGEN: [
    "{{customerName}}",
    "{{productName}}",
    "{{downloadUrl}}",
    "{{linkExpiryInfo}}",
  ],
  INVOICE_AVAILABLE: [
    "{{customerName}}",
    "{{invoiceNumber}}",
    "{{invoiceDate}}",
    "{{invoiceDownloadUrl}}",
    "{{orderNumber}}",
  ],
  ADMIN_LOGIN_OTP: ["{{code}}", "{{expiresAt}}"],
};

const DEFAULT_TEMPLATES: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">[]
  = [
    {
      key: "ORDER_CONFIRMATION",
      name: "Confirmation de commande",
      description:
        "Envoyé après un paiement réussi avec le récapitulatif et les accès.",
      subject: "Votre commande {{orderNumber}} sur ComptaMatch",
      bodyHtml:
        "<p>Bonjour {{customerName}},</p>" +
        "<p>Nous confirmons la réception de votre commande {{orderNumber}} du {{orderDate}}." +
        " Vous trouverez ci-dessous le récapitulatif :</p>" +
        "<div>{{orderSummaryHtml}}</div>" +
        "<p>Montant total réglé : <strong>{{orderTotal}} {{orderCurrency}}</strong></p>" +
        "<p>Retrouvez vos commandes et factures sur votre espace client : <a href='{{accountOrdersUrl}}'>Mes commandes & factures</a>.</p>" +
        "<p>Merci pour votre confiance.</p>",
      bodyText:
        "Bonjour {{customerName}},\n" +
        "Votre commande {{orderNumber}} du {{orderDate}} est confirmée.\n" +
        "Montant total : {{orderTotal}} {{orderCurrency}}.\n" +
        "Accédez à vos achats : {{accountOrdersUrl}}\n\n" +
        "Merci pour votre confiance.",
      isActive: true,
    },
    {
      key: "DOWNLOAD_LINK",
      name: "Lien de téléchargement",
      description: "Contient le lien unique pour télécharger le produit acheté.",
      subject: "Votre lien de téléchargement pour {{productName}}",
      bodyHtml:
        "<p>Bonjour {{customerName}},</p>" +
        "<p>Voici votre lien de téléchargement pour <strong>{{productName}}</strong> :</p>" +
        "<p><a href='{{downloadUrl}}'>Télécharger maintenant</a></p>" +
        "<p>{{linkExpiryInfo}}</p>",
      bodyText:
        "Bonjour {{customerName}},\n" +
        "Lien pour {{productName}} : {{downloadUrl}}\n" +
        "{{linkExpiryInfo}}",
      isActive: true,
    },
    {
      key: "DOWNLOAD_LINK_REGEN",
      name: "Lien de téléchargement régénéré",
      description: "Envoyé lorsqu'un nouvel accès de téléchargement est généré.",
      subject: "Nouveau lien de téléchargement pour {{productName}}",
      bodyHtml:
        "<p>Bonjour {{customerName}},</p>" +
        "<p>Un nouveau lien de téléchargement a été généré pour <strong>{{productName}}</strong>.</p>" +
        "<p><a href='{{downloadUrl}}'>Télécharger votre produit</a></p>" +
        "<p>{{linkExpiryInfo}}</p>",
      bodyText:
        "Bonjour {{customerName}},\n" +
        "Nouveau lien pour {{productName}} : {{downloadUrl}}\n" +
        "{{linkExpiryInfo}}",
      isActive: true,
    },
    {
      key: "INVOICE_AVAILABLE",
      name: "Facture disponible",
      description:
        "Notification lorsqu'une facture PDF peut être téléchargée par le client.",
      subject: "Votre facture {{invoiceNumber}} est disponible",
      bodyHtml:
        "<p>Bonjour {{customerName}},</p>" +
        "<p>Votre facture {{invoiceNumber}} datée du {{invoiceDate}} est prête.</p>" +
        "<p>Téléchargez-la ici : <a href='{{invoiceDownloadUrl}}'>Télécharger la facture</a>.</p>" +
        "<p>Commande associée : {{orderNumber}}</p>",
      bodyText:
        "Bonjour {{customerName}},\n" +
        "Votre facture {{invoiceNumber}} ({{invoiceDate}}) est disponible.\n" +
        "Téléchargement : {{invoiceDownloadUrl}}\n" +
        "Commande : {{orderNumber}}",
      isActive: true,
    },
    {
      key: "ADMIN_LOGIN_OTP",
      name: "Code de connexion administrateur (2FA)",
      description:
        "Envoyé après un login admin pour valider la double authentification.",
      subject: "Code de connexion administrateur ComptaMatch : {{code}}",
      bodyHtml:
        "<p>Bonjour,</p>" +
        "<p>Voici votre code de connexion administrateur ComptaMatch : <strong>{{code}}</strong>.</p>" +
        "<p>Ce code est valable pendant 10 minutes.</p>" +
        "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>",
      bodyText:
        "Bonjour,\n" +
        "Votre code de connexion administrateur ComptaMatch est : {{code}}.\n" +
        "Ce code est valable pendant 10 minutes.\n" +
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
      isActive: true,
    },
  ];

export function getTemplatePlaceholders(key: string): string[] {
  return TEMPLATE_PLACEHOLDERS[key] || [];
}

export async function ensureDefaultEmailTemplates(): Promise<void> {
  for (const template of DEFAULT_TEMPLATES) {
    const existing = await prisma.emailTemplate.findUnique({
      where: { key: template.key },
    });

    if (!existing) {
      await prisma.emailTemplate.create({
        data: template,
      });
    }
  }
}

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  await ensureDefaultEmailTemplates();
  return prisma.emailTemplate.findMany({ orderBy: { key: "asc" } });
}

export async function getEmailTemplateById(
  id: string
): Promise<EmailTemplate | null> {
  await ensureDefaultEmailTemplates();
  return prisma.emailTemplate.findUnique({ where: { id } });
}

export async function getEmailTemplateByKey(
  key: string
): Promise<EmailTemplate | null> {
  await ensureDefaultEmailTemplates();
  return prisma.emailTemplate.findUnique({ where: { key } });
}

export async function updateEmailTemplate(
  id: string,
  data: Partial<EmailTemplate>
): Promise<EmailTemplate> {
  await ensureDefaultEmailTemplates();
  const payload = { ...data };

  delete (payload as any).id;
  delete (payload as any).createdAt;
  delete (payload as any).updatedAt;
  delete (payload as any).key;

  return prisma.emailTemplate.update({
    where: { id },
    data: payload,
  });
}
