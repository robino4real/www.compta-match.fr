# Checklist SQL / Prisma (déploiement cPanel/phpPgAdmin)

Cette checklist sert à éviter les collisions SQL (enum déjà existant, table manquante) et à valider l'état des migrations **avant** d'agir sur la base LWS/cPanel.

## Vérifications locales (Mac)
1. Copier la base distante si nécessaire (dump) dans un Postgres local.
2. Positionner `DATABASE_URL` vers la base de test.
3. Inspecter l'état des migrations Prisma :
   - `npx prisma migrate status`
   - `npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url "$DATABASE_URL" --script` (aperçu des changements attendus)
4. Générer le client Prisma pour vérifier le schéma :
   - `npm run prisma:generate`

## Procédure d'application manuelle sur cPanel/phpPgAdmin
1. Sauvegarder la base avant toute action (export SQL complet).
2. Appliquer les migrations dans l'ordre numérique des dossiers `prisma/migrations`.
3. Pour chaque migration SQL :
   - Si l'exécution passe ✅, continuer.
   - Si une erreur « already exists » apparaît sur un **enum**, vérifier si le type existe déjà. Grâce aux blocs `DO $$ IF NOT EXISTS $$`, relancer la migration après confirmation ou passer à la suivante si le reste est déjà en place.
   - Si une erreur concerne une **table déjà créée** (Cas A), sauter le `CREATE TABLE` et appliquer uniquement les index/contraintes manquants.
   - Si un **enum existe mais la table associée est absente** (Cas B), créer manuellement la table manquante ou adapter le script pour ne créer que la table.
   - Si une **colonne est manquante** (Cas C), exécuter uniquement l'`ALTER TABLE ... ADD COLUMN ...` correspondant.
4. Après chaque migration, recharger la page phpPgAdmin et vérifier que les index/contraintes attendus sont présents.
5. Si une migration échoue de façon irrécupérable, consigner l'erreur et arrêter le déploiement (ne pas continuer en aveugle).

## Objets critiques à vérifier
- Enums : `AppFicheType`, `BrandTone`, `OrderType`, `SubscriptionBrand`, `AccountType` (doivent exister avant les tables qui les utilisent).
- Tables : `SeoSettingsV2`, `PageSeo`, `ProductSeo`, `GeoIdentity`, `GeoFaqItem`, `GeoAnswer`, `AppFiche`, `AccountingEntry`, `AccountingDocument`.
- Colonnes : `AppFiche.currency`, `AppFiche.fiscalYearStartMonth`.

## Contrôles post-déploiement
1. Lancer `SELECT * FROM information_schema.tables WHERE table_name IN (...)` pour confirmer la présence des tables critiques.
2. Tester l'endpoint admin `/api/admin/db-status` (authentifié) pour afficher les tables/colonnes manquantes.
3. Vérifier les routes publiques `/api/health` et les pages app pour s'assurer que les protections runtime renvoient des erreurs explicites plutôt qu'un crash.
