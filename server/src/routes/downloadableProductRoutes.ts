import { Router } from "express";
import { publicListDownloadableProductsV2 } from "../controllers/catalogController";

const router = Router();

router.get("/public", publicListDownloadableProductsV2);

export default router;
