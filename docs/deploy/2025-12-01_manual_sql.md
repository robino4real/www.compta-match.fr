# Script SQL manuel – Mise en conformité Stripe & PromoCode

Exécuter dans l’ordre via phpPgAdmin (PostgreSQL). Toutes les commandes sont idempotentes et ne suppriment aucune donnée.

## 1. Colonne manquante PromoCode.productCategoryId
```sql
ALTER TABLE "PromoCode"
ADD COLUMN IF NOT EXISTS "productCategoryId" TEXT NULL;

CREATE INDEX IF NOT EXISTS "PromoCode_productCategoryId_idx"
  ON "PromoCode"("productCategoryId");

ALTER TABLE "PromoCode"
ADD CONSTRAINT IF NOT EXISTS "PromoCode_productCategoryId_fkey"
FOREIGN KEY ("productCategoryId") REFERENCES "DownloadableCategory"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
```

## 2. Sécurisation des identifiants Stripe
```sql
CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripeSessionId_key"
  ON "Order"("stripeSessionId")
  WHERE "stripeSessionId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripePaymentIntentId_key"
  ON "Order"("stripePaymentIntentId")
  WHERE "stripePaymentIntentId" IS NOT NULL;
```

## 3. Jetons de téléchargement
```sql
CREATE UNIQUE INDEX IF NOT EXISTS "DownloadLink_token_key"
  ON "DownloadLink"("token");
```

## Vérifications rapides
```sql
-- Vérifier la présence de la colonne
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'PromoCode' AND column_name = 'productCategoryId';

-- Vérifier les index Stripe
\d "Order";
\d "PromoCode";
```
