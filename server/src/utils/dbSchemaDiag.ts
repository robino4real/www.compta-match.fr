import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

export type DbIdentity = {
  db: string | null;
  schema: string | null;
  version?: string | null;
  urlHost?: string | null;
  urlDb?: string | null;
};

export type ExpectedColumnsCheck = {
  ok: boolean;
  missing: string[];
  present: string[];
};

export type DbSchemaDiagnostics = {
  dbIdentity: DbIdentity;
  expectedColumnsCheck: ExpectedColumnsCheck;
  timestamp: Date;
};

const PROMO_CODE_TABLE = "PromoCode";
const PROMO_CODE_COLUMNS = [
  "sponsorPhone",
  "sponsorAddress",
  "sponsorBankName",
  "sponsorIban",
  "productCategoryId",
];

let latestDiagnostics: DbSchemaDiagnostics | null = null;

function extractDatabaseUrlInfo(): { urlHost: string | null; urlDb: string | null } {
  try {
    const url = new URL(env.databaseUrl);
    return {
      urlHost: url.host || null,
      urlDb: url.pathname.replace(/^\//, "") || null,
    };
  } catch (error) {
    console.warn("[db-identity] Impossible de parser DATABASE_URL", error);
    return { urlHost: null, urlDb: null };
  }
}

export async function getDbIdentity(prisma: PrismaClient): Promise<DbIdentity> {
  try {
    const [row] = await prisma.$queryRaw<{ db: string; schema: string }[]>`\
      SELECT current_database() as db, current_schema() as schema\
    `;
    const [versionRow] = await prisma.$queryRaw<{ version: string }[]>`SELECT version()`;

    return {
      db: row?.db || null,
      schema: row?.schema || null,
      version: versionRow?.version || null,
      ...extractDatabaseUrlInfo(),
    };
  } catch (error) {
    console.error("[db-identity] Erreur lors de la récupération de l'identité DB", error);
    return {
      db: null,
      schema: null,
      version: null,
      ...extractDatabaseUrlInfo(),
    };
  }
}

export async function checkExpectedColumns(
  prisma: PrismaClient
): Promise<ExpectedColumnsCheck> {
  try {
    const tableRows = await prisma.$queryRaw<{ table_name: string }[]>`\
      SELECT table_name\
      FROM information_schema.tables\
      WHERE table_schema = 'public'\
        AND table_name = ${PROMO_CODE_TABLE}\
      LIMIT 1\
    `;

    if (!tableRows.length) {
      return { ok: false, missing: ["PromoCode table missing"], present: [] };
    }

    const rows = await prisma.$queryRaw<{ column_name: string }[]>`\
      SELECT column_name\
      FROM information_schema.columns\
      WHERE table_schema = 'public'\
        AND table_name = ${PROMO_CODE_TABLE}\
        AND column_name = ANY(${PROMO_CODE_COLUMNS})\
    `;

    const present = rows.map((row) => row.column_name).filter(Boolean);
    const missing = PROMO_CODE_COLUMNS.filter((column) => !present.includes(column));

    return {
      ok: missing.length === 0,
      missing,
      present,
    };
  } catch (error) {
    console.error("[db-schema] Erreur lors de la vérification des colonnes PromoCode", error);
    return { ok: false, missing: ["Schema check failed"], present: [] };
  }
}

export async function runDbSchemaDiagnostics(prisma: PrismaClient): Promise<DbSchemaDiagnostics> {
  const dbIdentity = await getDbIdentity(prisma);
  const expectedColumnsCheck = await checkExpectedColumns(prisma);

  latestDiagnostics = {
    dbIdentity,
    expectedColumnsCheck,
    timestamp: new Date(),
  };

  return latestDiagnostics;
}

export function getLatestDbSchemaDiagnostics(): DbSchemaDiagnostics | null {
  return latestDiagnostics;
}

export function hasPromoCodeSchemaMismatch(): boolean {
  return latestDiagnostics?.expectedColumnsCheck?.ok === false;
}
