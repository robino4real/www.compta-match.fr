import { Router } from "express";
import { listCatalogDownloads } from "../controllers/catalogController";

const router = Router();

router.get("/downloads", listCatalogDownloads);

export default router;
