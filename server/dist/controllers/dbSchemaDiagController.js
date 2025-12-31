"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbSchemaDiagnostics = getDbSchemaDiagnostics;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_1 = require("../config/prisma");
const dbSchemaDiag_1 = require("../utils/dbSchemaDiag");
function readJsonFile(filePath) {
    try {
        const content = fs_1.default.readFileSync(filePath, "utf-8");
        return JSON.parse(content);
    }
    catch (error) {
        console.warn(`[diag] Impossible de lire ${filePath}`, error);
        return null;
    }
}
function readPackageVersion() {
    const pkgPath = path_1.default.resolve(process.cwd(), "package.json");
    const pkg = readJsonFile(pkgPath);
    return pkg?.version || "unknown";
}
function readCommitSha() {
    try {
        const headPath = path_1.default.resolve(process.cwd(), ".git", "HEAD");
        const headContent = fs_1.default.readFileSync(headPath, "utf-8").trim();
        if (headContent.startsWith("ref:")) {
            const refPath = headContent.replace("ref:", "").trim();
            const refFullPath = path_1.default.resolve(process.cwd(), ".git", refPath);
            return fs_1.default.readFileSync(refFullPath, "utf-8").trim() || "unknown";
        }
        return headContent || "unknown";
    }
    catch (error) {
        console.warn("[diag] Commit SHA indisponible", error);
        return "unknown";
    }
}
function readPrismaClientVersion() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pkg = require("@prisma/client/package.json");
        return pkg.version || "unknown";
    }
    catch (error) {
        console.warn("[diag] Version Prisma Client indisponible", error);
        return "unknown";
    }
}
async function getDbSchemaDiagnostics(req, res) {
    try {
        const diagnostics = (await (0, dbSchemaDiag_1.runDbSchemaDiagnostics)(prisma_1.prisma)) || (0, dbSchemaDiag_1.getLatestDbSchemaDiagnostics)();
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
    }
    catch (error) {
        console.error("[diag] Impossible d'exécuter le diagnostic DB", error);
        const fallback = (0, dbSchemaDiag_1.getLatestDbSchemaDiagnostics)();
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
