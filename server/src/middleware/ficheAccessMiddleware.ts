import { AppFiche, AppFicheType } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "./authMiddleware";
import { appErrors } from "../utils/appErrors";

export type FicheRequest = AuthenticatedRequest & {
  fiche?: AppFiche;
};

type FicheHandler = (
  req: FicheRequest,
  res: Response,
  next: NextFunction
) => void | Response | Promise<void> | Promise<Response> | Promise<Response | void>;

function extractFicheId(req: Request): string | null {
  const paramsId = (req.params as { ficheId?: string }).ficheId;
  const queryId = (req.query as { ficheId?: string }).ficheId;

  return paramsId || queryId || null;
}

interface RequireFicheAccessOptions {
  expectedType?: AppFicheType;
}

export function requireFicheAccess(options?: RequireFicheAccessOptions) {
  return async (req: FicheRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return appErrors.unauthorized(res);
    }

    const ficheId = extractFicheId(req);

    if (!ficheId) {
      return appErrors.badRequest(res, "Identifiant de fiche manquant.");
    }

    try {
      const fiche = await prisma.appFiche.findFirst({
        where: {
          id: ficheId,
          ownerId: req.user.id,
          ...(options?.expectedType ? { type: options.expectedType } : {}),
        },
      });

      if (!fiche) {
        const ficheById = await prisma.appFiche.findUnique({ where: { id: ficheId } });

        if (ficheById) {
          if (options?.expectedType && ficheById.type !== options.expectedType) {
            return appErrors.notFound(res);
          }

          if (ficheById.ownerId !== req.user.id) {
            return appErrors.forbidden(res);
          }
        }

        return appErrors.notFound(res);
      }

      req.fiche = fiche;

      return next();
    } catch (error) {
      console.error("[fiche] Erreur lors de la vérification d'accès", error);
      return appErrors.internal(res);
    }
  };
}

export function withFicheAccess(handler: FicheHandler, options?: RequireFicheAccessOptions) {
  return [requireFicheAccess(options), handler] as const;
}
