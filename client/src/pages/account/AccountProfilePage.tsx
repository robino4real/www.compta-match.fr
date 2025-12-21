import React from "react";
import { API_BASE_URL } from "../../config/api";

interface ProfilePayload {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  vatNumber?: string | null;
  siret?: string | null;
  billingStreet?: string | null;
  billingZip?: string | null;
  billingCity?: string | null;
  billingCountry?: string | null;
  phone?: string | null;
  accountType?: "INDIVIDUAL" | "PROFESSIONAL" | "ASSOCIATION";
}

const AccountProfilePage: React.FC = () => {
  const [profile, setProfile] = React.useState<ProfilePayload>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/account/profile`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Impossible de charger vos informations.");
        }

        setProfile({
          firstName: data?.user?.firstName || "",
          lastName: data?.user?.lastName || "",
          companyName: data?.profile?.companyName || "",
          vatNumber: data?.profile?.vatNumber || "",
          siret: data?.profile?.siret || "",
          billingStreet: data?.profile?.billingStreet || "",
          billingZip: data?.profile?.billingZip || "",
          billingCity: data?.profile?.billingCity || "",
          billingCountry: data?.profile?.billingCountry || "",
          phone: data?.profile?.phone || "",
          accountType: data?.profile?.accountType || "INDIVIDUAL",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleChange = (field: keyof ProfilePayload, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/account/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de mettre à jour votre profil.");
      }

      setFeedback("Vos informations ont été mises à jour.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    }
  };

  return (
    <main className="page-halo-neutral bg-white min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Espace client</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Informations personnelles</h1>
          <p className="text-sm text-slate-600 mt-2">
            Mettez à jour vos informations pour vos factures et abonnements.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-600 shadow-sm">
            Chargement de vos informations...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800 shadow-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-xs font-semibold text-slate-800">
                  Prénom
                </label>
                <input
                  id="firstName"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                  value={profile.firstName || ""}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-xs font-semibold text-slate-800">
                  Nom
                </label>
                <input
                  id="lastName"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                  value={profile.lastName || ""}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="accountType" className="text-xs font-semibold text-slate-800">
                Statut du compte
              </label>
              <select
                id="accountType"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                value={profile.accountType || "INDIVIDUAL"}
                onChange={(e) =>
                  handleChange(
                    "accountType",
                    e.target.value as "INDIVIDUAL" | "PROFESSIONAL" | "ASSOCIATION"
                  )
                }
              >
                <option value="INDIVIDUAL">Particulier</option>
                <option value="PROFESSIONAL">Professionnel</option>
                <option value="ASSOCIATION">Association</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Ces informations permettent de pré-remplir vos coordonnées de facturation.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-xs font-semibold text-slate-800">
                  Société
                </label>
                <input
                  id="companyName"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                  value={profile.companyName || ""}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="vatNumber" className="text-xs font-semibold text-slate-800">
                  N° TVA
                </label>
                <input
                  id="vatNumber"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                  value={profile.vatNumber || ""}
                  onChange={(e) => handleChange("vatNumber", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="siret" className="text-xs font-semibold text-slate-800">
                  SIRET
                </label>
                <input
                  id="siret"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                  value={profile.siret || ""}
                  onChange={(e) => handleChange("siret", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-xs font-semibold text-slate-800">
                  Téléphone
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                  value={profile.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-white px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">Adresse de facturation</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="billingStreet" className="text-xs font-semibold text-slate-800">
                    Adresse
                  </label>
                  <input
                    id="billingStreet"
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                    value={profile.billingStreet || ""}
                    onChange={(e) => handleChange("billingStreet", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="billingZip" className="text-xs font-semibold text-slate-800">
                    Code postal
                  </label>
                  <input
                    id="billingZip"
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                    value={profile.billingZip || ""}
                    onChange={(e) => handleChange("billingZip", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="billingCity" className="text-xs font-semibold text-slate-800">
                    Ville
                  </label>
                  <input
                    id="billingCity"
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                    value={profile.billingCity || ""}
                    onChange={(e) => handleChange("billingCity", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="billingCountry" className="text-xs font-semibold text-slate-800">
                    Pays
                  </label>
                  <input
                    id="billingCountry"
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-black focus:outline-none"
                    value={profile.billingCountry || ""}
                    onChange={(e) => handleChange("billingCountry", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-slate-900"
              >
                Enregistrer mes informations
              </button>
            </div>

            {feedback && <p className="text-sm text-emerald-700">{feedback}</p>}
          </form>
        )}
      </div>
    </main>
  );
};

export default AccountProfilePage;
