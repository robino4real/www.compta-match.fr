import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { createAdminTwoFactorCode, verifyAdminTwoFactorCode as verifyAdminTwoFactorCodeService } from "../services/adminTwoFactorService";
import { sendAdminLoginOtpEmail } from "../services/transactionalEmailService";
import { ADMIN_BACKOFFICE_EMAIL } from "../services/adminAccountService";
import { hashPassword, verifyPassword } from "../utils/password";

const TOKEN_COOKIE_NAME = "token";
const TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 jours
function createToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId }), "utf-8").toString("base64");
}

function setAuthCookie(res: Response, userId: string) {
  const token = createToken(userId);

  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TOKEN_MAX_AGE_MS,
  });
}

export async function register(req: Request, res: Response) {
  const { email, password } = (req.body ?? {}) as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ message: "Email et mot de passe requis." });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res
      .status(400)
      .json({ message: "Un compte existe déjà avec cet email." });
  }

  const passwordHash = hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      role: "user",
    },
  });

  setAuthCookie(res, user.id);

  return res.status(201).json({
    id: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = (req.body ?? {}) as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ message: "Email et mot de passe requis." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect." });
  }

  if (!user.passwordHash) {
    return res
      .status(400)
      .json({ message: "Ce compte n'a pas encore de mot de passe. Contactez le support." });
  }

  const isValidPassword = verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect." });
  }

  if (user.email === ADMIN_BACKOFFICE_EMAIL) {
    if (!env.adminPersonalEmail) {
      return res.status(500).json({
        message:
          "Adresse email personnelle de l'administrateur manquante (ADMIN_PERSONAL_EMAIL)",
      });
    }

    const { code, token, expiresAt } = await createAdminTwoFactorCode(user.id);
    const sent = await sendAdminLoginOtpEmail(
      code,
      env.adminPersonalEmail,
      expiresAt
    );

    if (!sent) {
      return res.status(500).json({
        message: "Impossible d'envoyer le code de vérification. Merci de réessayer.",
      });
    }

    return res.json({
      status: "OTP_REQUIRED",
      twoFactorToken: token,
      message: "Un code de vérification a été envoyé sur votre email personnel.",
    });
  }

  setAuthCookie(res, user.id);

  return res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  });
}

export async function verifyAdminTwoFactorCode(req: Request, res: Response) {
  const { twoFactorToken, code } = (req.body ?? {}) as {
    twoFactorToken?: string;
    code?: string;
  };

  if (!twoFactorToken || !code) {
    return res
      .status(400)
      .json({ message: "Token de vérification et code requis." });
  }

  const result = await verifyAdminTwoFactorCodeService(twoFactorToken, code);

  if (result.status === "NOT_FOUND") {
    return res.status(404).json({ message: "Requête de vérification introuvable." });
  }

  if (result.status === "EXPIRED") {
    return res
      .status(410)
      .json({ message: "Code expiré, veuillez vous reconnecter." });
  }

  if (result.status === "INVALID_CODE") {
    return res.status(401).json({ message: "Code invalide." });
  }

  if (result.status === "TOO_MANY_ATTEMPTS") {
    return res.status(429).json({
      message: "Nombre de tentatives dépassé. Veuillez vous reconnecter.",
    });
  }

  if (!result.user || result.user.email !== ADMIN_BACKOFFICE_EMAIL) {
    return res.status(403).json({ message: "Accès refusé." });
  }

  setAuthCookie(res, result.user.id);

  return res.json({
    id: result.user.id,
    email: result.user.email,
    role: result.user.role,
    isEmailVerified: result.user.isEmailVerified,
  });
}

export async function logout(_req: Request, res: Response) {
  res.cookie(TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  return res.status(200).json({ message: "Déconnecté." });
}

export async function me(req: Request, res: Response) {
  const user = (req as Request & { user?: Express.User }).user;

  if (!user) {
    return res.status(401).json({ message: "Non authentifié." });
  }

  return res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  });
}
