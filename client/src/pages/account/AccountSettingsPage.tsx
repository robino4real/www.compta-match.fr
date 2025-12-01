import React from "react";
import { API_BASE_URL } from "../../config/api";

interface UserSettings {
  id: string;
  newsletterOptIn: boolean;
  alertsOptIn: boolean;
}

const AccountSettingsPage: React.FC = () => {
  const [settings, setSettings] = React.useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/account/settings`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Impossible de charger les paramètres.");
        }

        setSettings(data.settings as UserSettings);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/account/settings`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsletterOptIn: settings?.newsletterOptIn,
          alertsOptIn: settings?.alertsOptIn,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible d'enregistrer vos préférences.");
      }

      setFeedback("Vos préférences ont été mises à jour.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/account/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de changer le mot de passe.");
      }

      setPasswordMessage("Votre mot de passe a été mis à jour.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setPasswordError(message);
    }
  };

  return (
    <main className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 lg:px-8 space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Espace client</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Paramètres du compte</h1>
          <p className="text-sm text-slate-600 mt-2">
            Gérez vos notifications et votre sécurité.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-600 shadow-sm">
            Chargement de vos paramètres...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800 shadow-sm">
            {error}
          </div>
        )}

        {settings && !isLoading && !error && (
          <div className="space-y-6">
            <form
              onSubmit={handleSaveSettings}
              className="space-y-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <input
                  id="newsletterOptIn"
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
                  checked={settings.newsletterOptIn}
                  onChange={(e) =>
                    setSettings((prev) => prev && { ...prev, newsletterOptIn: e.target.checked })
                  }
                />
                <div>
                  <label htmlFor="newsletterOptIn" className="text-sm font-semibold text-slate-900">
                    Recevoir la newsletter
                  </label>
                  <p className="text-sm text-slate-600">
                    Actualités produits, nouveautés et conseils pour optimiser votre comptabilité.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="alertsOptIn"
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
                  checked={settings.alertsOptIn}
                  onChange={(e) => setSettings((prev) => prev && { ...prev, alertsOptIn: e.target.checked })}
                />
                <div>
                  <label htmlFor="alertsOptIn" className="text-sm font-semibold text-slate-900">
                    Recevoir les alertes importantes
                  </label>
                  <p className="text-sm text-slate-600">
                    Notifications liées à vos achats, factures ou mises à jour de sécurité.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-slate-900"
                >
                  Enregistrer mes préférences
                </button>
              </div>

              {feedback && <p className="text-sm text-emerald-700">{feedback}</p>}
            </form>

            <form
              onSubmit={handleChangePassword}
              className="space-y-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm"
            >
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-900">Changer de mot de passe</label>
                <p className="text-sm text-slate-600">
                  Pour votre sécurité, choisissez un mot de passe unique d'au moins 8 caractères.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-xs font-semibold text-slate-800">
                    Mot de passe actuel
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-xs font-semibold text-slate-800">
                    Nouveau mot de passe
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-800">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-slate-900"
                >
                  Mettre à jour mon mot de passe
                </button>
              </div>

              {passwordMessage && <p className="text-sm text-emerald-700">{passwordMessage}</p>}
              {passwordError && <p className="text-sm text-rose-700">{passwordError}</p>}
            </form>
          </div>
        )}
      </div>
    </main>
  );
};

export default AccountSettingsPage;
