import React from "react";
import { API_BASE_URL } from "../../config/api";

interface CompanySettings {
  id: number;
  companyName: string;
  legalForm: string;
  tradeName?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  siren?: string | null;
  siret?: string | null;
  rcsCity?: string | null;
  vatNumber?: string | null;
  vatRegime: "NO_VAT_293B" | "STANDARD_VAT" | "OTHER";
  vatCustomMention?: string | null;
  capital?: string | null;
  contactEmail: string;
  supportEmail?: string | null;
  websiteUrl?: string | null;
  invoiceFooterText?: string | null;
  logoUrl?: string | null;
}

const AdminCompanySettingsPage: React.FC = () => {
  const [settings, setSettings] = React.useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/admin/company-settings`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            data.message || "Impossible de charger les paramètres entreprise."
          );
        }
        setSettings(data.settings as CompanySettings);
      } catch (err: any) {
        console.error("Erreur chargement company settings", err);
        setError(err?.message || "Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setError(null);
      setSuccess(null);
      const response = await fetch(`${API_BASE_URL}/admin/company-settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Enregistrement impossible");
      }
      setSettings(data.settings as CompanySettings);
      setSuccess("Paramètres enregistrés avec succès.");
    } catch (err: any) {
      console.error("Erreur sauvegarde company settings", err);
      setError(err?.message || "Impossible d'enregistrer les paramètres.");
    }
  };

  if (isLoading) {
    return <p className="text-xs text-slate-600">Chargement des paramètres...</p>;
  }

  if (!settings) {
    return <p className="text-xs text-red-600">{error || "Aucun paramètre."}</p>;
  }

  return (
    <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">
            Paramètres entreprise & facturation
          </h1>
          <p className="text-xs text-slate-600">
            Ces informations sont utilisées pour générer les factures (mentions
            légales, TVA, coordonnées).
          </p>
        </div>
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {success && <p className="text-[11px] text-green-600">{success}</p>}

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Dénomination</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Forme juridique</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.legalForm}
            onChange={(e) => handleChange("legalForm", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Nom commercial</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.tradeName || ""}
            onChange={(e) => handleChange("tradeName", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Adresse ligne 1</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.addressLine1}
            onChange={(e) => handleChange("addressLine1", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Adresse ligne 2</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.addressLine2 || ""}
            onChange={(e) => handleChange("addressLine2", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Code postal</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Ville</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.city}
            onChange={(e) => handleChange("city", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Pays</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.country}
            onChange={(e) => handleChange("country", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">SIREN</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.siren || ""}
            onChange={(e) => handleChange("siren", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">SIRET</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.siret || ""}
            onChange={(e) => handleChange("siret", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">RCS</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.rcsCity || ""}
            onChange={(e) => handleChange("rcsCity", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">TVA intracom</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.vatNumber || ""}
            onChange={(e) => handleChange("vatNumber", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Régime TVA</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.vatRegime}
            onChange={(e) => handleChange("vatRegime", e.target.value)}
          >
            <option value="NO_VAT_293B">TVA non applicable (293 B)</option>
            <option value="STANDARD_VAT">TVA normale</option>
            <option value="OTHER">Autre mention</option>
          </select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-[11px] text-slate-600">Mention TVA personnalisée</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.vatCustomMention || ""}
            onChange={(e) => handleChange("vatCustomMention", e.target.value)}
            disabled={settings.vatRegime !== "OTHER"}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Capital</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.capital || ""}
            onChange={(e) => handleChange("capital", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Email contact</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.contactEmail}
            onChange={(e) => handleChange("contactEmail", e.target.value)}
            required
            type="email"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Email support</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.supportEmail || ""}
            onChange={(e) => handleChange("supportEmail", e.target.value)}
            type="email"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Site web</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.websiteUrl || ""}
            onChange={(e) => handleChange("websiteUrl", e.target.value)}
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-[11px] text-slate-600">Texte pied de facture</label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={settings.invoiceFooterText || ""}
            onChange={(e) => handleChange("invoiceFooterText", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Logo (URL)</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={settings.logoUrl || ""}
            onChange={(e) => handleChange("logoUrl", e.target.value)}
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCompanySettingsPage;
