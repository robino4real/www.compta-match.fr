import { Request, Response } from "express";
import { getDashboardStats } from "../services/dashboardStatsService";
import { DashboardRange } from "../types/dashboard";

const allowedRanges: DashboardRange[] = ["all", "year", "month", "week", "day"];

function parseRange(range?: string | string[]): DashboardRange {
  const value = Array.isArray(range) ? range[0] : range;
  if (value && allowedRanges.includes(value as DashboardRange)) {
    return value as DashboardRange;
  }
  return "month";
}

function parseBoolean(value: string | string[] | undefined, defaultValue: boolean): boolean {
  if (typeof value === "undefined") {
    return defaultValue;
  }

  const normalized = Array.isArray(value) ? value[0] : value;
  return ["true", "1", "yes", "on"].includes(normalized.toLowerCase());
}

export async function getDashboard(req: Request, res: Response) {
  try {
    const range = parseRange(req.query.range as string | string[] | undefined);
    const includeTestAccount = parseBoolean(
      req.query.includeTestAccount as string | string[] | undefined,
      true
    );
    const stats = await getDashboardStats(range, { includeTestAccount });
    return res.json({ stats });
  } catch (error) {
    console.error("Erreur lors du chargement du dashboard admin", error);
    return res.status(500).json({ message: "Impossible de charger les statistiques." });
  }
}
