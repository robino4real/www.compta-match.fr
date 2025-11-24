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
