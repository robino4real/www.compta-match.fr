import { Router, type Request } from "express";
import multer from "multer";
import fs from "fs";
import { env } from "../config/env";
import { attachUserToRequest, requireAdmin } from "../middleware/authMiddleware";
import { adminUploadAsset, listUsers } from "../controllers/adminController";
import { downloadSuretyBackup, listSuretyBackups } from "../controllers/adminBackupController";
import {
  createDownloadableProduct,
  getDownloadableProductById,
  updateDownloadableProduct,
  listAdminDownloadableProducts,
  archiveDownloadableProduct,
  restoreDownloadableProduct,
  uploadDownloadableBinary,
} from "../controllers/adminDownloadController";
import {
  adminCreateDownloadableCategory,
  adminDeleteDownloadableCategory,
  adminListDownloadableCategories,
} from "../controllers/downloadableCategoryController";
import {
  getStripeSettings,
  updateStripeSettings,
} from "../controllers/stripeSettingsController";
import {
  getCompanySettings,
  saveCompanySettings,
} from "../controllers/companySettingsController";
import { getDbSchemaDiagnostics } from "../controllers/dbSchemaDiagController";
import {
  adminGetInvoice,
  adminListInvoices,
  adminRegenerateInvoice,
  downloadInvoice,
} from "../controllers/invoiceController";
import {
  adminGetOrder,
  adminGetOrderInvoice,
  adminCreateOrRegenerateInvoice,
  adminDownloadOrderInvoice,
  adminListOrders,
  adminListRecentOrders,
  adminRegenerateDownloadLink,
  adminCancelOrder,
  adminRefundOrder,
  adminSoftDeleteOrder,
  adminAdjustOrder,
  adminSendOrderAdjustment,
} from "../controllers/adminOrderController";
import {
  listPromoCodes,
  createPromoCode,
  getPromoCodeById,
  updatePromoCode,
  getPromoCodeStats,
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
import {
  adminGetClientQuestion,
  adminListClientQuestions,
  adminPublishClientQuestion,
  adminUnpublishClientQuestion,
  adminUpdateClientQuestion,
} from "../controllers/clientQuestionController";
import { getDashboard } from "../controllers/dashboardController";
import {
  adminGetHomepageSettings,
  adminSaveHomepageSettings,
} from "../controllers/homepageSettingsController";
import { getAdminDbStatus } from "../controllers/adminDbStatusController";
import {
  adminGetClientDetail,
  adminListClients,
  adminUpdateCustomer,
  adminGetClientOrders,
  adminGetClientInvoices,
  adminGetClientDownloads,
} from "../controllers/adminCustomerController";
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
  adminCreateWhyChooseItem,
  adminUpdateWhyChooseItem,
  adminDeleteWhyChooseItem,
  adminReorderWhyChooseItems,
  adminReorderPageBlocks,
  adminReorderPageSections,
  adminUpdateCustomPage,
  adminUpdatePageBlock,
  adminUpdatePageSection,
} from "../controllers/pageBuilderController";
import {
  adminCreateGeoAnswer,
  adminCreateGeoFaq,
  adminDeleteGeoAnswer,
  adminDeleteGeoFaq,
  adminGetGeoIdentity,
  adminGetPageSeo,
  adminGetProductSeo,
  adminGetSeoSettingsV2,
  adminListGeoAnswers,
  adminListGeoFaq,
  adminRunSeoGeoDiagnostics,
  adminReorderGeoAnswers,
  adminReorderGeoFaq,
  adminApplySeoGeoAutofill,
  adminPreviewSeoGeoAutofill,
  adminSavePageSeo,
  adminSaveProductSeo,
  adminUpdateGeoAnswer,
  adminUpdateGeoFaq,
  adminUpdateGeoIdentity,
  adminUpdateSeoSettingsV2,
} from "../controllers/seoGeoAdminController";
import {
  createSubscriber,
  exportSubscribers,
  getNewsletterKpis,
  importSubscribers,
  listSubscribers,
  resubscribeSubscriber,
  exportSubscriberData,
  anonymizeSubscriberData,
  unsubscribeSubscriber,
  updateSubscriber,
} from "../controllers/newsletterAdminController";
import {
  cancelCampaign,
  createCampaign,
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  getCampaign,
  getCampaignStats,
  getNewsletterSettings,
  getTemplate,
  listCampaigns,
  listTemplates,
  previewRecipients,
  scheduleCampaign,
  sendCampaignNowHandler,
  updateCampaign,
  updateNewsletterSettings,
  updateTemplate,
} from "../controllers/newsletterCampaignController";
import {
  activateAutomation,
  analyticsCampaigns,
  analyticsCohorts,
  analyticsOverview,
  analyticsSegments,
  createAutomation,
  createSegment,
  deleteSegment,
  forceAutomationTick,
  getAutomation,
  getSegment,
  listAutomationRuns,
  listAutomations,
  listSegments,
  pauseAutomation,
  previewSegmentCount,
  updateAutomation,
  updateSegment,
} from "../controllers/newsletterSegmentController";
import {
  getDeliverabilityStatus,
  listAlerts,
  updateDeliverabilityStatus,
} from "../controllers/newsletterDeliverabilityController";

const router = Router();

const storage = multer.diskStorage({
  destination(req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const uploadDir = env.downloadsStorageDir;
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

router.get("/db-status", attachUserToRequest, requireAdmin, getAdminDbStatus);
router.get("/diag/db-schema", attachUserToRequest, requireAdmin, getDbSchemaDiagnostics);
router.get("/backups/surete", attachUserToRequest, requireAdmin, listSuretyBackups);
router.get(
  "/backups/surete/:docId/download",
  attachUserToRequest,
  requireAdmin,
  downloadSuretyBackup
);

router.get("/clients", attachUserToRequest, requireAdmin, adminListClients);
router.get("/clients/:clientId", attachUserToRequest, requireAdmin, adminGetClientDetail);
router.get("/clients/:clientId/orders", attachUserToRequest, requireAdmin, adminGetClientOrders);
router.get("/clients/:clientId/invoices", attachUserToRequest, requireAdmin, adminGetClientInvoices);
router.get("/clients/:clientId/downloads", attachUserToRequest, requireAdmin, adminGetClientDownloads);
router.put("/clients/:clientId", attachUserToRequest, requireAdmin, adminUpdateCustomer);

// Legacy aliases
router.get("/customers", attachUserToRequest, requireAdmin, adminListClients);
router.get("/customers/:clientId", attachUserToRequest, requireAdmin, adminGetClientDetail);
router.put("/customers/:clientId", attachUserToRequest, requireAdmin, adminUpdateCustomer);

router.get(
  "/newsletter/subscribers",
  attachUserToRequest,
  requireAdmin,
  listSubscribers
);
router.post(
  "/newsletter/subscribers",
  attachUserToRequest,
  requireAdmin,
  createSubscriber
);
router.patch(
  "/newsletter/subscribers/:id",
  attachUserToRequest,
  requireAdmin,
  updateSubscriber
);
router.post(
  "/newsletter/subscribers/:id/unsubscribe",
  attachUserToRequest,
  requireAdmin,
  unsubscribeSubscriber
);
router.post(
  "/newsletter/subscribers/:id/resubscribe",
  attachUserToRequest,
  requireAdmin,
  resubscribeSubscriber
);
router.post(
  "/newsletter/subscribers/:id/export",
  attachUserToRequest,
  requireAdmin,
  exportSubscriberData
);
router.post(
  "/newsletter/subscribers/:id/anonymize",
  attachUserToRequest,
  requireAdmin,
  anonymizeSubscriberData
);
router.post(
  "/newsletter/subscribers/import",
  attachUserToRequest,
  requireAdmin,
  upload.single("file"),
  importSubscribers
);
router.get(
  "/newsletter/subscribers/export",
  attachUserToRequest,
  requireAdmin,
  exportSubscribers
);
router.get(
  "/newsletter/kpis",
  attachUserToRequest,
  requireAdmin,
  getNewsletterKpis
);
router.get("/newsletter/templates", attachUserToRequest, requireAdmin, listTemplates);
router.post("/newsletter/templates", attachUserToRequest, requireAdmin, createTemplate);
router.get("/newsletter/templates/:id", attachUserToRequest, requireAdmin, getTemplate);
router.patch("/newsletter/templates/:id", attachUserToRequest, requireAdmin, updateTemplate);
router.post(
  "/newsletter/templates/:id/duplicate",
  attachUserToRequest,
  requireAdmin,
  duplicateTemplate
);
router.delete(
  "/newsletter/templates/:id",
  attachUserToRequest,
  requireAdmin,
  deleteTemplate
);
router.get("/newsletter/campaigns", attachUserToRequest, requireAdmin, listCampaigns);
router.post("/newsletter/campaigns", attachUserToRequest, requireAdmin, createCampaign);
router.get("/newsletter/campaigns/:id", attachUserToRequest, requireAdmin, getCampaign);
router.patch("/newsletter/campaigns/:id", attachUserToRequest, requireAdmin, updateCampaign);
router.post(
  "/newsletter/campaigns/:id/schedule",
  attachUserToRequest,
  requireAdmin,
  scheduleCampaign
);
router.post(
  "/newsletter/campaigns/:id/send-now",
  attachUserToRequest,
  requireAdmin,
  sendCampaignNowHandler
);
router.post(
  "/newsletter/campaigns/:id/cancel",
  attachUserToRequest,
  requireAdmin,
  cancelCampaign
);
router.get(
  "/newsletter/campaigns/:id/stats",
  attachUserToRequest,
  requireAdmin,
  getCampaignStats
);
router.get(
  "/newsletter/campaigns/:id/recipients/preview",
  attachUserToRequest,
  requireAdmin,
  previewRecipients
);
router.get(
  "/newsletter/settings",
  attachUserToRequest,
  requireAdmin,
  getNewsletterSettings
);
router.patch(
  "/newsletter/settings",
  attachUserToRequest,
  requireAdmin,
  updateNewsletterSettings
);
router.get("/newsletter/segments", attachUserToRequest, requireAdmin, listSegments);
router.post("/newsletter/segments", attachUserToRequest, requireAdmin, createSegment);
router.get("/newsletter/segments/:id", attachUserToRequest, requireAdmin, getSegment);
router.patch("/newsletter/segments/:id", attachUserToRequest, requireAdmin, updateSegment);
router.delete("/newsletter/segments/:id", attachUserToRequest, requireAdmin, deleteSegment);
router.post("/newsletter/segments/:id/preview", attachUserToRequest, requireAdmin, previewSegmentCount);
router.get("/newsletter/automations", attachUserToRequest, requireAdmin, listAutomations);
router.post("/newsletter/automations", attachUserToRequest, requireAdmin, createAutomation);
router.get("/newsletter/automations/:id", attachUserToRequest, requireAdmin, getAutomation);
router.patch("/newsletter/automations/:id", attachUserToRequest, requireAdmin, updateAutomation);
router.post("/newsletter/automations/:id/activate", attachUserToRequest, requireAdmin, activateAutomation);
router.post("/newsletter/automations/:id/pause", attachUserToRequest, requireAdmin, pauseAutomation);
router.get("/newsletter/automations/:id/runs", attachUserToRequest, requireAdmin, listAutomationRuns);
router.post("/newsletter/automations/tick", attachUserToRequest, requireAdmin, forceAutomationTick);
router.get("/newsletter/analytics/overview", attachUserToRequest, requireAdmin, analyticsOverview);
router.get("/newsletter/analytics/campaigns", attachUserToRequest, requireAdmin, analyticsCampaigns);
router.get("/newsletter/analytics/segments", attachUserToRequest, requireAdmin, analyticsSegments);
router.get("/newsletter/analytics/cohorts", attachUserToRequest, requireAdmin, analyticsCohorts);
router.get("/newsletter/deliverability", attachUserToRequest, requireAdmin, getDeliverabilityStatus);
router.patch("/newsletter/deliverability", attachUserToRequest, requireAdmin, updateDeliverabilityStatus);
router.get("/newsletter/alerts", attachUserToRequest, requireAdmin, listAlerts);

router.post(
  "/downloads",
  attachUserToRequest,
  requireAdmin,
  upload.single("file"),
  createDownloadableProduct
);

router.post(
  "/downloads/:id/files",
  attachUserToRequest,
  requireAdmin,
  upload.single("file"),
  uploadDownloadableBinary
);

router.post(
  "/uploads",
  attachUserToRequest,
  requireAdmin,
  upload.single("file"),
  adminUploadAsset
);

router.get(
  "/downloadable-products",
  attachUserToRequest,
  requireAdmin,
  listAdminDownloadableProducts
);

router.post(
  "/downloadable-products",
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

router.put(
  "/downloadable-products/:id",
  attachUserToRequest,
  requireAdmin,
  updateDownloadableProduct
);

router.post(
  "/downloadable-products/:id/archive",
  attachUserToRequest,
  requireAdmin,
  archiveDownloadableProduct
);

router.post(
  "/downloadable-products/:id/restore",
  attachUserToRequest,
  requireAdmin,
  restoreDownloadableProduct
);

router.get(
  "/downloadable-categories",
  attachUserToRequest,
  requireAdmin,
  adminListDownloadableCategories
);

router.post(
  "/downloadable-categories",
  attachUserToRequest,
  requireAdmin,
  adminCreateDownloadableCategory
);

router.delete(
  "/downloadable-categories/:id",
  attachUserToRequest,
  requireAdmin,
  adminDeleteDownloadableCategory
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

router.get(
  "/promo-codes/:id/stats",
  attachUserToRequest,
  requireAdmin,
  getPromoCodeStats
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

router.get(
  "/client-questions",
  attachUserToRequest,
  requireAdmin,
  adminListClientQuestions
);

router.get(
  "/client-questions/:id",
  attachUserToRequest,
  requireAdmin,
  adminGetClientQuestion
);

router.put(
  "/client-questions/:id",
  attachUserToRequest,
  requireAdmin,
  adminUpdateClientQuestion
);

router.post(
  "/client-questions/:id/publish",
  attachUserToRequest,
  requireAdmin,
  adminPublishClientQuestion
);

router.post(
  "/client-questions/:id/unpublish",
  attachUserToRequest,
  requireAdmin,
  adminUnpublishClientQuestion
);

router.post(
  "/legal-pages/seed-defaults",
  attachUserToRequest,
  requireAdmin,
  adminCreateDefaultLegalPages
);

router.get("/homepage", attachUserToRequest, requireAdmin, adminGetHomepageSettings);

router.put("/homepage", attachUserToRequest, requireAdmin, adminSaveHomepageSettings);

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

router.get("/seo-settings", attachUserToRequest, requireAdmin, adminGetSeoSettingsV2);
router.put("/seo-settings", attachUserToRequest, requireAdmin, adminUpdateSeoSettingsV2);

router.get("/geo-identity", attachUserToRequest, requireAdmin, adminGetGeoIdentity);
router.put("/geo-identity", attachUserToRequest, requireAdmin, adminUpdateGeoIdentity);

router.get("/geo-faq", attachUserToRequest, requireAdmin, adminListGeoFaq);
router.post("/geo-faq", attachUserToRequest, requireAdmin, adminCreateGeoFaq);
router.put("/geo-faq/:id", attachUserToRequest, requireAdmin, adminUpdateGeoFaq);
router.delete("/geo-faq/:id", attachUserToRequest, requireAdmin, adminDeleteGeoFaq);
router.patch("/geo-faq/reorder", attachUserToRequest, requireAdmin, adminReorderGeoFaq);

router.get("/geo-answers", attachUserToRequest, requireAdmin, adminListGeoAnswers);
router.post("/geo-answers", attachUserToRequest, requireAdmin, adminCreateGeoAnswer);
router.put("/geo-answers/:id", attachUserToRequest, requireAdmin, adminUpdateGeoAnswer);
router.delete("/geo-answers/:id", attachUserToRequest, requireAdmin, adminDeleteGeoAnswer);
router.patch(
  "/geo-answers/reorder",
  attachUserToRequest,
  requireAdmin,
  adminReorderGeoAnswers
);

router.get(
  "/seo-geo/diagnostics",
  attachUserToRequest,
  requireAdmin,
  adminRunSeoGeoDiagnostics
);

router.post(
  "/seo-geo/autofill/preview",
  attachUserToRequest,
  requireAdmin,
  adminPreviewSeoGeoAutofill
);

router.post(
  "/seo-geo/autofill/apply",
  attachUserToRequest,
  requireAdmin,
  adminApplySeoGeoAutofill
);

router.get("/page-seo/:pageId", attachUserToRequest, requireAdmin, adminGetPageSeo);
router.put("/page-seo/:pageId", attachUserToRequest, requireAdmin, adminSavePageSeo);

router.get("/product-seo/:productId", attachUserToRequest, requireAdmin, adminGetProductSeo);
router.put("/product-seo/:productId", attachUserToRequest, requireAdmin, adminSaveProductSeo);

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

// Page Builder - Pourquoi choisir ComptaMatch
router.post(
  "/sections/:sectionId/why-choose-items",
  attachUserToRequest,
  requireAdmin,
  adminCreateWhyChooseItem
);

router.post(
  "/sections/:sectionId/why-choose-items/reorder",
  attachUserToRequest,
  requireAdmin,
  adminReorderWhyChooseItems
);

router.put(
  "/why-choose-items/:itemId",
  attachUserToRequest,
  requireAdmin,
  adminUpdateWhyChooseItem
);

router.delete(
  "/why-choose-items/:itemId",
  attachUserToRequest,
  requireAdmin,
  adminDeleteWhyChooseItem
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
router.get(
  "/orders/:orderId/invoice",
  attachUserToRequest,
  requireAdmin,
  adminGetOrderInvoice
);
router.post(
  "/orders/:orderId/invoice",
  attachUserToRequest,
  requireAdmin,
  adminCreateOrRegenerateInvoice
);
router.get(
  "/orders/:orderId/invoice/pdf",
  attachUserToRequest,
  requireAdmin,
  adminDownloadOrderInvoice
);
router.post(
  "/orders/:id/refund",
  attachUserToRequest,
  requireAdmin,
  adminRefundOrder
);
router.post(
  "/orders/:id/cancel",
  attachUserToRequest,
  requireAdmin,
  adminCancelOrder
);
router.post(
  "/orders/:id/adjust",
  attachUserToRequest,
  requireAdmin,
  adminAdjustOrder
);
router.post(
  "/orders/:id/adjustments/:adjustmentId/send",
  attachUserToRequest,
  requireAdmin,
  adminSendOrderAdjustment
);
router.delete(
  "/orders/:id",
  attachUserToRequest,
  requireAdmin,
  adminSoftDeleteOrder
);
router.post(
  "/orders/:orderItemId/regenerate-link",
  attachUserToRequest,
  requireAdmin,
  adminRegenerateDownloadLink
);

router.get(
  "/debug/last-orders",
  attachUserToRequest,
  requireAdmin,
  adminListRecentOrders
);

export default router;
