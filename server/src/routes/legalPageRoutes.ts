import { Router } from "express";
import { publicGetLegalPage } from "../controllers/legalPageController";

const router = Router();

router.get("/:identifier", publicGetLegalPage);

export default router;
