# ComptaMatch - SaaS comptable & téléchargements numériques

Structure du projet :
- `client/` : Front-end React + TypeScript + Tailwind + React Router.
- `server/` : API Node/Express en TypeScript + Prisma (PostgreSQL).

## Démarrage rapide
1. Installer les dépendances :
   - Front : `cd client && npm install`
   - Back : `cd server && npm install`
2. Lancer les serveurs de développement :
   - Front : `npm run dev` (port 5173)
   - Back : `npm run dev` (port 4000)

## Configuration Stripe (mode test)
- Ajouter dans un fichier `.env` côté serveur :
  - `STRIPE_SECRET_KEY=sk_test_xxx`
  - `STRIPE_WEBHOOK_SECRET=whsec_xxx`
  - `JWT_SECRET=change-me`
  - `DATABASE_URL=postgresql://user:password@localhost:5432/comptamatch`
- Les webhooks sont simulés dans ce prototype, mais les routes sont prêtes à être branchées.

## Prisma & base de données
- Mettre à jour le schéma dans `server/prisma/schema.prisma` puis exécuter :
  - `cd server`
  - `npx prisma migrate dev --name init`
  - `npx prisma db seed` (à créer si nécessaire)

## Commandes utiles
- `npm run build` (client) : construit l'application front.
- `npm run build` (server) : transpile l'API TypeScript vers `dist/`.
- `npm run preview` (client) : prévisualiser le build Vite.

## Accès administrateur pour tester
- Lien direct : http://localhost:5173/admin (bouton "Accès admin" dans l'entête).
- Identifiants de démo : `admin@demo.fr` / `admin123` (rôle admin).
- Compte utilisateur démo : `client@demo.fr` / `demo123`.

## Offres et téléchargements gratuits pour la démo
- Abonnement Pro facturé 0 € / mois pendant la phase de test (activation via l'interface front).
- Produit téléchargeable gratuit inclus : "ComptaMini Découverte (gratuit)" à 0 €.

Tout le contenu visible est rédigé en français et sert de base complète pour un site SaaS + e-commerce de logiciels téléchargeables.
