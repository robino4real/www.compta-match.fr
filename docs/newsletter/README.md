# Newsletter – Fondations

Cette itération ajoute la base de données, l’API admin et l’interface « Abonnés » pour la newsletter ComptaMatch.

## Modèles Prisma ajoutés

- `NewsletterSubscriber` : email unique, prénom/nom optionnels, statut (`ACTIVE`, `UNSUBSCRIBED`, `BOUNCED`, `COMPLAINED`), source, consentement (date, source, preuve JSON), liaison éventuelle avec `User`, tags (`String[]`), timestamps.
- `NewsletterConsentLog` : historique des actions de consentement (`OPT_IN`, `OPT_OUT`, `DOUBLE_OPTIN_CONFIRMED`) avec méta JSON.
- `CustomerActivityEvent` : trace les événements clients (inscription, login, commande, téléchargements…).
- `CustomerMetrics` : agrège l’activité par utilisateur (dernière activité/login, commandes et dépenses, téléchargements).

## Endpoints admin

Préfixe : `/api/admin/newsletter`

- `GET /subscribers` : liste paginée avec filtres `q`, `status`, `source`, `from`, `to`, `page`, `pageSize`, `sort` (`createdAt_desc` par défaut).
- `POST /subscribers` : crée un abonné (email requis) et journalise le consentement si actif.
- `PATCH /subscribers/:id` : met à jour un abonné (infos / statut / source / tags).
- `POST /subscribers/:id/unsubscribe` : désinscription (log OPT_OUT).
- `POST /subscribers/:id/resubscribe` : réactivation (log OPT_IN + refresh consentAt).
- `POST /subscribers/import` : import CSV (colonnes : `email`, `firstName`, `lastName`, `status`, `source`, `tags`, `consentSource`, `consentProof`).
- `GET /subscribers/export` : export CSV filtré (colonnes : email, prénom, nom, statut, source, consentAt, createdAt, tags).
- `GET /kpis` : compte actifs, désinscrits et nouveaux actifs sur la période (7d/30d/MTD/YTD ou plage personnalisée).

## Import / export CSV

**Import**
- Format UTF-8 avec entête.
- Champs : `email` (obligatoire), `firstName`, `lastName`, `status`, `source`, `tags` (séparateur virgule ou point-virgule), `consentSource`, `consentProof` (JSON sérialisé optionnel).
- Les emails sont dédupliqués (dernier enregistrement garde la main). Les statuts inconnus retombent sur `ACTIVE` et la source par défaut est `ADMIN_IMPORT`.

**Export**
- CSV encodé en UTF-8 avec entête.
- Champs : `email, firstName, lastName, status, source, consentAt, createdAt, tags` (tags séparés par `;`).

## Tracking d’activité

Le service `trackCustomerEvent` écrit dans `CustomerActivityEvent` et maintient `CustomerMetrics` (activité, commandes, téléchargements).

Événements branchés :
- Inscription (`USER_REGISTERED`).
- Connexion (`USER_LOGIN`).
- Création de commande (`ORDER_CREATED`).
- Paiement de commande (`ORDER_PAID`).
- Création de lien de téléchargement (`DOWNLOAD_CREATED`).
- Utilisation d’un lien de téléchargement (`DOWNLOAD_USED`).

Les futurs événements (campagnes/automations) pourront réutiliser la même brique.

## Segments, automations et analytics (prompt #3)

- Segments dynamiques (`NewsletterSegment`) évalués via `rulesJson` (opérateurs AND/OR, BETWEEN, IN/NOT_IN, LAST_X_DAYS) avec cache `NewsletterSegmentCache`.
- Automations (`NewsletterAutomation`) déclenchées sur événements (inscription, paiement, inactivité) et envoyées via `automationEngine` (worker 30s).
- Attribution de revenus post-clic via `NewsletterRevenueAttribution` (fenêtre 7 jours) exposée dans `/api/admin/newsletter/analytics/*`.
