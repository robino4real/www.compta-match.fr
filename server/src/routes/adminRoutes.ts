import { Router } from "express";
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
  listPromoCodes,
  createPromoCode,
  getPromoCodeById,
  updatePromoCode,
  archivePromoCode,
} from "../controllers/promoCodeAdminController";

const router = Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads/downloads");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
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

export default router;
