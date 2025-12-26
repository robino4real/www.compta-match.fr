import { Router } from "express";
import {
  createDownloadCheckoutSession,
  getDownloadCheckoutConfirmation,
  listRecentStripeWebhookEvents,
} from "../controllers/paymentController";
import {
  attachUserToRequest,
  requireAuth,
  requireAdmin,
} from "../middleware/authMiddleware";

const router = Router();

/**
 * Création d'une session Stripe Checkout pour les logiciels téléchargeables.
 * Utilisateur connecté obligatoire.
 */
router.post(
  "/downloads/checkout-session",
  attachUserToRequest,
  requireAuth,
  createDownloadCheckoutSession
);

router.get(
  "/downloads/confirmation",
  attachUserToRequest,
  requireAuth,
  getDownloadCheckoutConfirmation
);

router.get(
  "/stripe/debug-last-events",
  attachUserToRequest,
  requireAdmin,
  listRecentStripeWebhookEvents
);

export default router;
