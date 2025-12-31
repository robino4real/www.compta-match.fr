import fs from "fs";
import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { appErrors } from "../utils/appErrors";
import {
  buildSuretyBackupRelativePath,
  ensureStorageRoots,
  getSuretyBackupPath,
  resolveDocumentStoragePath,
} from "../utils/documentStorage";

export async function listSuretyBackups(_req: Request, res: Response) {
  try {
    const documents = await prisma.accountingDocument.findMany({
      include: {
        fiche: { select: { id: true, name: true, type: true } },
        owner: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    ensureStorageRoots();

    const items = documents.map((document) => {
      const backupRelativePath = buildSuretyBackupRelativePath({
        userId: document.ownerId,
        ficheType: document.fiche.type,
        ficheId: document.ficheId,
        documentId: document.id,
        filename: document.filename,
      });
      const backupPath = getSuretyBackupPath({
        userId: document.ownerId,
        ficheType: document.fiche.type,
        ficheId: document.ficheId,
        documentId: document.id,
        filename: document.filename,
      });

      return {
        id: document.id,
        ficheId: document.ficheId,
        ficheName: document.fiche.name,
        ficheType: document.fiche.type,
        ownerId: document.ownerId,
        ownerEmail: document.owner.email,
        originalName: document.originalName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        createdAt: document.createdAt,
        backupRelativePath,
        backupExists: fs.existsSync(backupPath),
      };
    });

    return res.json({ ok: true, data: { items } });
  } catch (error) {
    console.error("[admin-backup] Erreur lors du listing des sauvegardes", error);
    return appErrors.internal(res, "Impossible de charger les sauvegardes de sûreté.");
  }
}

export async function downloadSuretyBackup(req: Request, res: Response) {
  const { docId } = req.params as { docId?: string };

  if (!docId) {
    return appErrors.badRequest(res);
  }

  try {
    const document = await prisma.accountingDocument.findFirst({
      where: { id: docId },
      include: {
        fiche: { select: { id: true, name: true, type: true } },
        owner: { select: { id: true, email: true } },
      },
    });

    if (!document) {
      return appErrors.notFound(res);
    }

    ensureStorageRoots();

    const backupPath = getSuretyBackupPath({
      userId: document.ownerId,
      ficheType: document.fiche.type,
      ficheId: document.ficheId,
      documentId: document.id,
      filename: document.filename,
    });

    const primaryPath = resolveDocumentStoragePath(document.storagePath);
    const finalPath = fs.existsSync(backupPath) ? backupPath : primaryPath;

    if (!fs.existsSync(finalPath)) {
      return appErrors.notFound(res, "Fichier introuvable dans les sauvegardes de sûreté.");
    }

    const safeDownloadName = `${document.owner.email}-${document.fiche.type.toLowerCase()}-${document.fiche.name}-${document.originalName}`.replace(
      /\s+/g,
      "-"
    );

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader("Cache-Control", "no-store");
    return res.download(finalPath, safeDownloadName, (err) => {
      if (err) {
        console.error("[admin-backup] Erreur lors du téléchargement", err);
        if (!res.headersSent) {
          res
            .status(500)
            .json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Erreur lors du téléchargement" } });
        }
      }
    });
  } catch (error) {
    console.error("[admin-backup] Erreur sur la sauvegarde de sûreté", error);
    return appErrors.internal(res, "Impossible de télécharger ce fichier pour le moment.");
  }
}
