import { Router } from "express";
import {
  changePassword,
  generateOrderDownloadLink,
  getAccountOrders,
  getAccountOrderDetail,
  createExtraPaymentCheckoutSession,
  getAccountProfile,
  getAccountSettings,
  getAccountSubscriptions,
  updateAccountProfile,
  updateAccountSettings,
} from "../controllers/accountController";

const router = Router();

router.get("/subscriptions", getAccountSubscriptions);
router.get("/orders", getAccountOrders);
router.get("/orders/:orderId", getAccountOrderDetail);
router.post("/orders/:orderId/extra-payment/session", createExtraPaymentCheckoutSession);
router.post("/orders/:orderId/download-link", generateOrderDownloadLink);
router.get("/profile", getAccountProfile);
router.put("/profile", updateAccountProfile);
router.get("/settings", getAccountSettings);
router.patch("/settings", updateAccountSettings);
router.post("/change-password", changePassword);

export default router;
