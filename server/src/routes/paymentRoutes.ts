import { Router } from "express";
import {
  createDownloadCheckoutSession,
  handleStripeWebhook,
} from "../controllers/paymentController";
import {
  attachUserToRequest,
  requireAuth,
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

/**
 * Webhook Stripe.
 * Pas d'authentification ici : Stripe appelle directement cette URL.
 * ⚠️ Signature non vérifiée (adapter avant la mise en production).
 */
router.post("/stripe-webhook", handleStripeWebhook);

export default router;
