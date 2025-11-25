import { Router } from "express";
import { applyPromoToCart, removePromoFromCart } from "../controllers/cartController";
import { attachUserToRequest } from "../middleware/authMiddleware";

const router = Router();

router.post("/apply-promo", attachUserToRequest, applyPromoToCart);
router.post("/remove-promo", attachUserToRequest, removePromoFromCart);

export default router;
