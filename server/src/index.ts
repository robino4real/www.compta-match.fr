import express, { Router } from "express";
import fs from "fs";
import path from "path";
import { env } from "./config/env";
import healthRoutes from "./routes/healthRoutes";
import adminRoutes from "./routes/adminRoutes";
import {
  attachUserToRequest,
  requireAdmin,
  requireAuth,
} from "./middleware/authMiddleware";
import { errorHandler } from "./middleware/errorHandler";
import orderRoutes from "./routes/orderRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import downloadRoutes from "./routes/downloadRoutes";
import cartRoutes from "./routes/cartRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";
import legalPageRoutes from "./routes/legalPageRoutes";
import articleRoutes from "./routes/articleRoutes";
import authRoutes from "./routes/authRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import publicRoutes from "./routes/publicRoutes";
import catalogRoutes from "./routes/catalogRoutes";
import downloadableProductRoutes from "./routes/downloadableProductRoutes";
import accountRoutes from "./routes/accountRoutes";
import appRoutes from "./routes/appRoutes";
import { ensureAdminAccount } from "./services/adminAccountService";
import { robotsTxtHandler, sitemapHandler } from "./controllers/seoController";
import paidServicesRoutes from "./routes/paidServicesRoutes";
import { handleOrderDownloadByToken } from "./controllers/downloadController";
import { handleStripeWebhook } from "./controllers/paymentController";
import { renderIndexWithSeo } from "./utils/seoRenderer";
import { FicheRequest, requireFicheAccess } from "./middleware/ficheAccessMiddleware";

const app = express();
const apiRouter = Router();

app.set("trust proxy", 1);

console.log("[config] Frontend base URL:", env.frontendBaseUrl);
console.log("[config] API base URL:", env.apiBaseUrl);
console.log("[config] Stripe mode:", env.stripeMode);
console.log(
  "[config] Stripe webhook secret present:",
  Boolean(env.stripeActiveWebhookSecret),
  "source=",
  env.stripeActiveWebhookSecretSource || "none"
);

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin as string | undefined;

  const isAllowedOrigin =
    !env.allowCorsOrigins.length ||
    (requestOrigin && env.allowCorsOrigins.includes(requestOrigin));

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
app.post(
  "/api/payments/stripe/webhook",
  express.raw({ type: "*/*" }),
  handleStripeWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(env.downloadsStorageDir));

apiRouter.use("/health", healthRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/analytics", analyticsRoutes);
apiRouter.use("/public", publicRoutes);
apiRouter.use("/downloadable-products", downloadableProductRoutes);
apiRouter.use("/paid-services", paidServicesRoutes);
apiRouter.use(attachUserToRequest);
apiRouter.get(
  "/download/:token",
  requireAuth,
  handleOrderDownloadByToken
);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/catalog", catalogRoutes);
apiRouter.use("/cart", cartRoutes);
apiRouter.use("/legal-pages", legalPageRoutes);
apiRouter.use("/articles", articleRoutes);
apiRouter.use("/downloads", downloadRoutes);
apiRouter.use("/admin", requireAdmin, adminRoutes);
apiRouter.use("/orders", requireAuth, orderRoutes);
apiRouter.use("/invoices", requireAuth, invoiceRoutes);
apiRouter.use("/account", requireAuth, accountRoutes);
apiRouter.use("/app", appRoutes);

app.use("/api", apiRouter);
app.get("/robots.txt", robotsTxtHandler);
app.get("/sitemap.xml", sitemapHandler);

// Servez toujours le build Vite généré (emplacement configurable)
// On privilégie toujours le build le plus récent : variable d'environnement,
// puis build local client/dist, puis fallback server/frontend (archive de déploiement).
const frontendDirCandidates = [
  process.env.FRONTEND_DIST_DIR
    ? path.resolve(process.env.FRONTEND_DIST_DIR)
    : null,
  // Emplacement par défaut en développement : client/dist
  path.resolve(__dirname, "..", "..", "client", "dist"),
  // Dossier utilisé lors du packaging pour cPanel : server/frontend
  path.resolve(__dirname, "..", "frontend"),
].filter(Boolean) as string[];

const frontendDir = frontendDirCandidates.find((candidate) => fs.existsSync(candidate));

if (!frontendDir) {
  console.warn(
    "[frontend] Aucun build front trouvé. Attendu dans l'un des chemins suivants :",
    frontendDirCandidates,
  );
}

const serveWebAppIndex = (res: express.Response) => {
  const indexPath = frontendDir ? path.join(frontendDir, "index.html") : null;

  if (indexPath && fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.status(200).send("OK SECURED");
};

const secureWebAppRoute = (expectedType: "COMPTAPRO" | "COMPTASSO") =>
  [
    attachUserToRequest,
    requireAuth,
    requireFicheAccess,
    (req: express.Request, res: express.Response) => {
      const { fiche } = req as FicheRequest;

      if (!fiche || fiche.type !== expectedType) {
        return res.status(404).send("Ressource introuvable");
      }

      return serveWebAppIndex(res);
    },
  ] as const;

app.get("/app/comptapro/:ficheId", ...secureWebAppRoute("COMPTAPRO"));
app.get("/app/comptapro/:ficheId/*", ...secureWebAppRoute("COMPTAPRO"));
app.get("/app/comptasso/:ficheId", ...secureWebAppRoute("COMPTASSO"));
app.get("/app/comptasso/:ficheId/*", ...secureWebAppRoute("COMPTASSO"));

if (frontendDir) {
  app.use(express.static(frontendDir));
}

app.get("*", async (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  if (!frontendDir) {
    return res.status(404).send("Interface front-end introuvable (build manquant).");
  }

  const indexPath = path.join(frontendDir, "index.html");

  if (!fs.existsSync(indexPath)) {
    return res.status(404).send("Interface front-end introuvable.");
  }

  try {
    await renderIndexWithSeo({ req, res, indexPath });
  } catch (error) {
    console.error("[seo] Rendu SEO côté serveur impossible, fallback index.html", error);
    return res.sendFile(indexPath);
  }
});

app.use(errorHandler);

ensureAdminAccount().catch((error) => {
  console.error("[admin] Impossible de vérifier/créer le compte administrateur", error);
});

const HOST = "0.0.0.0";

app.listen(env.port, HOST, () => {
  console.log(`Serveur ComptaMatch démarré sur http://${HOST}:${env.port} (IPv4 uniquement)`);
});
