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
import { ensureAdminAccount } from "./services/adminAccountService";
import { robotsTxtHandler, sitemapHandler } from "./controllers/seoController";
import paidServicesRoutes from "./routes/paidServicesRoutes";

const app = express();
const apiRouter = Router();

app.set("trust proxy", 1);

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

app.use("/api", apiRouter);
app.get("/robots.txt", robotsTxtHandler);
app.get("/sitemap.xml", sitemapHandler);

const frontendDir = path.resolve(__dirname, "..", "frontend");
app.use(express.static(frontendDir));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  const indexPath = path.join(frontendDir, "index.html");

  if (!fs.existsSync(indexPath)) {
    return res.status(404).send("Interface front-end introuvable.");
  }

  return res.sendFile(indexPath);
});

app.use(errorHandler);

ensureAdminAccount().catch((error) => {
  console.error("[admin] Impossible de vérifier/créer le compte administrateur", error);
});

app.listen(env.port, () => {
  console.log(`Serveur ComptaMatch démarré sur le port ${env.port}`);
});
