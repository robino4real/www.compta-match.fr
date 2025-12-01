import React from "react";
import { API_BASE_URL } from "../../config/api";
import { PaidServicePlan, PaidServiceSection } from "../../types/paidServices";

interface FeatureRow {
  id: string;
  label: string;
  description?: string | null;
  planAIncluded: boolean;
  planBIncluded: boolean;
  sortOrder: number;
  planAId?: string | null;
  planBId?: string | null;
}

const emptyPlan: Partial<PaidServicePlan> = {
  name: "",
  slug: "",
  subtitle: "",
  priceAmount: 0,
  priceCurrency: "EUR",
  pricePeriod: "month",
  isPublished: false,
  isHighlighted: false,
  sortOrder: 0,
};

const AdminPaidServicesPage: React.FC = () => {
  const [plans, setPlans] = React.useState<PaidServicePlan[]>([]);
  const [features, setFeatures] = React.useState<FeatureRow[]>([]);
  const [sections, setSections] = React.useState<PaidServiceSection[]>([]);
  const [newPlan, setNewPlan] = React.useState<Partial<PaidServicePlan>>(emptyPlan);
  const [newFeature, setNewFeature] = React.useState<Partial<FeatureRow>>({ planAIncluded: false, planBIncluded: false, sortOrder: 0 });
  const [newSection, setNewSection] = React.useState<Partial<PaidServiceSection>>({ title: "", body: "", imageUrl: "", sortOrder: 0, isPublished: true });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const fetchAll = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const [plansRes, featuresRes, sectionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/paid-services/admin/plans`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/paid-services/admin/features`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/paid-services/admin/sections`, { credentials: "include" }),
      ]);

      if (!plansRes.ok || !featuresRes.ok || !sectionsRes.ok) {
        throw new Error("Impossible de charger les données services payants.");
      }

      const plansData = (await plansRes.json()) as { plans: PaidServicePlan[] };
      const featuresData = (await featuresRes.json()) as { plans: PaidServicePlan[]; rows: FeatureRow[] };
      const sectionsData = (await sectionsRes.json()) as { sections: PaidServiceSection[] };

      setPlans(plansData.plans || []);
      setFeatures(featuresData.rows || []);
      setSections(sectionsData.sections || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Une erreur est survenue lors du chargement.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handlePlanChange = (id: string, field: keyof PaidServicePlan, value: any) => {
    setPlans((prev) => prev.map((plan) => (plan.id === id ? { ...plan, [field]: value } : plan)));
  };

  const savePlan = async (plan: PaidServicePlan) => {
    setError(null);
    setSuccess(null);
    const response = await fetch(`${API_BASE_URL}/paid-services/admin/plans/${plan.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError((data as { message?: string }).message || "Impossible de mettre à jour le plan.");
      return;
    }
    setSuccess("Plan mis à jour.");
    fetchAll();
  };

  const createPlan = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newPlan.name || !newPlan.slug) {
      setError("Veuillez renseigner le nom et le slug du plan.");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/paid-services/admin/plans`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPlan),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError((data as { message?: string }).message || "Impossible de créer le plan.");
      return;
    }
    setNewPlan(emptyPlan);
    setSuccess("Plan créé.");
    fetchAll();
  };

  const deletePlanAction = async (planId: string) => {
    if (!window.confirm("Supprimer ce plan ?")) return;
    const response = await fetch(`${API_BASE_URL}/paid-services/admin/plans/${planId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError((data as { message?: string }).message || "Impossible de supprimer le plan.");
      return;
    }
    setSuccess("Plan supprimé.");
    fetchAll();
  };

  const handleFeatureChange = (id: string, field: keyof FeatureRow, value: any) => {
    setFeatures((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const saveFeature = async (row: FeatureRow) => {
    setError(null);
    setSuccess(null);
    const response = await fetch(`${API_BASE_URL}/paid-services/admin/features/${row.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError((data as { message?: string }).message || "Impossible de mettre à jour la fonctionnalité.");
      return;
    }
    setSuccess("Fonctionnalité mise à jour.");
    fetchAll();
  };

  const createFeature = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newFeature.label) {
      setError("Le libellé est requis.");
      return;
    }
    const response = await fetch(`${API_BASE_URL}/paid-services/admin/features`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFeature),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError((data as { message?: string }).message || "Impossible d’ajouter la fonctionnalité.");
      return;
    }
    setSuccess("Fonctionnalité ajoutée.");
    setNewFeature({ planAIncluded: false, planBIncluded: false, sortOrder: 0 });
    fetchAll();
  };

  const deleteFeature = async (id: string) => {
    if (!window.confirm("Supprimer cette fonctionnalité ?")) return;
    const response = await fetch(`${API_BASE_URL}/paid-services/admin/features/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError((data as { message?: string }).message || "Impossible de supprimer la fonctionnalité.");
      return;
    }
    setSuccess("Fonctionnalité supprimée.");
    fetchAll();
  };

  const handleSectionChange = (id: string, field: keyof PaidServiceSection, value: any) => {
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, [field]: value } : section)));
  };

  const saveSection = async (section: PaidServiceSection) => {
    setError(null);
    setSuccess(null);
    const response = await fetch(`${API_BASE_URL}/paid-services/admin/sections/${section.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(section),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError((data as { message?: string }).message || "Impossible de mettre à jour la section.");
      return;
    }
    setSuccess("Section mise à jour.");
    fetchAll();
  };

  const createSection = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newSection.title || !newSection.body) {
      setError("Merci de renseigner le titre et le contenu de la section.");
      return;
    }
    const response = await fetch(`${API_BASE_URL}/paid-services/admin/sections`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSection),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError((data as { message?: string }).message || "Impossible d’ajouter la section.");
      return;
    }
    setSuccess("Section ajoutée.");
    setNewSection({ title: "", body: "", imageUrl: "", sortOrder: 0, isPublished: true });
    fetchAll();
  };

  const deleteSectionAction = async (id: string) => {
    if (!window.confirm("Supprimer cette section ?")) return;
    const response = await fetch(`${API_BASE_URL}/paid-services/admin/sections/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError((data as { message?: string }).message || "Impossible de supprimer la section.");
      return;
    }
    setSuccess("Section supprimée.");
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Services payants</h1>
          <p className="text-sm text-slate-600">Gérez les plans ComptaPro, le tableau comparatif et les sections descriptives.</p>
        </div>
        <button
          type="button"
          onClick={fetchAll}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"
        >
          Rafraîchir
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}
      {isLoading && <div className="text-sm text-slate-600">Chargement...</div>}

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Plans d’abonnement</h2>
            <p className="text-sm text-slate-600">Maximum conseillé : 2 plans pour la page publique.</p>
          </div>
          {plans.length > 2 && <span className="text-xs font-medium text-amber-700">Vous avez plus de 2 plans publiés.</span>}
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="space-y-3 rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{plan.name}</h3>
                <button
                  type="button"
                  onClick={() => deletePlanAction(plan.id)}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Supprimer
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-600">
                  Nom
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={plan.name}
                    onChange={(e) => handlePlanChange(plan.id, "name", e.target.value)}
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Slug
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={plan.slug}
                    onChange={(e) => handlePlanChange(plan.id, "slug", e.target.value)}
                  />
                </label>
                <label className="col-span-2 text-xs text-slate-600">
                  Sous-titre
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={plan.subtitle || ""}
                    onChange={(e) => handlePlanChange(plan.id, "subtitle", e.target.value)}
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Prix HT
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={plan.priceAmount}
                    onChange={(e) => handlePlanChange(plan.id, "priceAmount", parseFloat(e.target.value))}
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Devise
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={plan.priceCurrency}
                    onChange={(e) => handlePlanChange(plan.id, "priceCurrency", e.target.value)}
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Période
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={plan.pricePeriod}
                    onChange={(e) => handlePlanChange(plan.id, "pricePeriod", e.target.value)}
                  >
                    <option value="month">Mois</option>
                    <option value="year">An</option>
                  </select>
                </label>
                <label className="text-xs text-slate-600">
                  Ordre
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={plan.sortOrder ?? 0}
                    onChange={(e) => handlePlanChange(plan.id, "sortOrder", parseInt(e.target.value, 10))}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={plan.isPublished}
                    onChange={(e) => handlePlanChange(plan.id, "isPublished", e.target.checked)}
                  />
                  Publié
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={plan.isHighlighted}
                    onChange={(e) => handlePlanChange(plan.id, "isHighlighted", e.target.checked)}
                  />
                  Mis en avant
                </label>
              </div>
              <button
                type="button"
                onClick={() => savePlan(plan)}
                className="w-full rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
              >
                Enregistrer
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 p-3">
          <h3 className="text-sm font-semibold text-slate-900">Ajouter un plan</h3>
          {plans.length >= 2 && (
            <p className="text-xs text-amber-700">Vous avez atteint le nombre conseillé de plans (2 maximum).</p>
          )}
          <form className="mt-2 grid gap-2 md:grid-cols-2" onSubmit={createPlan}>
            <input
              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
              placeholder="Nom"
              value={newPlan.name || ""}
              onChange={(e) => setNewPlan((prev) => ({ ...prev, name: e.target.value }))}
              disabled={plans.length >= 2}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
              placeholder="Slug"
              value={newPlan.slug || ""}
              onChange={(e) => setNewPlan((prev) => ({ ...prev, slug: e.target.value }))}
              disabled={plans.length >= 2}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm md:col-span-2"
              placeholder="Sous-titre"
              value={newPlan.subtitle || ""}
              onChange={(e) => setNewPlan((prev) => ({ ...prev, subtitle: e.target.value }))}
              disabled={plans.length >= 2}
            />
            <div className="grid grid-cols-2 gap-2 md:col-span-2 md:grid-cols-4">
              <input
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                placeholder="Prix HT"
                value={newPlan.priceAmount ?? 0}
                onChange={(e) => setNewPlan((prev) => ({ ...prev, priceAmount: parseFloat(e.target.value) }))}
                disabled={plans.length >= 2}
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                placeholder="Devise"
                value={newPlan.priceCurrency || "EUR"}
                onChange={(e) => setNewPlan((prev) => ({ ...prev, priceCurrency: e.target.value }))}
                disabled={plans.length >= 2}
              />
              <select
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                value={newPlan.pricePeriod || "month"}
                onChange={(e) => setNewPlan((prev) => ({ ...prev, pricePeriod: e.target.value }))}
                disabled={plans.length >= 2}
              >
                <option value="month">Mois</option>
                <option value="year">An</option>
              </select>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                placeholder="Ordre"
                value={newPlan.sortOrder ?? 0}
                onChange={(e) => setNewPlan((prev) => ({ ...prev, sortOrder: parseInt(e.target.value, 10) }))}
                disabled={plans.length >= 2}
              />
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={!!newPlan.isPublished}
                  onChange={(e) => setNewPlan((prev) => ({ ...prev, isPublished: e.target.checked }))}
                  disabled={plans.length >= 2}
                />
                Publié
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={!!newPlan.isHighlighted}
                  onChange={(e) => setNewPlan((prev) => ({ ...prev, isHighlighted: e.target.checked }))}
                  disabled={plans.length >= 2}
                />
                Mis en avant
              </label>
            </div>
            <button
              type="submit"
              className="md:col-span-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
              disabled={plans.length >= 2}
            >
              Ajouter un plan
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tableau comparatif</h2>
            <p className="text-sm text-slate-600">Activez les fonctionnalités par plan.</p>
          </div>
          <span className="text-xs text-slate-500">
            Colonnes : {plans[0]?.name || "Plan 1"} / {plans[1]?.name || "Plan 2"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-3 py-2">Fonctionnalité</th>
                <th className="px-3 py-2 text-center">{plans[0]?.name || "Plan 1"}</th>
                <th className="px-3 py-2 text-center">{plans[1]?.name || "Plan 2"}</th>
                <th className="px-3 py-2 text-center">Ordre</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {features.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      value={row.label}
                      onChange={(e) => handleFeatureChange(row.id, "label", e.target.value)}
                    />
                    <textarea
                      className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                      placeholder="Description"
                      value={row.description || ""}
                      onChange={(e) => handleFeatureChange(row.id, "description", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.planAIncluded}
                      onChange={(e) => handleFeatureChange(row.id, "planAIncluded", e.target.checked)}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.planBIncluded}
                      onChange={(e) => handleFeatureChange(row.id, "planBIncluded", e.target.checked)}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      value={row.sortOrder ?? 0}
                      onChange={(e) => handleFeatureChange(row.id, "sortOrder", parseInt(e.target.value, 10))}
                    />
                  </td>
                  <td className="px-3 py-2 space-x-2 text-right text-xs">
                    <button
                      type="button"
                      onClick={() => saveFeature(row)}
                      className="rounded-lg bg-black px-3 py-2 font-semibold text-white hover:bg-slate-900"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFeature(row.id)}
                      className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:border-slate-300"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="mt-3 grid gap-2 rounded-xl border border-dashed border-slate-200 p-3 md:grid-cols-2" onSubmit={createFeature}>
          <input
            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
            placeholder="Libellé"
            value={newFeature.label || ""}
            onChange={(e) => setNewFeature((prev) => ({ ...prev, label: e.target.value }))}
          />
          <input
            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
            placeholder="Description"
            value={newFeature.description || ""}
            onChange={(e) => setNewFeature((prev) => ({ ...prev, description: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={!!newFeature.planAIncluded}
              onChange={(e) => setNewFeature((prev) => ({ ...prev, planAIncluded: e.target.checked }))}
            />
            {plans[0]?.name || "Plan 1"}
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={!!newFeature.planBIncluded}
              onChange={(e) => setNewFeature((prev) => ({ ...prev, planBIncluded: e.target.checked }))}
            />
            {plans[1]?.name || "Plan 2"}
          </label>
          <input
            type="number"
            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
            placeholder="Ordre"
            value={newFeature.sortOrder ?? 0}
            onChange={(e) => setNewFeature((prev) => ({ ...prev, sortOrder: parseInt(e.target.value, 10) }))}
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white md:col-span-2 hover:bg-black"
          >
            Ajouter une fonctionnalité
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Sections texte + image</h2>
            <p className="text-sm text-slate-600">Ces sections s’affichent sous le tableau comparatif.</p>
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="space-y-2 rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                <button
                  type="button"
                  onClick={() => deleteSectionAction(section.id)}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Supprimer
                </button>
              </div>
              <input
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                value={section.title}
                onChange={(e) => handleSectionChange(section.id, "title", e.target.value)}
              />
              <textarea
                className="h-24 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                value={section.body}
                onChange={(e) => handleSectionChange(section.id, "body", e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                placeholder="URL de l’image"
                value={section.imageUrl || ""}
                onChange={(e) => handleSectionChange(section.id, "imageUrl", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-600">
                  Ordre
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={section.sortOrder ?? 0}
                    onChange={(e) => handleSectionChange(section.id, "sortOrder", parseInt(e.target.value, 10))}
                  />
                </label>
                <label className="mt-6 flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={section.isPublished ?? true}
                    onChange={(e) => handleSectionChange(section.id, "isPublished", e.target.checked)}
                  />
                  Publié
                </label>
              </div>
              <button
                type="button"
                onClick={() => saveSection(section)}
                className="w-full rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
              >
                Enregistrer
              </button>
            </div>
          ))}
        </div>

        <form className="grid gap-2 rounded-xl border border-dashed border-slate-200 p-3" onSubmit={createSection}>
          <h3 className="text-sm font-semibold text-slate-900">Ajouter une section</h3>
          <input
            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
            placeholder="Titre"
            value={newSection.title || ""}
            onChange={(e) => setNewSection((prev) => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            className="h-20 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
            placeholder="Contenu"
            value={newSection.body || ""}
            onChange={(e) => setNewSection((prev) => ({ ...prev, body: e.target.value }))}
          />
          <input
            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
            placeholder="URL de l’image"
            value={newSection.imageUrl || ""}
            onChange={(e) => setNewSection((prev) => ({ ...prev, imageUrl: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-600">
              Ordre
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                value={newSection.sortOrder ?? 0}
                onChange={(e) => setNewSection((prev) => ({ ...prev, sortOrder: parseInt(e.target.value, 10) }))}
              />
            </label>
            <label className="mt-6 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={!!newSection.isPublished}
                onChange={(e) => setNewSection((prev) => ({ ...prev, isPublished: e.target.checked }))}
              />
              Publié
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            Ajouter la section
          </button>
        </form>
      </section>
    </div>
  );
};

export default AdminPaidServicesPage;
