import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { listUsers, createDownloadableProduct } from "../controllers/adminController";

const router = Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads/downloads");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}-${sanitized}`);
  },
});

const upload = multer({ storage });

// GET /admin/users
router.get("/users", listUsers);

router.post(
  "/downloads",
  upload.single("file"),
  createDownloadableProduct
);

export default router;
