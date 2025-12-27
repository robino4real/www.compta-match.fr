import { NextFunction, Request, Response } from "express";
import { HttpError, isHttpError } from "../utils/errors";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const httpError = isHttpError(err)
    ? err
    : new HttpError(500, err.message || "Erreur interne du serveur");

  console.error("[error]", {
    code: httpError.code,
    statusCode: httpError.statusCode,
    message: httpError.message,
    stack: err.stack,
  });

  res.status(httpError.statusCode).json({
    ok: false,
    error: { code: httpError.code, message: httpError.message },
  });
}
