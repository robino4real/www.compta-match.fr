# Tests Stripe (local et distant)

Ce projet est déployé en build local (TypeScript -> dist). Le webhook Stripe exige le corps **RAW** et un header `Stripe-Signature` fourni par Stripe ; un `curl` artisanal sans ce header échouera toujours (400).

## Local : vérifier le flux sans toucher au serveur distant

1. Démarrer l'API en local avec le même secret webhook que sur le dashboard Stripe (`STRIPE_MODE=test` et `STRIPE_WEBHOOK_SECRET_TEST=...`).
2. Dans un autre terminal, lancer l'écoute des webhooks avec le CLI Stripe :

```bash
stripe listen --forward-to http://localhost:4000/api/payments/stripe/webhook
```

3. Créer une session Checkout en local puis simuler un paiement de test. Stripe renverra automatiquement l'événement `checkout.session.completed` vers l'API.
4. Pour rejouer un webhook précis :

```bash
stripe trigger checkout.session.completed
```

5. Consulter les 20 derniers événements reçus depuis un compte admin :

```bash
curl -H "Cookie: session=..." http://localhost:4000/api/payments/stripe/debug-last-events
```

Les logs complets sont persistés en base (`WebhookEventLog`) avec l'ID d'événement Stripe, le `checkout.session` et le `payment_intent` associés.

## Production (ou pré-prod) : sanity-check à distance via Stripe CLI

1. Vérifier que l'environnement cPanel contient bien :
   - `STRIPE_MODE=test` (ou `live` en production) ;
   - `STRIPE_WEBHOOK_SECRET_TEST` (mode test) ou `STRIPE_WEBHOOK_SECRET_LIVE` (mode live) ;
   - optionnellement `STRIPE_WEBHOOK_SECRET` comme fallback commun.
2. Depuis une machine locale reliée au même compte Stripe, déclencher un événement de test pointant directement vers l'URL distante :

```bash
stripe trigger checkout.session.completed --webhook-endpoint "https://www.compta-match.fr/api/payments/stripe/webhook"
```

3. Attendu :
   - le serveur répond `200` sur `/api/payments/stripe/webhook` avec un payload valide ;
   - les logs Passenger affichent un corps reçu en Buffer et la vérification de signature OK ;
   - un `curl` sans header `Stripe-Signature` doit renvoyer `400 Missing Stripe-Signature` (comportement attendu).

## Vérifications rapides en base après un paiement réel

- `WebhookEventLog` : contrôler que l'enregistrement du `checkout.session.completed` possède bien la colonne `orderId` renseignée (jointure sur `eventId` retourné par Stripe).
- `Order` : vérifier que la commande liée (via `orderId` ou `stripeSessionId`) est passée à `status = "PAID"` et que `stripeEventId`/`stripePaymentIntentId` sont renseignés.
