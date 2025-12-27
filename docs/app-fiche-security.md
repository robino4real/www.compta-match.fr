# Sécurité WebApp ComptaPro / ComptAsso

Fondations mises en place pour garantir l'isolement strict des fiches WebApp.

## Middlewares et règles
- Authentification obligatoire : `requireAuth`.
- Contrôle d'accès fiche : `requireFicheAccess` (extrait `ficheId` depuis `params` puis `query`, charge la fiche Prisma, renvoie 404 si absente, 403 si l'utilisateur n'est pas propriétaire, attache `req.fiche`).
- Helper standard : `withFicheAccess(handler)` applique automatiquement `requireAuth + requireFicheAccess` pour toute route `/api/app/...`.
- Exemple d'API sécurisée : `GET /api/app/fiche/:ficheId/context` renvoie `{ ok: true, fiche, user }` sans données sensibles.
- Entrée WebApp serveur : routes dédiées `GET /app/comptapro/:ficheId` et `GET /app/comptasso/:ficheId` utilisent `requireAuth + requireFicheAccess` et valident le type avant de servir l'UI ou un placeholder sécurisé.
- Listing propriétaire : `GET /api/app/fiches?type=COMPTAPRO|COMPTASSO` renvoie uniquement les fiches de l'utilisateur connecté.

## Checklist de tests manuels
1. **Création** : User A crée une fiche `A1`.
2. **Isolation API** : User B authentifié appelle `/api/app/fiche/A1/context` → réponse `403`.
3. **Isolation WebApp** : User B authentifié ouvre `/app/comptapro/A1` → réponse `403` (ou redirection login si non authentifié).
4. **Accès propriétaire** : User A authentifié ouvre `/api/app/fiche/A1/context` puis `/app/comptapro/A1` → `200`.
5. **Fiche inexistante** : appel `/api/app/fiche/unknown/context` → `404` avec message générique.
6. **Ouverture depuis la liste** : User A clique sur une fiche ComptaPro/ComptAsso depuis son espace → ouverture dans un nouvel onglet `/app/...` correspondant.
7. **Refresh direct** : rechargement F5 sur `/app/comptapro/:ficheId` ou `/app/comptasso/:ficheId` reste sur l'URL et charge la WebApp, 403/401 si non autorisé.
