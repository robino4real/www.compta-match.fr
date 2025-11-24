import { Router } from "express";
import { createDownloadableOrder } from "../controllers/orderController";

const router = Router();

// POST /orders/downloads
router.post("/downloads", createDownloadableOrder);

export default router;
