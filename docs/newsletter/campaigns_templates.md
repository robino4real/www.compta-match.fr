# Newsletter — Campagnes & Templates

## Modèles Prisma ajoutés
- `NewsletterTemplate` : bibliothèque HTML, sujets par défaut.
- `NewsletterCampaign` : définition de campagne (audience, statut, compteurs, snapshot).
- `NewsletterSendBatch` : suivi d'exécution batch.
- `NewsletterSendLog` : traces d'envoi/statuts.
- `NewsletterLink` : tokens de redirection pour clicks.

## API Admin
- `GET /api/admin/newsletter/templates` – lister les templates.
- `POST /api/admin/newsletter/templates` – créer un template.
- `GET /api/admin/newsletter/templates/:id` – détail.
- `PATCH /api/admin/newsletter/templates/:id` – mise à jour.
- `POST /api/admin/newsletter/templates/:id/duplicate` – duplication rapide.
- `DELETE /api/admin/newsletter/templates/:id` – suppression.
- `GET /api/admin/newsletter/campaigns` – lister les campagnes (filtres statut/recherche).
- `POST /api/admin/newsletter/campaigns` – créer un brouillon.
- `GET /api/admin/newsletter/campaigns/:id` – détail.
- `PATCH /api/admin/newsletter/campaigns/:id` – éditer sujet/audience/template/html.
- `POST /api/admin/newsletter/campaigns/:id/schedule` – planifier.
- `POST /api/admin/newsletter/campaigns/:id/send-now` – envoyer immédiatement.
- `POST /api/admin/newsletter/campaigns/:id/cancel` – annuler.
- `GET /api/admin/newsletter/campaigns/:id/stats` – stats agrégées.
- `GET /api/admin/newsletter/campaigns/:id/recipients/preview` – prévisualiser la taille d'audience.
- `GET /api/admin/newsletter/settings` / `PATCH .../settings` – paramètres expéditeur SMTP (reuse EmailSettings).

## Audience JSON (simplifié)
```json
{
  "include": { "tags": ["premium"], "sources": ["ACCOUNT"] },
  "exclude": { "tags": ["churn"] }
}
```
Status `ACTIVE` est appliqué par défaut.

## Worker & envoi
- `startNewsletterWorker()` (intervalle 30s) déclenche les campagnes `SCHEDULED` arrivées à échéance.
- `sendCampaignNow` résout l'audience, crée les logs, envoie via transport SMTP existant et marque les statuts.
- Injecte pixel d'ouverture et lien de désinscription signé.

## Tracking
- Pixel : `GET /api/newsletter/open?c=:campaignId&l=:logId&t=:token` (image 1x1 gif).
- Click : `GET /r/:token?l=:logId` (redirection + incrément click/log).
- Unsubscribe : `GET /api/newsletter/unsubscribe?email=...&token=...` (statut UNSUBSCRIBED + log consent).

## Secrets
- `NEWSLETTER_SIGNING_SECRET` (fallback sur `JWT_SECRET`) sert à signer les tokens d'open/click/unsubscribe.
