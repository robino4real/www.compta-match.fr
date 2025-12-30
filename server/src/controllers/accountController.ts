import crypto from "crypto";
import { Request, Response } from "express";
import {
  AccountType,
  OrderAdjustmentStatus,
  OrderAdjustmentType,
  OrderStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { hashPassword, verifyPassword } from "../utils/password";
import { stripe } from "../config/stripeClient";

function getAuthenticatedUserId(req: Request): string | null {
  const request = req as AuthenticatedRequest;
  return request.user?.id || null;
}

function sendUnauthenticated(res: Response) {
  return res.status(401).json({ message: "Non authentifié." });
}

const buildInvoiceDownloadUrl = (invoiceId: string) =>
  `${env.apiBaseUrl.replace(/\/$/, "")}/invoices/${invoiceId}/download`;

const buildDownloadUrl = (token: string) =>
  `${env.apiBaseUrl.replace(/\/$/, "")}/downloads/${token}`;

export async function getAccountSubscriptions(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return sendUnauthenticated(res);
  }

  try {
    const subscriptions = await prisma.userSubscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ subscriptions });
  } catch (error) {
    console.error("[account] Erreur lors de la récupération des abonnements", error);
    return res.status(500).json({
      message: "Impossible de récupérer vos abonnements pour le moment.",
    });
  }
}

export async function getAccountOrders(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return sendUnauthenticated(res);
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        invoice: true,
        items: { include: { product: true } },
        adjustments: {
          where: { type: OrderAdjustmentType.EXTRA_PAYMENT },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const normalizedOrders = orders.map((order) => ({
      ...order,
      invoice: order.invoice
        ? {
            ...order.invoice,
            downloadUrl: buildInvoiceDownloadUrl(order.invoice.id),
          }
        : null,
    }));

    return res.json({ orders: normalizedOrders });
  } catch (error) {
    console.error("[account] Erreur lors de la récupération des commandes", error);
    return res.status(500).json({
      message: "Impossible de récupérer vos commandes pour le moment.",
    });
  }
}

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    invoice: true;
    items: {
      include: {
        product: { include: { binaries: true } };
        binary: true;
        downloadLinks: true;
      };
    };
    adjustments: true;
  };
}>;

function findDownloadableItem(order: OrderWithRelations) {
  return order.items.find(
    (item) =>
      Boolean(item.product?.storagePath) ||
      (Array.isArray(item.product?.binaries) && item.product.binaries.length > 0)
  );
}

function buildDownloadState(order: OrderWithRelations) {
  const downloadableItem = findDownloadableItem(order);
  const now = new Date();

  if (!downloadableItem) {
    return {
      hasDownloadableProduct: false,
      activeLink: null,
      isExpired: false,
    };
  }

  const sortedLinks = [...downloadableItem.downloadLinks].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const activeLink = sortedLinks.find(
    (link) =>
      link.status === "ACTIVE" && (!link.expiresAt || link.expiresAt.getTime() > now.getTime())
  );

  const latestLink = sortedLinks[0];

  return {
    hasDownloadableProduct: true,
    activeLink: activeLink
      ? {
          token: activeLink.token,
          expiresAt: activeLink.expiresAt,
          downloadUrl: buildDownloadUrl(activeLink.token),
          remainingSeconds: activeLink.expiresAt
            ? Math.max(0, Math.floor((activeLink.expiresAt.getTime() - now.getTime()) / 1000))
            : null,
        }
      : null,
    isExpired: latestLink?.expiresAt
      ? latestLink.expiresAt.getTime() <= now.getTime()
      : false,
  };
}

function serializeOrderDetail(order: OrderWithRelations) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    totalPaid: order.totalPaid,
    currency: order.currency,
    orderType: order.orderType,
    subscriptionBrand: order.subscriptionBrand,
    billingName: order.billingNameSnapshot,
    billingEmail: order.billingEmailSnapshot,
    invoice: order.invoice
      ? {
          ...order.invoice,
          downloadUrl: buildInvoiceDownloadUrl(order.invoice.id),
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productNameSnapshot || item.product?.name || "Produit",
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      platform: item.platform,
    })),
    adjustments: order.adjustments.map((adjustment) => ({
      id: adjustment.id,
      type: adjustment.type,
      status: adjustment.status,
      amountCents: adjustment.amountCents,
      currency: adjustment.currency,
      clientNote: adjustment.clientNote,
      adminNote: adjustment.adminNote,
      stripeCheckoutSessionId: adjustment.stripeCheckoutSessionId,
      createdAt: adjustment.createdAt,
    })),
  };
}

export async function getAccountOrderDetail(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return sendUnauthenticated(res);
  }

  const { orderId } = req.params as { orderId?: string };

  if (!orderId) {
    return res.status(400).json({ message: "Identifiant de commande manquant." });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        invoice: true,
        items: {
          include: {
            product: { include: { binaries: true } },
            binary: true,
            downloadLinks: true,
          },
        },
        adjustments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    const download = buildDownloadState(order);

    return res.json({ order: serializeOrderDetail(order), download });
  } catch (error) {
    console.error("[account] Erreur lors de la récupération du détail commande", error);
    return res.status(500).json({
      message: "Impossible de récupérer le détail de cette commande pour le moment.",
    });
  }
}

export async function createExtraPaymentCheckoutSession(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return sendUnauthenticated(res);
  }

  const { orderId } = req.params as { orderId?: string };

  if (!orderId) {
    return res.status(400).json({ message: "Identifiant de commande manquant." });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { adjustments: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      return res.status(400).json({ message: "Cette commande ne peut plus être réglée." });
    }

    const adjustment = order.adjustments.find(
      (adj) =>
        adj.type === OrderAdjustmentType.EXTRA_PAYMENT &&
        (adj.status === OrderAdjustmentStatus.PENDING || adj.status === OrderAdjustmentStatus.SENT)
    );

    if (!adjustment) {
      return res.status(400).json({ message: "Aucun paiement complémentaire en attente." });
    }

    if (order.status !== OrderStatus.EN_ATTENTE_DE_PAIEMENT) {
      return res.status(400).json({ message: "Cette commande n'est pas en attente de paiement." });
    }

    if (!adjustment.amountCents || adjustment.amountCents <= 0) {
      return res.status(400).json({ message: "Montant de paiement complémentaire invalide." });
    }

    const currency = order.currency || "EUR";
    const successUrlBase = `${env.frontendBaseUrl.replace(/\/$/, "")}/compte/commandes/${order.id}`;
    let sessionUrl: string | null = null;

    if (adjustment.stripeCheckoutSessionId) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(adjustment.stripeCheckoutSessionId);

        if (existingSession?.payment_status === "paid") {
          await prisma.$transaction([
            prisma.orderAdjustment.update({
              where: { id: adjustment.id },
              data: { status: OrderAdjustmentStatus.PAID },
            }),
            prisma.order.update({
              where: { id: order.id },
              data: {
                status: OrderStatus.PAID,
                paidAt: order.paidAt || new Date(),
                totalPaid: order.totalPaid + adjustment.amountCents,
              },
            }),
          ]);

          return res.status(200).json({ alreadyPaid: true, message: "Paiement déjà effectué." });
        }

        if (existingSession?.status === "open" && existingSession.url) {
          sessionUrl = existingSession.url;
        }
      } catch (error) {
        console.warn(
          "[account] Impossible de récupérer la session Stripe existante pour l'ajustement",
          adjustment.stripeCheckoutSessionId,
          error
        );
      }
    }

    if (!sessionUrl) {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: adjustment.amountCents,
              product_data: {
                name: `Paiement complémentaire commande ${order.orderNumber || "ComptaMatch"}`,
              },
            },
          },
        ],
        success_url: `${successUrlBase}?paid=1`,
        cancel_url: successUrlBase,
        customer_email: order.billingEmailSnapshot || undefined,
        client_reference_id: order.id,
        metadata: {
          orderId: order.id,
          adjustmentId: adjustment.id,
          adjustmentType: adjustment.type,
          userId,
          environment: env.nodeEnv,
        },
      });

      sessionUrl = session.url || null;

      await prisma.orderAdjustment.update({
        where: { id: adjustment.id },
        data: { stripeCheckoutSessionId: session.id },
      });
    }

    if (!sessionUrl) {
      return res.status(500).json({ message: "Impossible de créer la session de paiement." });
    }

    return res.json({ url: sessionUrl });
  } catch (error) {
    console.error("[account] Erreur lors de la création de la session de paiement complémentaire", error);
    return res.status(500).json({ message: "Impossible de créer la session de paiement." });
  }
}

export async function generateOrderDownloadLink(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return sendUnauthenticated(res);
  }

  const { orderId } = req.params as { orderId?: string };

  if (!orderId) {
    return res.status(400).json({ message: "Identifiant de commande manquant." });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        invoice: true,
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

    if (order.status !== "PAID") {
      return res
        .status(400)
        .json({ message: "La commande doit être réglée pour générer un téléchargement." });
    }

    const downloadableItem = findDownloadableItem(order);

    if (!downloadableItem) {
      return res
        .status(400)
        .json({ message: "Cette commande ne contient pas de produit téléchargeable." });
    }

    if (downloadableItem.downloadLinks.length > 0) {
      return res.status(400).json({
        message:
          "Un lien a déjà été généré pour cette commande. Contactez le support ou l'admin pour un nouveau lien.",
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    const link = await prisma.downloadLink.create({
      data: {
        orderItemId: downloadableItem.id,
        userId: order.userId,
        productId: downloadableItem.productId,
        token: crypto.randomBytes(32).toString("hex"),
        status: "ACTIVE",
        maxDownloads: 50,
        downloadCount: 0,
        expiresAt,
      },
    });

    return res.status(201).json({
      message: "Lien de téléchargement généré.",
      link: {
        token: link.token,
        expiresAt: link.expiresAt,
        downloadUrl: buildDownloadUrl(link.token),
        remainingSeconds: Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)),
      },
    });
  } catch (error) {
    console.error("[account] Erreur lors de la génération du lien de téléchargement", error);
    return res.status(500).json({
      message: "Impossible de générer le lien, contactez le support.",
    });
  }
}

export async function getAccountProfile(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return sendUnauthenticated(res);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const profile =
      user.profile || {
        accountType: AccountType.INDIVIDUAL,
      };

    return res.json({ user: { ...user, profile }, profile });
  } catch (error) {
    console.error("[account] Erreur lors de la récupération du profil", error);
    return res.status(500).json({
      message: "Impossible de charger vos informations de profil.",
    });
  }
}

export async function updateAccountProfile(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return sendUnauthenticated(res);
  }

  const {
    firstName,
    lastName,
    companyName,
    vatNumber,
    siret,
    billingStreet,
    billingZip,
    billingCity,
    billingCountry,
    phone,
    accountType,
  } = (req.body ?? {}) as Record<string, string | undefined>;

  const normalizeAccountType = (value?: string): AccountType | null => {
    const normalized = (value || "").toUpperCase();
    if (!normalized) return null;
    if (normalized === "PROFESSIONAL") return "PROFESSIONAL";
    if (normalized === "ASSOCIATION") return "ASSOCIATION";
    if (normalized === "INDIVIDUAL") return "INDIVIDUAL";
    if (normalized === "COMPANY") return "COMPANY";
    if (normalized === "ENTREPRENEUR") return "ENTREPRENEUR";
    return null;
  };

  try {
    const resolvedAccountType = normalizeAccountType(accountType);
    if (accountType && !resolvedAccountType) {
      return res.status(400).json({
        message:
          "Statut de compte invalide. Valeurs autorisées : INDIVIDUAL, PROFESSIONAL, ASSOCIATION, COMPANY ou ENTREPRENEUR.",
      });
    }

    const sanitizedData = {
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      companyName: companyName?.trim() || null,
      vatNumber: vatNumber?.trim() || null,
      siret: siret?.trim() || null,
      billingStreet: billingStreet?.trim() || null,
      billingZip: billingZip?.trim() || null,
      billingCity: billingCity?.trim() || null,
      billingCountry: billingCountry?.trim() || null,
      phone: phone?.trim() || null,
    };

    const accountTypeUpdate = resolvedAccountType
      ? { accountType: resolvedAccountType }
      : {};

    const [user, profile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          firstName: sanitizedData.firstName,
          lastName: sanitizedData.lastName,
          ...accountTypeUpdate,
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      }),
      prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          ...sanitizedData,
          accountType: resolvedAccountType || AccountType.INDIVIDUAL,
        },
        update: { ...sanitizedData, ...accountTypeUpdate },
      }),
    ]);

    return res.json({
      message: "Profil mis à jour avec succès.",
      user,
      profile,
    });
  } catch (error) {
    console.error("[account] Erreur lors de la mise à jour du profil", error);
    return res.status(500).json({
      message: "Impossible de mettre à jour votre profil pour le moment.",
    });
  }
}

export async function getAccountSettings(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return sendUnauthenticated(res);
  }

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return res.json({ settings });
  } catch (error) {
    console.error("[account] Erreur lors de la récupération des paramètres", error);
    return res.status(500).json({
      message: "Impossible de charger vos paramètres de compte.",
    });
  }
}

export async function updateAccountSettings(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return sendUnauthenticated(res);
  }

  const { newsletterOptIn, alertsOptIn } = (req.body ?? {}) as {
    newsletterOptIn?: boolean;
    alertsOptIn?: boolean;
  };

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        newsletterOptIn: Boolean(newsletterOptIn),
        alertsOptIn: alertsOptIn !== undefined ? Boolean(alertsOptIn) : true,
      },
      update: {
        ...(newsletterOptIn !== undefined && {
          newsletterOptIn: Boolean(newsletterOptIn),
        }),
        ...(alertsOptIn !== undefined && { alertsOptIn: Boolean(alertsOptIn) }),
      },
    });

    return res.json({
      message: "Paramètres mis à jour.",
      settings,
    });
  } catch (error) {
    console.error("[account] Erreur lors de la mise à jour des paramètres", error);
    return res.status(500).json({
      message: "Impossible de mettre à jour vos paramètres pour le moment.",
    });
  }
}

export async function changePassword(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return sendUnauthenticated(res);
  }

  const { currentPassword, newPassword } = (req.body ?? {}) as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Mot de passe actuel et nouveau mot de passe requis.",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "Le mot de passe doit contenir au moins 8 caractères.",
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.passwordHash) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const isValid = verifyPassword(currentPassword, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        message: "Mot de passe actuel incorrect.",
      });
    }

    const passwordHash = hashPassword(newPassword);

    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return res.json({ message: "Mot de passe mis à jour." });
  } catch (error) {
    console.error("[account] Erreur lors du changement de mot de passe", error);
    return res.status(500).json({
      message: "Impossible de changer votre mot de passe pour le moment.",
    });
  }
}
