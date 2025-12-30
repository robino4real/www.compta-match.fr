import { Request, Response } from "express";
import { getDashboardStats } from "../services/dashboardStatsService";
import { DashboardRange } from "../types/dashboard";
import { RangeSelection } from "../utils/dashboardRange";

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

function parseInteger(
  value: string | string[] | undefined,
  defaultValue: number,
  bounds?: { min?: number; max?: number }
): number {
  const normalized = Array.isArray(value) ? value[0] : value;
  const parsed = normalized ? Number.parseInt(normalized, 10) : Number.NaN;

  if (Number.isNaN(parsed)) return defaultValue;
  if (typeof bounds?.min === "number" && parsed < bounds.min) return defaultValue;
  if (typeof bounds?.max === "number" && parsed > bounds.max) return defaultValue;
  return parsed;
}

function parseDate(value: string | string[] | undefined): Date | null {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getDashboard(req: Request, res: Response) {
  try {
    const range = parseRange(req.query.range as string | string[] | undefined);
    const includeTestAccount = parseBoolean(
      req.query.includeTestAccount as string | string[] | undefined,
      true
    );
    const now = new Date();
    const requestedYear = parseInteger(req.query.year as string | string[] | undefined, now.getFullYear());
    const requestedMonth = parseInteger(
      req.query.month as string | string[] | undefined,
      now.getMonth() + 1,
      { min: 1, max: 12 }
    );
    const requestedWeekStart = parseDate(req.query.weekStart as string | string[] | undefined);
    const requestedDay = parseDate(req.query.day as string | string[] | undefined);

    const selection: RangeSelection = {};
    if (range === "year") selection.year = requestedYear;
    if (range === "month") {
      selection.year = requestedYear;
      selection.month = requestedMonth;
    }
    if (range === "week" && requestedWeekStart) selection.weekStart = requestedWeekStart.toISOString();
    if (range === "day" && requestedDay) selection.day = requestedDay.toISOString();

    const stats = await getDashboardStats(range, { includeTestAccount, selection });
    return res.json({ stats });
  } catch (error) {
    console.error("Erreur lors du chargement du dashboard admin", error);
    return res.status(500).json({ message: "Impossible de charger les statistiques." });
  }
}
