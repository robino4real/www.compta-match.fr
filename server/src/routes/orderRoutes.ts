import { Router } from "express";
import {
  createDownloadableOrder,
  listUserOrders,
  getOrderByStripeSession,
} from "../controllers/orderController";

const router = Router();

// POST /orders/downloads
router.post("/downloads", createDownloadableOrder);
router.get("/me", listUserOrders);
router.get("/by-session/:sessionId", getOrderByStripeSession);

export default router;
