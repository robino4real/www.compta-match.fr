import { Router } from "express";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { attachUserToRequest, AuthenticatedRequest } from "../middleware/authMiddleware";

type RateLimitBucket = { count: number; windowStart: number };

const rateLimitWindowMs = 60 * 1000;
const rateLimitMaxEvents = 50;
const rateLimitBuckets = new Map<string, RateLimitBucket>();

const allowedEventTypes = new Set([
  "PAGE_VIEW",
  "CLICK",
  "PRODUCT_VIEW",
  "ADD_TO_CART",
  "CHECKOUT_START",
]);

function isRateLimited(key: string) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || now - bucket.windowStart > rateLimitWindowMs) {
    rateLimitBuckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);
  return bucket.count > rateLimitMaxEvents;
}

const router = Router();

router.post("/track", attachUserToRequest, async (req: AuthenticatedRequest, res) => {
  try {
    if (!env.trackingEnabled) {
      return res.status(503).json({ message: "Tracking désactivé." });
    }

    const clientIp = (req.headers["x-forwarded-for"] as string) || req.ip || "unknown";
    if (isRateLimited(clientIp)) {
      return res.status(429).json({ message: "Trop d'événements. Réessayer plus tard." });
    }

    const { type, page, metadata, sessionId } = req.body || {};

    if (!type || typeof type !== "string" || !allowedEventTypes.has(type.toUpperCase())) {
      return res.status(400).json({ message: "Type d'événement invalide." });
    }

    const resolvedSessionId = typeof sessionId === "string" && sessionId.trim()
      ? sessionId.trim().slice(0, 128)
      : `anon-${clientIp}`;

    await prisma.userEvent.create({
      data: {
        eventType: type.toUpperCase(),
        page: typeof page === "string" ? page.slice(0, 500) : null,
        metadata: metadata ?? null,
        sessionId: resolvedSessionId,
        userId: req.user?.id,
      },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'événement analytics", error);
    return res
      .status(500)
      .json({ message: "Impossible d'enregistrer l'événement analytics." });
  }
});

export default router;
