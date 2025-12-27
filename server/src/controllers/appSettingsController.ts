import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { FicheRequest } from "../middleware/ficheAccessMiddleware";
import { appErrors } from "../utils/appErrors";

const allowedCurrencies = ["EUR", "USD", "GBP"] as const;

function getContext(req: Request) {
  const { fiche } = req as FicheRequest;
  const { user } = req as AuthenticatedRequest;

  return { fiche, user };
}

export async function getFicheSettings(req: Request, res: Response) {
  const { fiche, user } = getContext(req);

  if (!fiche || !user) {
    return appErrors.internal(res, "Impossible de charger le contexte de la fiche.");
  }

  try {
    const settings = await prisma.appFiche.findFirst({
      where: { id: fiche.id, ownerId: user.id, type: fiche.type },
      select: {
        id: true,
        name: true,
        type: true,
        currency: true,
        fiscalYearStartMonth: true,
        createdAt: true,
        ownerId: true,
      },
    });

    if (!settings) {
      return appErrors.notFound(res);
    }

    const { ownerId, ...payload } = settings;

    return res.json({ ok: true, data: { fiche: payload } });
  } catch (error) {
    console.error("[settings] Erreur lors du chargement des paramètres de fiche", error);
    return appErrors.internal(res);
  }
}

export async function updateFicheSettings(req: Request, res: Response) {
  const { fiche, user } = getContext(req);

  if (!fiche || !user) {
    return appErrors.internal(res, "Impossible de charger le contexte de la fiche.");
  }

  const { name, currency, fiscalYearStartMonth } = req.body as {
    name?: string;
    currency?: string;
    fiscalYearStartMonth?: number | string;
  };

  const updates: {
    name?: string;
    currency?: string;
    fiscalYearStartMonth?: number;
  } = {};

  if (name !== undefined) {
    if (typeof name !== "string") {
      return appErrors.badRequest(res, "Le nom fourni est invalide.");
    }

    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length > 120) {
      return appErrors.badRequest(res, "Le nom de la fiche doit être renseigné (120 caractères max).");
    }

    updates.name = trimmedName;
  }

  if (currency !== undefined) {
    if (typeof currency !== "string") {
      return appErrors.badRequest(res, "La devise fournie est invalide.");
    }

    const normalizedCurrency = currency.trim().toUpperCase();

    const isAllowedCurrency =
      allowedCurrencies.includes(normalizedCurrency as (typeof allowedCurrencies)[number]) ||
      /^[A-Z]{3}$/.test(normalizedCurrency);

    if (!normalizedCurrency || !isAllowedCurrency) {
      return appErrors.badRequest(res, "Devise non prise en charge.");
    }

    updates.currency = normalizedCurrency;
  }

  if (fiscalYearStartMonth !== undefined) {
    const monthValue = typeof fiscalYearStartMonth === "string" ? Number(fiscalYearStartMonth) : fiscalYearStartMonth;

    if (!Number.isInteger(monthValue) || monthValue < 1 || monthValue > 12) {
      return appErrors.badRequest(
        res,
        "Le mois de début d'exercice doit être compris entre 1 et 12."
      );
    }

    updates.fiscalYearStartMonth = monthValue;
  }

  if (Object.keys(updates).length === 0) {
    return appErrors.badRequest(res, "Aucune modification à appliquer.");
  }

  try {
    const updated = await prisma.appFiche.update({
      where: { id: fiche.id },
      data: updates,
      select: {
        id: true,
        name: true,
        type: true,
        currency: true,
        fiscalYearStartMonth: true,
        createdAt: true,
        ownerId: true,
      },
    });

    const { ownerId, ...payload } = updated;

    return res.json({ ok: true, data: { fiche: payload } });
  } catch (error) {
    console.error("[settings] Erreur lors de la mise à jour des paramètres de fiche", error);
    return appErrors.internal(res, "Impossible d'enregistrer ces paramètres pour le moment.");
  }
}
