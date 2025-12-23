import dotenv from "dotenv";

dotenv.config();

const appendApiSuffix = (value: string) => {
  const normalized = value.replace(/\/$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

const normalizeOrigin = (value?: string | null) => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.origin;
  } catch (error) {
    // Tente d'ajouter un schéma manquant (ex: "https://") pour éviter les CORS vides
    try {
      const url = new URL(`https://${value.replace(/^\/*/, "")}`);
      return url.origin;
    } catch (nestedError) {
      console.warn(`[env] Impossible de parser l'URL fournie: ${value}`, error, nestedError);
      return null;
    }
  }
};

const rawFrontendBaseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
const rawApiBaseUrl = appendApiSuffix(
  process.env.API_BASE_URL || process.env.FRONTEND_BASE_URL || "http://localhost:4000"
);

const defaultCorsOrigins = [
  "https://compta-match.fr",
  "https://www.compta-match.fr",
];

const extraCorsOrigins = (process.env.ALLOWED_CORS_ORIGINS || "")
  .split(/[,\s]+/)
  .map((origin) => origin.trim())
  .filter(Boolean);

const frontendOrigin = normalizeOrigin(rawFrontendBaseUrl);
const apiOrigin = normalizeOrigin(rawApiBaseUrl.replace(/\/api$/, ""));
const allowCorsOrigins = Array.from(
  new Set(
    [
      ...defaultCorsOrigins,
      frontendOrigin,
      apiOrigin,
      ...extraCorsOrigins.map(normalizeOrigin),
    ].filter((value): value is string => Boolean(value))
  )
);

const isCrossSite = frontendOrigin && apiOrigin && frontendOrigin !== apiOrigin;
const frontendUsesHttps = frontendOrigin?.startsWith("https://");
const cookieSameSite: "lax" | "none" = isCrossSite ? "none" : "lax";
const cookieSecure = process.env.NODE_ENV === "production" || Boolean(frontendUsesHttps);

export const env = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://USER:PASSWORD@localhost:5432/comptamatch_saas?schema=public",
  frontendBaseUrl: rawFrontendBaseUrl,
  apiBaseUrl: rawApiBaseUrl,
  frontendOrigin,
  apiOrigin,
  allowCorsOrigins,
  cookieSameSite,
  cookieSecure,
  downloadsStorageDir:
    process.env.DOWNLOADS_STORAGE_DIR ||
    `/home/${process.env.USER || "node"}/comptamatch_uploads`,
  adminPersonalEmail: process.env.ADMIN_PERSONAL_EMAIL,
  adminBackofficePassword: process.env.ADMIN_BACKOFFICE_PASSWORD,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  nodeEnv: process.env.NODE_ENV || "development",
};
