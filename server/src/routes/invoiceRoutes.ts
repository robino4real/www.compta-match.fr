import { Router } from "express";
import { downloadInvoice } from "../controllers/invoiceController";

const router = Router();

router.get("/:id/download", downloadInvoice);

export default router;
