import { DashboardRange } from "../types/dashboard";

export type DateInterval = { from: Date | null; to: Date | null };
export type TimelineBucket = "month" | "day" | "hour";

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

export function getRangeBounds(range: DashboardRange): DateInterval {
  const now = new Date();
  const to = new Date(now);

  switch (range) {
    case "all":
      return { from: null, to: null };
    case "year": {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from, to };
    }
    case "month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to };
    }
    case "week": {
      const from = startOfWeek(now);
      return { from, to };
    }
    case "day":
    default: {
      const from = startOfDay(now);
      return { from, to };
    }
  }
}

export function getTimelineBucket(range: DashboardRange): TimelineBucket {
  if (range === "day") return "hour";
  if (range === "month" || range === "week") return "day";
  return "month";
}
