import { Request, Response } from "express";
import { AppFicheType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { FicheRequest } from "../middleware/ficheAccessMiddleware";

export function getFicheContext(req: Request, res: Response) {
  const { fiche } = req as FicheRequest;
  const { user } = req as AuthenticatedRequest;

  if (!fiche || !user) {
    return res
      .status(500)
      .json({ message: "Impossible de charger le contexte de la fiche." });
  }

  return res.json({
    ok: true,
    fiche: { id: fiche.id, type: fiche.type, name: fiche.name },
    user: { id: user.id, email: user.email },
  });
}

export async function listUserFiches(req: Request, res: Response) {
  const { user } = req as AuthenticatedRequest;

  if (!user) {
    return res.status(401).json({ message: "Non authentifié." });
  }

  const typeParam = (req.query.type as string | undefined)?.toUpperCase();
  const allowedTypes: AppFicheType[] = ["COMPTAPRO", "COMPTASSO"];

  const filters: { ownerId: string; type?: AppFicheType } = { ownerId: user.id };

  if (typeParam && allowedTypes.includes(typeParam as AppFicheType)) {
    filters.type = typeParam as AppFicheType;
  }

  try {
    const fiches = await prisma.appFiche.findMany({
      where: filters,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, createdAt: true, updatedAt: true },
    });

    return res.json({ fiches });
  } catch (error) {
    console.error("[fiche] Erreur lors du chargement des fiches utilisateur", error);
    return res.status(500).json({ message: "Impossible de récupérer vos fiches pour le moment." });
  }
}
