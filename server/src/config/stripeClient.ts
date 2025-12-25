import Stripe from "stripe";
import { env } from "./env";

const stripeSecretKey = env.stripeSecretKey;

if (!stripeSecretKey) {
  // On lève une erreur au démarrage si la clé manque,
  // pour éviter des surprises en production.
  throw new Error(
    "La variable d'environnement STRIPE_SECRET_KEY est manquante."
  );
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20", // ou la version Stripe actuelle configurée
});
