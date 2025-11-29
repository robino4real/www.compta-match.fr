import React from "react";
import { API_BASE_URL } from "../../config/api";

interface StripeSettings {
  id: number;
  useLiveMode: boolean;
  defaultCurrency: string;
  testPublishableKey: string | null;
  livePublishableKey: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const AdminStripeSettingsPage: React.FC = () => {
  const [settings, setSettings] = React.useState<StripeSettings | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [useLiveMode, setUseLiveMode] = React.useState(false);
  const [defaultCurrency, setDefaultCurrency] = React.useState("EUR");
  const [testPublishableKey, setTestPublishableKey] = React.useState("");
  const [livePublishableKey, setLivePublishableKey] = React.useState("");

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/admin/stripe-settings`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Impossible de récupérer les paramètres Stripe."
          );
        }

        const s: StripeSettings = data.settings;
        setSettings(s);
        setUseLiveMode(Boolean(s.useLiveMode));
        setDefaultCurrency(s.defaultCurrency || "EUR");
        setTestPublishableKey(s.testPublishableKey ?? "");
        setLivePublishableKey(s.livePublishableKey ?? "");
      } catch (err: any) {
        console.error("Erreur GET /admin/stripe-settings :", err);
        setError(
          err?.message ||
            "Une erreur est survenue lors du chargement des paramètres Stripe."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const payload = {
        useLiveMode,
        defaultCurrency: defaultCurrency.trim().toUpperCase() || "EUR",
        testPublishableKey: testPublishableKey.trim() || null,
        livePublishableKey: livePublishableKey.trim() || null,
      };

      const response = await fetch(
        `${API_BASE_URL}/admin/stripe-settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de mettre à jour les paramètres Stripe."
        );
      }

      const updated: StripeSettings = data.settings;
      setSettings(updated);
      setUseLiveMode(Boolean(updated.useLiveMode));
      setDefaultCurrency(updated.defaultCurrency || "EUR");
      setTestPublishableKey(updated.testPublishableKey ?? "");
      setLivePublishableKey(updated.livePublishableKey ?? "");

      setSaveSuccess("Paramètres Stripe mis à jour avec succès.");
    } catch (err: any) {
      console.error("Erreur PUT /admin/stripe-settings :", err);
      setSaveError(
        err?.message ||
          "Une erreur est survenue lors de la mise à jour des paramètres Stripe."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-black">
            Paramètres Stripe
          </h1>
          <p className="text-xs text-slate-600">
            Configurez ici le mode test / live, la devise par défaut et les
            clés publiques Stripe utilisées par le site. Les clés secrètes
            restent dans les variables d&apos;environnement du serveur.
          </p>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {isLoading && (
          <p className="text-xs text-slate-600">
            Chargement des paramètres Stripe...
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600">
            {error}
          </p>
        )}

        {!isLoading && !error && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {saveError && (
              <p className="text-xs text-red-600">
                {saveError}
              </p>
            )}
            {saveSuccess && (
              <p className="text-xs text-emerald-600">
                {saveSuccess}
              </p>
            )}

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">
                Mode de fonctionnement
              </span>
              <div className="flex flex-wrap gap-3 items-center">
                <button
                  type="button"
                  onClick={() => setUseLiveMode(false)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                    !useLiveMode
                      ? "border-black bg-black text-white"
                      : "border-slate-300 text-slate-700 hover:border-black hover:text-black"
                  }`}
                >
                  Mode test
                </button>
                <button
                  type="button"
                  onClick={() => setUseLiveMode(true)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                    useLiveMode
                      ? "border-black bg-black text-white"
                      : "border-slate-300 text-slate-700 hover:border-black hover:text-black"
                  }`}
                >
                  Mode live
                </button>
                <span className="text-[11px] text-slate-500">
                  Utiliser Stripe en mode test pour les essais, puis activer le
                  mode live lorsque tout est prêt.
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Devise par défaut
              </label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="EUR">EUR – Euro</option>
                <option value="USD">USD – Dollar américain</option>
                <option value="GBP">GBP – Livre sterling</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Clé publique Stripe (mode test)
              </label>
              <input
                type="text"
                value={testPublishableKey}
                onChange={(e) => setTestPublishableKey(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="pk_test_..."
              />
              <p className="text-[11px] text-slate-500">
                Clé publique utilisable côté navigateur pour les tests. Ce n&apos;est
                pas une clé secrète.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Clé publique Stripe (mode live)
              </label>
              <input
                type="text"
                value={livePublishableKey}
                onChange={(e) => setLivePublishableKey(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="pk_live_..."
              />
              <p className="text-[11px] text-slate-500">
                Clé publique utilisable côté navigateur en production. À ne
                renseigner que lorsque le compte Stripe est prêt.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer les paramètres"}
              </button>
            </div>
          </form>
        )}
      </section>

      {settings && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Informations techniques (lecture seule)
          </h2>
          <p className="text-[11px] text-slate-500">
            Dernière mise à jour :{" "}
            {settings.updatedAt
              ? new Date(settings.updatedAt).toLocaleString()
              : "—"}
          </p>
        </section>
      )}
    </div>
  );
};

export default AdminStripeSettingsPage;
