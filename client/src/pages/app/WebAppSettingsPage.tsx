import React, { useEffect, useMemo, useState } from "react";
import { useWebApp, WebAppRouteType, WebAppType } from "../../context/WebAppContext";
import { useWebAppContextLoader } from "../../hooks/useWebAppContextLoader";
import { WebAppApiError, webAppFetch } from "../../lib/webAppFetch";
import WebAppErrorPage from "../../components/app/WebAppErrorPage";

interface WebAppSettingsPageProps {
  expectedType: WebAppType;
  routeType: WebAppRouteType;
}

interface FicheSettings {
  id: string;
  name: string;
  type: WebAppType;
  currency: string;
  fiscalYearStartMonth: number;
  createdAt: string;
}

interface SettingsResponse {
  ok: boolean;
  data: { fiche: FicheSettings };
}

const months = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const currencies = [
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
  { value: "GBP", label: "GBP (£)" },
];

const WebAppSettingsPage: React.FC<WebAppSettingsPageProps> = ({ expectedType, routeType }) => {
  const { context, setContext } = useWebApp();
  const { isLoading: isContextLoading, error: contextError, hasContext } = useWebAppContextLoader({
    expectedType,
    routeType,
  });
  const [settings, setSettings] = useState<FicheSettings | null>(null);
  const [form, setForm] = useState<Omit<FicheSettings, "id" | "createdAt" | "type">>({
    name: "",
    currency: "EUR",
    fiscalYearStartMonth: 1,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [error, setError] = useState<WebAppApiError | null>(null);

  const ficheId = context.fiche?.id;

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadSettings = async () => {
    if (!ficheId) return;

    setLoadingSettings(true);
    setError(null);

    try {
      const response = await webAppFetch<SettingsResponse>(
        `/api/app/${routeType}/fiche/${ficheId}/settings`
      );
      const ficheSettings = response.data.fiche;

      setSettings(ficheSettings);
      setForm({
        name: ficheSettings.name,
        currency: ficheSettings.currency || "EUR",
        fiscalYearStartMonth: ficheSettings.fiscalYearStartMonth || 1,
      });
    } catch (apiErr) {
      const apiError =
        apiErr instanceof WebAppApiError
          ? apiErr
          : new WebAppApiError("Impossible de charger les paramètres de la fiche.");
      setError(apiError);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (ficheId) {
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ficheId]);

  const hasChanges = useMemo(() => {
    if (!settings) return false;

    return (
      form.name.trim() !== settings.name.trim() ||
      form.currency !== settings.currency ||
      form.fiscalYearStartMonth !== settings.fiscalYearStartMonth
    );
  }, [form.currency, form.fiscalYearStartMonth, form.name, settings]);

  const handleInputChange = (field: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;

      setForm((prev) => ({
        ...prev,
        [field]: field === "fiscalYearStartMonth" ? Number(value) : value,
      }));
    };

  const handleReset = () => {
    if (!settings) return;

    setForm({
      name: settings.name,
      currency: settings.currency,
      fiscalYearStartMonth: settings.fiscalYearStartMonth,
    });
  };

  const handleSave = async () => {
    if (!ficheId || !settings) return;

    setSaving(true);
    setError(null);

    try {
      const response = await webAppFetch<SettingsResponse>(
        `/api/app/${routeType}/fiche/${ficheId}/settings`,
        {
          method: "PUT",
          body: JSON.stringify(form),
        }
      );

      const updated = response.data.fiche;
      setSettings(updated);
      setForm({
        name: updated.name,
        currency: updated.currency,
        fiscalYearStartMonth: updated.fiscalYearStartMonth,
      });
      showToast("success", "Modifications enregistrées");

      setContext({
        type: routeType,
        fiche: { id: updated.id, name: updated.name, type: updated.type },
        user: context.user || undefined,
      });
    } catch (apiErr) {
      const apiError =
        apiErr instanceof WebAppApiError
          ? apiErr
          : new WebAppApiError("Impossible d'enregistrer les paramètres.");
      showToast("error", apiError.message);
      setError(apiError);
    } finally {
      setSaving(false);
    }
  };

  if (isContextLoading || loadingSettings) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
        Chargement des paramètres...
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
        <h1 className="text-2xl font-semibold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-600">Gérez les préférences propres à cette fiche.</p>
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

      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Informations de la fiche</p>
          <p className="text-sm text-slate-600">Mettez à jour le nom de votre fiche et consultez ses informations clés.</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="fiche-name">
                Nom de la fiche
              </label>
              <input
                id="fiche-name"
                type="text"
                value={form.name}
                onChange={handleInputChange("name")}
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Ma structure"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</label>
              <input
                type="text"
                value={context.fiche.type}
                disabled
                className="block w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Créée le</label>
              <input
                type="text"
                value={settings ? new Date(settings.createdAt).toLocaleDateString("fr-FR") : "-"}
                disabled
                className="block w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Préférences</p>
          <p className="text-sm text-slate-600">Choisissez la devise et le mois de début de votre exercice.</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="currency">
                Devise
              </label>
              <select
                id="currency"
                value={form.currency}
                onChange={handleInputChange("currency")}
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {currencies.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="fiscal-year-start">
                Début d'exercice
              </label>
              <select
                id="fiscal-year-start"
                value={form.fiscalYearStartMonth}
                onChange={handleInputChange("fiscalYearStartMonth")}
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebAppSettingsPage;
