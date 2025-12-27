import { prisma } from "../config/prisma";
import { HttpError } from "./errors";

export type TableCheck = {
  name: string;
  exists: boolean;
};

export type ColumnCheck = {
  table: string;
  column: string;
  exists: boolean;
};

export type DbStatus = {
  tables: TableCheck[];
  columns: ColumnCheck[];
};

async function queryExistingTables(tables: string[]): Promise<string[]> {
  if (!tables.length) return [];

  const rows = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ANY(${tables})
  `;

  return rows.map((row) => row.table_name);
}

async function queryExistingColumns(
  checks: { table: string; column: string }[]
): Promise<string[]> {
  if (!checks.length) return [];

  const tableList = Array.from(new Set(checks.map((item) => item.table)));

  const rows = await prisma.$queryRaw<{ table_name: string; column_name: string }[]>`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY(${tableList})
  `;

  const existing = new Set(rows.map((row) => `${row.table_name}.${row.column_name}`));

  return Array.from(existing);
}

export async function getDbStatus(
  tableNames: string[],
  columnNames: { table: string; column: string }[] = []
): Promise<DbStatus> {
  const existingTables = await queryExistingTables(tableNames);
  const existingColumns = await queryExistingColumns(columnNames);

  return {
    tables: tableNames.map((name) => ({ name, exists: existingTables.includes(name) })),
    columns: columnNames.map(({ table, column }) => ({
      table,
      column,
      exists: existingColumns.includes(`${table}.${column}`),
    })),
  };
}

export async function assertTablesExist(tableNames: string[], context?: string) {
  const status = await getDbStatus(tableNames);
  const missing = status.tables.filter((t) => !t.exists).map((t) => t.name);

  if (missing.length) {
    const message = `Migration manquante: table(s) ${missing.join(", ")}`;
    console.error(`[db-check] ${message}`, { context, missing });
    throw new HttpError(500, message, "MIGRATION_MISSING");
  }
}

export async function assertColumnsExist(
  checks: { table: string; column: string }[],
  context?: string
) {
  const status = await getDbStatus([], checks);
  const missing = status.columns.filter((c) => !c.exists);

  if (missing.length) {
    const label = missing.map((c) => `${c.table}.${c.column}`).join(", ");
    const message = `Migration manquante: colonne(s) ${label}`;
    console.error(`[db-check] ${message}`, { context, missing });
    throw new HttpError(500, message, "MIGRATION_MISSING");
  }
}

export async function logCriticalSchemaStatus(
  tables: string[],
  columns: { table: string; column: string }[] = []
) {
  try {
    const status = await getDbStatus(tables, columns);
    const missingTables = status.tables.filter((t) => !t.exists).map((t) => t.name);
    const missingColumns = status.columns.filter((c) => !c.exists);

    if (missingTables.length || missingColumns.length) {
      console.warn("[db-check] Schéma incomplet détecté", {
        missingTables,
        missingColumns,
      });
    } else {
      console.log("[db-check] Schéma critique présent");
    }
  } catch (error) {
    console.error("[db-check] Impossible de vérifier le schéma", error);
  }
}
