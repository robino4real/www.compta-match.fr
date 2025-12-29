import { Request, Response } from "express";
import { NewsletterCampaignStatus, NewsletterSendLogStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  resolveAudience,
  sendCampaignNow,
  startNewsletterWorker,
  trackClick,
  trackOpen,
  unsubscribe,
} from "../services/newsletterCampaignService";
import { redactEmailSettings, upsertEmailSettings } from "../services/emailSettingsService";
import { toInputJson } from "../services/newsletter/json";

startNewsletterWorker();

export async function listTemplates(req: Request, res: Response) {
  const templates = await prisma.newsletterTemplate.findMany({ orderBy: { createdAt: "desc" } });
  res.json(templates);
}

export async function createTemplate(req: Request, res: Response) {
  const { name, subjectDefault, previewTextDefault, html, designJson } = req.body;
  const template = await prisma.newsletterTemplate.create({
    data: { name, subjectDefault, previewTextDefault, html, designJson },
  });
  res.status(201).json(template);
}

export async function getTemplate(req: Request, res: Response) {
  const template = await prisma.newsletterTemplate.findUnique({ where: { id: req.params.id } });
  if (!template) return res.status(404).json({ error: "Template introuvable" });
  res.json(template);
}

export async function updateTemplate(req: Request, res: Response) {
  const { id } = req.params;
  const { name, subjectDefault, previewTextDefault, html, designJson } = req.body;
  const template = await prisma.newsletterTemplate.update({
    where: { id },
    data: { name, subjectDefault, previewTextDefault, html, designJson },
  });
  res.json(template);
}

export async function duplicateTemplate(req: Request, res: Response) {
  const { id } = req.params;
  const template = await prisma.newsletterTemplate.findUnique({ where: { id } });
  if (!template) return res.status(404).json({ error: "Template introuvable" });
  const clone = await prisma.newsletterTemplate.create({
    data: {
      name: `${template.name} (copie)`,
      subjectDefault: template.subjectDefault,
      previewTextDefault: template.previewTextDefault,
      html: template.html,
      designJson: toInputJson(template.designJson),
    },
  });
  res.status(201).json(clone);
}

export async function deleteTemplate(req: Request, res: Response) {
  await prisma.newsletterTemplate.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function listCampaigns(req: Request, res: Response) {
  const { status, q } = req.query;
  const where: any = {};
  if (status) where.status = status as NewsletterCampaignStatus;
  if (q) where.name = { contains: q as string, mode: "insensitive" };
  const campaigns = await prisma.newsletterCampaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { template: true },
  });
  res.json(campaigns);
}

export async function createCampaign(req: Request, res: Response) {
  const { name, subject, previewText, templateId, html, audienceJson } = req.body;
  const campaign = await prisma.newsletterCampaign.create({
    data: {
      name,
      subject,
      previewText,
      templateId,
      htmlSnapshot: html || null,
      audienceJson: audienceJson || {},
      status: "DRAFT",
    },
  });
  res.status(201).json(campaign);
}

export async function getCampaign(req: Request, res: Response) {
  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: req.params.id },
    include: { template: true },
  });
  if (!campaign) return res.status(404).json({ error: "Campagne introuvable" });
  res.json(campaign);
}

export async function updateCampaign(req: Request, res: Response) {
  const { name, subject, previewText, templateId, html, audienceJson } = req.body;
  const campaign = await prisma.newsletterCampaign.update({
    where: { id: req.params.id },
    data: {
      name,
      subject,
      previewText,
      templateId,
      htmlSnapshot: html || null,
      audienceJson: audienceJson || {},
    },
  });
  res.json(campaign);
}

export async function scheduleCampaign(req: Request, res: Response) {
  const { scheduledAt } = req.body;
  const campaign = await prisma.newsletterCampaign.update({
    where: { id: req.params.id },
    data: { status: "SCHEDULED", scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date() },
  });
  res.json(campaign);
}

export async function sendCampaignNowHandler(req: Request, res: Response) {
  const { id } = req.params;
  await sendCampaignNow(id);
  res.json({ ok: true });
}

export async function cancelCampaign(req: Request, res: Response) {
  const campaign = await prisma.newsletterCampaign.update({
    where: { id: req.params.id },
    data: { status: "CANCELLED" },
  });
  res.json(campaign);
}

export async function getCampaignStats(req: Request, res: Response) {
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: req.params.id } });
  if (!campaign) return res.status(404).json({ error: "Campagne introuvable" });
  const counts = await prisma.newsletterSendLog.groupBy({
    by: ["status"],
    where: { campaignId: req.params.id },
    _count: { _all: true },
  });
  res.json({ campaign, counts });
}

export async function previewRecipients(req: Request, res: Response) {
  const { id } = req.params;
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!campaign) return res.status(404).json({ error: "Campagne introuvable" });
  const audience = (campaign.audienceJson as any) || {};
  const resolved = await resolveAudience(audience);
  res.json({ total: resolved.subscribers.length + resolved.manualEmails.length });
}

export async function getNewsletterSettings(req: Request, res: Response) {
  const settings = await prisma.emailSettings.findFirst();
  if (!settings) return res.json(null);
  res.json(redactEmailSettings(settings));
}

export async function updateNewsletterSettings(req: Request, res: Response) {
  const settings = await upsertEmailSettings(req.body);
  res.json(redactEmailSettings(settings));
}

export async function newsletterOpenPixel(req: Request, res: Response) {
  const { c: campaignId, l: logId, t: token } = req.query as Record<string, string>;
  if (!campaignId || !logId || !token) return res.status(400).end();
  const ok = await trackOpen(campaignId, logId, token);
  res.setHeader("Content-Type", "image/gif");
  const pixel = Buffer.from("R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==", "base64");
  res.status(ok ? 200 : 400).end(pixel, "binary");
}

export async function newsletterClickRedirect(req: Request, res: Response) {
  const { token, l: logId } = req.query as Record<string, string>;
  if (!token) return res.status(400).send("Token manquant");
  const target = await trackClick(token);
  if (logId) {
    await prisma.newsletterSendLog.updateMany({
      where: { id: logId },
      data: { status: NewsletterSendLogStatus.CLICKED, clickedAt: new Date() },
    });
  }
  if (!target) return res.status(404).send("Lien introuvable");
  res.redirect(target);
}

export async function newsletterUnsubscribe(req: Request, res: Response) {
  const { email, token } = req.query as Record<string, string>;
  if (!email || !token) return res.status(400).send("Paramètres manquants");
  const ok = await unsubscribe(email, token);
  res.status(ok ? 200 : 400).send(ok ? "Vous êtes désinscrit." : "Lien invalide");
}
