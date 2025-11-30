import dotenv from "dotenv";

dotenv.config();

const appendApiSuffix = (value: string) => {
  const normalized = value.replace(/\/$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

export const env = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://USER:PASSWORD@localhost:5432/comptamatch_saas?schema=public",
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:5173",
  apiBaseUrl: process.env.API_BASE_URL
    ? appendApiSuffix(process.env.API_BASE_URL)
    : "http://localhost:4000/api",
  downloadsStorageDir:
    process.env.DOWNLOADS_STORAGE_DIR ||
    `/home/${process.env.USER || "node"}/comptamatch_uploads`,
  adminPersonalEmail: process.env.ADMIN_PERSONAL_EMAIL,
  adminBackofficePassword: process.env.ADMIN_BACKOFFICE_PASSWORD,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  nodeEnv: process.env.NODE_ENV || "development",
};
