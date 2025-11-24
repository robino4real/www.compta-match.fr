import { Request, Response } from "express";
import { prisma } from "../config/prisma";

/**
 * Récupère les paramètres Stripe globaux.
 *
 * GET /admin/stripe-settings
 *
 * S'il n'existe aucune configuration en base, on crée une configuration
 * par défaut (mode test, EUR, sans clés publiques).
 */
export async function getStripeSettings(req: Request, res: Response) {
  try {
    let settings = await prisma.stripeSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.stripeSettings.create({
        data: {
          id: 1,
          useLiveMode: false,
          defaultCurrency: "EUR",
          testPublishableKey: null,
          livePublishableKey: null,
        },
      });
    }

    return res.status(200).json({ settings });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des paramètres Stripe :",
      error
    );
    return res.status(500).json({
      message: "Erreur lors de la récupération des paramètres Stripe.",
    });
  }
}

/**
 * Met à jour les paramètres Stripe globaux.
 *
 * PUT /admin/stripe-settings
 *
 * Body attendu (tous facultatifs) :
 * {
 *   "useLiveMode": boolean,
 *   "defaultCurrency": string,
 *   "testPublishableKey": string,
 *   "livePublishableKey": string
 * }
 */
export async function updateStripeSettings(req: Request, res: Response) {
  try {
    const {
      useLiveMode,
      defaultCurrency,
      testPublishableKey,
      livePublishableKey,
    } = req.body as {
      useLiveMode?: boolean;
      defaultCurrency?: string;
      testPublishableKey?: string | null;
      livePublishableKey?: string | null;
    };

    const data: any = {};

    if (typeof useLiveMode !== "undefined") {
      data.useLiveMode = Boolean(useLiveMode);
    }

    if (typeof defaultCurrency === "string" && defaultCurrency.trim().length > 0) {
      // On normalise en majuscules
      data.defaultCurrency = defaultCurrency.trim().toUpperCase();
    }

    if (typeof testPublishableKey !== "undefined") {
      data.testPublishableKey =
        testPublishableKey === null
          ? null
          : String(testPublishableKey).trim() || null;
    }

    if (typeof livePublishableKey !== "undefined") {
      data.livePublishableKey =
        livePublishableKey === null
          ? null
          : String(livePublishableKey).trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "Aucune donnée valide à mettre à jour.",
      });
    }

    const updated = await prisma.stripeSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        useLiveMode: typeof data.useLiveMode === "boolean" ? data.useLiveMode : false,
        defaultCurrency: data.defaultCurrency || "EUR",
        testPublishableKey:
          typeof data.testPublishableKey !== "undefined"
            ? data.testPublishableKey
            : null,
        livePublishableKey:
          typeof data.livePublishableKey !== "undefined"
            ? data.livePublishableKey
            : null,
      },
    });

    return res.status(200).json({ settings: updated });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour des paramètres Stripe :",
      error
    );
    return res.status(500).json({
      message: "Erreur lors de la mise à jour des paramètres Stripe.",
    });
  }
}
