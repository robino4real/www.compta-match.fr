import {
  OrderAdjustmentStatus,
  OrderAdjustmentType,
  OrderStatus,
  Prisma,
} from "@prisma/client";
import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import Stripe from "stripe";
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
import { sendOrderPaymentRequestEmail } from "../services/transactionalEmailService";

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
type OrderWithUser = Prisma.OrderGetPayload<{ include: { user: true } }>;

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

function normalizeNote(value?: string | null): string | null {
  const trimmed = (value || "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function sumRefundedCents(orderId: string): Promise<number> {
  const aggregate = await prisma.orderAdjustment.aggregate({
    where: {
      orderId,
      type: OrderAdjustmentType.PARTIAL_REFUND,
      status: { not: OrderAdjustmentStatus.CANCELLED },
    },
    _sum: { amountCents: true },
  });

  return aggregate._sum.amountCents || 0;
}

function normalizeStripeRefundReason(
  reason?: string
): Stripe.RefundCreateParams.Reason | undefined {
  const allowed: Stripe.RefundCreateParams.Reason[] = [
    "duplicate",
    "fraudulent",
    "requested_by_customer",
  ];

  if (!reason) return undefined;
  return allowed.includes(reason as Stripe.RefundCreateParams.Reason)
    ? (reason as Stripe.RefundCreateParams.Reason)
    : undefined;
}

async function performRefundAction({
  order,
  amountCents,
  reason,
  adminNote,
  clientNote,
  initiatedBy,
}: {
  order: OrderWithUser;
  amountCents?: number;
  reason?: string;
  adminNote?: string | null;
  clientNote?: string | null;
  initiatedBy?: string;
}) {
  if (!order.stripePaymentIntentId) {
    const error = new Error("Aucun paiement Stripe associé à cette commande.");
    (error as any).status = 400;
    throw error;
  }

  if (order.status === OrderStatus.REFUNDED) {
    const error = new Error("Commande déjà remboursée.");
    (error as any).status = 400;
    throw error;
  }

  if (order.status === OrderStatus.CANCELLED || order.isDeleted) {
    const error = new Error("Impossible de rembourser une commande annulée ou supprimée.");
    (error as any).status = 400;
    throw error;
  }

  const alreadyRefunded = await sumRefundedCents(order.id);
  const refundable = Math.max(order.totalPaid - alreadyRefunded, 0);

  if (refundable <= 0) {
    const error = new Error("Aucun montant remboursable restant sur cette commande.");
    (error as any).status = 400;
    throw error;
  }

  const targetAmount = amountCents ?? refundable;
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    const error = new Error("Montant de remboursement invalide.");
    (error as any).status = 400;
    throw error;
  }

  if (targetAmount > refundable) {
    const error = new Error("Le montant dépasse le montant remboursable restant.");
    (error as any).status = 400;
    throw error;
  }

  const refund = await stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
    amount: Math.round(targetAmount),
    reason: normalizeStripeRefundReason(reason),
  });

  const nextStatus =
    Math.round(targetAmount) === refundable ? OrderStatus.REFUNDED : OrderStatus.PAID;

  const [adjustment, updatedOrder] = await prisma.$transaction([
    prisma.orderAdjustment.create({
      data: {
        orderId: order.id,
        type: OrderAdjustmentType.PARTIAL_REFUND,
        status: OrderAdjustmentStatus.PAID,
        amountCents: Math.round(targetAmount),
        currency: order.currency,
        adminNote: normalizeNote(adminNote) || normalizeNote(reason),
        clientNote: normalizeNote(clientNote),
        stripeRefundId: refund.id,
      },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { status: nextStatus },
    }),
  ]);

  if (initiatedBy) {
    await recordAuditLog(initiatedBy, "ADMIN_REFUND_ORDER", "ORDER", order.id, {
      refundId: refund.id,
      paymentIntent: order.stripePaymentIntentId,
      refundedAmount: targetAmount,
      previousStatus: order.status,
    });
  }

  if (nextStatus === OrderStatus.REFUNDED && order.user) {
    await sendRefundConfirmationEmail(order.user, updatedOrder, refund.id);
  }

  return { order: updatedOrder, refundId: refund.id, adjustment };
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
        adjustments: {
          orderBy: { createdAt: "desc" },
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

    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.EN_ATTENTE_DE_PAIEMENT,
    ];
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

  const { amountCents, reason } = req.body as { amountCents?: number; reason?: string };
  const parsedAmount =
    amountCents === undefined || amountCents === null ? undefined : Math.round(Number(amountCents));

  if (parsedAmount !== undefined && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
    return res.status(400).json({ message: "Montant de remboursement invalide." });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    const result = await performRefundAction({
      order,
      amountCents: parsedAmount,
      reason,
      adminNote: reason,
      initiatedBy: req.user?.id,
    });

    return res.json({
      order: result.order,
      refundId: result.refundId,
      adjustment: result.adjustment,
      message: parsedAmount && parsedAmount < order.totalPaid
        ? "Remboursement partiel effectué."
        : "Remboursement déclenché.",
    });
  } catch (error: any) {
    const status = error?.status || 500;
    console.error("[admin] Erreur lors du remboursement", error);
    return res.status(status).json({ message: error?.message || "Impossible de rembourser la commande." });
  }
}

export async function adminAdjustOrder(req: AuthenticatedRequest, res: Response) {
  const orderId = resolveOrderId(req);

  if (!orderId) {
    return res
      .status(400)
      .json({ ok: false, error: { code: "BAD_REQUEST", message: "Missing order id" } });
  }

  const { mode, amountCents, adminNote, clientNote } = req.body as {
    mode?: string;
    amountCents?: number;
    adminNote?: string;
    clientNote?: string;
  };

  const parsedAmount = Math.round(Number(amountCents));
  if (!mode || !["PARTIAL_REFUND", "EXTRA_PAYMENT"].includes(mode)) {
    return res.status(400).json({ message: "Mode d'ajustement invalide." });
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: "Montant d'ajustement invalide." });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    if (order.isDeleted || order.status === OrderStatus.CANCELLED) {
      return res
        .status(400)
        .json({ message: "Impossible de modifier une commande annulée ou supprimée." });
    }

    if (mode === "PARTIAL_REFUND") {
      const result = await performRefundAction({
        order,
        amountCents: parsedAmount,
        adminNote,
        clientNote,
        initiatedBy: req.user?.id,
      });

      return res.json({
        order: result.order,
        adjustment: result.adjustment,
        message: "Remboursement partiel effectué.",
      });
    }

    if (order.status === OrderStatus.REFUNDED) {
      return res.status(400).json({ message: "Commande déjà remboursée." });
    }

    const adjustment = await prisma.orderAdjustment.create({
      data: {
        orderId,
        type: OrderAdjustmentType.EXTRA_PAYMENT,
        amountCents: parsedAmount,
        currency: order.currency,
        adminNote: normalizeNote(adminNote),
        clientNote: normalizeNote(clientNote),
        status: OrderAdjustmentStatus.PENDING,
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.EN_ATTENTE_DE_PAIEMENT },
    });

    if (req.user?.id) {
      await recordAuditLog(req.user.id, "ADMIN_CREATE_ORDER_ADJUSTMENT", "ORDER", orderId, {
        adjustmentId: adjustment.id,
        amountCents: parsedAmount,
        type: adjustment.type,
      });
    }

    return res.json({
      order: updatedOrder,
      adjustment,
      message: "Proposition de paiement créée.",
    });
  } catch (error) {
    console.error("[admin] Erreur lors de l'ajustement de commande", error);
    return res
      .status(500)
      .json({ message: "Impossible de modifier ou rembourser la commande." });
  }
}

export async function adminSendOrderAdjustment(
  req: AuthenticatedRequest,
  res: Response
) {
  const { id: orderId, adjustmentId } = req.params as { id: string; adjustmentId: string };

  if (!orderId || !adjustmentId) {
    return res
      .status(400)
      .json({ ok: false, error: { code: "BAD_REQUEST", message: "Missing order or adjustment id" } });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    const adjustment = await prisma.orderAdjustment.findUnique({ where: { id: adjustmentId } });

    if (!order || !adjustment || adjustment.orderId !== order.id) {
      return res.status(404).json({ message: "Ajustement introuvable." });
    }

    if (adjustment.type !== OrderAdjustmentType.EXTRA_PAYMENT) {
      return res.status(400).json({ message: "Seules les propositions de paiement peuvent être envoyées." });
    }

    if (!order.user) {
      return res.status(400).json({ message: "Impossible d'envoyer l'email sans client associé." });
    }

    const updatedAdjustment = await prisma.orderAdjustment.update({
      where: { id: adjustmentId },
      data: { status: OrderAdjustmentStatus.SENT },
    });

    await sendOrderPaymentRequestEmail(order, updatedAdjustment);

    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.EN_ATTENTE_DE_PAIEMENT },
    });

    if (req.user?.id) {
      await recordAuditLog(req.user.id, "ADMIN_SEND_ORDER_ADJUSTMENT", "ORDER", orderId, {
        adjustmentId: updatedAdjustment.id,
        amountCents: updatedAdjustment.amountCents,
      });
    }

    return res.json({ adjustment: updatedAdjustment, message: "Proposition envoyée au client." });
  } catch (error) {
    console.error("[admin] Erreur lors de l'envoi de la proposition", error);
    return res
      .status(500)
      .json({ message: "Impossible d'envoyer la proposition au client." });
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
