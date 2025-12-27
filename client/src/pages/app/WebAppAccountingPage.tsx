import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWebApp, WebAppRouteType, WebAppType } from "../../context/WebAppContext";
import { useWebAppContextLoader } from "../../hooks/useWebAppContextLoader";
import { formatPrice } from "../../lib/formatPrice";
import { WebAppApiError, webAppFetch } from "../../lib/webAppFetch";
import WebAppErrorPage from "../../components/app/WebAppErrorPage";

interface WebAppAccountingPageProps {
  expectedType: WebAppType;
  routeType: WebAppRouteType;
}

interface AccountingEntry {
  id: string;
  ficheId: string;
  ownerId: string;
  date: string;
  label: string;
  amountCents: number;
  account?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AccountingSummaryResponse {
  ok: boolean;
  data: { totals: { entriesCount: number }; lastUpdatedAt: string | null };
}

interface AccountingEntriesResponse {
  ok: boolean;
  data: { items: AccountingEntry[] };
}

interface CreateEntryResponse {
  ok: boolean;
  data: { item: AccountingEntry };
}

const WebAppAccountingPage: React.FC<WebAppAccountingPageProps> = ({ expectedType, routeType }) => {
  const { context } = useWebApp();
  const { isLoading: isContextLoading, error: contextError, hasContext } = useWebAppContextLoader({
    expectedType,
    routeType,
  });
  const [summary, setSummary] = useState<AccountingSummaryResponse["data"] | null>(null);
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<WebAppApiError | null>(null);
  const [formValues, setFormValues] = useState({
    date: new Date().toISOString().split("T")[0],
    label: "",
    amount: "",
    account: "",
  });

  const ficheId = context.fiche?.id;

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  const loadSummary = useCallback(async () => {
    if (!ficheId) return;

    setLoadingSummary(true);
    try {
      const response = await webAppFetch<AccountingSummaryResponse>(
        `/api/app/${routeType}/comptabilite/${ficheId}/summary`
      );
      setSummary(response.data);
    } catch (error) {
      const apiError =
        error instanceof WebAppApiError
          ? error
          : new WebAppApiError("Impossible de charger le résumé de la fiche.");
      setError(apiError);
      showToast("error", apiError.message);
    } finally {
      setLoadingSummary(false);
    }
  }, [ficheId, routeType, showToast]);

  const loadEntries = useCallback(async () => {
    if (!ficheId) return;

    setLoadingEntries(true);
    try {
      const response = await webAppFetch<AccountingEntriesResponse>(
        `/api/app/${routeType}/comptabilite/${ficheId}/entries`
      );
      setEntries(response.data.items);
    } catch (error) {
      const apiError =
        error instanceof WebAppApiError
          ? error
          : new WebAppApiError("Impossible de charger les écritures.");
      setError(apiError);
      showToast("error", apiError.message);
    } finally {
      setLoadingEntries(false);
    }
  }, [ficheId, routeType, showToast]);

  useEffect(() => {
    if (ficheId) {
      loadSummary();
      loadEntries();
    }
  }, [ficheId, loadEntries, loadSummary]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmissionError(null);

    if (!ficheId) {
      setSubmissionError("Aucune fiche sélectionnée.");
      return;
    }

    const parsedAmount = Number(formValues.amount);
    if (Number.isNaN(parsedAmount)) {
      setSubmissionError("Le montant doit être un nombre.");
      return;
    }

    setIsSubmitting(true);
    try {
      await webAppFetch<CreateEntryResponse>(
        `/api/app/${routeType}/comptabilite/${ficheId}/entries`,
        {
          method: "POST",
          body: JSON.stringify({
            date: formValues.date,
            label: formValues.label,
            amount: parsedAmount,
            account: formValues.account || undefined,
          }),
        }
      );
      showToast("success", "Écriture ajoutée avec succès.");
      setShowModal(false);
      setFormValues({
        date: new Date().toISOString().split("T")[0],
        label: "",
        amount: "",
        account: "",
      });
      await Promise.all([loadEntries(), loadSummary()]);
    } catch (error) {
      const apiError =
        error instanceof WebAppApiError
          ? error
          : new WebAppApiError("Impossible d'ajouter l'écriture.");
      setSubmissionError(apiError.message);
      setError(apiError);
      showToast("error", apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const lastUpdated = useMemo(() => {
    if (!summary?.lastUpdatedAt) return "Aucune écriture";

    const parsed = new Date(summary.lastUpdatedAt);
    return Number.isNaN(parsed.getTime()) ? "Aucune écriture" : parsed.toLocaleString("fr-FR");
  }, [summary]);

  if (isContextLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
        Chargement du module comptabilité...
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
        <h1 className="text-2xl font-semibold text-slate-900">Ma comptabilité</h1>
        <p className="text-sm text-slate-600">Synthèse de vos écritures et préparation des futures fonctionnalités comptables.</p>
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Résumé</p>
              <p className="text-sm text-slate-600">Vue d'ensemble de vos écritures.</p>
            </div>
            <button
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow"
              onClick={() => {
                loadSummary();
                loadEntries();
              }}
            >
              Actualiser
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Écritures</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {loadingSummary ? "--" : summary?.totals.entriesCount ?? 0}
              </p>
              <p className="text-xs text-slate-500">Nombre total d'écritures</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dernière mise à jour</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{loadingSummary ? "--" : lastUpdated}</p>
              <p className="text-xs text-slate-500">Basé sur vos dernières écritures</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actions rapides</p>
              <p className="text-sm text-slate-600">Ajoutez des écritures pour votre fiche.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              Ajouter une écriture
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Identifiant fiche : {context.fiche.id}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dernières écritures</p>
            <p className="text-sm text-slate-600">La table sera enrichie avec vos opérations.</p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {loadingEntries && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-sm text-slate-500">
                    Chargement des écritures...
                  </td>
                </tr>
              )}

              {!loadingEntries && entries.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                    Aucune écriture pour le moment.
                  </td>
                </tr>
              )}

              {!loadingEntries &&
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3">{new Date(entry.date).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{entry.label}</div>
                      {entry.account && <p className="text-xs text-slate-500">{entry.account}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatPrice(entry.amountCents / 100)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nouvelle écriture</p>
                <h2 className="text-xl font-semibold text-slate-900">Ajouter une écriture</h2>
                <p className="text-sm text-slate-600">Saisissez les informations principales.</p>
              </div>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300"
                onClick={() => setShowModal(false)}
              >
                Fermer
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-slate-700">
                  <span className="font-semibold">Date</span>
                  <input
                    type="date"
                    required
                    value={formValues.date}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, date: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span className="font-semibold">Montant</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formValues.amount}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, amount: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-semibold">Libellé</span>
                <input
                  type="text"
                  required
                  value={formValues.label}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, label: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700">
                <span className="font-semibold">Compte (optionnel)</span>
                <input
                  type="text"
                  value={formValues.account}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, account: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </label>

              {submissionError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{submissionError}</div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebAppAccountingPage;
