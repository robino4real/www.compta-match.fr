# Déploiement cPanel (hébergement mutualisé LWS)

Ce guide décrit le build local et la mise en prod sans jamais lancer `npm install` ou `prisma generate` sur le serveur cPanel.

## 1. Préparer l'environnement de build
- Cloner le dépôt.
- Installer les dépendances en local ou sur Codespaces :
  ```bash
  cd client && npm install
  cd ../server && npm install
  ```
- Copier `server/.env.example` vers `server/.env` et renseigner au minimum :
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `ADMIN_BACKOFFICE_PASSWORD`
  - `ADMIN_PERSONAL_EMAIL`
  - `API_BASE_URL` (ex : `https://compta-match.fr/api`)
  - `FRONTEND_BASE_URL` (ex : `https://compta-match.fr`)
  - `STRIPE_SECRET_KEY`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`

## 2. Initialiser la base
- Sur une base neuve, appliquer les migrations Prisma :
  ```bash
  cd server
  npx prisma migrate deploy
  ```
  ou importer le script SQL complet `docs/bootstrap.sql` via phpPgAdmin pour créer toutes les tables et types.

## 3. Builder le front
```bash
cd client
npm run build
```
Le build Vite est généré dans `client/dist`.

## 4. Builder le back
```bash
cd server
npm run prisma:generate
npm run build
```
Le dossier `dist/` contient le code compilé TypeScript.

## 5. Préparer le dossier `server/`
- Copier le build du front dans le dossier serveur :
  ```bash
  rm -rf frontend && mkdir -p frontend
  cp -r ../client/dist/* frontend/
  ```
- Vérifier que `node_modules` contient bien `@prisma/client` (généré à l'étape 4).
- Conserver les fichiers nécessaires :
  - `dist/`
  - `node_modules/`
  - `package.json` + `package-lock.json`
  - `prisma/` (schema + migrations)
  - `frontend/` (build du front)
  - `tsconfig.json`

## 6. Créer l'archive de déploiement
Depuis la racine du projet :
```bash
cd server
zip -r ../server-build.zip dist node_modules prisma frontend package.json package-lock.json tsconfig.json .env.example
```

## 7. Upload cPanel
- Charger `server-build.zip` dans `/home/.../repositories/www.compta-match.fr/` via le gestionnaire de fichiers cPanel.
- Extraire l'archive ; le dossier `server/` doit contenir `dist/`, `node_modules/`, `prisma/`, `frontend/`...
- Déposer le fichier `.env` (non versionné) dans `repositories/www.compta-match.fr/server/`.

## 8. Configuration de l'application Node cPanel
- Application root : `repositories/www.compta-match.fr/server`
- Startup file : `dist/index.js`
- Node version : 20
- Aucun `npm install` ni `prisma generate` n'est exécuté côté serveur.

## 9. Vérifications après déploiement
- Tester `https://compta-match.fr/api/health`.
- Vérifier que les routes front (`/auth/login`, `/admin`, etc.) fonctionnent en rechargement grâce au fallback SPA.
- Vérifier la création automatique du compte admin (voir README) et l'accès au back-office.
