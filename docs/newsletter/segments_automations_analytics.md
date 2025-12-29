# Newsletter — Segments, Automations & Analytics

## Modèles Prisma ajoutés
- `NewsletterSegment` + `NewsletterSegmentCache`
- `NewsletterAutomation`, `NewsletterAutomationStep`, `NewsletterAutomationRun`
- `NewsletterRevenueAttribution`
- Champs `lastEmailOpenAt` / `lastEmailClickAt` sur `CustomerMetrics`

## API Admin
- `GET/POST/PATCH/DELETE /api/admin/newsletter/segments`
- `POST /api/admin/newsletter/segments/:id/preview`
- `GET/POST/PATCH /api/admin/newsletter/automations` (+ activate/pause, runs)
- `GET /api/admin/newsletter/analytics/{overview,campaigns,segments,cohorts}`

## Services
- `segmentEngine` : prévisualisation + cache des segments, règles (status, tags, sources, métriques, activité email, opérateurs AND/OR, BETWEEN, LAST_X_DAYS...).
- `automationEngine` : déclenchement sur events (inscription, paiement, inactivité), envoi différé des steps email, worker toutes les 30s.
- `revenueService` : attribution CA post-clic (fenêtre 7 jours).

## UI Admin
- Onglet Segments (création rapide + tableau)
- Onglet Automations (création d'un flow basique + liste)
- Onglet Analytics (KPI, revenu par campagne, taille segments)

## Tracking & ROI
- Mise à jour des métriques email sur open/click
- Attribution commande → campagne si clic < 7j

## Prochaines extensions
- Conditions d'étape plus riches et builders visuels
- Détails cohorte/timeline client (email → clic → achat)
- Garde-fous fréquence et limites par jour
