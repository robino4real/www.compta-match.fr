import { Router } from "express";
import { publicGetHomepageSettings } from "../controllers/homepageSettingsController";
import { getPublicContactInfo } from "../controllers/publicInfoController";
import { publicGetCustomPageByRoute } from "../controllers/pageBuilderController";
import {
  publicGetDownloadableProduct,
  publicListDownloadableProducts,
} from "../controllers/catalogController";

const router = Router();

router.get("/contact", getPublicContactInfo);
router.get("/homepage-settings", publicGetHomepageSettings);
router.get("/pages/by-route", publicGetCustomPageByRoute);
router.get("/products", publicListDownloadableProducts);
router.get("/products/:slug", publicGetDownloadableProduct);

export default router;
