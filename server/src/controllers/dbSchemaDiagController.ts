import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { getLatestDbSchemaDiagnostics, runDbSchemaDiagnostics } from "../utils/dbSchemaDiag";

function readJsonFile<T = unknown>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    console.warn(`[diag] Impossible de lire ${filePath}`, error);
    return null;
  }
}

function readPackageVersion(): string {
  const pkgPath = path.resolve(process.cwd(), "package.json");
  const pkg = readJsonFile<{ version?: string }>(pkgPath);
  return pkg?.version || "unknown";
}

function readCommitSha(): string {
  try {
    const headPath = path.resolve(process.cwd(), ".git", "HEAD");
    const headContent = fs.readFileSync(headPath, "utf-8").trim();

    if (headContent.startsWith("ref:")) {
      const refPath = headContent.replace("ref:", "").trim();
      const refFullPath = path.resolve(process.cwd(), ".git", refPath);

      return fs.readFileSync(refFullPath, "utf-8").trim() || "unknown";
    }

    return headContent || "unknown";
  } catch (error) {
    console.warn("[diag] Commit SHA indisponible", error);
    return "unknown";
  }
}

function readPrismaClientVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require("@prisma/client/package.json");
    return pkg.version || "unknown";
  } catch (error) {
    console.warn("[diag] Version Prisma Client indisponible", error);
    return "unknown";
  }
}

export async function getDbSchemaDiagnostics(req: Request, res: Response) {
  try {
    const diagnostics = (await runDbSchemaDiagnostics(prisma)) || getLatestDbSchemaDiagnostics();
    const serverBuildInfo = {
      version: readPackageVersion(),
      commitSha: readCommitSha(),
    };

    const statusOk = diagnostics?.expectedColumnsCheck?.ok ?? false;

    return res.status(statusOk ? 200 : 503).json({
      dbIdentity: diagnostics?.dbIdentity || null,
      expectedColumnsCheck: diagnostics?.expectedColumnsCheck || null,
      serverBuildInfo,
      prismaClientVersion: readPrismaClientVersion(),
      ok: statusOk,
    });
  } catch (error) {
    console.error("[diag] Impossible d'exécuter le diagnostic DB", error);
    const fallback = getLatestDbSchemaDiagnostics();

    return res.status(500).json({
      ok: false,
      dbIdentity: fallback?.dbIdentity || null,
      expectedColumnsCheck: fallback?.expectedColumnsCheck || null,
      serverBuildInfo: {
        version: readPackageVersion(),
        commitSha: readCommitSha(),
      },
      prismaClientVersion: readPrismaClientVersion(),
      error: "DB_DIAG_FAILED",
    });
  }
}
