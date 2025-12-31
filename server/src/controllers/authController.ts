import { Request, Response } from "express";
import { Prisma, AccountType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import {
  createAdminTwoFactorCode,
  verifyAdminTwoFactorCode as verifyAdminTwoFactorCodeService,
} from "../services/adminTwoFactorService";
import { sendAdminLoginOtpEmail } from "../services/transactionalEmailService";
import { ADMIN_BACKOFFICE_EMAIL } from "../services/adminAccountService";
import { CustomerActivityEventType } from "@prisma/client";
import { trackCustomerEvent } from "../services/customerActivityService";
import { hashPassword, verifyPassword } from "../utils/password";
import { signJwt } from "../utils/jwt";

const TOKEN_COOKIE_NAME = "token";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours
const TOKEN_MAX_AGE_MS = TOKEN_MAX_AGE_SECONDS * 1000;

interface AuthRequestBody {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  accountType?: string;
  companyName?: string;
  vatNumber?: string;
  siret?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
}

type UserWithProfile = {
  id: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  firstName?: string | null;
  lastName?: string | null;
  profile?: {
    accountType: AccountType;
    companyName?: string | null;
    vatNumber?: string | null;
    siret?: string | null;
    billingStreet?: string | null;
    billingZip?: string | null;
    billingCity?: string | null;
    billingCountry?: string | null;
    phone?: string | null;
  } | null;
};

function sanitizeUser(user: UserWithProfile) {
  const profile = user.profile
    ? {
        accountType: user.profile.accountType,
        companyName: user.profile.companyName,
        vatNumber: user.profile.vatNumber,
        siret: user.profile.siret,
        billingStreet: user.profile.billingStreet,
        billingZip: user.profile.billingZip,
        billingCity: user.profile.billingCity,
        billingCountry: user.profile.billingCountry,
        phone: user.profile.phone,
      }
    : undefined;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    firstName: user.firstName,
    lastName: user.lastName,
    profile,
  };
}

function buildJwtForUser(userId: string) {
  return signJwt(userId, env.jwtSecret, TOKEN_MAX_AGE_SECONDS);
}

function setAuthCookie(res: Response, token: string) {
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure,
    maxAge: TOKEN_MAX_AGE_MS,
    ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
    path: "/",
  });
}

function sendUnexpectedError(res: Response, error: unknown) {
  const err = error as Error;
  console.error("[auth] unexpected error", err);
  return res.status(500).json({
    error: "AUTH_UNEXPECTED_ERROR",
    message: "Une erreur est survenue. Merci de réessayer ultérieurement.",
  });
}

export async function register(req: Request, res: Response) {
  const {
    email,
    password,
    firstName,
    lastName,
    accountType,
    companyName,
    vatNumber,
    siret,
    address1,
    address2,
    postalCode,
    city,
    country,
    phone,
  } = (req.body ?? {}) as AuthRequestBody;
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedAccountType = (accountType || "").toUpperCase();

  if (
    !normalizedEmail ||
    !password?.trim() ||
    !firstName?.trim() ||
    !lastName?.trim() ||
    !postalCode?.trim() ||
    !city?.trim() ||
    !country?.trim() ||
    !address1?.trim()
  ) {
    return res.status(400).json({
      error: "INVALID_PAYLOAD",
      message:
        "Email, mot de passe, nom, prénom et adresse de facturation sont requis.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: "PASSWORD_TOO_SHORT",
      message: "Le mot de passe doit contenir au moins 8 caractères.",
    });
  }

  if (
    !["PROFESSIONAL", "ASSOCIATION", "INDIVIDUAL", "COMPANY", "ENTREPRENEUR"].includes(
      normalizedAccountType
    )
  ) {
    return res.status(400).json({
      error: "INVALID_ACCOUNT_TYPE",
      message:
        "Le statut du compte doit être renseigné (professionnel, association, société ou entrepreneur).",
    });
  }

  try {
    const billingStreet = [address1.trim(), address2?.trim()].filter(Boolean).join(", ");

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "user",
        accountType: normalizedAccountType as AccountType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profile: {
          create: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            companyName: companyName?.trim() || null,
            vatNumber: vatNumber?.trim() || null,
            siret: siret?.trim() || null,
            billingStreet,
            billingZip: postalCode.trim(),
            billingCity: city.trim(),
            billingCountry: country.trim(),
            accountType: normalizedAccountType as AccountType,
            phone: phone?.trim() || null,
          },
        },
      },
      include: { profile: true },
    });

    await trackCustomerEvent(CustomerActivityEventType.USER_REGISTERED, {
      userId: user.id,
      email: user.email,
      meta: { accountType: normalizedAccountType },
    });

    const token = buildJwtForUser(user.id);
    setAuthCookie(res, token);

    return res.status(201).json({
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        error: "EMAIL_ALREADY_USED",
        message: "Un compte existe déjà avec cet email.",
      });
    }

    return sendUnexpectedError(res, error);
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = (req.body ?? {}) as AuthRequestBody;

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({
      error: "INVALID_PAYLOAD",
      message: "Email et mot de passe requis.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user || !verifyPassword(password, user.passwordHash || "")) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Email ou mot de passe incorrect.",
      });
    }

    if (user.email === ADMIN_BACKOFFICE_EMAIL) {
      if (!env.adminPersonalEmail) {
        return res.status(500).json({
          error: "ADMIN_PERSONAL_EMAIL_MISSING",
          message:
            "Adresse email personnelle de l'administrateur manquante (ADMIN_PERSONAL_EMAIL)",
        });
      }

      const { code, token, expiresAt } = await createAdminTwoFactorCode(user.id);
      const sent = await sendAdminLoginOtpEmail(code, env.adminPersonalEmail, expiresAt);

      if (!sent) {
        return res.status(500).json({
          error: "OTP_SEND_FAILED",
          message: "Impossible d'envoyer le code de vérification. Merci de réessayer.",
        });
      }

      return res.json({
        status: "OTP_REQUIRED",
        twoFactorToken: token,
        message: "Un code de vérification a été envoyé sur votre email personnel.",
      });
    }

    const jwt = buildJwtForUser(user.id);
    setAuthCookie(res, jwt);

    await trackCustomerEvent(CustomerActivityEventType.USER_LOGIN, {
      userId: user.id,
      email: user.email,
    });

    return res.json({ user: sanitizeUser(user), token: jwt });
  } catch (error) {
    return sendUnexpectedError(res, error);
  }
}

export async function verifyAdminTwoFactorCode(req: Request, res: Response) {
  const { twoFactorToken, code } = (req.body ?? {}) as {
    twoFactorToken?: string;
    code?: string;
  };

  if (!twoFactorToken || !code) {
    return res.status(400).json({
      error: "INVALID_PAYLOAD",
      message: "Token de vérification et code requis.",
    });
  }

  try {
    const result = await verifyAdminTwoFactorCodeService(twoFactorToken, code);

    if (result.status === "NOT_FOUND") {
      return res.status(404).json({
        error: "OTP_REQUEST_NOT_FOUND",
        message: "Requête de vérification introuvable.",
      });
    }

    if (result.status === "EXPIRED") {
      return res.status(410).json({
        error: "OTP_EXPIRED",
        message: "Code expiré, veuillez vous reconnecter.",
      });
    }

    if (result.status === "INVALID_CODE") {
      return res.status(401).json({ error: "OTP_INVALID", message: "Code invalide." });
    }

    if (result.status === "TOO_MANY_ATTEMPTS") {
      return res.status(429).json({
        error: "OTP_TOO_MANY_ATTEMPTS",
        message: "Nombre de tentatives dépassé. Veuillez vous reconnecter.",
      });
    }

    if (!result.user || result.user.email !== ADMIN_BACKOFFICE_EMAIL) {
      return res.status(403).json({ error: "FORBIDDEN", message: "Accès refusé." });
    }

    const token = buildJwtForUser(result.user.id);
    setAuthCookie(res, token);

    return res.json({ user: sanitizeUser(result.user), token });
  } catch (error) {
    return sendUnexpectedError(res, error);
  }
}

export async function logout(_req: Request, res: Response) {
  res.cookie(TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure,
    maxAge: 0,
    expires: new Date(0),
    ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
    path: "/",
  });

  return res.status(200).json({ success: true, message: "Déconnecté." });
}

export async function me(req: Request, res: Response) {
  const user = (req as Request & { user?: Express.User }).user;

  if (!user) {
    return res.status(401).json({ error: "UNAUTHENTICATED", message: "Non authentifié." });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    if (!dbUser) {
      return res.status(404).json({ error: "USER_NOT_FOUND", message: "Utilisateur introuvable." });
    }

    return res.json(sanitizeUser(dbUser));
  } catch (error) {
    return sendUnexpectedError(res, error);
  }
}
