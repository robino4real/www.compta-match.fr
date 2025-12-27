import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWebApp, WebAppRouteType, WebAppType } from "../../context/WebAppContext";
import { useWebAppContextLoader } from "../../hooks/useWebAppContextLoader";
import { WebAppApiError, webAppFetch } from "../../lib/webAppFetch";
import WebAppErrorPage from "../../components/app/WebAppErrorPage";

interface WebAppDocumentsPageProps {
  expectedType: WebAppType;
  routeType: WebAppRouteType;
}

interface DocumentItem {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

interface DocumentsResponse {
  ok: boolean;
  data: { items: DocumentItem[] };
}

interface UploadResponse {
  ok: boolean;
  data: { item: DocumentItem };
}

const formatBytes = (size: number) => {
  if (size < 1024) return `${size} o`;
  const units = ["Ko", "Mo", "Go"];
  let index = -1;
  let formatted = size;

  do {
    formatted /= 1024;
    index += 1;
  } while (formatted >= 1024 && index < units.length - 1);

  return `${formatted.toFixed(1)} ${units[index]}`;
};

const WebAppDocumentsPage: React.FC<WebAppDocumentsPageProps> = ({ expectedType, routeType }) => {
  const { context } = useWebApp();
  const { isLoading: isContextLoading, error: contextError, hasContext } = useWebAppContextLoader({
    expectedType,
    routeType,
  });
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<WebAppApiError | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ficheId = context.fiche?.id;

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  const loadDocuments = useCallback(async () => {
    if (!ficheId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await webAppFetch<DocumentsResponse>(
        `/api/app/${routeType}/documents/${ficheId}`
      );
      setDocuments(response.data.items);
    } catch (apiErr) {
      const apiError =
        apiErr instanceof WebAppApiError
          ? apiErr
          : new WebAppApiError("Impossible de charger les documents.");
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [ficheId, routeType]);

  useEffect(() => {
    if (ficheId) {
      loadDocuments();
    }
  }, [ficheId, loadDocuments]);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const validateFile = (file: File) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];

    if (!allowed.includes(file.type)) {
      showToast("error", "Type de fichier non autorisé. (PDF ou image)");
      return false;
    }

    if (file.size > 20 * 1024 * 1024) {
      showToast("error", "Le fichier dépasse la limite de 20 Mo.");
      return false;
    }

    return true;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;
    if (!ficheId) {
      setError(new WebAppApiError("Aucune fiche sélectionnée."));
      return;
    }

    if (!validateFile(file)) {
      event.target.value = "";
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await webAppFetch<UploadResponse>(`/api/app/${routeType}/documents/${ficheId}/upload`, {
        method: "POST",
        body: formData,
        skipDefaultJsonHeaders: true,
      });
      showToast("success", "Document ajouté avec succès.");
      await loadDocuments();
    } catch (apiErr) {
      const apiError =
        apiErr instanceof WebAppApiError
          ? apiErr
          : new WebAppApiError("Impossible d'uploader le document.");
      setError(apiError);
      showToast("error", apiError.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const openDeleteConfirm = (doc: DocumentItem) => {
    setDeleteTarget(doc);
  };

  const closeDeleteConfirm = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !ficheId) return;

    setDeleting(true);
    try {
      await webAppFetch(`/api/app/${routeType}/documents/${ficheId}/${deleteTarget.id}`, {
        method: "DELETE",
      });
      showToast("success", "Document supprimé.");
      await loadDocuments();
    } catch (apiErr) {
      const apiError =
        apiErr instanceof WebAppApiError
          ? apiErr
          : new WebAppApiError("Impossible de supprimer le document.");
      setError(apiError);
      showToast("error", apiError.message);
    } finally {
      setDeleting(false);
      closeDeleteConfirm();
    }
  };

  const downloadUrl = useCallback(
    (docId: string) => `/api/app/${routeType}/documents/${ficheId}/${docId}/download`,
    [ficheId, routeType]
  );

  const hasDocuments = useMemo(() => documents.length > 0, [documents]);

  if (isContextLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
        Chargement des documents comptables...
      </div>
    );
  }

  if (contextError || error || !hasContext || !context.fiche) {
    const effectiveError = contextError || error || undefined;
    return (
      <WebAppErrorPage
        status={effectiveError?.status}
        message={effectiveError?.message}
        routeType={routeType}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fiche {context.fiche.type}</p>
        <h1 className="text-2xl font-semibold text-slate-900">Mes documents comptables</h1>
        <p className="text-sm text-slate-600">Téléversez, consultez et gérez vos documents liés à cette fiche.</p>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documents comptables</p>
          <p className="text-sm text-slate-600">Gérez vos fichiers (pdf, images) en toute sécurité.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFileButtonClick}
            disabled={uploading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Upload en cours..." : "Ajouter un document"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="application/pdf,image/jpeg,image/png"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Nom</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Taille</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-slate-500">
                    Chargement des documents...
                  </td>
                </tr>
              )}
              {!loading && !hasDocuments && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-slate-500">
                    Aucun document pour le moment.
                  </td>
                </tr>
              )}
              {!loading &&
                documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">{doc.originalName}</td>
                    <td className="px-6 py-4 text-slate-600">{doc.mimeType}</td>
                    <td className="px-6 py-4 text-slate-600">{formatBytes(doc.sizeBytes)}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(doc.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <a
                          href={downloadUrl(doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 transition hover:text-indigo-800"
                        >
                          Télécharger
                        </a>
                        <button
                          onClick={() => openDeleteConfirm(doc)}
                          className="text-rose-600 transition hover:text-rose-800"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {error && !loading && (
          <div className="border-t border-slate-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Supprimer ce document ?</h2>
            <p className="mt-2 text-sm text-slate-600">
              "{deleteTarget.originalName}" sera supprimé définitivement de cette fiche.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeDeleteConfirm}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebAppDocumentsPage;
