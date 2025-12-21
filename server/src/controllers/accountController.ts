import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AccountType } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { hashPassword, verifyPassword } from "../utils/password";

function getAuthenticatedUserId(req: Request): string | null {
  const request = req as AuthenticatedRequest;
  return request.user?.id || null;
}

function sendUnauthenticated(res: Response) {
  return res.status(401).json({ message: "Non authentifié." });
}

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
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ orders });
  } catch (error) {
    console.error("[account] Erreur lors de la récupération des commandes", error);
    return res.status(500).json({
      message: "Impossible de récupérer vos commandes pour le moment.",
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
    return null;
  };

  try {
    const resolvedAccountType = normalizeAccountType(accountType);
    if (accountType && !resolvedAccountType) {
      return res.status(400).json({
        message:
          "Statut de compte invalide. Valeurs autorisées : INDIVIDUAL, PROFESSIONAL ou ASSOCIATION.",
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
      accountType: resolvedAccountType || undefined,
    };

    const [user, profile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          firstName: sanitizedData.firstName,
          lastName: sanitizedData.lastName,
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      }),
      prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          ...sanitizedData,
          accountType: sanitizedData.accountType || AccountType.INDIVIDUAL,
        },
        update: { ...sanitizedData },
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
