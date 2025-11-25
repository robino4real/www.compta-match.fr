import { Router } from "express";
import {
  createDownloadableOrder,
  listUserOrders,
} from "../controllers/orderController";

const router = Router();

// POST /orders/downloads
router.post("/downloads", createDownloadableOrder);
router.get("/me", listUserOrders);

export default router;
