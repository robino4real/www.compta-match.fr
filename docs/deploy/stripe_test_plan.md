# Plan de test manuel Stripe (mode test)

1. **Préparation**
   - Saisir `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` dans `.env`.
   - Démarrer le serveur local (`npm run dev` côté API) avec `STRIPE_WEBHOOK_SECRET` configuré.
2. **Création produit**
   - Créer un produit téléchargeable actif via le back-office admin.
3. **Panier**
   - Depuis le front public, ajouter le produit au panier puis passer au checkout.
4. **Lancement paiement**
   - Renseigner les informations de facturation, accepter CGU/licence puis cliquer "Payer".
   - Vérifier que l’URL Stripe Checkout s’ouvre et que `order` est créée en statut `PENDING` en base.
5. **Paiement test**
   - Utiliser une carte test Stripe (4242 4242 4242 4242). Valider.
6. **Webhook**
   - Confirmer que le webhook `checkout.session.completed` est reçu (logs serveur avec l’ID d’événement).
   - Vérifier que la commande passe en statut `PAID`, avec `stripeSessionId` et `stripePaymentIntentId` renseignés.
7. **Emails**
   - Contrôler la réception de l’email de confirmation et, si activé, de disponibilité de facture.
8. **Téléchargement**
   - Depuis la page de succès, récupérer le lien de téléchargement et vérifier qu’il fonctionne.
   - Vérifier qu’un `DownloadLink` a été créé pour chaque item.
9. **Back-office**
   - Ouvrir la liste des commandes/ventes et vérifier l’incrément, la présence de la facture et du code promo éventuel.
10. **Idempotence**
    - Relancer manuellement l’événement Stripe depuis le dashboard : la commande ne doit pas être dupliquée ni recréer des liens.
