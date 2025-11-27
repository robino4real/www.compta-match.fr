import { Router } from "express";
import { attachUserToRequest } from "../middleware/authMiddleware";
import { login, logout, me, register } from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", attachUserToRequest, me);

export default router;
