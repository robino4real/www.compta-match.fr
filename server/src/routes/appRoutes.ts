import { Router } from "express";
import { createFiche, getFicheContext, listUserFiches } from "../controllers/appController";
import {
  createAccountingEntry,
  getAccountingSummary,
  listAccountingEntries,
} from "../controllers/appAccountingController";
import {
  deleteDocument,
  documentsUpload,
  downloadDocument,
  listDocuments,
  uploadDocument,
} from "../controllers/appDocumentsController";
import { getFicheSettings, updateFicheSettings } from "../controllers/appSettingsController";
import { attachUserToRequest, requireAuth } from "../middleware/authMiddleware";
import { withFicheAccess } from "../middleware/ficheAccessMiddleware";
import { AppFicheType } from "@prisma/client";

const router = Router();

// SECURITY REQUIRED: toutes les routes WebApp doivent être protégées par authentification + contrôle de fiche.
router.use(attachUserToRequest);
router.use(requireAuth);

router.get("/fiches", listUserFiches);
router.post("/fiches", createFiche);

const registerFicheRoutes = (prefix: string, expectedType: AppFicheType) => {
  router.get(
    `${prefix}/fiche/:ficheId/context`,
    ...withFicheAccess(getFicheContext, { expectedType })
  );
  router.get(
    `${prefix}/fiche/:ficheId/settings`,
    ...withFicheAccess(getFicheSettings, { expectedType })
  );
  router.put(
    `${prefix}/fiche/:ficheId/settings`,
    ...withFicheAccess(updateFicheSettings, { expectedType })
  );
  router.get(
    `${prefix}/comptabilite/:ficheId/summary`,
    ...withFicheAccess(getAccountingSummary, { expectedType })
  );
  router.get(
    `${prefix}/comptabilite/:ficheId/entries`,
    ...withFicheAccess(listAccountingEntries, { expectedType })
  );
  router.post(
    `${prefix}/comptabilite/:ficheId/entries`,
    ...withFicheAccess(createAccountingEntry, { expectedType })
  );
  router.get(
    `${prefix}/documents/:ficheId`,
    ...withFicheAccess(listDocuments, { expectedType })
  );
  router.post(
    `${prefix}/documents/:ficheId/upload`,
    ...withFicheAccess(documentsUpload.single("file"), { expectedType }),
    uploadDocument
  );
  router.get(
    `${prefix}/documents/:ficheId/:docId/download`,
    ...withFicheAccess(downloadDocument, { expectedType })
  );
  router.delete(
    `${prefix}/documents/:ficheId/:docId`,
    ...withFicheAccess(deleteDocument, { expectedType })
  );
};

registerFicheRoutes("/comptapro", "COMPTAPRO");
registerFicheRoutes("/comptasso", "COMPTASSO");

export default router;
