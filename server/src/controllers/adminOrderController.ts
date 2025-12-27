import { OrderStatus } from "@prisma/client";
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

export async function adminListOrders(req: Request, res: Response) {
  const { email, status, promoCode } = req.query as Record<string, string>;

  const where: any = {};

  if (status) {
    where.status = status.toUpperCase();
  }

  if (promoCode) {
    where.promoCode = { code: { contains: promoCode, mode: "insensitive" } };
  }

  if (email) {
    where.user = {
      email: { contains: email, mode: "insensitive" },
    };
  }

  try {
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        promoCode: true,
        invoice: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ orders });
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
  const { orderId } = req.params as { orderId: string };

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
  const { orderId } = req.params as { orderId: string };

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
  const { orderId } = req.params as { orderId: string };

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
