import { Router } from "express";
import {
  handleDownloadByToken,
  listUserDownloads,
} from "../controllers/downloadController";
import {
  attachUserToRequest,
  requireAuth,
} from "../middleware/authMiddleware";

const router = Router();

/**
 * Liste des logiciels téléchargeables de l'utilisateur connecté.
 *
 * GET /downloads/me
 */
router.get(
  "/me",
  attachUserToRequest,
  requireAuth,
  listUserDownloads
);

/**
 * Téléchargement d'un logiciel via un token.
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
