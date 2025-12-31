import fs from "fs";
import path from "path";
import { AppFicheType } from "@prisma/client";
import { documentsStorageRoot, suretyBackupRoot } from "../config/storage";

export const ensureStorageRoots = () => {
  fs.mkdirSync(documentsStorageRoot, { recursive: true });
  fs.mkdirSync(suretyBackupRoot, { recursive: true });
};

export const resolveDocumentStoragePath = (storagePath: string) => {
  if (path.isAbsolute(storagePath)) {
    return storagePath;
  }

  const preferredPath = path.join(documentsStorageRoot, storagePath);

  if (fs.existsSync(preferredPath)) {
    return preferredPath;
  }

  // Compatibilité : certains fichiers plus anciens peuvent avoir été stockés
  // relativement au dossier du serveur. On garde ce fallback pour éviter les pertes.
  return path.join(process.cwd(), storagePath);
};

export type BackupPathParams = {
  userId: string;
  ficheType: AppFicheType;
  ficheId: string;
  documentId: string;
  filename: string;
};

export const buildSuretyBackupRelativePath = ({
  userId,
  ficheType,
  ficheId,
  documentId,
  filename,
}: BackupPathParams) => path.join(userId, ficheType.toLowerCase(), ficheId, documentId, filename);

export const getSuretyBackupPath = (params: BackupPathParams) =>
  path.join(suretyBackupRoot, buildSuretyBackupRelativePath(params));
