import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { verifyJwt } from "../utils/jwt";
import { appErrors } from "../utils/appErrors";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      isEmailVerified: boolean;
      firstName?: string | null;
      lastName?: string | null;
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
      try {
        acc[key] = decodeURIComponent(value);
      } catch (error) {
        console.warn(`[cookies] Échec du décodage du cookie "${key}"`, error);
        acc[key] = value;
      }
    }
    return acc;
  }, {});
}

export async function attachUserToRequest(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  if (!req.cookies) {
    req.cookies = parseCookies(req.headers.cookie);
  }

  const authorization = req.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : undefined;
  const token = bearerToken || req.cookies?.token;

  if (!token) {
    return next();
  }

  const payload = verifyJwt(token, env.jwtSecret);

  if (!payload?.sub) {
    return next();
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

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
    return appErrors.unauthorized(res);
  }

  return next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return appErrors.unauthorized(res);
  }

  if (req.user.role !== "admin") {
    return appErrors.forbidden(res, "Accès réservé à l'administrateur.");
  }

  return next();
}
