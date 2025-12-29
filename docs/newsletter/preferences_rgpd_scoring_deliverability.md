# Newsletter — Préférences, RGPD, Scoring & Délivrabilité

## Centre de préférences public
- Routes publiques :
  - `GET /api/newsletter/preferences?token=...` retourne email + préférences (topics, fréquence, toggles).
  - `POST /api/newsletter/preferences?token=...` enregistre les préférences (et désinscription hard si demandé).
  - `POST /api/newsletter/unsubscribe?token=...` désinscription directe.
- Token HMAC (secret `NEWSLETTER_SIGNING_SECRET`), expiré après 30 jours.

## RGPD avancé
- Export admin : `POST /api/admin/newsletter/subscribers/:id/export` (abonné, consent logs, préférences, send logs, events).
- Anonymisation : `POST /api/admin/newsletter/subscribers/:id/anonymize` (email hashé, statut ANONYMIZED, tokens invalidés).
- Journalisation : table `RGPDLog` pour tracer export/anonymisation.

## Scoring abonnés
- Table `NewsletterScore` avec breakdown JSON.
- Règles simples (0–100) : open<7j, click<7j, achat<30j, high spender, inactivité>30/60j.
- Recalculé après événements clients et événements email.
- Visible dans la liste abonnés admin (colonne “Score”).

## Délivrabilité & hygiène
- Table `NewsletterDeliverabilityStatus` (domaine + SPF/DKIM/DMARC) et `NewsletterAlert`.
- UI admin onglet “Délivrabilité” : checklist + alertes.
- Routes admin :
  - `GET /api/admin/newsletter/deliverability`
  - `PATCH /api/admin/newsletter/deliverability`
  - `GET /api/admin/newsletter/alerts`

## Sécurité & limites
- Désinscription hard via préférences -> statut UNSUBSCRIBED + log.
- Token HMAC pour préférences/désinscription publiques.
- Champs `preferencesJson`, `unsubscribedAt`, statut `ANONYMIZED` ajoutés à `NewsletterSubscriber`.
