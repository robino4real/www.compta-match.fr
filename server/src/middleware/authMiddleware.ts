import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      isEmailVerified: boolean;
      createdAt: Date;
    }
  }
}

export type AuthenticatedRequest = Request & {
  user?: Express.User;
  cookies?: Record<string, string>;
};

function parseCookies(header?: string): Record<string, string> {
  if (!header) {
    return {};
  }

  return header.split(";").reduce<Record<string, string>>((acc, cookie) => {
    const [rawKey, ...rest] = cookie.split("=");
    if (!rawKey) return acc;

    const key = rawKey.trim();
    const value = rest.join("=").trim();
    if (key) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});
}

function decodeToken(token: string): { userId?: string } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Token invalide", error);
    return null;
  }
}

export async function attachUserToRequest(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.cookies) {
    req.cookies = parseCookies(req.headers.cookie);
  }

  const token = req.cookies?.token;

  if (!token) {
    return next();
  }

  const payload = decodeToken(token);

  if (!payload?.userId) {
    return next();
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (user) {
      req.user = user;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du token", error);
  }

  return next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Non authentifié." });
  }

  return next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Non authentifié." });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Accès réservé à l'administrateur." });
  }

  return next();
}
