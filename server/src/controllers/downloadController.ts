import crypto from "crypto";
import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { prisma } from "../config/prisma";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

async function streamDownloadForLink(
  link: any,
  userId: string,
  res: Response
) {
  if (!link.orderItem) {
    return res.status(404).json({ message: "Lien de téléchargement introuvable." });
  }

  if (link.orderItem.order.userId !== userId) {
    return res.status(403).json({ message: "Vous n'avez pas accès à ce téléchargement." });
  }

  if (link.orderItem.order.status !== "PAID") {
    return res.status(403).json({ message: "La commande n'est pas finalisée." });
  }

  if (link.status !== "ACTIVE") {
    return res.status(410).json({ message: "Ce lien n'est plus actif." });
  }

  const now = new Date();

  if (link.expiresAt && now > link.expiresAt) {
    await prisma.downloadLink.update({
      where: { id: link.id },
      data: { status: "EXPIRED" },
    });
    return res.status(410).json({
      message: "Le lien de téléchargement a expiré.",
    });
  }

  if (link.downloadCount >= link.maxDownloads) {
    await prisma.downloadLink.update({
      where: { id: link.id },
      data: { status: "USED" },
    });
    return res.status(410).json({
      message: "Le lien de téléchargement a déjà été utilisé.",
    });
  }

  const expiresAt = link.expiresAt || new Date(now.getTime() + 60 * 60 * 1000);
  const newCount = link.downloadCount + 1;
  const newStatus = newCount >= link.maxDownloads ? "USED" : "ACTIVE";

  await prisma.downloadLink.update({
    where: { id: link.id },
    data: {
      downloadCount: newCount,
      firstDownloadedAt: link.firstDownloadedAt || now,
      lastDownloadedAt: now,
      expiresAt,
      status: newStatus,
    },
  });

  const product = link.orderItem.product;
  const selectedBinary = link.orderItem.binary || product?.binaries?.[0] || null;

  const fileName = selectedBinary?.fileName || product.fileName;
  const storagePath = selectedBinary?.storagePath || product.storagePath;

  if (!storagePath || !fileName) {
    return res.status(500).json({
      message:
        "Le fichier associé à ce produit n'est pas disponible sur le serveur.",
    });
  }

  const filePath = path.isAbsolute(storagePath)
    ? storagePath
    : path.join(__dirname, "../../", storagePath);

  if (!fs.existsSync(filePath)) {
    return res.status(500).json({
      message: "Le fichier à télécharger est introuvable sur le serveur.",
    });
  }

  return res.download(filePath, fileName);
}

/**
 * Téléchargement d'un logiciel à partir d'un token de téléchargement.
 *
 * Règles :
 * - L'utilisateur doit être connecté.
 * - Le token doit correspondre à un OrderItem appartenant à cet utilisateur,
 *   pour une commande payée.
 * - Au premier téléchargement : on enregistre downloadFirstAt = now,
 *   downloadExpiresAt = now + 1 heure.
 * - Tant que now <= downloadExpiresAt, l'utilisateur peut retélécharger
 *   (utile en cas de problème de connexion, etc.).
 * - Si now > downloadExpiresAt, le lien est expiré.
 */
export async function handleDownloadByToken(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  try {
    const userId = request.user?.id;
    const { token } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    if (!token) {
      return res.status(400).json({ message: "Token de téléchargement manquant." });
    }

    const link = await prisma.downloadLink.findUnique({
      where: { token },
      include: {
        orderItem: {
          include: {
            order: true,
            product: { include: { binaries: true } },
            binary: true,
          },
        },
      },
    });

    if (!link || !link.orderItem) {
      return res.status(404).json({ message: "Lien de téléchargement introuvable." });
    }

    return streamDownloadForLink(link, userId, res);
  } catch (error) {
    console.error(
      "Erreur lors du téléchargement d'un produit téléchargeable :",
      error
    );
    return res.status(500).json({
      message:
        "Erreur lors du téléchargement du produit téléchargeable.",
    });
  }
}

export async function handleOrderDownloadByToken(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  try {
    const userId = request.user?.id;
    const { token } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    if (!token) {
      return res.status(400).json({ message: "Token de téléchargement manquant." });
    }

    const order = await prisma.order.findFirst({
      where: { downloadToken: token },
      include: {
        items: {
          include: {
            product: { include: { binaries: true } },
            binary: true,
            downloadLinks: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ message: "Ce lien ne vous appartient pas." });
    }

    if (order.status !== "PAID") {
      return res.status(403).json({ message: "La commande n'est pas finalisée." });
    }

    const downloadableItem = order.items.find((item) => item.product?.storagePath);

    if (!downloadableItem) {
      return res.status(404).json({
        message: "Aucun produit téléchargeable associé à cette commande.",
      });
    }

    let activeLink = downloadableItem.downloadLinks.find(
      (link) => link.status === "ACTIVE"
    );

    if (!activeLink) {
      const createdLink = await prisma.downloadLink.create({
        data: {
          orderItemId: downloadableItem.id,
          userId,
          productId: downloadableItem.productId,
          token: crypto.randomBytes(24).toString("hex"),
          status: "ACTIVE",
          maxDownloads: 1,
          downloadCount: 0,
        },
        include: {
          orderItem: {
            include: {
              order: true,
              product: { include: { binaries: true } },
              binary: true,
            },
          },
        },
      });

      activeLink = createdLink;
    } else {
      const hydratedLink = await prisma.downloadLink.findUnique({
        where: { id: activeLink.id },
        include: {
          orderItem: {
            include: {
              order: true,
              product: { include: { binaries: true } },
              binary: true,
            },
          },
        },
      });

      if (!hydratedLink) {
        return res.status(404).json({ message: "Lien de téléchargement introuvable." });
      }

      activeLink = hydratedLink;
    }

    return streamDownloadForLink(activeLink, userId, res);
  } catch (error) {
    console.error(
      "Erreur lors du téléchargement d'un produit via commande :",
      error
    );
    return res.status(500).json({
      message: "Erreur lors du téléchargement du produit téléchargeable.",
    });
  }
}

export async function listUserDownloads(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  try {
    const userId = request.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    const links = await prisma.downloadLink.findMany({
      where: {
        userId,
        orderItem: {
          order: { status: "PAID" },
        },
      },
      include: {
        orderItem: { include: { order: true, product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    const downloads = links
      .filter((link) => !!link.orderItem)
      .map((link) => {
        const expiresAt = link.expiresAt;
        const diff = expiresAt ? expiresAt.getTime() - now.getTime() : null;

        return {
          id: link.id,
          token: link.token,
          productId: link.orderItem.productId,
          productName: link.orderItem.product.name,
          productDescription: link.orderItem.product.shortDescription,
          priceCents: link.orderItem.priceCents,
          orderCreatedAt: link.orderItem.order.createdAt,
          downloadFirstAt: link.firstDownloadedAt,
          downloadExpiresAt: link.expiresAt,
          downloadCount: link.downloadCount,
          maxDownloads: link.maxDownloads,
          status: link.status,
          remainingMs: diff != null ? Math.max(diff, 0) : null,
          isExpired: expiresAt ? expiresAt.getTime() <= now.getTime() : false,
        };
      });

    return res.status(200).json({ downloads });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des téléchargements utilisateur :",
      error
    );
    return res.status(500).json({
      message:
        "Erreur lors de la récupération des téléchargements utilisateur.",
    });
  }
}
