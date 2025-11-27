import { Request, Response } from "express";
import { getDashboardStats } from "../services/dashboardStatsService";

function parseRange(range?: string | string[]) {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  const value = Array.isArray(range) ? range[0] : range;

  switch (value) {
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "ytd":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "all":
      start = new Date(2020, 0, 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
}

export async function getDashboard(req: Request, res: Response) {
  try {
    const { from, to, range } = req.query;

    const fallback = parseRange(range as string | undefined);

    const dateFrom = from ? new Date(from as string) : fallback.start;
    const dateTo = to ? new Date(to as string) : fallback.end;

    const stats = await getDashboardStats(dateFrom, dateTo);
    return res.json({ stats });
  } catch (error) {
    console.error("Erreur lors du chargement du dashboard admin", error);
    return res.status(500).json({ message: "Impossible de charger les statistiques." });
  }
}
