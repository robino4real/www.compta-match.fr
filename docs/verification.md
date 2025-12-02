# Vérifications front/back office

## Page des logiciels (`/logiciels`)
- La section `DownloadableProductsSection` charge la liste publique via `GET ${API_BASE_URL}/downloadable-products/public` puis alimente le carrousel et les détails produits en temps réel, en réagissant aux erreurs de l’API. 【F:client/src/components/downloadable-products/DownloadableProductsSection.tsx†L26-L102】
- Le back office expose la création et la mise à jour des logiciels téléchargeables (`/admin/downloadable-products` + `/admin/downloadable-products/:id`) ainsi que l’archivage/restauration, ce qui alimente le carrousel public dès qu’un produit actif est ajouté, modifié ou archivé. 【F:server/src/controllers/adminDownloadController.ts†L24-L137】
- La route publique `/downloadable-products/public` retourne uniquement les produits actifs et non archivés avec leurs visuels et tags, garantissant la synchro en temps réel entre back office et carrousel. 【F:server/src/controllers/catalogController.ts†L176-L216】

## Page d’accueil (`/`)
- Le composant `HomePage` récupère les réglages depuis `GET ${API_BASE_URL}/public/homepage` et applique dynamiquement titres, sous-titres, visuel héro et icônes de features, avec fallback si l’API est indisponible. Les balises `TitleTag`/`SubtitleTag` permettent de choisir le niveau de titre (influence indirecte sur la taille et le style via le CSS). 【F:client/src/pages/HomePage.tsx†L33-L118】
- L’interface d’administration `AdminHomepagePage` charge (`GET /admin/homepage`) puis sauvegarde (`PUT /admin/homepage`) les textes, liens, images (illustration, logo, favicon) et champs de mise en forme (tags de titre/sous-titre, style du bouton), offrant un contrôle complet depuis le back office. 【F:client/src/pages/admin/AdminHomepagePage.tsx†L38-L134】【F:client/src/pages/admin/AdminHomepagePage.tsx†L204-L310】
- Le service `homepageSettingsService` persiste les valeurs éditées (textes, images, tags de titre/sous-titre, style de bouton, icônes des features) via Prisma, garantissant que les modifications admin se répercutent sur la page publique. 【F:server/src/services/homepageSettingsService.ts†L88-L148】
