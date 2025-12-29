import { Router } from "express";
import { publicGetHomepage, publicHomepageStream } from "../controllers/homepageSettingsController";
import { getPublicContactInfo } from "../controllers/publicInfoController";
import { publicGetCustomPageByRoute } from "../controllers/pageBuilderController";
import {
  publicGetDownloadableProduct,
  publicListDownloadableProducts,
} from "../controllers/catalogController";
import { publicGetPublishedFaq } from "../controllers/clientQuestionController";
import {
  newsletterClickRedirect,
  newsletterOpenPixel,
  newsletterUnsubscribe,
} from "../controllers/newsletterCampaignController";
import {
  getPreferences,
  savePreferences,
  unsubscribeFromToken,
} from "../controllers/newsletterPreferenceController";

const router = Router();

router.get("/contact", getPublicContactInfo);
router.get("/homepage", publicGetHomepage);
router.get("/homepage/stream", publicHomepageStream);
router.get("/pages/by-route", publicGetCustomPageByRoute);
router.get("/products", publicListDownloadableProducts);
router.get("/downloadable-products", publicListDownloadableProducts);
router.get("/products/:slug", publicGetDownloadableProduct);
router.get("/faq", publicGetPublishedFaq);
router.get("/newsletter/open", newsletterOpenPixel);
router.get("/newsletter/unsubscribe", newsletterUnsubscribe);
router.get("/newsletter/preferences", getPreferences);
router.post("/newsletter/preferences", savePreferences);
router.post("/newsletter/unsubscribe", unsubscribeFromToken);
router.get("/r/:token", newsletterClickRedirect);

export default router;
