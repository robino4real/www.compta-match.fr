-- AlterEnum
BEGIN;
CREATE TYPE "PromoTargetType_new" AS ENUM ('ALL', 'PRODUCT', 'CATEGORY');
ALTER TABLE "PromoCode" ALTER COLUMN "targetType" DROP DEFAULT;
ALTER TABLE "PromoCode" ALTER COLUMN "targetType" TYPE "PromoTargetType_new" USING ("targetType"::text::"PromoTargetType_new");
ALTER TYPE "PromoTargetType" RENAME TO "PromoTargetType_old";
ALTER TYPE "PromoTargetType_new" RENAME TO "PromoTargetType";
DROP TYPE "PromoTargetType_old";
ALTER TABLE "PromoCode" ALTER COLUMN "targetType" SET DEFAULT 'ALL';
COMMIT;

-- AlterTable
ALTER TABLE "PromoCode" ALTER COLUMN "targetType" SET DEFAULT 'ALL';

