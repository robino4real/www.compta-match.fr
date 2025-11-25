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

## Mises à jour blog / articles

**Fichiers créés / modifiés :**
- Prisma : `server/prisma/schema.prisma`, `server/prisma/migrations/20250115120000_articles/migration.sql`, `server/prisma/migrations/20250122120000_article_author/migration.sql`, `server/prisma/migrations/migration_lock.toml`
- API : `server/src/index.ts`, `server/src/routes/adminRoutes.ts`, `server/src/routes/articleRoutes.ts`, `server/src/controllers/articleController.ts`, `server/src/services/articleService.ts`
- Front public : `client/src/pages/ArticlesPage.tsx`, `client/src/pages/ArticleDetailPage.tsx`, `client/src/components/Header.tsx`, `client/src/components/Footer.tsx`, `client/src/App.tsx`
- Back-office : `client/src/pages/admin/AdminArticlesPage.tsx`, `client/src/pages/admin/AdminArticleEditPage.tsx`

**Résumé :**
- Ajout du modèle Prisma `Article` (statuts brouillon/publié/archivé, SEO, image, catégorie, temps de lecture, auteur affiché) et migrations associées.
- Mise en place des routes API publiques (`/articles`, `/articles/:slug`) et admin pour créer/lister/éditer les articles.
- Nouvelles pages front : liste et détail des articles avec métadonnées, lien depuis le header/footer et affichage de l'auteur quand il est renseigné.
- Nouvelles pages back-office : tableau de bord des articles avec filtres, colonne auteur et formulaire de création/édition inspiré de WordPress (titre large, slug sous le titre, panneau latéral de publication, carte SEO).
