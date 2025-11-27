import { prisma } from "../config/prisma";

export interface DashboardStatsRange {
  from: string;
  to: string;
}

export interface DashboardStats {
  range: DashboardStatsRange;
  sales: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    newCustomers: number;
    totalCustomers: number;
    ordersByDay: { date: string; revenue: number; ordersCount: number }[];
  };
  products: {
    topProductsByRevenue: {
      productId: string;
      productName: string;
      revenue: number;
      ordersCount: number;
    }[];
    topProductsByDownloads: {
      productId: string;
      productName: string;
      downloadsCount: number;
    }[];
    totalDownloads: number;
  };
  promos: {
    promoUsageRate: number;
    topPromoCodes: {
      code: string;
      usageCount: number;
      totalDiscountAmount: number;
      revenueGenerated: number;
    }[];
  };
  users: {
    totalUsers: number;
    newUsers: number;
    payingCustomers: number;
    customersByCountry: { country: string; count: number }[];
  };
  subscriptions: {
    available: boolean;
    totalSubscriptions: number;
    activeSubscriptions: number;
    canceledSubscriptions: number;
    mrr: number;
  };
  articles: {
    totalArticlesPublished: number;
    articleViewsTotal: number;
    articleViewsByArticle: { articleId: string; articleTitle: string; viewsCount: number }[];
  };
  interactions: {
    pageViewsTotal: number;
    pageViewsByUrl: { url: string; viewsCount: number }[];
    checkoutsStarted: number;
    checkoutsCompleted: number;
    conversionRateCheckout: number;
  };
}

function normalizeDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getDashboardStats(dateFrom: Date, dateTo: Date): Promise<DashboardStats> {
  const paidOrders = await prisma.order.findMany({
    where: {
      status: "PAID",
      paidAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    include: {
      items: true,
      promoCode: true,
      user: true,
    },
  });

  const totalRevenue = paidOrders.reduce((acc, order) => acc + order.totalPaid, 0);
  const totalOrders = paidOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const allPayingCustomers = await prisma.order.groupBy({
    by: ["userId"],
    where: { status: "PAID" },
  });

  const firstPaidOrders = await prisma.order.groupBy({
    by: ["userId"],
    where: { status: "PAID" },
    _min: { paidAt: true },
  });

  const newCustomers = firstPaidOrders.filter((item) => {
    const paidAt = item._min.paidAt;
    if (!paidAt) return false;
    return paidAt >= dateFrom && paidAt <= dateTo;
  }).length;

  const ordersByDayMap = new Map<string, { revenue: number; ordersCount: number }>();
  paidOrders.forEach((order) => {
    const key = normalizeDate(order.paidAt || order.createdAt);
    const current = ordersByDayMap.get(key) || { revenue: 0, ordersCount: 0 };
    ordersByDayMap.set(key, {
      revenue: current.revenue + order.totalPaid,
      ordersCount: current.ordersCount + 1,
    });
  });

  const ordersByDay = Array.from(ordersByDayMap.entries())
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const productRevenueMap = new Map<string, { productName: string; revenue: number; ordersCount: number }>();
  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = productRevenueMap.get(item.productId) || {
        productName: item.productNameSnapshot,
        revenue: 0,
        ordersCount: 0,
      };
      productRevenueMap.set(item.productId, {
        productName: existing.productName || item.productNameSnapshot,
        revenue: existing.revenue + item.lineTotal,
        ordersCount: existing.ordersCount + 1,
      });
    });
  });

  const topProductsByRevenue = Array.from(productRevenueMap.entries())
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const downloadLinks = await prisma.downloadLink.findMany({
    where: {
      OR: [
        { firstDownloadedAt: { gte: dateFrom, lte: dateTo } },
        { lastDownloadedAt: { gte: dateFrom, lte: dateTo } },
      ],
    },
    include: { product: true },
  });

  const downloadMap = new Map<string, { productName: string; downloadsCount: number }>();
  downloadLinks.forEach((link) => {
    const key = link.productId || "unknown";
    const current = downloadMap.get(key) || {
      productName: link.product?.name || "Produit",
      downloadsCount: 0,
    };
    downloadMap.set(key, {
      productName: current.productName,
      downloadsCount: current.downloadsCount + (link.downloadCount || 0),
    });
  });

  const topProductsByDownloads = Array.from(downloadMap.entries())
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.downloadsCount - a.downloadsCount)
    .slice(0, 5);

  const totalDownloads = Array.from(downloadMap.values()).reduce(
    (acc, item) => acc + item.downloadsCount,
    0
  );

  const promoUsageRate = totalOrders > 0 ? paidOrders.filter((o) => o.promoCodeId).length / totalOrders : 0;

  const promoMap = new Map<
    string,
    { code: string; usageCount: number; totalDiscountAmount: number; revenueGenerated: number }
  >();
  paidOrders.forEach((order) => {
    if (!order.promoCodeId || !order.promoCode) return;
    const current = promoMap.get(order.promoCodeId) || {
      code: order.promoCode.code,
      usageCount: 0,
      totalDiscountAmount: 0,
      revenueGenerated: 0,
    };
    promoMap.set(order.promoCodeId, {
      code: current.code,
      usageCount: current.usageCount + 1,
      totalDiscountAmount: current.totalDiscountAmount + order.discountAmount,
      revenueGenerated: current.revenueGenerated + order.totalPaid,
    });
  });

  const topPromoCodes = Array.from(promoMap.values()).sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);

  const totalUsers = await prisma.user.count();
  const newUsers = await prisma.user.count({
    where: { createdAt: { gte: dateFrom, lte: dateTo } },
  });

  const payingCustomers = allPayingCustomers.length;

  const customersByCountry: { country: string; count: number }[] = [];

  const articlesPublished = await prisma.article.count({ where: { status: "PUBLISHED" } });

  const analyticsEvents = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      type: {
        in: [
          "PAGE_VIEW",
          "ARTICLE_VIEW",
          "CHECKOUT_STARTED",
          "CHECKOUT_COMPLETED",
          "DOWNLOAD_CLICK",
        ],
      },
    },
    select: { type: true, url: true, meta: true },
  });

  const pageViewEvents = analyticsEvents.filter((e) => e.type === "PAGE_VIEW");
  const articleViewEvents = analyticsEvents.filter((e) => e.type === "ARTICLE_VIEW");
  const checkoutsStarted = analyticsEvents.filter((e) => e.type === "CHECKOUT_STARTED").length;
  const checkoutsCompleted = analyticsEvents.filter((e) => e.type === "CHECKOUT_COMPLETED").length;

  const pageViewsByUrlMap = new Map<string, number>();
  pageViewEvents.forEach((event) => {
    if (!event.url) return;
    const current = pageViewsByUrlMap.get(event.url) || 0;
    pageViewsByUrlMap.set(event.url, current + 1);
  });
  const pageViewsByUrl = Array.from(pageViewsByUrlMap.entries())
    .map(([url, viewsCount]) => ({ url, viewsCount }))
    .sort((a, b) => b.viewsCount - a.viewsCount)
    .slice(0, 10);

  const articleViewsByArticleMap = new Map<string, { articleTitle: string; viewsCount: number }>();
  articleViewEvents.forEach((event) => {
    const meta = event.meta as { articleId?: string; articleTitle?: string } | null;
    const articleId = meta?.articleId;
    if (!articleId) return;
    const current = articleViewsByArticleMap.get(articleId) || {
      articleTitle: meta?.articleTitle || "Article",
      viewsCount: 0,
    };
    articleViewsByArticleMap.set(articleId, {
      articleTitle: current.articleTitle,
      viewsCount: current.viewsCount + 1,
    });
  });

  const articleViewsByArticle = Array.from(articleViewsByArticleMap.entries())
    .map(([articleId, data]) => ({ articleId, ...data }))
    .sort((a, b) => b.viewsCount - a.viewsCount)
    .slice(0, 5);

  const conversionRateCheckout = checkoutsStarted > 0 ? checkoutsCompleted / checkoutsStarted : 0;

  return {
    range: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
    sales: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      newCustomers,
      totalCustomers: allPayingCustomers.length,
      ordersByDay,
    },
    products: {
      topProductsByRevenue,
      topProductsByDownloads,
      totalDownloads,
    },
    promos: {
      promoUsageRate,
      topPromoCodes,
    },
    users: {
      totalUsers,
      newUsers,
      payingCustomers,
      customersByCountry,
    },
    subscriptions: {
      available: false,
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      canceledSubscriptions: 0,
      mrr: 0,
    },
    articles: {
      totalArticlesPublished: articlesPublished,
      articleViewsTotal: articleViewEvents.length,
      articleViewsByArticle,
    },
    interactions: {
      pageViewsTotal: pageViewEvents.length,
      pageViewsByUrl,
      checkoutsStarted,
      checkoutsCompleted,
      conversionRateCheckout,
    },
  };
}
