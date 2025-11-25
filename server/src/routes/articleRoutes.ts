import { Router } from "express";
import { publicGetArticle, publicListArticles } from "../controllers/articleController";

const router = Router();

router.get("/", publicListArticles);
router.get("/:slug", publicGetArticle);

export default router;
