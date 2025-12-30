import { DashboardRange } from "../types/dashboard";

export type DateInterval = { from: Date | null; to: Date | null };
export type TimelineBucket = "year" | "month" | "day" | "hour";
export type RangeSelection = {
  year?: number;
  month?: number;
  weekStart?: string;
  day?: string;
};

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date: Date): Date {
  const copy = startOfDay(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7; // Monday as start of week
  copy.setDate(copy.getDate() - diff);
  return copy;
}

export function getRangeBounds(range: DashboardRange, selection: RangeSelection = {}): DateInterval {
  const now = new Date();

  switch (range) {
    case "all":
      return { from: null, to: null };
    case "year": {
      const year = selection.year ?? now.getFullYear();
      const from = new Date(year, 0, 1);
      const to = new Date(year, 11, 31, 23, 59, 59, 999);
      return { from, to };
    }
    case "month": {
      const year = selection.year ?? now.getFullYear();
      const monthIndex = (selection.month ?? now.getMonth() + 1) - 1;
      const from = new Date(year, monthIndex, 1);
      const to = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
      return { from, to };
    }
    case "week": {
      const start = selection.weekStart ? startOfWeek(new Date(selection.weekStart)) : startOfWeek(now);
      const to = new Date(start);
      to.setDate(start.getDate() + 6);
      to.setHours(23, 59, 59, 999);
      return { from: start, to };
    }
    case "day":
    default: {
      const day = selection.day ? startOfDay(new Date(selection.day)) : startOfDay(now);
      const to = new Date(day);
      to.setHours(23, 59, 59, 999);
      return { from: day, to };
    }
  }
}

export function getTimelineBucket(range: DashboardRange): TimelineBucket {
  if (range === "all") return "year";
  if (range === "day") return "hour";
  if (range === "month" || range === "week") return "day";
  return "month";
}
