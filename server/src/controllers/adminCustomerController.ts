import { AccountType, OrderStatus, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { recordAuditLog } from "../services/auditLogService";

const SORT_MAPPING: Record<string, Prisma.UserOrderByWithRelationInput> = {
  name: { firstName: "asc" },
  city: { profile: { billingCity: "asc" } },
  type: { accountType: "asc" },
  createdAt: { createdAt: "desc" },
};

type AggregatedSort = "revenue_desc" | "revenue_asc" | "orders_desc" | "orders_asc";

function parseDateParam(dateString?: string): string | null {
  if (!dateString) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }
  return dateString;
}

function getParisDate(dateString: string, endOfDay = false): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  const baseDate = new Date(
    Date.UTC(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0)
  );

  const parisDate = new Date(baseDate.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const offsetMinutes = (parisDate.getTime() - baseDate.getTime()) / 60000;

  return new Date(baseDate.getTime() - offsetMinutes * 60000);
}

function getDateRange({ from, to }: { from?: string | null; to?: string | null }) {
  const parsedFrom = parseDateParam(from || undefined);
  const parsedTo = parseDateParam(to || undefined);

  return {
    fromDate: parsedFrom ? getParisDate(parsedFrom) : undefined,
    toDate: parsedTo ? getParisDate(parsedTo, true) : undefined,
  };
}

function getDefaultClientDateRange(): { from: string; to: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const today = formatter.format(new Date());
  const [year, month, day] = today.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  start.setUTCDate(start.getUTCDate() - 29);

  return {
    from: start.toISOString().slice(0, 10),
    to: today,
  };
}

function sanitizeAccountType(value?: string | null): AccountType | undefined {
  const normalized = (value || "").toUpperCase();
  if (!normalized) return undefined;
  if (
    [
      AccountType.ASSOCIATION,
      AccountType.COMPANY,
      AccountType.ENTREPRENEUR,
      AccountType.INDIVIDUAL,
      AccountType.PROFESSIONAL,
    ].includes(normalized as AccountType)
  ) {
    return normalized as AccountType;
  }
  return undefined;
}

export async function adminListClients(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);
  const search = (req.query.query as string) || "";
  const sort = ((req.query.sort as string) || "createdAt_desc").toLowerCase();
  const { from, to } = (req.query as { from?: string; to?: string }) || {};

  const { fromDate, toDate } = getDateRange({ from, to });
  const dateRange = !from && !to ? getDefaultClientDateRange() : { from: fromDate ? from : undefined, to: toDate ? to : undefined };
  const fromBoundary = fromDate || (dateRange.from ? getParisDate(dateRange.from) : undefined);
  const toBoundary = toDate || (dateRange.to ? getParisDate(dateRange.to, true) : undefined);

  const userWhere: Prisma.UserWhereInput = { role: { not: "admin" } };
  const searchTerm = search.trim();
  if (searchTerm) {
    userWhere.OR = [
      { email: { contains: searchTerm, mode: "insensitive" } },
      { firstName: { contains: searchTerm, mode: "insensitive" } },
      { lastName: { contains: searchTerm, mode: "insensitive" } },
      { profile: { companyName: { contains: searchTerm, mode: "insensitive" } } },
    ];
  }

  const filteredUsers = await prisma.user.findMany({
    where: userWhere,
    select: { id: true },
  });
  const total = filteredUsers.length;
  const userIds = filteredUsers.map((u) => u.id);

  const orderWhere: Prisma.OrderWhereInput = {
    userId: { in: userIds },
    isDeleted: false,
    status: { notIn: [OrderStatus.FAILED] },
  };

  if (fromBoundary || toBoundary) {
    orderWhere.createdAt = {
      ...(fromBoundary ? { gte: fromBoundary } : {}),
      ...(toBoundary ? { lte: toBoundary } : {}),
    };
  }

  const aggregates = await prisma.order.groupBy({
    by: ["userId"],
    _sum: { totalPaid: true },
    _count: { _all: true },
    _max: { createdAt: true },
    where: orderWhere,
  });

  const aggregateMap = new Map(
    aggregates.map((agg) => [
      agg.userId,
      {
        revenue: agg._sum?.totalPaid || 0,
        orders: agg._count?._all || 0,
        lastOrderAt: agg._max?.createdAt || null,
      },
    ])
  );

  const aggregatedSort: AggregatedSort | null = ["revenue_desc", "revenue_asc", "orders_desc", "orders_asc"].includes(sort as AggregatedSort)
    ? (sort as AggregatedSort)
    : null;

  let sortedUserIds = [...userIds];

  if (aggregatedSort) {
    sortedUserIds.sort((a, b) => {
      const statsA = aggregateMap.get(a) || { revenue: 0, orders: 0 };
      const statsB = aggregateMap.get(b) || { revenue: 0, orders: 0 };

      if (aggregatedSort === "revenue_desc") return statsB.revenue - statsA.revenue;
      if (aggregatedSort === "revenue_asc") return statsA.revenue - statsB.revenue;
      if (aggregatedSort === "orders_desc") return statsB.orders - statsA.orders;
      return statsA.orders - statsB.orders;
    });
  } else {
    const [field, direction] = sort.split("_");
    const baseOrderBy = SORT_MAPPING[field] || { createdAt: "desc" };
    const directionValue = direction === "asc" ? "asc" : "desc";
    const usersSorted = await prisma.user.findMany({
      where: userWhere,
      select: { id: true },
      orderBy: Array.isArray(baseOrderBy)
        ? baseOrderBy
        : {
            ...baseOrderBy,
            ...(typeof baseOrderBy === "object" && !Array.isArray(baseOrderBy)
              ? Object.fromEntries(Object.entries(baseOrderBy).map(([k]) => [k, directionValue]))
              : {}),
          },
    });
    sortedUserIds = usersSorted.map((u) => u.id);
  }

  const paginatedIds = sortedUserIds.slice((page - 1) * pageSize, page * pageSize);

  const users = await prisma.user.findMany({
    where: { id: { in: paginatedIds } },
    include: { profile: true },
  });

  const customers = paginatedIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean)
    .map((user) => {
      const stats = aggregateMap.get(user!.id) || { revenue: 0, orders: 0, lastOrderAt: null };
      const fullName = `${user!.firstName || user!.profile?.firstName || ""} ${
        user!.lastName || user!.profile?.lastName || ""
      }`.trim();
      return {
        id: user!.id,
        name: user!.profile?.companyName || fullName || user!.email,
        email: user!.email,
        createdAt: user!.createdAt,
        ordersCount: stats.orders,
        totalRevenueCents: stats.revenue,
        lastOrderAt: stats.lastOrderAt,
      };
    });

  return res.json({
    items: customers,
    total,
    page,
    pageSize,
    filters: {
      from: (fromBoundary || undefined)?.toISOString() || null,
      to: (toBoundary || undefined)?.toISOString() || null,
    },
  });
}

export async function adminGetClientDetail(req: Request, res: Response) {
  const { clientId } = req.params as { clientId: string };

  try {
    const user = await prisma.user.findUnique({
      where: { id: clientId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Client introuvable" });
    }

    const [ordersAggregation, downloadsCount, invoicesCount] = await Promise.all([
      prisma.order.aggregate({
        where: { userId: clientId, isDeleted: false, status: { notIn: [OrderStatus.FAILED] } },
        _sum: { totalPaid: true },
        _count: { _all: true },
        _max: { createdAt: true },
      }),
      prisma.downloadLink.count({ where: { userId: clientId } }),
      prisma.invoice.count({ where: { order: { userId: clientId } } }),
    ]);

    return res.json({
      customer: user,
      stats: {
        ordersCount: ordersAggregation._count?._all || 0,
        totalRevenueCents: ordersAggregation._sum?.totalPaid || 0,
        lastOrderAt: ordersAggregation._max?.createdAt || null,
        downloadsCount,
        invoicesCount,
      },
    });
  } catch (error) {
    console.error("[admin] Erreur lors du chargement du client", error);
    return res.status(500).json({ message: "Impossible de charger la fiche client." });
  }
}

export async function adminUpdateCustomer(
  req: AuthenticatedRequest,
  res: Response
) {
  const { customerId } = req.params as { customerId: string };
  const {
    firstName,
    lastName,
    companyName,
    email,
    billingStreet,
    billingCity,
    billingZip,
    billingCountry,
    phone,
    accountType,
  } = (req.body ?? {}) as Record<string, string | undefined>;

  const normalizedType = sanitizeAccountType(accountType);

  try {
    const user = await prisma.user.findUnique({ where: { id: customerId } });
    if (!user) {
      return res.status(404).json({ message: "Client introuvable" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: customerId },
        data: {
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          email: email?.trim() || user.email,
          accountType: normalizedType || user.accountType,
        },
        include: { profile: true },
      });

      const updatedProfile = await tx.userProfile.upsert({
        where: { userId: customerId },
        create: {
          userId: customerId,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          companyName: companyName?.trim() || null,
          billingStreet: billingStreet?.trim() || null,
          billingCity: billingCity?.trim() || null,
          billingZip: billingZip?.trim() || null,
          billingCountry: billingCountry?.trim() || null,
          phone: phone?.trim() || null,
          accountType: normalizedType || user.accountType,
        },
        update: {
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          companyName: companyName?.trim() || null,
          billingStreet: billingStreet?.trim() || null,
          billingCity: billingCity?.trim() || null,
          billingZip: billingZip?.trim() || null,
          billingCountry: billingCountry?.trim() || null,
          phone: phone?.trim() || null,
          accountType: normalizedType || user.accountType,
        },
      });

      return { user: updatedUser, profile: updatedProfile };
    });

    if (req.user?.id) {
      await recordAuditLog(req.user.id, "ADMIN_UPDATE_CUSTOMER", "USER", customerId, {
        fields: Object.keys(req.body || {}),
      });
    }

    return res.json({ message: "Profil client mis à jour", ...updated });
  } catch (error) {
    console.error("[admin] Erreur mise à jour client", error);
    return res.status(500).json({ message: "Impossible de mettre à jour le client." });
  }
}

export async function adminGetClientOrders(req: Request, res: Response) {
  const { clientId } = req.params as { clientId: string };
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 100);
  const sort = ((req.query.sort as string) || "createdAt_desc").toLowerCase();

  const [field, direction] = sort.split("_");
  const orderBy: Prisma.OrderOrderByWithRelationInput =
    field === "amount"
      ? { totalPaid: direction === "asc" ? "asc" : "desc" }
      : { createdAt: direction === "asc" ? "asc" : "desc" };

  try {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where: { userId: clientId, isDeleted: false },
        orderBy,
        include: { invoice: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where: { userId: clientId, isDeleted: false } }),
    ]);

    return res.json({ items, total, page, pageSize });
  } catch (error) {
    console.error("[admin] Erreur chargement commandes client", error);
    return res.status(500).json({ message: "Impossible de charger les commandes du client." });
  }
}

export async function adminGetClientInvoices(req: Request, res: Response) {
  const { clientId } = req.params as { clientId: string };
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 100);

  try {
    const [items, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where: { order: { userId: clientId } },
        orderBy: { issueDate: "desc" },
        include: { order: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where: { order: { userId: clientId } } }),
    ]);

    return res.json({ items, total, page, pageSize });
  } catch (error) {
    console.error("[admin] Erreur chargement factures client", error);
    return res.status(500).json({ message: "Impossible de charger les factures du client." });
  }
}

export async function adminGetClientDownloads(req: Request, res: Response) {
  const { clientId } = req.params as { clientId: string };
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 100);

  try {
    const [items, total] = await prisma.$transaction([
      prisma.downloadLink.findMany({
        where: { userId: clientId },
        orderBy: { createdAt: "desc" },
        include: { orderItem: { include: { order: true, product: true } }, product: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.downloadLink.count({ where: { userId: clientId } }),
    ]);

    return res.json({ items, total, page, pageSize });
  } catch (error) {
    console.error("[admin] Erreur chargement téléchargements client", error);
    return res.status(500).json({ message: "Impossible de charger les téléchargements du client." });
  }
}
