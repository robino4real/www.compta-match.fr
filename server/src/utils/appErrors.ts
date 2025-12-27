import { Response } from "express";

export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export interface AppErrorBody {
  ok: false;
  error: {
    code: AppErrorCode;
    message: string;
  };
}

export function appError(
  res: Response,
  statusCode: number,
  code: AppErrorCode,
  message: string
): Response<AppErrorBody> {
  return res.status(statusCode).json({ ok: false, error: { code, message } });
}

export const appErrors = {
  badRequest: (res: Response, message = "Requête invalide") =>
    appError(res, 400, "BAD_REQUEST", message),
  unauthorized: (res: Response, message = "Authentification requise") =>
    appError(res, 401, "UNAUTHORIZED", message),
  forbidden: (res: Response, message = "Accès interdit") =>
    appError(res, 403, "FORBIDDEN", message),
  notFound: (res: Response, message = "Ressource introuvable") =>
    appError(res, 404, "NOT_FOUND", message),
  internal: (res: Response, message = "Erreur interne du serveur") =>
    appError(res, 500, "INTERNAL_ERROR", message),
};
