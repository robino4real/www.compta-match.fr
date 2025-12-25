import { Router } from "express";
import { prisma } from "../config/prisma";
import { env } from "../config/env";

const router = Router();

router.get(["/", "/health"], async (_req, res) => {
  const status: any = {
    ok: true,
    database: "unknown",
    stripeKeyPresent: Boolean(env.stripeSecretKey),
    stripeWebhookConfigured: Boolean(env.stripeWebhookSecret),
    emailSettings: "unknown",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    status.database = "ok";
  } catch (error) {
    status.ok = false;
    status.database = "error";
    status.databaseError = (error as Error)?.message;
  }

  try {
    const emailSettings = await prisma.emailSettings.findFirst();
    status.emailSettings = emailSettings ? "ok" : "missing";
  } catch (error) {
    status.ok = false;
    status.emailSettings = "error";
    status.emailSettingsError = (error as Error)?.message;
  }

  res.json(status);
});

export default router;
