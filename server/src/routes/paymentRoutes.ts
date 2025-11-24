import { Router } from "express";
import { createDownloadCheckoutSession } from "../controllers/paymentController";

const router = Router();

router.post("/downloads/checkout-session", createDownloadCheckoutSession);

export default router;
