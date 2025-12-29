# Assistant d'auto-remplissage SEO / GEO

## Règles de génération (déterministes)
- Basé uniquement sur les données en base (paramètres SEO/GEO, pages actives, produits actifs).
- Aucune requête vers un service IA externe.
- Valeurs par défaut orientées ComptaMatch :
  - URL canonique par défaut : `https://www.compta-match.fr`
  - SiteName : `ComptaMatch`
  - Titre par défaut : `ComptaMatch — Logiciels de comptabilité simples pour indépendants, TPE et associations`
  - Description par défaut courte (≈160 caractères) couvrant comptabilité, facturation et conformité France.
  - robots.txt : autorise tout et référence le sitemap absolu.
  - Sitemap activé pour pages/produits, articles désactivés par défaut.
- Identité GEO : ton pédagogique/pro, public cible "Indépendants, TPE, associations", différenciation sans abonnement.
- FAQ GEO : 6–10 questions courtes, réponses factuelles en 2–4 phrases.
- Réponses IA GEO : 3–5 blocs avec réponse courte et longue structurée.
- SEO pages/produits : titres `{Nom} | ComptaMatch`, description dérivée du contenu existant ou fallback global.

## Sécurité & workflow
- Prévisualisation obligatoire (endpoint `/api/admin/seo-geo/autofill/preview`).
- Mode `FILL_ONLY_MISSING` par défaut ; mode `OVERWRITE` exige une confirmation explicite.
- Application (endpoint `/api/admin/seo-geo/autofill/apply`) effectuée en transaction Prisma.
- Aucune valeur inventée si les données sources sont absentes (fallback sur global sans promesse fonctionnelle).
