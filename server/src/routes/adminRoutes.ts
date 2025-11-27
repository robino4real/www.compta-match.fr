import { Router, type Request } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { attachUserToRequest, requireAdmin } from "../middleware/authMiddleware";
import { listUsers } from "../controllers/adminController";
import {
  createDownloadableProduct,
  getDownloadableProductById,
  updateDownloadableProduct,
} from "../controllers/adminDownloadController";
import {
  getStripeSettings,
  updateStripeSettings,
} from "../controllers/stripeSettingsController";
import {
  getCompanySettings,
  saveCompanySettings,
} from "../controllers/companySettingsController";
import {
  adminGetInvoice,
  adminListInvoices,
  adminRegenerateInvoice,
  downloadInvoice,
} from "../controllers/invoiceController";
import {
  adminGetOrder,
  adminListOrders,
  adminMarkOrderRefunded,
  adminRegenerateDownloadLink,
} from "../controllers/adminOrderController";
import {
  listPromoCodes,
  createPromoCode,
  getPromoCodeById,
  updatePromoCode,
  archivePromoCode,
} from "../controllers/promoCodeAdminController";
import {
  getEmailSettings,
  saveEmailSettings,
} from "../controllers/emailSettingsController";
import {
  adminGetEmailTemplate,
  adminListEmailTemplates,
  adminUpdateEmailTemplate,
} from "../controllers/emailTemplateController";
import {
  adminCreateDefaultLegalPages,
  adminGetLegalPage,
  adminListLegalPages,
  adminUpdateLegalPage,
} from "../controllers/legalPageController";
import {
  adminCreateArticle,
  adminGetArticle,
  adminListArticles,
  adminUpdateArticle,
} from "../controllers/articleController";
import { getDashboard } from "../controllers/dashboardController";
import {
  adminGetHomepageSettings,
  adminSaveHomepageSettings,
} from "../controllers/homepageSettingsController";
import {
  adminGetSeoSettings,
  adminListSeoStaticPages,
  adminSaveSeoSettings,
  adminSeedSeoStaticPages,
  adminUpdateSeoStaticPage,
} from "../controllers/seoController";
import {
  adminCreateCustomPage,
  adminCreatePageBlock,
  adminCreatePageSection,
  adminDeleteCustomPage,
  adminDeletePageBlock,
  adminDeletePageSection,
  adminGetCustomPage,
  adminListCustomPages,
  adminReorderPageBlocks,
  adminReorderPageSections,
  adminUpdateCustomPage,
  adminUpdatePageBlock,
  adminUpdatePageSection,
} from "../controllers/pageBuilderController";

const router = Router();

const storage = multer.diskStorage({
  destination(req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const uploadDir = path.join(__dirname, "../../uploads/downloads");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}-${sanitized}`);
  },
});

const upload = multer({ storage });

// GET /admin/users
router.get("/users", attachUserToRequest, requireAdmin, listUsers);

router.post(
  "/downloads",
  attachUserToRequest,
  requireAdmin,
  upload.single("file"),
  createDownloadableProduct
);

router.get(
  "/dashboard",
  attachUserToRequest,
  requireAdmin,
  getDashboard
);

router.get(
  "/downloads/:id",
  attachUserToRequest,
  requireAdmin,
  getDownloadableProductById
);

router.put(
  "/downloads/:id",
  attachUserToRequest,
  requireAdmin,
  updateDownloadableProduct
);

// Paramétrages Stripe (réservés à l'administrateur)
router.get(
  "/stripe-settings",
  attachUserToRequest,
  requireAdmin,
  getStripeSettings
);

router.put(
  "/stripe-settings",
  attachUserToRequest,
  requireAdmin,
  updateStripeSettings
);

// Gestion des codes promo
router.get(
  "/promo-codes",
  attachUserToRequest,
  requireAdmin,
  listPromoCodes
);

router.post(
  "/promo-codes",
  attachUserToRequest,
  requireAdmin,
  createPromoCode
);

router.get(
  "/promo-codes/:id",
  attachUserToRequest,
  requireAdmin,
  getPromoCodeById
);

router.put(
  "/promo-codes/:id",
  attachUserToRequest,
  requireAdmin,
  updatePromoCode
);

router.delete(
  "/promo-codes/:id",
  attachUserToRequest,
  requireAdmin,
  archivePromoCode
);

// Paramètres entreprise / facturation
router.get(
  "/company-settings",
  attachUserToRequest,
  requireAdmin,
  getCompanySettings
);

router.put(
  "/company-settings",
  attachUserToRequest,
  requireAdmin,
  saveCompanySettings
);

// Paramètres emails & notifications
router.get(
  "/email-settings",
  attachUserToRequest,
  requireAdmin,
  getEmailSettings
);

router.put(
  "/email-settings",
  attachUserToRequest,
  requireAdmin,
  saveEmailSettings
);

router.get(
  "/email-templates",
  attachUserToRequest,
  requireAdmin,
  adminListEmailTemplates
);

router.get(
  "/email-templates/:id",
  attachUserToRequest,
  requireAdmin,
  adminGetEmailTemplate
);

router.put(
  "/email-templates/:id",
  attachUserToRequest,
  requireAdmin,
  adminUpdateEmailTemplate
);

// Pages légales
router.get(
  "/legal-pages",
  attachUserToRequest,
  requireAdmin,
  adminListLegalPages
);

router.get(
  "/articles",
  attachUserToRequest,
  requireAdmin,
  adminListArticles
);

router.get(
  "/articles/:id",
  attachUserToRequest,
  requireAdmin,
  adminGetArticle
);

router.post(
  "/articles",
  attachUserToRequest,
  requireAdmin,
  adminCreateArticle
);

router.put(
  "/articles/:id",
  attachUserToRequest,
  requireAdmin,
  adminUpdateArticle
);

router.post(
  "/legal-pages/seed-defaults",
  attachUserToRequest,
  requireAdmin,
  adminCreateDefaultLegalPages
);

router.get(
  "/homepage-settings",
  attachUserToRequest,
  requireAdmin,
  adminGetHomepageSettings
);

router.put(
  "/homepage-settings",
  attachUserToRequest,
  requireAdmin,
  adminSaveHomepageSettings
);

// Page Builder - pages
router.get(
  "/pages",
  attachUserToRequest,
  requireAdmin,
  adminListCustomPages
);

router.get(
  "/pages/:id",
  attachUserToRequest,
  requireAdmin,
  adminGetCustomPage
);

router.post(
  "/pages",
  attachUserToRequest,
  requireAdmin,
  adminCreateCustomPage
);

router.put(
  "/pages/:id",
  attachUserToRequest,
  requireAdmin,
  adminUpdateCustomPage
);

router.delete(
  "/pages/:id",
  attachUserToRequest,
  requireAdmin,
  adminDeleteCustomPage
);

// Page Builder - sections
router.post(
  "/pages/:pageId/sections",
  attachUserToRequest,
  requireAdmin,
  adminCreatePageSection
);

router.post(
  "/pages/:pageId/sections/reorder",
  attachUserToRequest,
  requireAdmin,
  adminReorderPageSections
);

router.put(
  "/sections/:sectionId",
  attachUserToRequest,
  requireAdmin,
  adminUpdatePageSection
);

router.delete(
  "/sections/:sectionId",
  attachUserToRequest,
  requireAdmin,
  adminDeletePageSection
);

// Page Builder - blocks
router.post(
  "/sections/:sectionId/blocks",
  attachUserToRequest,
  requireAdmin,
  adminCreatePageBlock
);

router.post(
  "/sections/:sectionId/blocks/reorder",
  attachUserToRequest,
  requireAdmin,
  adminReorderPageBlocks
);

router.put(
  "/blocks/:blockId",
  attachUserToRequest,
  requireAdmin,
  adminUpdatePageBlock
);

router.delete(
  "/blocks/:blockId",
  attachUserToRequest,
  requireAdmin,
  adminDeletePageBlock
);

router.get(
  "/seo/settings",
  attachUserToRequest,
  requireAdmin,
  adminGetSeoSettings
);

router.put(
  "/seo/settings",
  attachUserToRequest,
  requireAdmin,
  adminSaveSeoSettings
);

router.get(
  "/seo/static-pages",
  attachUserToRequest,
  requireAdmin,
  adminListSeoStaticPages
);

router.post(
  "/seo/static-pages/seed",
  attachUserToRequest,
  requireAdmin,
  adminSeedSeoStaticPages
);

router.put(
  "/seo/static-pages/:id",
  attachUserToRequest,
  requireAdmin,
  adminUpdateSeoStaticPage
);

router.get(
  "/legal-pages/:id",
  attachUserToRequest,
  requireAdmin,
  adminGetLegalPage
);

router.put(
  "/legal-pages/:id",
  attachUserToRequest,
  requireAdmin,
  adminUpdateLegalPage
);

// Factures
router.get(
  "/invoices",
  attachUserToRequest,
  requireAdmin,
  adminListInvoices
);

router.get(
  "/invoices/:id",
  attachUserToRequest,
  requireAdmin,
  adminGetInvoice
);

router.post(
  "/invoices/:id/regenerate",
  attachUserToRequest,
  requireAdmin,
  adminRegenerateInvoice
);

router.get(
  "/invoices/:id/download",
  attachUserToRequest,
  requireAdmin,
  downloadInvoice
);

// Commandes
router.get("/orders", attachUserToRequest, requireAdmin, adminListOrders);
router.get(
  "/orders/:id",
  attachUserToRequest,
  requireAdmin,
  adminGetOrder
);
router.post(
  "/orders/:id/refund",
  attachUserToRequest,
  requireAdmin,
  adminMarkOrderRefunded
);
router.post(
  "/orders/:orderItemId/regenerate-link",
  attachUserToRequest,
  requireAdmin,
  adminRegenerateDownloadLink
);

export default router;
