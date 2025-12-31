# ComptaMatch SaaS

Plateforme SaaS avec front React/Vite et API Node.js/Express/Prisma.

## Pré-requis
- Node.js 20+
- PostgreSQL 14+
- `npm` (utilisé pour installer les dépendances uniquement sur la machine de build, **jamais en prod cPanel**)

## Configuration des variables d'environnement
Un fichier d'exemple est disponible dans `server/.env.example`.
Principales variables attendues en production :

- `DATABASE_URL` : URL PostgreSQL.
- `JWT_SECRET` : secret utilisé pour signer les JWT.
- `ADMIN_BACKOFFICE_PASSWORD` : mot de passe initial pour le compte admin automatique.
- `ADMIN_PERSONAL_EMAIL` : email personnel recevant les OTP 2FA admin.
- `FRONTEND_BASE_URL` : URL publique du front (ex : `https://compta-match.fr`).
- `API_BASE_URL` : URL publique de l'API (ex : `https://compta-match.fr/api`).
- `STRIPE_SECRET_KEY`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL` : paramètres Stripe.
- `PORT` : port d'écoute local (4000 par défaut).

## Base de données
- Le schéma Prisma est défini dans `server/prisma/schema.prisma`.
- Les migrations ont été régénérées : une base neuve peut être créée via `prisma migrate deploy` ou directement avec le script SQL `docs/bootstrap.sql` (utile dans phpPgAdmin).

## Numéros de commande
- Chaque commande possède désormais un `orderNumber` unique et lisible :
  - `PTXXXXXXXXXX` pour les produits téléchargeables ;
  - `CPXXXXXXXXXX` pour les abonnements ComptaPro ;
  - `CAXXXXXXXXXX` pour les abonnements ComptaAsso.
- Les numéros sont générés à la création de commande, vérifiés en base pour éviter les collisions, et ne doivent jamais être modifiés après coup.
- Backfill : pour ajouter un numéro aux commandes existantes ou corriger un format hérité, exécuter côté serveur (avec les variables d'env DB configurées) :
  ```bash
  cd server
  npm run backfill:order-numbers
  ```
  Le script regénère les numéros manquants au bon format et journalise les mises à jour.

## Lancement en local
1. Installer les dépendances :
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
2. Générer Prisma côté serveur :
   ```bash
   cd server
   npm run prisma:generate
   ```
3. Démarrer l'API :
   ```bash
   cd server
   npm run dev
   ```
4. Démarrer le front :
   ```bash
   cd client
   npm run dev
   ```

### Vérifier les numéros de commande en local
1. Créer une commande (panier gratuit ou paiement test Stripe) via le front.
2. Ouvrir `/compte/commandes` puis le détail pour vérifier l'affichage du nouveau numéro (prefixe PT/CP/CA + 10 chiffres).
3. Contrôler en base que le champ `orderNumber` est bien renseigné et unique (table `Order`).

## Vérifications locales : espace client / commandes
1. Démarrer l'API :
   ```bash
   cd server
   npm run dev
   ```
2. Démarrer le front :
   ```bash
   cd client
   npm run dev
   ```
3. Depuis `http://localhost:5173`, se connecter avec un compte client.
4. Ouvrir `/compte/commandes` pour lister les commandes et accéder à la facture.
5. Ouvrir `/compte/commandes/:orderId` pour tester le détail, générer un lien de téléchargement (valable 1h) et vérifier le compte à rebours.

## Authentification
- `POST /api/auth/register` : crée un utilisateur, hash du mot de passe, retourne `{ user, token }` + cookie httpOnly.
- `POST /api/auth/login` : vérifie email/mot de passe, retourne `{ user, token }` + cookie httpOnly. Si l'email correspond à l'admin, déclenche un OTP envoyé à `ADMIN_PERSONAL_EMAIL`.
- `POST /api/auth/admin-2fa-verify` : valide l'OTP admin, renvoie `{ user, token }`.
- `GET /api/auth/me` : renvoie l'utilisateur courant via le JWT stocké en cookie.
- `POST /api/auth/logout` : supprime le cookie de session.

Les erreurs retournent un JSON avec un champ `error` explicite et un status HTTP cohérent.

## Compte administrateur
Au démarrage de l'API, `ensureAdminAccount` crée le compte `admin-user@compta-match.fr` si :
- Le compte n'existe pas déjà ;
- `ADMIN_BACKOFFICE_PASSWORD` est renseigné (8+ caractères).

En production, pour changer le mot de passe admin :
- Mettre à jour `ADMIN_BACKOFFICE_PASSWORD` dans le `.env` ;
- Redéployer le serveur (le mot de passe sera régénéré si le compte existe déjà).

## Routing front/back
- L'API est servie sous `/api/...`.
- Les assets statiques du front (copiés dans `server/frontend`) sont servis par Express ; toutes les routes non `/api` font un fallback SPA vers `index.html`.

## Tests
Tests unitaires basés sur le runner natif Node :
```bash
cd server
npm test
```

## Build & déploiement
Le workflow complet pour cPanel est détaillé dans `docs/DEPLOY_CPANEL.md`.
En résumé :
1. Builder le front (`client`) puis copier `client/dist` dans `server/frontend`.
2. Builder le back (`server`), générer Prisma et conserver `node_modules` avec `@prisma/client` généré.
3. Créer l'archive `server-build.zip` contenant tout le dossier `server/` (dist, node_modules, prisma, frontend...).
4. Uploader et extraire l'archive sur le serveur cPanel sans jamais exécuter `npm install` ni `prisma generate` en production.

## Si P2022 "column does not exist" (PromoCode)
1. Appeler l'endpoint admin `/api/admin/diag/db-schema` (protégé admin) pour récupérer l'identité DB et la liste des colonnes attendues sur `PromoCode`.
2. Vérifier dans phpPgAdmin que la table `PromoCode` contient bien `sponsorPhone`, `sponsorAddress`, `sponsorBankName`, `sponsorIban`, `productCategoryId`.
3. Si la colonne existe en base mais que P2022 persiste, régénérer Prisma en local (`npm run prisma:generate`), reconstruire le pack (`server/dist`, `node_modules/@prisma/client`, `node_modules/.prisma`) puis redéployer sur cPanel sans exécuter de migration SQL côté serveur.
