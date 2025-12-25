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
  isReferral?: boolean;
  sponsorName?: string;
  sponsorEmail?: string;
  sponsorPhone?: string;
  sponsorAddress?: string;
  sponsorBankName?: string;
  sponsorIban?: string;
  sponsorBic?: string;
  referralRate?: number | null;
  targetType?: "PRODUCT" | "SUBSCRIPTION" | string;
  productCategoryId?: string | null;
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
  } catch (error: any) {
    console.error("Erreur lors de la liste des codes promo :", error);

    if (error?.code === "P2022") {
      return res.status(503).json({
        message:
          "La colonne productCategoryId est absente en base. Merci d'appliquer le script SQL de correction.",
        promos: [],
      });
    }

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
      isReferral,
      sponsorName,
      sponsorEmail,
      sponsorPhone,
      sponsorAddress,
      sponsorBankName,
      sponsorIban,
      sponsorBic,
      referralRate,
      targetType,
      productCategoryId,
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
    const referralEnabled = Boolean(isReferral);

    const finalTargetType =
      targetType === "SUBSCRIPTION" || targetType === "PRODUCT"
        ? targetType
        : "PRODUCT";

    let finalProductCategoryId: string | null = null;
    if (finalTargetType === "PRODUCT") {
      if (productCategoryId) {
        const category = await prisma.downloadableCategory.findUnique({
          where: { id: productCategoryId },
        });

        if (!category) {
          return res.status(400).json({
            message: "La catégorie sélectionnée pour le code promo est introuvable.",
          });
        }

        finalProductCategoryId = category.id;
      }
    }

    let parsedReferralRate: number | null = null;
    let trimmedIban: string | null = null;
    let trimmedBic: string | null = null;

    if (referralEnabled) {
      if (!sponsorName || !sponsorName.trim()) {
        return res.status(400).json({
          message:
          "Le nom ou la dénomination du parrain est obligatoire pour un code parrainage.",
        });
      }

      trimmedIban = sponsorIban?.replace(/\s+/g, "") || null;
      trimmedBic = sponsorBic?.replace(/\s+/g, "") || null;

      if (!trimmedIban || trimmedIban.length < 14) {
        return res.status(400).json({
          message: "Le RIB/IBAN du parrain est obligatoire et doit être valide.",
        });
      }

      if (!trimmedBic || trimmedBic.length < 8) {
        return res.status(400).json({
          message: "Le code BIC du parrain est obligatoire et doit être valide.",
        });
      }

      if (typeof referralRate === "number") {
        const rate = Number(referralRate);
        if (!Number.isFinite(rate) || rate <= 0 || rate > 100) {
          return res.status(400).json({
            message:
              "Le pourcentage de redevance doit être un nombre entre 0 et 100.",
          });
        }
        parsedReferralRate = Math.round(rate);
      } else {
        return res.status(400).json({
          message: "Le pourcentage de redevance est obligatoire pour un parrainage.",
        });
      }
    }

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
        isReferral: referralEnabled,
        targetType: finalTargetType,
        productCategoryId: finalProductCategoryId,
        sponsorName: referralEnabled ? sponsorName?.trim() || null : null,
        sponsorEmail: referralEnabled ? sponsorEmail?.trim() || null : null,
        sponsorPhone: referralEnabled ? sponsorPhone?.trim() || null : null,
        sponsorAddress: referralEnabled ? sponsorAddress?.trim() || null : null,
        sponsorBankName: referralEnabled ? sponsorBankName?.trim() || null : null,
        sponsorIban: referralEnabled ? trimmedIban : null,
        sponsorBic: referralEnabled ? trimmedBic : null,
        referralRate: referralEnabled ? parsedReferralRate : null,
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
      isReferral,
      sponsorName,
      sponsorEmail,
      sponsorPhone,
      sponsorAddress,
      sponsorBankName,
      sponsorIban,
      sponsorBic,
      referralRate,
      targetType,
      productCategoryId,
    } = req.body as PromoCodePayload;

    const data: any = {};

    const finalTargetType =
      targetType === "PRODUCT" || targetType === "SUBSCRIPTION"
        ? targetType
        : existing.targetType || "PRODUCT";

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

    if (typeof targetType !== "undefined") {
      if (targetType !== "PRODUCT" && targetType !== "SUBSCRIPTION") {
        return res
          .status(400)
          .json({ message: "La cible du code promo est invalide." });
      }
      data.targetType = targetType;
    }

    if (typeof productCategoryId !== "undefined") {
      if (finalTargetType === "SUBSCRIPTION") {
        data.productCategoryId = null;
      } else if (productCategoryId) {
        const category = await prisma.downloadableCategory.findUnique({
          where: { id: productCategoryId },
        });

        if (!category) {
          return res.status(400).json({
            message: "La catégorie sélectionnée pour le code promo est introuvable.",
          });
        }

        data.productCategoryId = category.id;
      } else {
        data.productCategoryId = null;
      }
    } else if (finalTargetType === "SUBSCRIPTION") {
      data.productCategoryId = null;
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

    const referralFlag =
      typeof isReferral !== "undefined" ? Boolean(isReferral) : existing.isReferral;

    if (typeof isReferral !== "undefined") {
      data.isReferral = referralFlag;
    }

    if (referralFlag) {
      const finalSponsorName =
        typeof sponsorName !== "undefined" ? sponsorName : existing.sponsorName;

      if (!finalSponsorName || !finalSponsorName.trim()) {
        return res.status(400).json({
          message:
            "Le nom ou la dénomination du parrain est obligatoire pour un code parrainage.",
        });
      }

      const finalReferralRate =
        typeof referralRate !== "undefined" ? referralRate : existing.referralRate;

      const finalIban =
        typeof sponsorIban !== "undefined"
          ? sponsorIban?.replace(/\s+/g, "") || null
          : existing.sponsorIban;

      const finalBic =
        typeof sponsorBic !== "undefined"
          ? sponsorBic?.replace(/\s+/g, "") || null
          : existing.sponsorBic;

      if (
        typeof finalReferralRate !== "number" ||
        !Number.isFinite(finalReferralRate) ||
        finalReferralRate <= 0 ||
        finalReferralRate > 100
      ) {
        return res.status(400).json({
          message: "Le pourcentage de redevance doit être un nombre entre 0 et 100.",
        });
      }

      data.sponsorName = finalSponsorName.trim();
      data.sponsorEmail =
        typeof sponsorEmail !== "undefined"
          ? sponsorEmail?.trim() || null
          : existing.sponsorEmail;
      data.sponsorPhone =
        typeof sponsorPhone !== "undefined"
          ? sponsorPhone?.trim() || null
          : existing.sponsorPhone;
      data.sponsorAddress =
        typeof sponsorAddress !== "undefined"
          ? sponsorAddress?.trim() || null
          : existing.sponsorAddress;
      data.sponsorBankName =
        typeof sponsorBankName !== "undefined"
          ? sponsorBankName?.trim() || null
          : existing.sponsorBankName;

      if (!finalIban || finalIban.length < 14) {
        return res.status(400).json({
          message: "Le RIB/IBAN du parrain est obligatoire et doit être valide.",
        });
      }

      if (!finalBic || finalBic.length < 8) {
        return res.status(400).json({
          message: "Le code BIC du parrain est obligatoire et doit être valide.",
        });
      }

      data.sponsorIban = finalIban;
      data.sponsorBic = finalBic;
      data.referralRate = Math.round(finalReferralRate);
    } else if (typeof isReferral !== "undefined") {
      data.sponsorName = null;
      data.sponsorEmail = null;
      data.sponsorPhone = null;
      data.sponsorAddress = null;
      data.sponsorBankName = null;
      data.sponsorIban = null;
      data.sponsorBic = null;
      data.referralRate = null;
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

export async function getPromoCodeStats(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { startDate, endDate, groupBy } = req.query as Record<string, string>;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Identifiant du code promo manquant." });
    }

    const promo = await prisma.promoCode.findUnique({ where: { id } });

    if (!promo) {
      return res.status(404).json({ message: "Code promo introuvable." });
    }

    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (typeof startDate === "string" && startDate.trim()) {
      const d = new Date(startDate);
      if (Number.isNaN(d.getTime())) {
        return res
          .status(400)
          .json({ message: "La date de début fournie est invalide." });
      }
      parsedStartDate = d;
    }

    if (typeof endDate === "string" && endDate.trim()) {
      const d = new Date(endDate);
      if (Number.isNaN(d.getTime())) {
        return res
          .status(400)
          .json({ message: "La date de fin fournie est invalide." });
      }
      parsedEndDate = d;
    }

    const where: any = {
      promoCodeId: id,
      status: "PAID",
    };

    if (parsedStartDate || parsedEndDate) {
      where.createdAt = {
        ...(parsedStartDate ? { gte: parsedStartDate } : {}),
        ...(parsedEndDate ? { lte: parsedEndDate } : {}),
      };
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        totalBeforeDiscount: true,
        discountAmount: true,
        totalPaid: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const totals = orders.reduce(
      (acc, order) => {
        acc.totalBeforeDiscountCents += order.totalBeforeDiscount;
        acc.totalDiscountCents += order.discountAmount;
        acc.totalRevenueCents += order.totalPaid;
        return acc;
      },
      {
        totalBeforeDiscountCents: 0,
        totalDiscountCents: 0,
        totalRevenueCents: 0,
      }
    );

    const commission =
      promo.isReferral && promo.referralRate
        ? Math.round((totals.totalRevenueCents * promo.referralRate) / 100)
        : 0;

    const grouping = groupBy === "day" || groupBy === "month" ? groupBy : null;
    let groups: Array<{
      period: string;
      uses: number;
      totalRevenueCents: number;
      totalDiscountCents: number;
      totalBeforeDiscountCents: number;
      referralCommissionCents: number;
    }> = [];

    if (grouping) {
      const map = new Map<string, (typeof groups)[number]>();

      for (const order of orders) {
        const date = order.createdAt;
        const key =
          grouping === "month"
            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
            : date.toISOString().slice(0, 10);

        const current = map.get(key) || {
          period: key,
          uses: 0,
          totalRevenueCents: 0,
          totalDiscountCents: 0,
          totalBeforeDiscountCents: 0,
          referralCommissionCents: 0,
        };

        current.uses += 1;
        current.totalRevenueCents += order.totalPaid;
        current.totalDiscountCents += order.discountAmount;
        current.totalBeforeDiscountCents += order.totalBeforeDiscount;

        if (promo.isReferral && promo.referralRate) {
          current.referralCommissionCents += Math.round(
            (order.totalPaid * promo.referralRate) / 100
          );
        }

        map.set(key, current);
      }

      groups = Array.from(map.values()).sort((a, b) =>
        a.period.localeCompare(b.period)
      );
    }

    return res.status(200).json({
      promoId: id,
      totalUses: orders.length,
      ...totals,
      referralCommissionCents: commission,
      groupBy: grouping,
      period: {
        startDate: parsedStartDate ? parsedStartDate.toISOString() : null,
        endDate: parsedEndDate ? parsedEndDate.toISOString() : null,
      },
      groups,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques promo :", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des statistiques du code promo.",
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
