import { prisma } from "../config/prisma";
import {
  DashboardCustomerStats,
  DashboardProductInteraction,
  DashboardProductSales,
  DashboardRange,
  DashboardStatsResponse,
  RevenuePoint,
} from "../types/dashboard";
import { getRangeBounds, getTimelineBucket, TimelineBucket } from "../utils/dashboardRange";

const ORDER_STATUS_PAID = "PAID";

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
  if (bucket === "month") {
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

async function computeSales(range: DashboardRange) {
  const { from, to } = getRangeBounds(range);
  const dateFilter = buildDateFilter(from, to);

  const paidOrders = await prisma.order.findMany({
    where: {
      status: ORDER_STATUS_PAID,
      ...(dateFilter ? dateFilter : {}),
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

  const timeline: RevenuePoint[] = Array.from(timelineMap.entries())
    .map(([, value]) => ({
      label: value.label,
      date: value.date,
      revenue: value.revenue,
      ordersCount: value.ordersCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalRevenue,
    totalStripeFees,
    netResult,
    ordersCount,
    timeline,
  };
}

async function computeCustomers(range: DashboardRange): Promise<DashboardCustomerStats> {
  const { from, to } = getRangeBounds(range);
  const dateFilter = buildDateFilter(from, to);
  const newUsersDateFilter = from || to ? { createdAt: { gte: from ?? undefined, lte: to ?? undefined } } : {};

  const [totalRegisteredUsers, newUsersInRange, customersWithOrdersAllTime, customersWithOrdersInRange] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: newUsersDateFilter }),
      prisma.order.groupBy({ by: ["userId"], where: { status: ORDER_STATUS_PAID } }),
      prisma.order.groupBy({
        by: ["userId"],
        where: { status: ORDER_STATUS_PAID, ...(dateFilter ? dateFilter : {}) },
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

async function computeProductSales(range: DashboardRange): Promise<DashboardProductSales[]> {
  const { from, to } = getRangeBounds(range);
  const dateFilter = buildDateFilter(from, to);
  const products = await prisma.downloadableProduct.findMany({ select: { id: true, name: true } });
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const [salesInRange, salesAllTime] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          status: ORDER_STATUS_PAID,
          ...(dateFilter ? dateFilter : {}),
        },
      },
      _count: { _all: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: ORDER_STATUS_PAID } },
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

async function computeProductInteractions(range: DashboardRange): Promise<DashboardProductInteraction[]> {
  const { from, to } = getRangeBounds(range);
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

export async function getDashboardStats(range: DashboardRange): Promise<DashboardStatsResponse> {
  const [sales, customers, productSales, productInteractions] = await Promise.all([
    computeSales(range),
    computeCustomers(range),
    computeProductSales(range),
    computeProductInteractions(range),
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
