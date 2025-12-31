# Sauvegardes documents et dossier de sûreté

Ce document résume le fonctionnement des sauvegardes de documents côté serveur pour les espaces **ComptAsso** et **ComptaPro**. Il est rédigé en deux parties :

1. **Vue technique** (où sont stockés les fichiers, quelles variables d'environnement utiliser, comment les sauvegardes fonctionnent).
2. **Version simple** pour expliquer rapidement à toute personne où trouver les fichiers et à quoi ils servent.

---

## 1) Vue technique

### Dossiers utilisés
- `DOCUMENTS_STORAGE_ROOT` (par défaut : `../app-storage/documents` depuis le dossier `server`) : emplacement principal des documents envoyés par les utilisateurs.
- `SURETY_BACKUP_ROOT` (par défaut : `../app-storage/surety-backups`) : copie miroir des documents classés par **utilisateur / type de fiche / fiche / document** pour garantir la pérennité même lors d'une mise à jour CPanel.

Ces deux dossiers sont créés automatiquement si besoin. Ils sont situés en dehors du dossier `server` pour ne pas être écrasés lors des déploiements.

### Arborescence des fichiers
```
DOCUMENTS_STORAGE_ROOT/
  └─ <userId>/<ficheId>/<documentId>/document.pdf

SURETY_BACKUP_ROOT/
  └─ <userId>/<comptapro|comptasso>/<ficheId>/<documentId>/document.pdf
```

### Points d'entrée serveur
- `server/src/config/storage.ts` : centralise les chemins (`DOCUMENTS_STORAGE_ROOT`, `SURETY_BACKUP_ROOT`).
- `server/src/utils/documentStorage.ts` : création des dossiers, construction des chemins de sûreté, compatibilité des anciens chemins.
- `server/src/controllers/appDocumentsController.ts` : upload/suppression des documents ; copie immédiate dans le dossier de sûreté.
- `server/src/controllers/adminBackupController.ts` : liste et téléchargement des sauvegardes de sûreté pour l'admin.
- `server/src/routes/adminRoutes.ts` et `server/src/routes/appRoutes.ts` : exposent les routes d'API correspondantes.

### Comportement
- À chaque upload, le fichier est écrit dans `DOCUMENTS_STORAGE_ROOT` **et** copié dans `SURETY_BACKUP_ROOT`.
- À la suppression, les deux emplacements sont nettoyés.
- L'admin peut consulter/télécharger les copies de sûreté depuis le back office (onglet "Sauvegardes de sûreté").

---

## 2) Explication simple
- Les documents des clients sont rangés dans un dossier principal **documents** qui reste en place même quand on met à jour le site.
- Chaque document est aussi dupliqué dans un dossier de **sauvegarde de sûreté** pour éviter toute perte.
- Les deux dossiers se trouvent en dehors du code du site (dans `app-storage` par défaut) pour qu'une mise à jour ne les efface pas.
- Dans le back office, l'onglet **"Sauvegardes de sûreté"** permet de voir et télécharger ces copies classées par client et par type de fiche.

### Où trouver quoi ?
- Chemins configurables : variables d'environnement `DOCUMENTS_STORAGE_ROOT` et `SURETY_BACKUP_ROOT` (sinon `app-storage/documents` et `app-storage/surety-backups`).
- Fichiers de code clés :
  - `server/src/config/storage.ts` (chemins)
  - `server/src/utils/documentStorage.ts` (gestion des dossiers)
  - `server/src/controllers/appDocumentsController.ts` (upload/suppression)
  - `server/src/controllers/adminBackupController.ts` (interface admin)
  - `client/src/pages/admin/AdminSuretyBackupsPage.tsx` (page back office)

En résumé : les documents et leurs copies de secours sont stockés de manière persistante et restent disponibles après une mise à jour du site.
