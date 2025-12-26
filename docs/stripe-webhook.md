# Stripe webhook – mise en place et dépannage

## Points clés
- Le webhook Stripe doit recevoir le corps **brut (Buffer)** sans passer par `express.json()` ou tout autre body-parser.
- L'endpoint exposé est `https://compta-match.fr/api/payments/stripe/webhook`.
- La signature Stripe (`Stripe-Signature`) est vérifiée via `stripe.webhooks.constructEvent`.
- La session Checkout est liée à la commande via `metadata.orderId` et `client_reference_id`.

## Configuration Stripe
1. Dans le Dashboard Stripe, créez ou mettez à jour un endpoint webhook avec l'URL :
   - `https://compta-match.fr/api/payments/stripe/webhook`
2. Sélectionnez au minimum l'événement `checkout.session.completed`.
3. Renseignez la clé secrète du webhook dans `.env`.

## Variables d'environnement
- `STRIPE_SECRET_KEY` (ou `STRIPE_SECRET_KEY_TEST` selon l'environnement)
- `STRIPE_WEBHOOK_SECRET` (ou `STRIPE_WEBHOOK_SECRET_TEST` pour la clé de signature)
- `PUBLIC_BASE_URL` (base publique de l'API si besoin)
- `FRONTEND_BASE_URL` (URL front utilisée pour les redirections)

> Astuce : en environnement de test, utilisez les clés suffixées `_TEST` si elles sont définies et exportez-les vers les variables génériques avant de lancer le serveur.

## Checklist de troubleshooting
- Le header `Stripe-Signature` est-il bien présent ? Sinon Stripe renvoie directement une erreur 400.
- Le corps de la requête est-il traité en `express.raw({ type: "application/json" })` avant tout middleware JSON ?
- La variable `STRIPE_WEBHOOK_SECRET` correspond-elle bien à l'endpoint configuré dans Stripe (mode test vs live) ?
- La commande a-t-elle un `stripeSessionId` ou un `orderId` qui correspond à la session ?
- Vérifiez les derniers événements via `GET /api/payments/stripe/debug-last-events` (admin requis).
- Pour inspecter une session Checkout côté Stripe : `GET /api/payments/stripe/session/:id` (admin requis).
