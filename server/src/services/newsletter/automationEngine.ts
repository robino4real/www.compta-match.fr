import {
  CustomerActivityEventType,
  NewsletterAutomationRunStatus,
  NewsletterAutomationStatus,
  NewsletterAutomationTrigger,
  NewsletterSubscriberStatus,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { sendEmail } from "../mailer";
import {
  buildContextForSubscriber,
  evaluateRulesForContext,
  resolveSegmentSubscribers,
} from "./segmentEngine";

interface AutomationEventPayload {
  userId?: string | null;
  email?: string | null;
  meta?: Record<string, any>;
}

function triggerFromEvent(event: CustomerActivityEventType): NewsletterAutomationTrigger | null {
  switch (event) {
    case CustomerActivityEventType.USER_REGISTERED:
      return NewsletterAutomationTrigger.USER_REGISTERED;
    case CustomerActivityEventType.ORDER_PAID:
      return NewsletterAutomationTrigger.ORDER_PAID;
    case CustomerActivityEventType.USER_LOGIN:
      return NewsletterAutomationTrigger.NO_LOGIN_X_DAYS; // handled by inactivity worker but keep mapping
    case CustomerActivityEventType.DOWNLOAD_USED:
      return NewsletterAutomationTrigger.DOWNLOAD_NOT_USED; // inverse trigger handled separately
    default:
      return null;
  }
}

async function ensureSubscriber(email: string, userId?: string | null) {
  const normalized = email.toLowerCase();
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: normalized } });
  if (existing) return existing;
  return prisma.newsletterSubscriber.create({
    data: {
      email: normalized,
      status: NewsletterSubscriberStatus.ACTIVE,
      source: "ACCOUNT",
      consentAt: new Date(),
      consentSource: "automation",
      userId: userId || undefined,
    },
  });
}

async function startAutomationRun(automationId: string, subscriberId: string) {
  const existingRun = await prisma.newsletterAutomationRun.findFirst({
    where: { automationId, subscriberId, status: NewsletterAutomationRunStatus.RUNNING },
  });
  if (existingRun) return existingRun;
  return prisma.newsletterAutomationRun.create({
    data: {
      automationId,
      subscriberId,
      currentStep: 0,
      startedAt: new Date(),
      stepStartedAt: new Date(),
    },
  });
}

async function sendAutomationStep(runId: string) {
  const run = await prisma.newsletterAutomationRun.findUnique({
    where: { id: runId },
    include: {
      automation: { include: { steps: { orderBy: { stepOrder: "asc" } }, segment: true } },
      subscriber: true,
    },
  });
  if (!run || run.status !== NewsletterAutomationRunStatus.RUNNING) return;
  const step = run.automation.steps[run.currentStep];
  if (!step) {
    await prisma.newsletterAutomationRun.update({
      where: { id: run.id },
      data: { status: NewsletterAutomationRunStatus.COMPLETED, finishedAt: new Date() },
    });
    return;
  }

  // Respect audience restriction
  if (run.automation.segmentId) {
    const segmentIds = await resolveSegmentSubscribers(run.automation.segmentId);
    if (!segmentIds.includes(run.subscriberId)) {
      await prisma.newsletterAutomationRun.update({
        where: { id: run.id },
        data: { status: NewsletterAutomationRunStatus.CANCELLED, finishedAt: new Date() },
      });
      return;
    }
  }

  const readyAt = new Date(run.stepStartedAt.getTime() + step.delayMinutes * 60 * 1000);
  if (readyAt > new Date()) return;

  const template = await prisma.newsletterTemplate.findUnique({ where: { id: step.templateId } });
  if (!template) {
    await prisma.newsletterAutomationRun.update({
      where: { id: run.id },
      data: { status: NewsletterAutomationRunStatus.CANCELLED, finishedAt: new Date() },
    });
    return;
  }

  // Optional conditions on step
  if (step.conditionsJson) {
    const ctx = await buildContextForSubscriber(run.subscriber);
    const matches = evaluateRulesForContext(step.conditionsJson as any, ctx);
    if (!matches) {
      await prisma.newsletterAutomationRun.update({
        where: { id: run.id },
        data: { status: NewsletterAutomationRunStatus.CANCELLED, finishedAt: new Date() },
      });
      return;
    }
  }

  await sendEmail({
    to: run.subscriber.email,
    subject: template.subjectDefault,
    html: template.html,
  });

  const nextStepIndex = run.currentStep + 1;
  const hasNext = run.automation.steps[nextStepIndex];
  await prisma.newsletterAutomationRun.update({
    where: { id: run.id },
    data: {
      currentStep: nextStepIndex,
      stepStartedAt: new Date(),
      status: hasNext ? NewsletterAutomationRunStatus.RUNNING : NewsletterAutomationRunStatus.COMPLETED,
      finishedAt: hasNext ? null : new Date(),
    },
  });
}

export async function handleAutomationEvent(event: CustomerActivityEventType, payload: AutomationEventPayload) {
  const trigger = triggerFromEvent(event);
  if (!trigger) return;
  const email = (payload.email || "").toLowerCase();
  if (!email) return;
  const subscriber = await ensureSubscriber(email, payload.userId);

  const automations = await prisma.newsletterAutomation.findMany({
    where: { status: NewsletterAutomationStatus.ACTIVE, trigger },
  });

  for (const automation of automations) {
    if (automation.segmentId) {
      const allowed = await resolveSegmentSubscribers(automation.segmentId);
      if (!allowed.includes(subscriber.id)) continue;
    }
    await startAutomationRun(automation.id, subscriber.id);
  }
}

async function processInactivityAutomations() {
  const automations = await prisma.newsletterAutomation.findMany({
    where: { status: NewsletterAutomationStatus.ACTIVE, trigger: { in: ["NO_LOGIN_X_DAYS", "NO_ORDER_X_DAYS", "DOWNLOAD_NOT_USED"] } },
  });
  if (!automations.length) return;
  const subscribers = await prisma.newsletterSubscriber.findMany({});
  for (const automation of automations) {
    const days = Number((automation.triggerConfig as any)?.days || 7);
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    for (const subscriber of subscribers) {
      const metrics = subscriber.userId
        ? await prisma.customerMetrics.findUnique({ where: { userId: subscriber.userId } })
        : null;
      if (!metrics) continue;
      if (
        automation.trigger === "NO_LOGIN_X_DAYS" &&
        (!metrics.lastLoginAt || metrics.lastLoginAt < threshold)
      ) {
        await startAutomationRun(automation.id, subscriber.id);
      }
      if (
        automation.trigger === "NO_ORDER_X_DAYS" &&
        (!metrics.lastOrderAt || metrics.lastOrderAt < threshold)
      ) {
        await startAutomationRun(automation.id, subscriber.id);
      }
      if (
        automation.trigger === "DOWNLOAD_NOT_USED" &&
        (!metrics.lastActivityAt || metrics.lastActivityAt < threshold)
      ) {
        await startAutomationRun(automation.id, subscriber.id);
      }
    }
  }
}

export async function processAutomationRuns() {
  const runs = await prisma.newsletterAutomationRun.findMany({ where: { status: NewsletterAutomationRunStatus.RUNNING } });
  for (const run of runs) {
    await sendAutomationStep(run.id);
  }
  await processInactivityAutomations();
}

export function startAutomationWorker() {
  setInterval(() => {
    void processAutomationRuns();
  }, 30000);
}
