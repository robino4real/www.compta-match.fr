import { Request, Response } from "express";
import { DeliverabilityStatusEnum, NewsletterAlertSeverity, NewsletterAlertType } from "@prisma/client";
import { prisma } from "../config/prisma";

const DEFAULT_DOMAIN = process.env.NEWSLETTER_DOMAIN || "example.com";

export async function getDeliverabilityStatus(req: Request, res: Response) {
  const domain = (req.query.domain as string) || DEFAULT_DOMAIN;
  const status = await prisma.newsletterDeliverabilityStatus.findUnique({ where: { domain } });
  res.json(
    status || {
      domain,
      spfStatus: DeliverabilityStatusEnum.UNKNOWN,
      dkimStatus: DeliverabilityStatusEnum.UNKNOWN,
      dmarcStatus: DeliverabilityStatusEnum.UNKNOWN,
    }
  );
}

export async function updateDeliverabilityStatus(req: Request, res: Response) {
  const { domain = DEFAULT_DOMAIN, spfStatus, dkimStatus, dmarcStatus } = req.body;
  const data = {
    spfStatus: spfStatus || DeliverabilityStatusEnum.UNKNOWN,
    dkimStatus: dkimStatus || DeliverabilityStatusEnum.UNKNOWN,
    dmarcStatus: dmarcStatus || DeliverabilityStatusEnum.UNKNOWN,
    lastCheckedAt: new Date(),
  };
  const status = await prisma.newsletterDeliverabilityStatus.upsert({
    where: { domain },
    update: data,
    create: { domain, ...data },
  });
  res.json(status);
}

export async function listAlerts(req: Request, res: Response) {
  const alerts = await prisma.newsletterAlert.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  res.json(alerts);
}

export async function createAlert(type: NewsletterAlertType, message: string, severity: NewsletterAlertSeverity = NewsletterAlertSeverity.WARNING) {
  await prisma.newsletterAlert.create({ data: { type, severity, message } });
}
