import { Router } from "express";
import { publicGetHomepageSettings } from "../controllers/homepageSettingsController";
import { getPublicContactInfo } from "../controllers/publicInfoController";
import { publicGetCustomPageByRoute } from "../controllers/pageBuilderController";

const router = Router();

router.get("/contact", getPublicContactInfo);
router.get("/homepage-settings", publicGetHomepageSettings);
router.get("/pages/by-route", publicGetCustomPageByRoute);

export default router;
