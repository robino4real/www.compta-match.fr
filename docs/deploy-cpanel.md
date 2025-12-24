# Déploiement sur cPanel/LWS (Architecture "Solution A")

Ce guide décrit le packaging local (macOS ou environnement de build) et l'upload sur cPanel sans jamais lancer `npm`, `prisma` ou `node` côté hébergement mutualisé.

## 1) Frontend (SPA servie par Apache sur `compta-match.fr`)
- Build en local (macOS) :
  ```bash
  cd client
  npm ci
  npm run build
  ```
- Contenu à déployer : tout le dossier `client/dist` (incluant `index.html` et `assets/`).
- Upload : copier le contenu de `client/dist` dans `public_html/`.
- Fallback SPA via `.htaccess` dans `public_html/` :
  ```apache
  <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
  </IfModule>
  ```
  Ce fallback permet le rafraîchissement des pages `/comptapro`, `/comptasso`, `/admin`, etc.

## 2) Backend API (Node/Express sur `api.compta-match.fr` uniquement)
- Build en local (macOS) :
  ```bash
  cd server
  npm ci
  npx prisma generate
  npm run build
  ```
- Téléversements : les fichiers envoyés via le back-office sont stockés dans `DOWNLOADS_STORAGE_DIR` (défaut : `/home/<user>/comptamatch_uploads`).
- L'API sert ces fichiers en statique sous `/uploads` (ex: `https://api.compta-match.fr/uploads/<fichier>`). Les URL stockées en base doivent rester **relatives** (`/uploads/xxx`).
- Variables d'env clés :
  - `PUBLIC_BASE_URL=https://api.compta-match.fr` (construction des URL absolues côté API)
  - `VITE_API_BASE_URL=https://api.compta-match.fr` côté front : le helper `resolveAssetUrl` préfixe automatiquement les chemins `/uploads/` et corrige les anciennes URL `compta-match.fr/uploads`.
- Contenu à déployer dans l'application Node cPanel (nodevenv) :
  - `server/dist/` (build TypeScript)
  - `server/node_modules/.prisma` et `server/node_modules/@prisma` (client Prisma généré)
  - `server/node_modules/` complet pour les dépendances
  - `server/prisma/` (schema et migrations si besoin)
  - `server/package.json` + `server/package-lock.json`
  - Éventuellement `server/.env.example` pour référence (le vrai `.env` reste privé)
- **Ne pas activer Node sur le domaine principal** `compta-match.fr`. L'application Node doit être créée/configurée uniquement pour le sous-domaine `api.compta-match.fr` (sinon le serveur Express volerait les routes Apache et casserait le refresh SPA).
- L'API écoute explicitement en IPv4 (`0.0.0.0`) pour éviter les resets Safari/NAT64.

## 3) DNS
- Supprimer les enregistrements AAAA pour `compta-match.fr` et `api.compta-match.fr` (pas d'IPv6 annoncé).
- Vérifier que `api.compta-match.fr` pointe bien vers l'IP IPv4 du serveur.

## 4) Checklist de déploiement
- [ ] Compiler le front en local et uploader le contenu de `client/dist` dans `public_html/`.
- [ ] Placer le `.htaccess` SPA dans `public_html/`.
- [ ] Compiler le back (`npm ci`, `npx prisma generate`, `npm run build`) en local.
- [ ] Uploader `server/dist`, `server/node_modules` (dont `.prisma`), `server/package*.json`, `server/prisma` et le `.env` privé dans le répertoire nodevenv du sous-domaine `api.compta-match.fr`.
- [ ] (Legacy) Normaliser les URL d'upload existantes :
  - `cd server`
  - `npx ts-node src/scripts/migrate-upload-urls.ts`
- [ ] Configurer l'application Node cPanel : Root `server/`, Startup file `dist/index.js`, Node 20.
- [ ] Vérifier que le backend n'est **pas** attaché au domaine racine.
- [ ] DNS : aucun AAAA sur le domaine ni le sous-domaine.
- [ ] Tests post-déploiement :
  - `curl -I https://compta-match.fr/comptapro` ne doit pas contenir `x-powered-by: Express` (servi par Apache/Vite build).
  - `curl -4 https://api.compta-match.fr/api/health` doit répondre `200`.
