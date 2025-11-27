import { Router } from "express";
import { prisma } from "../config/prisma";
import { attachUserToRequest } from "../middleware/authMiddleware";

const router = Router();

router.post("/track", attachUserToRequest, async (req, res) => {
  try {
    const { type, url, referrer, meta } = req.body || {};

    if (!type || typeof type !== "string") {
      return res.status(400).json({ message: "Le type d'événement est requis." });
    }

    await prisma.analyticsEvent.create({
      data: {
        type,
        url: typeof url === "string" ? url : null,
        referrer: typeof referrer === "string" ? referrer : null,
        meta: meta ?? null,
        userAgent:
          typeof req.headers["user-agent"] === "string"
            ? req.headers["user-agent"].slice(0, 500)
            : null,
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
