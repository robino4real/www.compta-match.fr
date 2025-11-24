import { Router } from "express";
import { handleDownloadByToken } from "../controllers/downloadController";
import {
  attachUserToRequest,
  requireAuth,
} from "../middleware/authMiddleware";

const router = Router();

/**
 * Téléchargement d'un logiciel via un token.
 * Utilisateur authentifié obligatoire.
 *
 * GET /downloads/:token
 */
router.get(
  "/:token",
  attachUserToRequest,
  requireAuth,
  handleDownloadByToken
);

export default router;
