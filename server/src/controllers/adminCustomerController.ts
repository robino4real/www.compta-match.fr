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

export async function adminListCustomers(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);
  const search = (req.query.search as string) || "";
  const typeFilter = sanitizeAccountType(req.query.type as string | undefined);
  const cityFilter = (req.query.city as string) || "";
  const sortParam = (req.query.sort as string) || "createdAt:desc";

  const [sortField, sortDirection] = sortParam.split(":");
  const orderBy = SORT_MAPPING[sortField] || { createdAt: "desc" };
  const resolvedOrderBy = Array.isArray(orderBy)
    ? orderBy
    : {
        ...orderBy,
      };
  if (typeof resolvedOrderBy === "object" && !Array.isArray(resolvedOrderBy)) {
    for (const key of Object.keys(resolvedOrderBy)) {
      const value = (resolvedOrderBy as any)[key];
      if (typeof value === "string") {
        (resolvedOrderBy as any)[key] = (sortDirection || "asc").toLowerCase() === "desc" ? "desc" : "asc";
      }
    }
  }

  const where: Prisma.UserWhereInput = {
    role: { not: "admin" },
  };

  const searchTerm = search.trim();
  if (searchTerm) {
    where.OR = [
      { email: { contains: searchTerm, mode: "insensitive" } },
      { firstName: { contains: searchTerm, mode: "insensitive" } },
      { lastName: { contains: searchTerm, mode: "insensitive" } },
      { profile: { companyName: { contains: searchTerm, mode: "insensitive" } } },
    ];
  }

  if (typeFilter) {
    where.accountType = typeFilter;
  }

  if (cityFilter.trim()) {
    where.profile = {
      ...(where.profile as Prisma.UserProfileNullableRelationFilter),
      billingCity: { contains: cityFilter.trim(), mode: "insensitive" },
    };
  }

  try {
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        include: { profile: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: resolvedOrderBy,
      }),
      prisma.user.count({ where }),
    ]);

    const aggregates = await prisma.order.groupBy({
      by: ["userId"],
      _sum: { totalPaid: true },
      _count: { _all: true },
      where: {
        userId: { in: users.map((u) => u.id) },
        isDeleted: false,
        status: { notIn: [OrderStatus.FAILED] },
      },
    });

    const customers = users.map((user) => {
      const stats = aggregates.find((agg) => agg.userId === user.id);
      const fullName = `${user.firstName || user.profile?.firstName || ""} ${
        user.lastName || user.profile?.lastName || ""
      }`.trim();
      return {
        id: user.id,
        name: user.profile?.companyName || fullName || user.email,
        email: user.email,
        city: user.profile?.billingCity || "",
        type: user.accountType,
        createdAt: user.createdAt,
        ordersCount: stats?._count?._all || 0,
        totalRevenueCents: stats?._sum?.totalPaid || 0,
      };
    });

    return res.json({
      customers,
      pagination: {
        page,
        pageSize,
        total,
      },
    });
  } catch (error) {
    console.error("[admin] Erreur lors de la liste des clients", error);
    return res.status(500).json({ message: "Impossible de récupérer les clients." });
  }
}

export async function adminGetCustomerDetail(req: Request, res: Response) {
  const { customerId } = req.params as { customerId: string };

  try {
    const user = await prisma.user.findUnique({
      where: { id: customerId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Client introuvable" });
    }

    const [orders, lastEvents, pageViews7, pageViews30, topPages] = await Promise.all([
      prisma.order.findMany({
        where: { userId: customerId, isDeleted: false },
        orderBy: { createdAt: "desc" },
        include: { invoice: true },
      }),
      prisma.userEvent.findMany({
        where: { userId: customerId },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.userEvent.count({
        where: {
          userId: customerId,
          eventType: "PAGE_VIEW",
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.userEvent.count({
        where: {
          userId: customerId,
          eventType: "PAGE_VIEW",
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.userEvent.groupBy({
        by: ["page"],
        where: {
          userId: customerId,
          eventType: "PAGE_VIEW",
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
        take: 5,
      }),
    ]);

    return res.json({
      customer: user,
      orders,
      analytics: {
        pageViews7,
        pageViews30,
        topPages,
        lastEvents,
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
