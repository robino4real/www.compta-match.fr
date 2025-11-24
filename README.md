# ComptaMatch SaaS

Projet de démonstration pour une plateforme SaaS avec vente de produits numériques. La structure est séparée en deux dossiers :
- `client/` : front-end React + TypeScript (Vite) avec Tailwind CSS.
- `server/` : API Node.js + Express en TypeScript, prête pour PostgreSQL via Prisma.

## Installation
1. Installer les dépendances du front :
   ```bash
   cd client
   npm install
   ```
2. Installer les dépendances du back :
   ```bash
   cd server
   npm install
   ```

## Lancement
- Démarrer le front en mode développement :
  ```bash
  cd client
  npm run dev
  ```
- Démarrer le back en mode développement :
  ```bash
  cd server
  npm run dev
  ```

## Base de données
- Copier le fichier `.env.example` situé dans `server/` vers `.env` et ajuster `DATABASE_URL` si nécessaire.
- Le schéma Prisma minimal est défini dans `server/prisma/schema.prisma`.

## Accès à l'espace administrateur

### En développement (local)

1. **Lancer l’API (backend)**
   ```bash
   cd server
   npm install        # la première fois seulement
   npm run dev
   ```
   L’API tourne généralement sur http://localhost:4000.

2. **Lancer le front (client)**
   Dans un autre terminal :
   ```bash
   cd client
   npm install        # la première fois seulement
   npm run dev
   ```
   Le front est accessible sur http://localhost:5173 (ou le port configuré dans Vite).

3. **Créer un compte administrateur**
   - Créer un utilisateur normalement via le front (`/auth/register`).
   - Aller dans la base de données (via Prisma Studio ou un client SQL) et passer le champ `role` de cet utilisateur à `"admin"`.
   - Exemple avec Prisma Studio :
     ```bash
     cd server
     npx prisma studio
     ```
     Ouvrir ensuite la table des utilisateurs et éditer le champ `role`.

4. **Accéder à la page admin en local**
   - Ouvrir le navigateur sur : http://localhost:5173/admin
   - Si l’utilisateur n’est pas connecté ou n’est pas admin, il est redirigé vers la page de connexion.
   - Si l’utilisateur est connecté et a `role = "admin"`, il voit le tableau de bord admin.

### En production (une fois le site hébergé)

Une fois le projet déployé :
- Le front sera accessible via une URL de type : https://votre-domaine.com
- L’API sera accessible derrière une URL d’API (ou sur le même domaine via un reverse proxy).

L’espace administrateur sera accessible via : https://votre-domaine.com/admin

Pour y accéder, l’utilisateur doit disposer d’un compte avec le rôle `admin` (créé via un seeding, une commande d’administration ou une modification directe en base) et être connecté.

Lorsque le nom de domaine sera définitif (par ex. https://app.comptamatch.fr), l’URL d’accès administrateur deviendra : https://app.comptamatch.fr/admin.
