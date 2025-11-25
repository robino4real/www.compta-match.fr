import { Request, Response } from "express";
import { prisma } from "../config/prisma";

interface PromoCodePayload {
  code?: string;
  description?: string;
  discountType?: "PERCENT" | "AMOUNT" | string;
  discountValue?: number;
  maxUses?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

/**
 * Liste tous les codes promo (admin).
 */
export async function listPromoCodes(req: Request, res: Response) {
  try {
    const promos = await prisma.promoCode.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ promos });
  } catch (error) {
    console.error("Erreur lors de la liste des codes promo :", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des codes promo.",
    });
  }
}

/**
 * Crée un nouveau code promo.
 *
 * Body attendu :
 * {
 *   "code": "COMPTA10",
 *   "description": "Réduction de lancement",
 *   "discountType": "PERCENT",
 *   "discountValue": 10,
 *   "maxUses": 100,
 *   "isActive": true,
 *   "startsAt": "2025-01-01T00:00:00.000Z",
 *   "endsAt": "2025-01-31T23:59:59.000Z"
 * }
 */
export async function createPromoCode(req: Request, res: Response) {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      isActive,
      startsAt,
      endsAt,
    } = req.body as PromoCodePayload;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res
        .status(400)
        .json({ message: "Le code promo (code) est obligatoire." });
    }

    const normalizedCode = code.trim().toUpperCase();

    if (!discountType || !["PERCENT", "AMOUNT"].includes(discountType)) {
      return res.status(400).json({
        message: "Le type de réduction (discountType) doit être 'PERCENT' ou 'AMOUNT'.",
      });
    }

    if (
      typeof discountValue !== "number" ||
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      return res.status(400).json({
        message:
          "La valeur de réduction (discountValue) doit être un nombre strictement positif.",
      });
    }

    let parsedMaxUses: number | null = null;
    if (typeof maxUses !== "undefined" && maxUses !== null) {
      const n = Number(maxUses);
      if (!Number.isInteger(n) || n <= 0) {
        return res.status(400).json({
          message:
            "maxUses doit être un entier positif ou null pour illimité.",
        });
      }
      parsedMaxUses = n;
    }

    let parsedStartsAt: Date | null = null;
    let parsedEndsAt: Date | null = null;

    if (typeof startsAt === "string" && startsAt.trim()) {
      const d = new Date(startsAt);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({
          message: "La date de début (startsAt) est invalide.",
        });
      }
      parsedStartsAt = d;
    }

    if (typeof endsAt === "string" && endsAt.trim()) {
      const d = new Date(endsAt);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({
          message: "La date de fin (endsAt) est invalide.",
        });
      }
      parsedEndsAt = d;
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: normalizedCode,
        description: description?.trim() || null,
        discountType,
        discountValue: Math.round(discountValue),
        maxUses: parsedMaxUses,
        isActive: typeof isActive === "boolean" ? isActive : true,
        startsAt: parsedStartsAt,
        endsAt: parsedEndsAt,
      },
    });

    return res.status(201).json({ promo });
  } catch (error: any) {
    console.error("Erreur lors de la création d'un code promo :", error);

    if (error?.code === "P2002") {
      // Violation de contrainte unique (code déjà utilisé)
      return res.status(400).json({
        message: "Ce code promo existe déjà. Choisissez un autre code.",
      });
    }

    return res.status(500).json({
      message: "Erreur lors de la création du code promo.",
    });
  }
}

/**
 * Récupère un code promo par id (admin).
 */
export async function getPromoCodeById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Identifiant du code promo manquant." });
    }

    const promo = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!promo) {
      return res.status(404).json({
        message: "Code promo introuvable.",
      });
    }

    return res.status(200).json({ promo });
  } catch (error) {
    console.error("Erreur lors de la récupération d'un code promo :", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération du code promo.",
    });
  }
}

/**
 * Met à jour un code promo existant.
 *
 * Tous les champs sont facultatifs dans le body :
 * {
 *   "description": "...",
 *   "discountType": "PERCENT",
 *   "discountValue": 10,
 *   "maxUses": 100,
 *   "isActive": false,
 *   "startsAt": "2025-01-01T00:00:00.000Z",
 *   "endsAt": "2025-01-31T23:59:59.000Z"
 * }
 *
 * (On ne permet pas de changer le champ "code" ici pour garder une trace propre.)
 */
export async function updatePromoCode(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Identifiant du code promo manquant." });
    }

    const existing = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Code promo introuvable.",
      });
    }

    const {
      description,
      discountType,
      discountValue,
      maxUses,
      isActive,
      startsAt,
      endsAt,
    } = req.body as PromoCodePayload;

    const data: any = {};

    if (typeof description !== "undefined") {
      data.description = description ? description.trim() : null;
    }

    if (typeof discountType !== "undefined") {
      if (!["PERCENT", "AMOUNT"].includes(discountType)) {
        return res.status(400).json({
          message:
            "Le type de réduction (discountType) doit être 'PERCENT' ou 'AMOUNT'.",
        });
      }
      data.discountType = discountType;
    }

    if (typeof discountValue !== "undefined") {
      const n = Number(discountValue);
      if (!Number.isFinite(n) || n <= 0) {
        return res.status(400).json({
          message:
            "La valeur de réduction (discountValue) doit être un nombre strictement positif.",
        });
      }
      data.discountValue = Math.round(n);
    }

    if (typeof maxUses !== "undefined") {
      if (maxUses === null) {
        data.maxUses = null;
      } else {
        const n = Number(maxUses);
        if (!Number.isInteger(n) || n <= 0) {
          return res.status(400).json({
            message:
              "maxUses doit être un entier positif ou null pour illimité.",
          });
        }
        data.maxUses = n;
      }
    }

    if (typeof isActive !== "undefined") {
      data.isActive = Boolean(isActive);
    }

    if (typeof startsAt !== "undefined") {
      if (startsAt === null) {
        data.startsAt = null;
      } else if (typeof startsAt === "string" && startsAt.trim()) {
        const d = new Date(startsAt);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({
            message: "La date de début (startsAt) est invalide.",
          });
        }
        data.startsAt = d;
      }
    }

    if (typeof endsAt !== "undefined") {
      if (endsAt === null) {
        data.endsAt = null;
      } else if (typeof endsAt === "string" && endsAt.trim()) {
        const d = new Date(endsAt);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({
            message: "La date de fin (endsAt) est invalide.",
          });
        }
        data.endsAt = d;
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "Aucune donnée valide à mettre à jour.",
      });
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data,
    });

    return res.status(200).json({ promo: updated });
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un code promo :", error);
    return res.status(500).json({
      message: "Erreur lors de la mise à jour du code promo.",
    });
  }
}

/**
 * "Supprime" un code promo : on le désactive (isActive = false).
 *
 * DELETE /admin/promo-codes/:id
 */
export async function archivePromoCode(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Identifiant du code promo manquant." });
    }

    const existing = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Code promo introuvable.",
      });
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({ promo: updated });
  } catch (error) {
    console.error("Erreur lors de la désactivation d'un code promo :", error);
    return res.status(500).json({
      message: "Erreur lors de la désactivation du code promo.",
    });
  }
}
