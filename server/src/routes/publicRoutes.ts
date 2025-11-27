import { Router } from "express";
import { getPublicContactInfo } from "../controllers/publicInfoController";

const router = Router();

router.get("/contact", getPublicContactInfo);

export default router;
