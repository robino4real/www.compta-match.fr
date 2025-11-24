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
    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: "Token de téléchargement manquant." });
    }

    const orderItem = await prisma.orderItem.findUnique({
      where: {
        downloadToken: token,
      },
      include: {
        order: true,
        product: true,
      },
    });

    if (!orderItem) {
      return res.status(404).json({ message: "Lien de téléchargement introuvable." });
    }

    if (orderItem.order.userId !== userId) {
      return res.status(403).json({ message: "Vous n'avez pas accès à ce téléchargement." });
    }

    if (orderItem.order.status !== "PAID") {
      return res.status(403).json({ message: "La commande n'est pas finalisée." });
    }

    const now = new Date();

    if (orderItem.downloadFirstAt && orderItem.downloadExpiresAt) {
      // Téléchargement déjà démarré : on vérifie la fenêtre d'une heure
      if (now > orderItem.downloadExpiresAt) {
        return res.status(410).json({
          message:
            "Le lien de téléchargement a expiré. La fenêtre de téléchargement d'une heure est dépassée.",
        });
      }

      // Fenêtre encore valide : on autorise un nouveau téléchargement
      await prisma.orderItem.update({
        where: { id: orderItem.id },
        data: {
          downloadCount: orderItem.downloadCount + 1,
        },
      });
    } else {
      // Premier téléchargement : on initialise la fenêtre d'une heure
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

      await prisma.orderItem.update({
        where: { id: orderItem.id },
        data: {
          downloadFirstAt: now,
          downloadExpiresAt: expiresAt,
          downloadCount: 1,
        },
      });
    }

    const product = orderItem.product;

    if (!product.storagePath || !product.fileName) {
      return res.status(500).json({
        message:
          "Le fichier associé à ce produit n'est pas disponible sur le serveur.",
      });
    }

    // Si storagePath est déjà un chemin absolu, on peut l'utiliser tel quel.
    // Sinon, on le résout depuis la racine du projet serveur.
    const filePath = path.isAbsolute(product.storagePath)
      ? product.storagePath
      : path.join(__dirname, "../../", product.storagePath);

    if (!fs.existsSync(filePath)) {
      return res.status(500).json({
        message:
          "Le fichier à télécharger est introuvable sur le serveur.",
      });
    }

    // Envoi du fichier au client
    return res.download(filePath, product.fileName);
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

export async function listUserDownloads(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  try {
    const userId = request.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    // On récupère tous les OrderItem des commandes payées de cet utilisateur
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          userId,
          status: "PAID",
        },
      },
      include: {
        order: true,
        product: true,
      },
      orderBy: {
        order: {
          createdAt: "desc",
        },
      },
    });

    const now = new Date();

    const downloads = items.map((item) => {
      let remainingMs: number | null = null;
      let isExpired = false;

      if (item.downloadExpiresAt) {
        const diff = item.downloadExpiresAt.getTime() - now.getTime();
        remainingMs = diff > 0 ? diff : 0;
        isExpired = diff <= 0;
      }

      return {
        id: item.id,
        token: item.downloadToken,
        productId: item.productId,
        productName: item.product.name,
        productDescription: item.product.shortDescription,
        priceCents: item.priceCents,
        orderCreatedAt: item.order.createdAt,
        downloadFirstAt: item.downloadFirstAt,
        downloadExpiresAt: item.downloadExpiresAt,
        downloadCount: item.downloadCount,
        remainingMs,
        isExpired,
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
