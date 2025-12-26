"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const errorHandler_1 = require("./middleware/errorHandler");
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const downloadRoutes_1 = __importDefault(require("./routes/downloadRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const legalPageRoutes_1 = __importDefault(require("./routes/legalPageRoutes"));
const articleRoutes_1 = __importDefault(require("./routes/articleRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const publicRoutes_1 = __importDefault(require("./routes/publicRoutes"));
const catalogRoutes_1 = __importDefault(require("./routes/catalogRoutes"));
const downloadableProductRoutes_1 = __importDefault(require("./routes/downloadableProductRoutes"));
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
const adminAccountService_1 = require("./services/adminAccountService");
const seoController_1 = require("./controllers/seoController");
const paidServicesRoutes_1 = __importDefault(require("./routes/paidServicesRoutes"));
const downloadController_1 = require("./controllers/downloadController");
const paymentController_1 = require("./controllers/paymentController");
const app = (0, express_1.default)();
const apiRouter = (0, express_1.Router)();
app.set("trust proxy", 1);
console.log("[config] Frontend base URL:", env_1.env.frontendBaseUrl);
console.log("[config] API base URL:", env_1.env.apiBaseUrl);
console.log("[config] Stripe mode:", env_1.env.stripeMode);
console.log("[config] Stripe webhook secret present:", Boolean(env_1.env.stripeActiveWebhookSecret), "source=", env_1.env.stripeActiveWebhookSecretSource || "none");
app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const isAllowedOrigin = !env_1.env.allowCorsOrigins.length ||
        (requestOrigin && env_1.env.allowCorsOrigins.includes(requestOrigin));
    if (requestOrigin && isAllowedOrigin) {
        res.header("Access-Control-Allow-Origin", requestOrigin);
        res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});
// Webhook Stripe : doit recevoir le corps RAW pour la vérification de signature.
app.post("/api/payments/stripe/webhook", express_1.default.raw({ type: "*/*" }), paymentController_1.handleStripeWebhook);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use("/uploads", express_1.default.static(env_1.env.downloadsStorageDir));
apiRouter.use("/health", healthRoutes_1.default);
apiRouter.use("/auth", authRoutes_1.default);
apiRouter.use("/analytics", analyticsRoutes_1.default);
apiRouter.use("/public", publicRoutes_1.default);
apiRouter.use("/downloadable-products", downloadableProductRoutes_1.default);
apiRouter.use("/paid-services", paidServicesRoutes_1.default);
apiRouter.use(authMiddleware_1.attachUserToRequest);
apiRouter.get("/download/:token", authMiddleware_1.requireAuth, downloadController_1.handleOrderDownloadByToken);
apiRouter.use("/payments", paymentRoutes_1.default);
apiRouter.use("/catalog", catalogRoutes_1.default);
apiRouter.use("/cart", cartRoutes_1.default);
apiRouter.use("/legal-pages", legalPageRoutes_1.default);
apiRouter.use("/articles", articleRoutes_1.default);
apiRouter.use("/downloads", downloadRoutes_1.default);
apiRouter.use("/admin", authMiddleware_1.requireAdmin, adminRoutes_1.default);
apiRouter.use("/orders", authMiddleware_1.requireAuth, orderRoutes_1.default);
apiRouter.use("/invoices", authMiddleware_1.requireAuth, invoiceRoutes_1.default);
apiRouter.use("/account", authMiddleware_1.requireAuth, accountRoutes_1.default);
app.use("/api", apiRouter);
app.get("/robots.txt", seoController_1.robotsTxtHandler);
app.get("/sitemap.xml", seoController_1.sitemapHandler);
// Servez toujours le build Vite généré (emplacement configurable)
// On privilégie toujours le build le plus récent : variable d'environnement,
// puis build local client/dist, puis fallback server/frontend (archive de déploiement).
const frontendDirCandidates = [
    process.env.FRONTEND_DIST_DIR
        ? path_1.default.resolve(process.env.FRONTEND_DIST_DIR)
        : null,
    // Emplacement par défaut en développement : client/dist
    path_1.default.resolve(__dirname, "..", "..", "client", "dist"),
    // Dossier utilisé lors du packaging pour cPanel : server/frontend
    path_1.default.resolve(__dirname, "..", "frontend"),
].filter(Boolean);
const frontendDir = frontendDirCandidates.find((candidate) => fs_1.default.existsSync(candidate));
if (!frontendDir) {
    console.warn("[frontend] Aucun build front trouvé. Attendu dans l'un des chemins suivants :", frontendDirCandidates);
}
if (frontendDir) {
    app.use(express_1.default.static(frontendDir));
}
app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
        return next();
    }
    if (!frontendDir) {
        return res.status(404).send("Interface front-end introuvable (build manquant).");
    }
    const indexPath = path_1.default.join(frontendDir, "index.html");
    if (!fs_1.default.existsSync(indexPath)) {
        return res.status(404).send("Interface front-end introuvable.");
    }
    return res.sendFile(indexPath);
});
app.use(errorHandler_1.errorHandler);
(0, adminAccountService_1.ensureAdminAccount)().catch((error) => {
    console.error("[admin] Impossible de vérifier/créer le compte administrateur", error);
});
const HOST = "0.0.0.0";
app.listen(env_1.env.port, HOST, () => {
    console.log(`Serveur ComptaMatch démarré sur http://${HOST}:${env_1.env.port} (IPv4 uniquement)`);
});
