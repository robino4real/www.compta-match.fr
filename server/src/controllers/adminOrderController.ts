import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { regenerateDownloadLinkForOrderItem } from "../services/downloadLinkService";
import { sendDownloadLinkRegeneratedEmail } from "../services/transactionalEmailService";

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
