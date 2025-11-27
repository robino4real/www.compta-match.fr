import { Router } from "express";
import { publicGetHomepageSettings } from "../controllers/homepageSettingsController";
import { getPublicContactInfo } from "../controllers/publicInfoController";

const router = Router();

router.get("/contact", getPublicContactInfo);
router.get("/homepage-settings", publicGetHomepageSettings);

export default router;
