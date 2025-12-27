import { AppFiche } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest, requireAuth } from "./authMiddleware";

export type FicheRequest = AuthenticatedRequest & {
  fiche?: AppFiche;
};

type FicheHandler = (
  req: FicheRequest,
  res: Response,
  next: NextFunction
) => void | Response | Promise<void> | Promise<Response>;

function extractFicheId(req: Request): string | null {
  const paramsId = (req.params as { ficheId?: string }).ficheId;
  const queryId = (req.query as { ficheId?: string }).ficheId;

  return paramsId || queryId || null;
}

export async function requireFicheAccess(
  req: FicheRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ message: "Non authentifié." });
  }

  const ficheId = extractFicheId(req);

  if (!ficheId) {
    return res.status(400).json({ message: "Identifiant de fiche manquant." });
  }

  try {
    const fiche = await prisma.appFiche.findUnique({ where: { id: ficheId } });

    if (!fiche) {
      return res.status(404).json({ message: "Ressource introuvable" });
    }

    if (fiche.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Accès interdit" });
    }

    req.fiche = fiche;

    return next();
  } catch (error) {
    console.error("[fiche] Erreur lors de la vérification d'accès", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
}

export function withFicheAccess(handler: FicheHandler) {
  return [requireAuth, requireFicheAccess, handler] as const;
}
