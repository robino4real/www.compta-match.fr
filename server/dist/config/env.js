"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const appendApiSuffix = (value) => {
    const normalized = value.replace(/\/$/, "");
    return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};
const normalizeOrigin = (value) => {
    if (!value)
        return null;
    try {
        const url = new URL(value);
        return url.origin;
    }
    catch (error) {
        // Tente d'ajouter un schéma manquant (ex: "https://") pour éviter les CORS vides
        try {
            const url = new URL(`https://${value.replace(/^\/*/, "")}`);
            return url.origin;
        }
        catch (nestedError) {
            console.warn(`[env] Impossible de parser l'URL fournie: ${value}`, error, nestedError);
            return null;
        }
    }
};
const appEnv = process.env.APP_ENV || process.env.NODE_ENV || "development";
const stripeMode = process.env.STRIPE_MODE === "live" ? "live" : "test";
const stripeWebhookSecretFallback = process.env.STRIPE_WEBHOOK_SECRET;
const stripeWebhookSecretTest = process.env.STRIPE_WEBHOOK_SECRET_TEST;
const stripeWebhookSecretLive = process.env.STRIPE_WEBHOOK_SECRET_LIVE;
const stripeActiveWebhookSecret = stripeMode === "live"
    ? stripeWebhookSecretLive || stripeWebhookSecretFallback
    : stripeWebhookSecretTest || stripeWebhookSecretFallback;
const stripeActiveWebhookSecretSource = stripeMode === "live"
    ? stripeWebhookSecretLive
        ? "STRIPE_WEBHOOK_SECRET_LIVE"
        : stripeWebhookSecretFallback
            ? "STRIPE_WEBHOOK_SECRET"
            : null
    : stripeWebhookSecretTest
        ? "STRIPE_WEBHOOK_SECRET_TEST"
        : stripeWebhookSecretFallback
            ? "STRIPE_WEBHOOK_SECRET"
            : null;
const defaultFrontendBaseUrl = appEnv === "production" ? "https://www.compta-match.fr" : "http://localhost:5173";
const rawFrontendBaseUrl = process.env.FRONTEND_URL || process.env.FRONTEND_BASE_URL || defaultFrontendBaseUrl;
const rawApiBaseUrl = appendApiSuffix(process.env.API_BASE_URL ||
    process.env.FRONTEND_BASE_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:4000");
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
const allowCorsOrigins = Array.from(new Set([
    ...defaultCorsOrigins,
    frontendOrigin,
    apiOrigin,
    ...extraCorsOrigins.map(normalizeOrigin),
].filter((value) => Boolean(value))));
const canonicalWebOrigin = normalizeOrigin(process.env.CANONICAL_WEB_ORIGIN) || frontendOrigin || "https://www.compta-match.fr";
const canonicalWebHost = canonicalWebOrigin ? new URL(canonicalWebOrigin).hostname : null;
const isCrossSite = frontendOrigin && apiOrigin && frontendOrigin !== apiOrigin;
const frontendUsesHttps = frontendOrigin?.startsWith("https://");
const cookieSameSite = process.env.COOKIE_SAMESITE ||
    (appEnv === "production" ? "none" : isCrossSite ? "none" : "lax");
const cookieSecure = process.env.NODE_ENV === "production" || Boolean(frontendUsesHttps);
const extractCookieDomain = (origin) => {
    if (!origin)
        return null;
    try {
        const url = new URL(origin);
        const hostSegments = url.hostname.split(".");
        if (hostSegments.length < 2) {
            return null;
        }
        const topLevelDomain = hostSegments.slice(-2).join(".");
        return `.${topLevelDomain}`;
    }
    catch (error) {
        console.warn(`[env] Impossible de déterminer le domaine de cookie pour ${origin}`, error);
        return null;
    }
};
const cookieDomain = process.env.COOKIE_DOMAIN ||
    (appEnv === "production" ? ".compta-match.fr" : null) ||
    extractCookieDomain(frontendOrigin) ||
    extractCookieDomain(apiOrigin);
exports.env = {
    port: Number(process.env.PORT) || 4000,
    databaseUrl: process.env.DATABASE_URL ||
        "postgresql://USER:PASSWORD@localhost:5432/comptamatch_saas?schema=public",
    frontendBaseUrl: rawFrontendBaseUrl,
    apiBaseUrl: rawApiBaseUrl,
    frontendOrigin,
    apiOrigin,
    allowCorsOrigins,
    canonicalWebOrigin,
    canonicalWebHost,
    cookieSameSite,
    cookieSecure,
    cookieDomain,
    stripeMode,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: stripeWebhookSecretFallback,
    stripeWebhookSecretTest,
    stripeWebhookSecretLive,
    stripeActiveWebhookSecret,
    stripeActiveWebhookSecretSource,
    publicBaseUrl: process.env.PUBLIC_BASE_URL ||
        apiOrigin ||
        rawApiBaseUrl.replace(/\/api$/, "").replace(/\/$/, ""),
    downloadsStorageDir: process.env.DOWNLOADS_STORAGE_DIR ||
        `/home/${process.env.USER || "node"}/comptamatch_uploads`,
    adminPersonalEmail: process.env.ADMIN_PERSONAL_EMAIL,
    adminBackofficePassword: process.env.ADMIN_BACKOFFICE_PASSWORD,
    jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
    nodeEnv: process.env.NODE_ENV || "development",
    trackingEnabled: (process.env.TRACKING_ENABLED || "true").toLowerCase() === "true",
};
