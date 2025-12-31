import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { HttpError, isHttpError } from "../utils/errors";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2022") {
    const meta = err.meta as { [key: string]: unknown } | undefined;
    const model = typeof meta?.modelName === "string" ? meta?.modelName : "unknown";
    const columnMeta = meta?.column ?? meta?.target;
    const column = typeof columnMeta === "string" ? columnMeta : Array.isArray(columnMeta) ? columnMeta.join(",") : "unknown";
    const diagEndpoint = "/api/admin/diag/db-schema";

    console.error(
      `[prisma:P2022] model=${model} missingColumn=${column} => DB schema mismatch. Fix: apply migration SQL in Postgres OR regenerate Prisma client locally and redeploy node_modules/@prisma and node_modules/.prisma. See ${diagEndpoint}`,
      { meta }
    );

    return res.status(500).json({
      ok: false,
      error: {
        code: "DB_SCHEMA_MISMATCH",
        message: "Schéma de base de données incompatible",
        details: {
          model,
          column,
          probableCause: ["Prisma Client déployé obsolète", "DATABASE_URL pointe vers une autre DB"],
          diagEndpoint,
        },
      },
    });
  }

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
