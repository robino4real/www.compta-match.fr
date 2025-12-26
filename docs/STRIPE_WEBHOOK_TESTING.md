# Tests Stripe locaux

Ce projet est déployé en build local (TypeScript -> dist). Pour vérifier le flux Stripe en développement sans toucher au serveur distant :

1. Démarrer l'API en local avec le même `STRIPE_WEBHOOK_SECRET` que celui configuré sur le dashboard Stripe.
2. Dans un autre terminal, lancer l'écoute des webhooks avec le CLI Stripe :

```bash
stripe listen --forward-to http://localhost:4000/api/payments/stripe/webhook
```

3. Créer une session Checkout en local puis simuler un paiement de test. Stripe renverra automatiquement l'événement `checkout.session.completed` vers l'API.
4. Pour rejouer un webhook précis, utiliser par exemple :

```bash
stripe trigger checkout.session.completed
```

5. Consulter les 20 derniers événements reçus depuis un compte admin :

```bash
curl -H "Cookie: session=..." http://localhost:4000/api/payments/stripe/debug-last-events
```

Les logs complets sont persistés en base (`WebhookEventLog`) avec l'ID d'événement Stripe, le `checkout.session` et le `payment_intent` associés.

## Vérifications rapides en base après un paiement réel

- `WebhookEventLog` : contrôler que l'enregistrement du `checkout.session.completed` possède bien la colonne `orderId` renseignée (jointure sur `eventId` retourné par Stripe).
- `Order` : vérifier que la commande liée (via `orderId` ou `stripeSessionId`) est passée à `status = "PAID"` et que `stripeEventId`/`stripePaymentIntentId` sont renseignés.

## Sanity-check du webhook en production de test

- Lancer un webhook de test depuis le CLI Stripe :

```bash
stripe trigger checkout.session.completed
```

- Attendu :
  - le serveur répond `200` sur `/api/payments/stripe/webhook` avec un payload valide ;
  - plus aucun `StripeSignatureVerificationError` ni `[Stripe webhook] Signature Stripe manquante` dans les logs passenger ;
  - un `curl` sans header `Stripe-Signature` doit renvoyer `400 Missing Stripe-Signature`.
