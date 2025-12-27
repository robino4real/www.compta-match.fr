import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export async function recordAuditLog(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Prisma.JsonValue
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        metadata: metadata ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] Impossible d'enregistrer le log", error);
  }
}
