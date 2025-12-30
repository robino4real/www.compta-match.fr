import { prisma } from "../config/prisma";
import {
  DashboardCustomerStats,
  DashboardProductInteraction,
  DashboardProductSales,
  DashboardRange,
  DashboardStatsResponse,
  RevenuePoint,
} from "../types/dashboard";
import {
  getRangeBounds,
  getTimelineBucket,
  RangeSelection,
  TimelineBucket,
} from "../utils/dashboardRange";

const ORDER_STATUS_PAID = "PAID";
const TEST_ACCOUNT_EMAIL = "lesbazeilles@yahoo.fr";

type DashboardStatsOptions = {
  includeTestAccount?: boolean;
  selection?: RangeSelection;
};

function buildDateFilter(from: Date | null, to: Date | null) {
  if (!from && !to) return undefined;
  const dateClause: { gte?: Date; lte?: Date } = {};
  if (from) dateClause.gte = from;
  if (to) dateClause.lte = to;
  return {
    OR: [
      { paidAt: dateClause },
      {
        AND: [{ paidAt: null }, { createdAt: dateClause }],
      },
    ],
  };
}

function getOrderDate(order: { paidAt: Date | null; createdAt: Date }): Date {
  return order.paidAt ?? order.createdAt;
}

function formatBucketLabel(date: Date, bucket: TimelineBucket): string {
  switch (bucket) {
    case "hour":
      return `${date.getHours()}h`;
    case "day":
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      });
    case "year":
      return date.getFullYear().toString();
    case "month":
    default:
      return date.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });
  }
}

function bucketizeOrder(date: Date, bucket: TimelineBucket) {
  const bucketDate = new Date(date);
  if (bucket === "year") {
    bucketDate.setMonth(0, 1);
    bucketDate.setHours(0, 0, 0, 0);
  } else if (bucket === "month") {
    bucketDate.setDate(1);
    bucketDate.setHours(0, 0, 0, 0);
  } else if (bucket === "day") {
    bucketDate.setHours(0, 0, 0, 0);
  } else {
    bucketDate.setMinutes(0, 0, 0);
  }

  const key = bucketDate.toISOString();
  return {
    key,
    date: bucketDate,
    label: formatBucketLabel(bucketDate, bucket),
  };
}

function alignToBucketStart(date: Date, bucket: TimelineBucket) {
  return bucketizeOrder(date, bucket).date;
}

function getNextBucketStart(date: Date, bucket: TimelineBucket) {
  const next = new Date(date);
  if (bucket === "year") {
    next.setFullYear(date.getFullYear() + 1);
  } else if (bucket === "month") {
    next.setMonth(date.getMonth() + 1, 1);
  } else if (bucket === "day") {
    next.setDate(date.getDate() + 1);
  } else {
    next.setHours(date.getHours() + 1, 0, 0, 0);
  }

  return alignToBucketStart(next, bucket);
}

function buildTimelineRange(from: Date, to: Date, bucket: TimelineBucket) {
  const start = alignToBucketStart(from, bucket);
  const end = alignToBucketStart(to, bucket);
  const buckets: { key: string; date: Date; label: string }[] = [];

  for (let cursor = start; cursor <= end; cursor = getNextBucketStart(cursor, bucket)) {
    const { key, date, label } = bucketizeOrder(cursor, bucket);
    buckets.push({ key, date, label });
  }

  return buckets;
}

function buildOrderUserFilter(includeTestAccount: boolean) {
  if (includeTestAccount) {
    return {};
  }

  return { user: { email: { not: TEST_ACCOUNT_EMAIL } } };
}

function buildUserFilter(includeTestAccount: boolean) {
  if (includeTestAccount) {
    return undefined;
  }

  return { email: { not: TEST_ACCOUNT_EMAIL } };
}

async function computeSales(range: DashboardRange, includeTestAccount: boolean, selection: RangeSelection = {}) {
  const { from, to } = getRangeBounds(range, selection);
  const dateFilter = buildDateFilter(from, to);
  const userFilter = buildOrderUserFilter(includeTestAccount);

  const paidOrders = await prisma.order.findMany({
    where: {
      status: ORDER_STATUS_PAID,
      ...(dateFilter ? dateFilter : {}),
      ...userFilter,
    },
    include: {
      items: true,
    },
  });

  const totalRevenue = paidOrders.reduce((acc, order) => acc + order.totalPaid, 0);
  const totalStripeFees = paidOrders.reduce(
    (acc, order) => acc + (order.stripeFeeAmount ?? 0),
    0
  );
  const ordersCount = paidOrders.length;
  const netResult = totalRevenue - totalStripeFees;

  const bucket = getTimelineBucket(range);
  const timelineMap = new Map<string, { revenue: number; ordersCount: number; label: string; date: string }>();

  paidOrders.forEach((order) => {
    const orderDate = getOrderDate(order);
    const { key, label, date } = bucketizeOrder(orderDate, bucket);
    const current = timelineMap.get(key) || { revenue: 0, ordersCount: 0, label, date: date.toISOString() };
    timelineMap.set(key, {
      revenue: current.revenue + order.totalPaid,
      ordersCount: current.ordersCount + 1,
      label: current.label,
      date: current.date,
    });
  });

  const sortedOrders = paidOrders.sort((a, b) => getOrderDate(a).getTime() - getOrderDate(b).getTime());
  const timelineStart = alignToBucketStart(from ?? getOrderDate(sortedOrders[0] ?? new Date()), bucket);
  const timelineEnd = alignToBucketStart(to ?? getOrderDate(sortedOrders[sortedOrders.length - 1] ?? new Date()), bucket);

  const timeline: RevenuePoint[] = buildTimelineRange(timelineStart, timelineEnd, bucket).map(({ key, label, date }) => {
    const current = timelineMap.get(key);
    return {
      label,
      date: date.toISOString(),
      revenue: current?.revenue ?? 0,
      ordersCount: current?.ordersCount ?? 0,
    };
  });

  return {
    totalRevenue,
    totalStripeFees,
    netResult,
    ordersCount,
    timeline,
  };
}

async function computeCustomers(
  range: DashboardRange,
  includeTestAccount: boolean,
  selection: RangeSelection = {}
): Promise<DashboardCustomerStats> {
  const { from, to } = getRangeBounds(range, selection);
  const dateFilter = buildDateFilter(from, to);
  const newUsersDateFilter = from || to ? { createdAt: { gte: from ?? undefined, lte: to ?? undefined } } : {};
  const orderUserFilter = buildOrderUserFilter(includeTestAccount);
  const userFilter = buildUserFilter(includeTestAccount);

  const [totalRegisteredUsers, newUsersInRange, customersWithOrdersAllTime, customersWithOrdersInRange] =
    await Promise.all([
      prisma.user.count({ where: userFilter }),
      prisma.user.count({
        where: userFilter ? { ...newUsersDateFilter, ...userFilter } : newUsersDateFilter,
      }),
      prisma.order.groupBy({ by: ["userId"], where: { status: ORDER_STATUS_PAID, ...orderUserFilter } }),
      prisma.order.groupBy({
        by: ["userId"],
        where: { status: ORDER_STATUS_PAID, ...(dateFilter ? dateFilter : {}), ...orderUserFilter },
      }),
    ]);

  return {
    totalRegisteredUsers,
    newUsersInRange,
    customersWithOrdersAllTime: customersWithOrdersAllTime.length,
    customersWithOrdersInRange: customersWithOrdersInRange.length,
    customersWithSubscriptionAllTime: 0,
  };
}

async function computeProductSales(
  range: DashboardRange,
  includeTestAccount: boolean,
  selection: RangeSelection = {}
): Promise<DashboardProductSales[]> {
  const { from, to } = getRangeBounds(range, selection);
  const dateFilter = buildDateFilter(from, to);
  const products = await prisma.downloadableProduct.findMany({ select: { id: true, name: true } });
  const productMap = new Map(products.map((p) => [p.id, p.name]));
  const userFilter = buildOrderUserFilter(includeTestAccount);

  const [salesInRange, salesAllTime] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          status: ORDER_STATUS_PAID,
          ...(dateFilter ? dateFilter : {}),
          ...userFilter,
        },
      },
      _count: { _all: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: ORDER_STATUS_PAID, ...userFilter } },
      _count: { _all: true },
    }),
  ]);

  const salesInRangeMap = new Map(salesInRange.map((row) => [row.productId, row._count._all]));
  const salesAllTimeMap = new Map(salesAllTime.map((row) => [row.productId, row._count._all]));

  const allProductIds = new Set<string>([
    ...salesInRange.map((r) => r.productId),
    ...salesAllTime.map((r) => r.productId),
    ...products.map((p) => p.id),
  ]);

  return Array.from(allProductIds).map<DashboardProductSales>((productId) => ({
    productId,
    name: productMap.get(productId) || "Produit",
    type: "downloadable",
    salesCountInRange: salesInRangeMap.get(productId) || 0,
    salesCountAllTime: salesAllTimeMap.get(productId) || 0,
  }));
}

async function computeProductInteractions(
  range: DashboardRange,
  selection: RangeSelection = {}
): Promise<DashboardProductInteraction[]> {
  const { from, to } = getRangeBounds(range, selection);
  const products = await prisma.downloadableProduct.findMany({ select: { id: true, name: true } });
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const events = await prisma.productAnalyticsEvent.groupBy({
    by: ["productId", "type"],
    where: {
      ...(from || to
        ? {
            createdAt: {
              gte: from ?? undefined,
              lte: to ?? undefined,
            },
          }
        : {}),
    },
    _count: { _all: true },
  });

  const aggregated = new Map<string, { viewsInRange: number; addToCartInRange: number }>();
  events.forEach((event) => {
    const current = aggregated.get(event.productId) || { viewsInRange: 0, addToCartInRange: 0 };
    if (event.type === "view") {
      aggregated.set(event.productId, {
        ...current,
        viewsInRange: current.viewsInRange + event._count._all,
      });
      return;
    }
    if (event.type === "add_to_cart") {
      aggregated.set(event.productId, {
        ...current,
        addToCartInRange: current.addToCartInRange + event._count._all,
      });
    }
  });

  const productIds = new Set<string>([...aggregated.keys(), ...products.map((p) => p.id)]);

  return Array.from(productIds).map((productId) => {
    const counts = aggregated.get(productId) || { viewsInRange: 0, addToCartInRange: 0 };
    return {
      productId,
      name: productMap.get(productId) || "Produit",
      viewsInRange: counts.viewsInRange,
      addToCartInRange: counts.addToCartInRange,
    };
  });
}

export async function getDashboardStats(
  range: DashboardRange,
  { includeTestAccount = true, selection = {} }: DashboardStatsOptions = {}
): Promise<DashboardStatsResponse> {
  const [sales, customers, productSales, productInteractions] = await Promise.all([
    computeSales(range, includeTestAccount, selection),
    computeCustomers(range, includeTestAccount, selection),
    computeProductSales(range, includeTestAccount, selection),
    computeProductInteractions(range, selection),
  ]);

  const products = productSales.sort((a, b) => b.salesCountInRange - a.salesCountInRange);
  const interactions = productInteractions.sort((a, b) => b.viewsInRange - a.viewsInRange);

  return {
    range,
    generatedAt: new Date().toISOString(),
    sales,
    customers,
    products: {
      sales: products,
      interactions,
    },
  };
}
