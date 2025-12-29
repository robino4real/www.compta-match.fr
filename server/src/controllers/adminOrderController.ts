import { OrderStatus, Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { stripe } from "../config/stripeClient";
import { regenerateDownloadLinkForOrderItem } from "../services/downloadLinkService";
import { recordAuditLog } from "../services/auditLogService";
import {
  sendDownloadLinkRegeneratedEmail,
  sendRefundConfirmationEmail,
} from "../services/transactionalEmailService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { createInvoiceForOrder } from "../services/invoiceService";
import { generateInvoicePdf } from "../services/pdfService";

function resolveOrderId(req: Request): string | undefined {
  const params = req.params as { id?: string; orderId?: string };
  const body = req.body as { id?: string; orderId?: string };
  const candidate = params.id || params.orderId || body?.id || body?.orderId;

  if (typeof candidate !== "string") {
    return undefined;
  }

  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const SORT_WHITELIST: Record<string, Prisma.OrderOrderByWithRelationInput> = {
  createdAt_desc: { createdAt: "desc" },
  createdAt_asc: { createdAt: "asc" },
  amount_desc: { totalPaid: "desc" },
  amount_asc: { totalPaid: "asc" },
};

const DEFAULT_SORT = "createdAt_desc";
const MAX_PAGE_SIZE = 100;

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
    Date.UTC(
      year,
      month - 1,
      day,
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0
    )
  );

  const parisDate = new Date(
    baseDate.toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );
  const offsetMinutes = (parisDate.getTime() - baseDate.getTime()) / 60000;

  return new Date(baseDate.getTime() - offsetMinutes * 60000);
}

function getDefaultDateRange(): { from: string; to: string } {
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

export async function adminGetOrderInvoice(req: Request, res: Response) {
  const { orderId } = req.params as { orderId: string };

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        invoice: {
          include: {
            order: {
              include: { items: true, promoCode: true },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    if (!order.invoice) {
      return res.json({ invoice: null });
    }

    return res.json({ invoice: order.invoice });
  } catch (error) {
    console.error("Erreur récupération facture de commande", error);
    return res
      .status(500)
      .json({ message: "Impossible de récupérer la facture associée." });
  }
}

export async function adminCreateOrRegenerateInvoice(
  req: Request,
  res: Response
) {
  const { orderId } = req.params as { orderId: string };

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { invoice: true, user: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    if (order.status !== OrderStatus.PAID) {
      return res
        .status(400)
        .json({ message: "La facture ne peut être générée que pour une commande payée." });
    }

    if (!order.user) {
      return res
        .status(400)
        .json({ message: "Impossible de générer la facture sans client associé." });
    }

    let invoice = order.invoice;

    if (!invoice) {
      invoice = await createInvoiceForOrder({ order, user: order.user });
    } else {
      const regenerated = await generateInvoicePdf(invoice.id);
      invoice = regenerated;
    }

    const enrichedInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { order: { include: { items: true, promoCode: true } } },
    });

    return res.json({ invoice: enrichedInvoice, message: "Facture prête." });
  } catch (error) {
    console.error("Erreur génération facture commande", error);
    return res
      .status(500)
      .json({ message: "Impossible de générer ou régénérer la facture." });
  }
}

export async function adminDownloadOrderInvoice(req: Request, res: Response) {
  const { orderId } = req.params as { orderId: string };

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { orderId },
      include: { order: true },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Facture introuvable" });
    }

    let pdfPath = invoice.pdfPath;
    const absolutePath = pdfPath
      ? path.join(__dirname, "../../", pdfPath)
      : undefined;

    if (!pdfPath || !absolutePath || !fs.existsSync(absolutePath)) {
      const regenerated = await generateInvoicePdf(invoice.id);
      pdfPath = regenerated.pdfPath;
    }

    const finalAbsolute = path.join(__dirname, "../../", pdfPath!);
    return res.sendFile(finalAbsolute);
  } catch (error) {
    console.error("Erreur téléchargement facture commande", error);
    return res
      .status(500)
      .json({ message: "Impossible de télécharger la facture associée." });
  }
}

export async function adminListOrders(req: Request, res: Response) {
  const {
    email,
    status,
    promoCode,
    from: fromParam,
    to: toParam,
    sort: sortParam,
    query,
    page: pageParam,
    pageSize: pageSizeParam,
  } = req.query as Record<string, string>;

  const { from: defaultFrom, to: defaultTo } = getDefaultDateRange();

  const parsedFrom = parseDateParam(fromParam) ?? (fromParam ? null : defaultFrom);
  const parsedTo = parseDateParam(toParam) ?? (toParam ? null : defaultTo);

  if (!parsedFrom || !parsedTo) {
    return res.status(400).json({ message: "Paramètres de date invalides." });
  }

  const fromDate = getParisDate(parsedFrom, false);
  const toDate = getParisDate(parsedTo, true);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return res.status(400).json({ message: "Paramètres de date invalides." });
  }

  if (fromDate > toDate) {
    return res.status(400).json({ message: "La date de début doit précéder la date de fin." });
  }

  const normalizedStatus = status?.toUpperCase();
  if (normalizedStatus && !Object.values(OrderStatus).includes(normalizedStatus as OrderStatus)) {
    return res.status(400).json({ message: "Statut de commande invalide." });
  }

  const page = Math.max(parseInt(pageParam || "1", 10) || 1, 1);
  const requestedPageSize = parseInt(pageSizeParam || "20", 10) || 20;
  const pageSize = Math.min(Math.max(requestedPageSize, 1), MAX_PAGE_SIZE);
  const skip = (page - 1) * pageSize;

  const sortKey = sortParam && SORT_WHITELIST[sortParam] ? sortParam : DEFAULT_SORT;
  const orderBy = SORT_WHITELIST[sortKey];

  const where: Prisma.OrderWhereInput = {
    createdAt: {
      gte: fromDate,
      lte: toDate,
    },
  };

  if (normalizedStatus) {
    where.status = normalizedStatus as OrderStatus;
  }

  if (promoCode) {
    where.promoCode = { code: { contains: promoCode, mode: "insensitive" } };
  }

  if (email) {
    where.user = {
      email: { contains: email, mode: "insensitive" },
    };
  }

  if (query) {
    where.OR = [
      { id: query },
      { orderNumber: { contains: query, mode: "insensitive" } },
      { user: { email: { contains: query, mode: "insensitive" } } },
      { invoice: { invoiceNumber: { contains: query, mode: "insensitive" } } },
    ];
  }

  try {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          user: true,
          promoCode: true,
          invoice: true,
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return res.json({
      items,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Erreur liste commandes admin", error);
    return res
      .status(500)
      .json({ message: "Impossible de récupérer la liste des commandes." });
  }
}

export async function adminGetOrder(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        promoCode: true,
        invoice: true,
        items: {
          include: {
            product: true,
            downloadLinks: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    return res.json({ order });
  } catch (error) {
    console.error("Erreur récupération commande admin", error);
    return res
      .status(500)
      .json({ message: "Impossible d'afficher le détail de la commande." });
  }
}

export async function adminRegenerateDownloadLink(
  req: Request,
  res: Response
) {
  const { orderItemId } = req.params as { orderItemId: string };

  try {
    const link = await regenerateDownloadLinkForOrderItem(orderItemId);
    await sendDownloadLinkRegeneratedEmail(link.id);
    return res.json({
      link,
      message: "Nouveau lien de téléchargement généré pour cet article.",
    });
  } catch (error) {
    console.error("Erreur régénération lien", error);
    return res
      .status(500)
      .json({ message: "Impossible de régénérer le lien de téléchargement." });
  }
}

export async function adminMarkOrderRefunded(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status: "REFUNDED" },
    });

    return res.json({ order, message: "Commande marquée comme remboursée." });
  } catch (error) {
    console.error("Erreur mise à jour statut commande", error);
    return res
      .status(500)
      .json({ message: "Impossible de mettre à jour le statut." });
  }
}

export async function adminCancelOrder(req: AuthenticatedRequest, res: Response) {
  const orderId = resolveOrderId(req);

  if (!orderId) {
    return res
      .status(400)
      .json({ ok: false, error: { code: "BAD_REQUEST", message: "Missing order id" } });
  }

  console.debug(`[adminCancelOrder] orderId=${orderId}`);

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    if (order.isDeleted) {
      return res.status(400).json({ message: "Cette commande est supprimée." });
    }

    const cancellableStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.PAID];
    if (!cancellableStatuses.includes(order.status)) {
      return res
        .status(400)
        .json({ message: "Seules les commandes en attente ou payées peuvent être annulées." });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    if (req.user?.id) {
      await recordAuditLog(req.user.id, "ADMIN_CANCEL_ORDER", "ORDER", orderId, {
        previousStatus: order.status,
      });
    }

    return res.json({ order: updated, message: "Commande annulée." });
  } catch (error) {
    console.error("[admin] Erreur annulation commande", error);
    return res.status(500).json({ message: "Impossible d'annuler la commande." });
  }
}

export async function adminSoftDeleteOrder(req: AuthenticatedRequest, res: Response) {
  const orderId = resolveOrderId(req);

  if (!orderId) {
    return res
      .status(400)
      .json({ ok: false, error: { code: "BAD_REQUEST", message: "Missing order id" } });
  }

  console.debug(`[adminSoftDeleteOrder] orderId=${orderId}`);

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: order.status === OrderStatus.REFUNDED ? order.status : OrderStatus.CANCELLED,
      },
    });

    if (req.user?.id) {
      await recordAuditLog(req.user.id, "ADMIN_DELETE_ORDER", "ORDER", orderId, {
        previousStatus: order.status,
      });
    }

    return res.json({ order: updated, message: "Commande supprimée." });
  } catch (error) {
    console.error("[admin] Erreur suppression commande", error);
    return res.status(500).json({ message: "Impossible de supprimer la commande." });
  }
}

export async function adminRefundOrder(req: AuthenticatedRequest, res: Response) {
  const orderId = resolveOrderId(req);

  if (!orderId) {
    return res
      .status(400)
      .json({ ok: false, error: { code: "BAD_REQUEST", message: "Missing order id" } });
  }

  console.debug(`[adminRefundOrder] orderId=${orderId}`);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    if (!order.stripePaymentIntentId) {
      return res
        .status(400)
        .json({ message: "Aucun paiement Stripe associé pour cette commande." });
    }

    if (order.status === OrderStatus.REFUNDED) {
      return res.status(400).json({ message: "Commande déjà remboursée." });
    }

    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: order.totalPaid,
    });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED },
    });

    if (req.user?.id) {
      await recordAuditLog(req.user.id, "ADMIN_REFUND_ORDER", "ORDER", orderId, {
        refundId: refund.id,
        paymentIntent: order.stripePaymentIntentId,
      });
    }

    if (order.user) {
      await sendRefundConfirmationEmail(order.user, updated, refund.id);
    }

    return res.json({ order: updated, refundId: refund.id, message: "Remboursement déclenché." });
  } catch (error) {
    console.error("[admin] Erreur lors du remboursement", error);
    return res.status(500).json({ message: "Impossible de rembourser la commande." });
  }
}

export async function adminListRecentOrders(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, email: true } },
        items: true,
        invoice: true,
      },
    });

    return res.json({ orders, limit });
  } catch (error) {
    console.error("[admin] Impossible de lister les dernières commandes", error);
    return res.status(500).json({
      message: "Impossible de récupérer les dernières commandes pour le debug.",
    });
  }
}
