import { EmailSettings } from "@prisma/client";
import { getOrCreateEmailSettings } from "./emailSettingsService";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string | null;
}

function buildTransport(settings: EmailSettings) {
  const nodemailer = loadNodemailer();
  if (!nodemailer) return null;

  if (
    settings.providerType === "SMTP" &&
    settings.smtpHost &&
    settings.smtpPort
  ) {
    return nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth:
        settings.smtpUsername || settings.smtpPassword
          ? {
              user: settings.smtpUsername || undefined,
              pass: settings.smtpPassword || undefined,
            }
          : undefined,
    });
  }

  if (settings.apiKey) {
    // TODO: intégrer un provider API (SendGrid, Resend...) si nécessaire
    console.warn(
      `[mailer] Provider ${settings.providerType} non implémenté, utilisation du transport JSON.`
    );
  } else {
    console.warn("[mailer] Aucune configuration SMTP/API détectée, email non envoyé.");
  }

  return nodemailer.createTransport({ jsonTransport: true });
}

function loadNodemailer(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("nodemailer");
  } catch (error) {
    console.warn(
      "[mailer] nodemailer indisponible dans l'environnement, envoi simulé."
    );
    return null;
  }
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const settings = await getOrCreateEmailSettings();

  const fromEmail = options.fromEmail || settings.fromEmailDefault;
  if (!fromEmail) {
    console.warn("[mailer] fromEmail absent, email ignoré.");
    return false;
  }

  const transport = buildTransport(settings);
  if (!transport) {
    console.warn("[mailer] Aucun transport disponible, email non envoyé.");
    return false;
  }
  const from = options.fromName
    ? `${options.fromName} <${fromEmail}>`
    : fromEmail;

  try {
    await transport.sendMail({
      to: options.to,
      from,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo ?? settings.replyToEmailDefault ?? undefined,
    });
    return true;
  } catch (error) {
    console.error("[mailer] Erreur lors de l'envoi de l'email", error);
    return false;
  }
}
