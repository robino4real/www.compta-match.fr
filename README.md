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
