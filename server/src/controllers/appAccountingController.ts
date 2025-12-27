import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { FicheRequest } from "../middleware/ficheAccessMiddleware";
import { appErrors } from "../utils/appErrors";

function getContext(req: Request) {
  const { fiche } = req as FicheRequest;
  const { user } = req as AuthenticatedRequest;

  return { fiche, user };
}

export async function getAccountingSummary(req: Request, res: Response) {
  const { fiche, user } = getContext(req);

  if (!fiche || !user) {
    return appErrors.internal(res, "Impossible de charger le contexte de la fiche.");
  }

  try {
    const [entriesCount, lastEntry] = await Promise.all([
      prisma.accountingEntry.count({ where: { ficheId: fiche.id, ownerId: user.id } }),
      prisma.accountingEntry.findFirst({
        where: { ficheId: fiche.id, ownerId: user.id },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ]);

    return res.json({
      ok: true,
      data: {
        totals: { entriesCount },
        lastUpdatedAt: lastEntry?.updatedAt ?? null,
      },
    });
  } catch (error) {
    console.error("[comptabilite] Erreur lors du chargement du résumé", error);
    return appErrors.internal(res);
  }
}

export async function listAccountingEntries(req: Request, res: Response) {
  const { fiche, user } = getContext(req);

  if (!fiche || !user) {
    return appErrors.internal(res, "Impossible de charger le contexte de la fiche.");
  }

  try {
    const items = await prisma.accountingEntry.findMany({
      where: { ficheId: fiche.id, ownerId: user.id },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
    });

    return res.json({ ok: true, data: { items } });
  } catch (error) {
    console.error("[comptabilite] Erreur lors du chargement des écritures", error);
    return appErrors.internal(res);
  }
}

export async function createAccountingEntry(req: Request, res: Response) {
  const { fiche, user } = getContext(req);

  if (!fiche || !user) {
    return appErrors.internal(res, "Impossible de charger le contexte de la fiche.");
  }

  const { date, label, amount, account } = req.body as {
    date?: string;
    label?: string;
    amount?: number | string;
    account?: string;
  };

  const parsedDate = date ? new Date(date) : null;
  const parsedAmount = typeof amount === "string" ? Number(amount) : amount;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return appErrors.badRequest(res, "La date de l'écriture est invalide.");
  }

  if (!label || typeof label !== "string" || !label.trim()) {
    return appErrors.badRequest(res, "Le libellé est requis.");
  }

  if (parsedAmount === undefined || parsedAmount === null || Number.isNaN(parsedAmount)) {
    return appErrors.badRequest(res, "Le montant est invalide.");
  }

  const amountCents = Math.round(parsedAmount * 100);

  try {
    const item = await prisma.accountingEntry.create({
      data: {
        ficheId: fiche.id,
        ownerId: user.id,
        date: parsedDate,
        label: label.trim(),
        amountCents,
        account: account?.trim() || null,
      },
    });

    return res.status(201).json({ ok: true, data: { item } });
  } catch (error) {
    console.error("[comptabilite] Erreur lors de la création d'une écriture", error);
    return appErrors.internal(res, "Impossible d'enregistrer cette écriture pour le moment.");
  }
}
