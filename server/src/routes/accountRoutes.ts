import { Router } from "express";
import {
  changePassword,
  getAccountOrders,
  getAccountProfile,
  getAccountSettings,
  getAccountSubscriptions,
  updateAccountProfile,
  updateAccountSettings,
} from "../controllers/accountController";

const router = Router();

router.get("/subscriptions", getAccountSubscriptions);
router.get("/orders", getAccountOrders);
router.get("/profile", getAccountProfile);
router.put("/profile", updateAccountProfile);
router.get("/settings", getAccountSettings);
router.patch("/settings", updateAccountSettings);
router.post("/change-password", changePassword);

export default router;
