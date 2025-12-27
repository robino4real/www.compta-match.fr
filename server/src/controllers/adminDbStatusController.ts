import { Request, Response } from "express";
import { getDbStatus } from "../utils/dbReadiness";

const CRITICAL_TABLES = [
  "SeoSettingsV2",
  "PageSeo",
  "ProductSeo",
  "GeoIdentity",
  "GeoFaqItem",
  "GeoAnswer",
  "AppFiche",
  "AccountingEntry",
  "AccountingDocument",
];

const CRITICAL_COLUMNS = [
  { table: "AppFiche", column: "currency" },
  { table: "AppFiche", column: "fiscalYearStartMonth" },
];

export async function getAdminDbStatus(_req: Request, res: Response) {
  try {
    const status = await getDbStatus(CRITICAL_TABLES, CRITICAL_COLUMNS);
    return res.json({ ok: true, data: status });
  } catch (error) {
    console.error("[admin-db] Impossible de vérifier le statut DB", error);
    return res
      .status(500)
      .json({ ok: false, error: { message: "Impossible de vérifier le statut DB", code: "DB_STATUS_ERROR" } });
  }
}
