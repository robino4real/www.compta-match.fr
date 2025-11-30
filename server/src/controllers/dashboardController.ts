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

export async function getDashboard(req: Request, res: Response) {
  try {
    const range = parseRange(req.query.range as string | string[] | undefined);
    const stats = await getDashboardStats(range);
    return res.json({ stats });
  } catch (error) {
    console.error("Erreur lors du chargement du dashboard admin", error);
    return res.status(500).json({ message: "Impossible de charger les statistiques." });
  }
}
