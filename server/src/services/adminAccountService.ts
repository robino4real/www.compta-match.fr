import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { hashPassword } from "../utils/password";

export const ADMIN_BACKOFFICE_EMAIL = "admin-user@compta-match.fr";

export async function ensureAdminAccount() {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_BACKOFFICE_EMAIL },
  });

  if (existing) return existing;

  if (!env.adminBackofficePassword || env.adminBackofficePassword.length < 8) {
    console.warn(
      `[admin] Aucun mot de passe initial fourni ou mot de passe trop court pour ${ADMIN_BACKOFFICE_EMAIL}.` +
        " Définissez ADMIN_BACKOFFICE_PASSWORD pour créer automatiquement le compte administrateur."
    );
    return null;
  }

  const passwordHash = hashPassword(env.adminBackofficePassword);

  return prisma.user.create({
    data: {
      email: ADMIN_BACKOFFICE_EMAIL,
      passwordHash,
      role: "admin",
    },
  });
}
