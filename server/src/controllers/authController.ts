import crypto from "crypto";
import { Request, Response } from "express";
import { prisma } from "../config/prisma";

const TOKEN_COOKIE_NAME = "token";
const TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 jours
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;

function createToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId }), "utf-8").toString("base64");
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(PASSWORD_SALT_BYTES).toString("hex");
  const derivedKey = crypto
    .scryptSync(password, salt, PASSWORD_KEY_LENGTH)
    .toString("hex");

  return `${salt}:${derivedKey}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, storedKey] = storedHash.split(":");
  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = crypto
    .scryptSync(password, salt, PASSWORD_KEY_LENGTH)
    .toString("hex");

  const storedBuffer = Buffer.from(storedKey, "hex");
  const derivedBuffer = Buffer.from(derivedKey, "hex");

  if (storedBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedBuffer);
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

  setAuthCookie(res, user.id);

  return res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
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
