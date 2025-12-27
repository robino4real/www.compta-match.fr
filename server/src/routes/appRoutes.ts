import { Router } from "express";
import { getFicheContext, listUserFiches } from "../controllers/appController";
import { requireAuth } from "../middleware/authMiddleware";
import { withFicheAccess } from "../middleware/ficheAccessMiddleware";

const router = Router();

router.get("/fiches", requireAuth, listUserFiches);
router.get("/fiche/:ficheId/context", ...withFicheAccess(getFicheContext));

export default router;
