import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { FicheRequest } from "../middleware/ficheAccessMiddleware";
import { appErrors } from "../utils/appErrors";
import { HttpError } from "../utils/errors";
import { assertTablesExist } from "../utils/dbReadiness";

interface DocumentRequest extends AuthenticatedRequest, FicheRequest {
  file?: Express.Multer.File;
  generatedDocId?: string;
}

const DOCUMENT_MAX_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const documentsStorageRoot = path.join(process.cwd(), "server/storage/documents");
const DOCUMENT_TABLES = ["AppFiche", "AccountingDocument"];

async function ensureDocumentTables() {
  await assertTablesExist(DOCUMENT_TABLES, "app-documents");
}

function ensureSafeContext(req: FicheRequest) {
  const { fiche } = req as FicheRequest;
  const { user } = req as AuthenticatedRequest;

  if (!fiche || !user) {
    throw new Error("Contexte fiche ou utilisateur manquant.");
  }

  return { fiche, user };
}

const storage = multer.diskStorage({
  destination(req: Request, file, cb) {
    try {
      const { fiche, user } = ensureSafeContext(req);
      const documentReq = req as DocumentRequest;
      const docId = documentReq.generatedDocId || randomUUID();

      documentReq.generatedDocId = docId;

      const dir = path.join(documentsStorageRoot, user.id, fiche.id, docId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (error) {
      cb(error as Error, "");
    }
  },
  filename(req: Request, file, cb) {
    const ext = path.extname(file.originalname) || "";
    const safeName = `document${ext}`.replace(/\s+/g, "_");
    cb(null, safeName);
  },
});

export const documentsUpload = multer({
  storage,
  limits: { fileSize: DOCUMENT_MAX_SIZE },
  fileFilter(req: Request, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error("Type de fichier non autorisé."), false);
    }

    cb(null, true);
  },
});

function resolveStoragePath(storagePath: string) {
  return path.isAbsolute(storagePath) ? storagePath : path.join(process.cwd(), storagePath);
}

function toResponseItem(document: {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}) {
  return {
    id: document.id,
    originalName: document.originalName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    createdAt: document.createdAt,
  };
}

export async function listDocuments(req: FicheRequest, res: Response) {
  const { fiche, user } = ensureSafeContext(req);

  try {
    await ensureDocumentTables();
    const items = await prisma.accountingDocument.findMany({
      where: { ficheId: fiche.id, ownerId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
    });

    return res.json({ ok: true, data: { items: items.map(toResponseItem) } });
  } catch (error) {
    if (error instanceof HttpError) {
      return appErrors.internal(res, error.message);
    }
    console.error("[documents] Erreur lors de la liste des documents", error);
    return appErrors.internal(res);
  }
}

export async function uploadDocument(req: FicheRequest, res: Response) {
  const { fiche, user } = ensureSafeContext(req);
  const documentReq = req as DocumentRequest;

  if (!documentReq.file) {
    return appErrors.badRequest(res, "Aucun fichier reçu.");
  }

  const docId = documentReq.generatedDocId || randomUUID();
  const storagePath = path.relative(process.cwd(), documentReq.file.path);

  try {
    await ensureDocumentTables();
    const created = await prisma.accountingDocument.create({
      data: {
        id: docId,
        ficheId: fiche.id,
        ownerId: user.id,
        filename: documentReq.file.filename,
        originalName: documentReq.file.originalname,
        mimeType: documentReq.file.mimetype,
        sizeBytes: documentReq.file.size,
        storagePath,
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ ok: true, data: { item: toResponseItem(created) } });
  } catch (error) {
    if (error instanceof HttpError) {
      return appErrors.internal(res, error.message);
    }
    console.error("[documents] Erreur lors de l'upload d'un document", error);
    return appErrors.internal(res, "Impossible d'enregistrer ce document pour le moment.");
  }
}

export async function downloadDocument(req: FicheRequest, res: Response) {
  const { fiche, user } = ensureSafeContext(req);
  const { docId } = req.params as { docId?: string };

  if (!docId) {
    return appErrors.badRequest(res);
  }

  try {
    await ensureDocumentTables();
    const document = await prisma.accountingDocument.findFirst({
      where: { id: docId, ficheId: fiche.id, ownerId: user.id },
    });

    if (!document) {
      return appErrors.notFound(res);
    }

    const filePath = resolveStoragePath(document.storagePath);

    if (!fs.existsSync(filePath)) {
      return appErrors.notFound(res);
    }

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader("Cache-Control", "no-store");
    return res.download(filePath, document.originalName, (err) => {
      if (err) {
        console.error("[documents] Erreur lors du téléchargement", err);
        if (!res.headersSent) {
          res
            .status(500)
            .json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Erreur lors du téléchargement" } });
        }
      }
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return appErrors.internal(res, error.message);
    }
    console.error("[documents] Erreur lors de la récupération du document", error);
    return appErrors.internal(res);
  }
}

export async function deleteDocument(req: FicheRequest, res: Response) {
  const { fiche, user } = ensureSafeContext(req);
  const { docId } = req.params as { docId?: string };

  if (!docId) {
    return appErrors.badRequest(res);
  }

  try {
    await ensureDocumentTables();
    const document = await prisma.accountingDocument.findFirst({
      where: { id: docId, ficheId: fiche.id, ownerId: user.id },
    });

    if (!document) {
      return appErrors.notFound(res);
    }

    const filePath = resolveStoragePath(document.storagePath);
    const directoryToDelete = path.dirname(filePath);

    try {
      fs.rmSync(directoryToDelete, { recursive: true, force: true });
    } catch (fileError) {
      console.error("[documents] Erreur lors de la suppression du fichier", fileError);
    }

    await prisma.accountingDocument.delete({ where: { id: document.id } });

    return res.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return appErrors.internal(res, error.message);
    }
    console.error("[documents] Erreur lors de la suppression du document", error);
    return appErrors.internal(res);
  }
}
