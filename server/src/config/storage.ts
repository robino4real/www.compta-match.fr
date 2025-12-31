import path from "path";

const defaultStorageRoot = path.resolve(process.cwd(), "../app-storage");

export const documentsStorageRoot = process.env.DOCUMENTS_STORAGE_ROOT
  ? path.resolve(process.env.DOCUMENTS_STORAGE_ROOT)
  : path.join(defaultStorageRoot, "documents");

export const suretyBackupRoot = process.env.SURETY_BACKUP_ROOT
  ? path.resolve(process.env.SURETY_BACKUP_ROOT)
  : path.join(defaultStorageRoot, "surety-backups");
