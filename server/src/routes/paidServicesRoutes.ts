import { Router } from "express";
import { attachUserToRequest, requireAdmin } from "../middleware/authMiddleware";
import {
  adminCreatePaidServiceFeature,
  adminCreatePaidServicePlan,
  adminCreatePaidServiceSection,
  adminDeletePaidServiceFeature,
  adminDeletePaidServicePlan,
  adminDeletePaidServiceSection,
  adminListPaidServiceFeatures,
  adminListPaidServicePlans,
  adminListPaidServiceSections,
  adminUpdatePaidServiceFeature,
  adminUpdatePaidServicePlan,
  adminUpdatePaidServiceSection,
  publicGetPaidServiceComparison,
  publicListPaidServicePlans,
  publicListPaidServiceSections,
} from "../controllers/paidServicesController";

const router = Router();

router.get("/public/plans", publicListPaidServicePlans);
router.get("/public/comparison", publicGetPaidServiceComparison);
router.get("/public/sections", publicListPaidServiceSections);

router.use("/admin", attachUserToRequest, requireAdmin);

router.get("/admin/plans", adminListPaidServicePlans);
router.post("/admin/plans", adminCreatePaidServicePlan);
router.put("/admin/plans/:id", adminUpdatePaidServicePlan);
router.delete("/admin/plans/:id", adminDeletePaidServicePlan);

router.get("/admin/features", adminListPaidServiceFeatures);
router.post("/admin/features", adminCreatePaidServiceFeature);
router.put("/admin/features/:id", adminUpdatePaidServiceFeature);
router.delete("/admin/features/:id", adminDeletePaidServiceFeature);

router.get("/admin/sections", adminListPaidServiceSections);
router.post("/admin/sections", adminCreatePaidServiceSection);
router.put("/admin/sections/:id", adminUpdatePaidServiceSection);
router.delete("/admin/sections/:id", adminDeletePaidServiceSection);

export default router;
