import { Request, Response } from "express";
import { NewsletterAutomationStatus, NewsletterAutomationTrigger } from "@prisma/client";
import { prisma } from "../config/prisma";
import { previewSegment, resolveSegmentSubscribers } from "../services/newsletter/segmentEngine";
import { processAutomationRuns, startAutomationWorker } from "../services/newsletter/automationEngine";

startAutomationWorker();

export async function listSegments(req: Request, res: Response) {
  const segments = await prisma.newsletterSegment.findMany({ orderBy: { createdAt: "desc" } });
  res.json(segments);
}

export async function createSegment(req: Request, res: Response) {
  const { name, description, rulesJson } = req.body;
  const segment = await prisma.newsletterSegment.create({
    data: { name, description, rulesJson: rulesJson || {} },
  });
  await resolveSegmentSubscribers(segment.id);
  res.status(201).json(segment);
}

export async function getSegment(req: Request, res: Response) {
  const segment = await prisma.newsletterSegment.findUnique({ where: { id: req.params.id } });
  if (!segment) return res.status(404).json({ message: "Segment introuvable" });
  res.json(segment);
}

export async function updateSegment(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, rulesJson } = req.body;
  const segment = await prisma.newsletterSegment.update({
    where: { id },
    data: { name, description, rulesJson },
  });
  await resolveSegmentSubscribers(segment.id);
  res.json(segment);
}

export async function deleteSegment(req: Request, res: Response) {
  await prisma.newsletterSegment.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function previewSegmentCount(req: Request, res: Response) {
  const count = await previewSegment(req.params.id);
  res.json({ count });
}

export async function listAutomations(req: Request, res: Response) {
  const automations = await prisma.newsletterAutomation.findMany({
    orderBy: { createdAt: "desc" },
    include: { steps: { orderBy: { stepOrder: "asc" } }, segment: true },
  });
  res.json(automations);
}

export async function createAutomation(req: Request, res: Response) {
  const { name, trigger, triggerConfig, segmentId, steps } = req.body;
  const automation = await prisma.newsletterAutomation.create({
    data: {
      name,
      trigger,
      triggerConfig,
      segmentId: segmentId || null,
      steps: {
        create: (steps || []).map((step: any, idx: number) => ({
          stepOrder: step.stepOrder ?? idx,
          type: step.type || "EMAIL",
          templateId: step.templateId,
          delayMinutes: step.delayMinutes || 0,
          conditionsJson: step.conditionsJson || null,
          exitOnEvent: step.exitOnEvent || null,
        })),
      },
    },
    include: { steps: true },
  });
  res.status(201).json(automation);
}

export async function getAutomation(req: Request, res: Response) {
  const automation = await prisma.newsletterAutomation.findUnique({
    where: { id: req.params.id },
    include: { steps: { orderBy: { stepOrder: "asc" } }, segment: true },
  });
  if (!automation) return res.status(404).json({ message: "Automation introuvable" });
  res.json(automation);
}

export async function updateAutomation(req: Request, res: Response) {
  const { id } = req.params;
  const { name, trigger, triggerConfig, segmentId, steps } = req.body;
  const automation = await prisma.newsletterAutomation.update({
    where: { id },
    data: { name, trigger, triggerConfig, segmentId: segmentId || null },
  });
  if (steps) {
    await prisma.newsletterAutomationStep.deleteMany({ where: { automationId: id } });
    await prisma.newsletterAutomationStep.createMany({
      data: steps.map((step: any, idx: number) => ({
        automationId: id,
        stepOrder: step.stepOrder ?? idx,
        type: step.type || "EMAIL",
        templateId: step.templateId,
        delayMinutes: step.delayMinutes || 0,
        conditionsJson: step.conditionsJson || null,
        exitOnEvent: step.exitOnEvent || null,
      })),
    });
  }
  res.json(automation);
}

export async function activateAutomation(req: Request, res: Response) {
  const automation = await prisma.newsletterAutomation.update({
    where: { id: req.params.id },
    data: { status: NewsletterAutomationStatus.ACTIVE },
  });
  res.json(automation);
}

export async function pauseAutomation(req: Request, res: Response) {
  const automation = await prisma.newsletterAutomation.update({
    where: { id: req.params.id },
    data: { status: NewsletterAutomationStatus.PAUSED },
  });
  res.json(automation);
}

export async function listAutomationRuns(req: Request, res: Response) {
  const runs = await prisma.newsletterAutomationRun.findMany({
    where: { automationId: req.params.id },
    orderBy: { startedAt: "desc" },
    include: { subscriber: true },
  });
  res.json(runs);
}

export async function analyticsOverview(req: Request, res: Response) {
  const sentCount = await prisma.newsletterSendLog.count({});
  const opens = await prisma.newsletterSendLog.count({ where: { status: "OPENED" } });
  const clicks = await prisma.newsletterSendLog.count({ where: { status: "CLICKED" } });
  const revenueAgg = await prisma.newsletterRevenueAttribution.aggregate({ _sum: { revenue: true } });
  res.json({ sentCount, opens, clicks, revenue: revenueAgg._sum.revenue || 0 });
}

export async function analyticsCampaigns(req: Request, res: Response) {
  const attributions = await prisma.newsletterRevenueAttribution.groupBy({
    by: ["campaignId"],
    _sum: { revenue: true },
  });
  const campaigns = await prisma.newsletterCampaign.findMany({});
  const map = campaigns.reduce<Record<string, string>>((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});
  res.json(
    attributions.map((row) => ({
      campaignId: row.campaignId,
      campaignName: map[row.campaignId] || row.campaignId,
      revenue: row._sum.revenue || 0,
    }))
  );
}

export async function analyticsSegments(req: Request, res: Response) {
  const segments = await prisma.newsletterSegment.findMany({});
  const response = [] as Array<{ segmentId: string; name: string; size: number }>;
  for (const segment of segments) {
    const size = await prisma.newsletterSegmentCache.count({ where: { segmentId: segment.id } });
    response.push({ segmentId: segment.id, name: segment.name, size });
  }
  res.json(response);
}

export async function analyticsCohorts(req: Request, res: Response) {
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const clicks = await prisma.newsletterSendLog.count({ where: { clickedAt: { gte: lastWeek } } });
  const opens = await prisma.newsletterSendLog.count({ where: { openedAt: { gte: lastWeek } } });
  res.json({ window: "7d", opens, clicks });
}

export async function forceAutomationTick(req: Request, res: Response) {
  await processAutomationRuns();
  res.json({ ok: true });
}

export const automationTriggers = Object.values(NewsletterAutomationTrigger);
