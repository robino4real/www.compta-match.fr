"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbIdentity = getDbIdentity;
exports.checkExpectedColumns = checkExpectedColumns;
exports.runDbSchemaDiagnostics = runDbSchemaDiagnostics;
exports.getLatestDbSchemaDiagnostics = getLatestDbSchemaDiagnostics;
exports.hasPromoCodeSchemaMismatch = hasPromoCodeSchemaMismatch;
const env_1 = require("../config/env");
const PROMO_CODE_TABLE = "PromoCode";
const PROMO_CODE_COLUMNS = [
    "sponsorPhone",
    "sponsorAddress",
    "sponsorBankName",
    "sponsorIban",
    "productCategoryId",
];
let latestDiagnostics = null;
function extractDatabaseUrlInfo() {
    try {
        const url = new URL(env_1.env.databaseUrl);
        return {
            urlHost: url.host || null,
            urlDb: url.pathname.replace(/^\//, "") || null,
        };
    }
    catch (error) {
        console.warn("[db-identity] Impossible de parser DATABASE_URL", error);
        return { urlHost: null, urlDb: null };
    }
}
async function getDbIdentity(prisma) {
    try {
        const [row] = await prisma.$queryRaw `\
      SELECT current_database() as db, current_schema() as schema\
    `;
        const [versionRow] = await prisma.$queryRaw `SELECT version()`;
        return {
            db: row?.db || null,
            schema: row?.schema || null,
            version: versionRow?.version || null,
            ...extractDatabaseUrlInfo(),
        };
    }
    catch (error) {
        console.error("[db-identity] Erreur lors de la récupération de l'identité DB", error);
        return {
            db: null,
            schema: null,
            version: null,
            ...extractDatabaseUrlInfo(),
        };
    }
}
async function checkExpectedColumns(prisma) {
    try {
        const tableRows = await prisma.$queryRaw `\
      SELECT table_name\
      FROM information_schema.tables\
      WHERE table_schema = 'public'\
        AND table_name = ${PROMO_CODE_TABLE}\
      LIMIT 1\
    `;
        if (!tableRows.length) {
            return { ok: false, missing: ["PromoCode table missing"], present: [] };
        }
        const rows = await prisma.$queryRaw `\
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
    }
    catch (error) {
        console.error("[db-schema] Erreur lors de la vérification des colonnes PromoCode", error);
        return { ok: false, missing: ["Schema check failed"], present: [] };
    }
}
async function runDbSchemaDiagnostics(prisma) {
    const dbIdentity = await getDbIdentity(prisma);
    const expectedColumnsCheck = await checkExpectedColumns(prisma);
    latestDiagnostics = {
        dbIdentity,
        expectedColumnsCheck,
        timestamp: new Date(),
    };
    return latestDiagnostics;
}
function getLatestDbSchemaDiagnostics() {
    return latestDiagnostics;
}
function hasPromoCodeSchemaMismatch() {
    return latestDiagnostics?.expectedColumnsCheck?.ok === false;
}
