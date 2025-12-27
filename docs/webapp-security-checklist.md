# WebApp sécurité & tests manuels

Plan rapide pour vérifier l'étanchéité par fiche (ComptaPro/ComptAsso) et les flux critiques.

## Préparation
- Créer deux utilisateurs distincts : **User A** et **User B**.
- Créer au moins une fiche **A1** pour User A (type ComptaPro) et éventuellement **A2** (type ComptaAsso).
- (Optionnel) Créer une fiche pour User B pour vérifier l'isolement total.

## Contrôles routes /app
- Déconnecté : accéder à `/app/comptapro/{A1}` et `/app/comptasso/{A2}` redirige vers la page de connexion.
- User A connecté :
  - `/app/comptapro/{A1}` charge correctement.
  - `/app/comptasso/{A1}` retourne 404 (mismatch de type attendu).
- User B connecté :
  - `/app/comptapro/{A1}` et `/app/comptasso/{A1}` retournent 404/403 sans fuite d'information.

## API fiches & contexte
- `GET /api/app/comptapro/fiche/{A1}/context` : 200 pour User A, 403/404 pour User B.
- `GET /api/app/comptasso/fiche/{A1}/context` : 404 (mismatch type).

## Comptabilité
- `GET /api/app/comptapro/comptabilite/{A1}/summary` : succès pour User A, 404 type mismatch, 403 pour User B.
- Création d'écriture (`POST /api/app/comptapro/comptabilite/{A1}/entries`) : succès User A, 403/404 pour User B.

## Documents
- Upload via `POST /api/app/comptapro/documents/{A1}/upload` (PDF/JPG/PNG < 20MB) : succès User A.
- Listing `GET /api/app/comptapro/documents/{A1}` : visible uniquement par User A.
- Download `GET /api/app/comptapro/documents/{A1}/{docId}/download` : fonctionne pour User A, 403/404 sinon.
- Suppression `DELETE /api/app/comptapro/documents/{A1}/{docId}` : supprime fichier et ligne DB.

## Paramètres fiche
- `GET /api/app/comptapro/fiche/{A1}/settings` : succès User A, 403/404 User B.
- `PUT /api/app/comptapro/fiche/{A1}/settings` : renommer la fiche, changer la devise; persistance après rafraîchissement.

## Session expirée
- Forcer l'expiration de session (ou supprimer le cookie) puis appeler une route `/api/app/...` : obtenir 401, redirection front vers `/auth/login`.

## Vérifications supplémentaires
- Rafraîchir le navigateur sur toutes les pages WebApp : aucune erreur de routing, la page d'erreur dédiée s'affiche en cas de 401/403/404.
- Vérifier qu'aucune URL `/storage` ou `uploads` n'est accessible sans passer par les routes sécurisées.
- Contrôler que les réponses JSON ne renvoient pas d'informations sensibles (e-mail d'autres users, etc.).
