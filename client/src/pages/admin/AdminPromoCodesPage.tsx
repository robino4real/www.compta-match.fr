import React from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type DiscountType = "PERCENT" | "AMOUNT";

interface PromoCode {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType | string;
  discountValue: number;
  maxUses?: number | null;
  currentUses: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const AdminPromoCodesPage: React.FC = () => {
  const [promos, setPromos] = React.useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Création
  const [newCode, setNewCode] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newDiscountType, setNewDiscountType] =
    React.useState<DiscountType>("PERCENT");
  const [newDiscountValue, setNewDiscountValue] = React.useState("");
  const [newMaxUses, setNewMaxUses] = React.useState("");
  const [newStartsAt, setNewStartsAt] = React.useState("");
  const [newEndsAt, setNewEndsAt] = React.useState("");
  const [newIsActive, setNewIsActive] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = React.useState<string | null>(null);

  // Édition
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDescription, setEditDescription] = React.useState("");
  const [editDiscountType, setEditDiscountType] =
    React.useState<DiscountType>("PERCENT");
  const [editDiscountValue, setEditDiscountValue] = React.useState("");
  const [editMaxUses, setEditMaxUses] = React.useState("");
  const [editStartsAt, setEditStartsAt] = React.useState("");
  const [editEndsAt, setEditEndsAt] = React.useState("");
  const [editIsActive, setEditIsActive] = React.useState(true);
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [editSuccess, setEditSuccess] = React.useState<string | null>(null);

  const [archiveError, setArchiveError] = React.useState<string | null>(null);
  const [archiveSuccess, setArchiveSuccess] = React.useState<string | null>(
    null
  );

  const fetchPromos = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/admin/promo-codes`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de récupérer les codes promo."
        );
      }

      const list: PromoCode[] = Array.isArray(data.promos) ? data.promos : [];
      setPromos(list);
    } catch (err: any) {
      console.error("Erreur GET /admin/promo-codes :", err);
      setError(
        err?.message ||
          "Une erreur est survenue lors du chargement des codes promo."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      if (!newCode.trim()) {
        throw new Error("Le code promo est obligatoire.");
      }

      const value = Number(newDiscountValue.replace(",", "."));
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(
          "La valeur de réduction doit être un nombre strictement positif."
        );
      }

      let parsedMaxUses: number | null = null;
      if (newMaxUses.trim()) {
        const m = Number(newMaxUses);
        if (!Number.isInteger(m) || m <= 0) {
          throw new Error(
            "Le nombre maximal d'utilisations doit être un entier positif ou laissé vide."
          );
        }
        parsedMaxUses = m;
      }

      const payload = {
        code: newCode.trim(),
        description: newDescription.trim() || undefined,
        discountType: newDiscountType,
        discountValue: value,
        maxUses: parsedMaxUses,
        isActive: newIsActive,
        startsAt: newStartsAt.trim() || null,
        endsAt: newEndsAt.trim() || null,
      };

      const response = await fetch(`${API_BASE_URL}/admin/promo-codes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de créer le code promo."
        );
      }

      setCreateSuccess("Code promo créé avec succès.");
      setNewCode("");
      setNewDescription("");
      setNewDiscountType("PERCENT");
      setNewDiscountValue("");
      setNewMaxUses("");
      setNewStartsAt("");
      setNewEndsAt("");
      setNewIsActive(true);

      await fetchPromos();
    } catch (err: any) {
      console.error("Erreur POST /admin/promo-codes :", err);
      setCreateError(
        err?.message ||
          "Une erreur est survenue lors de la création du code promo."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (promo: PromoCode) => {
    setEditingId(promo.id);
    setEditDescription(promo.description ?? "");
    setEditDiscountType(
      promo.discountType === "AMOUNT" ? "AMOUNT" : "PERCENT"
    );
    setEditDiscountValue(promo.discountValue.toString());
    setEditMaxUses(
      typeof promo.maxUses === "number" ? promo.maxUses.toString() : ""
    );
    setEditStartsAt(promo.startsAt ?? "");
    setEditEndsAt(promo.endsAt ?? "");
    setEditIsActive(promo.isActive);
    setEditError(null);
    setEditSuccess(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDescription("");
    setEditDiscountValue("");
    setEditMaxUses("");
    setEditStartsAt("");
    setEditEndsAt("");
    setEditIsActive(true);
    setEditError(null);
    setEditSuccess(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setIsSavingEdit(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const value = Number(editDiscountValue.replace(",", "."));
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(
          "La valeur de réduction doit être un nombre strictement positif."
        );
      }

      let parsedMaxUses: number | null = null;
      if (editMaxUses.trim()) {
        const m = Number(editMaxUses);
        if (!Number.isInteger(m) || m <= 0) {
          throw new Error(
            "Le nombre maximal d'utilisations doit être un entier positif ou laissé vide."
          );
        }
        parsedMaxUses = m;
      }

      const payload: any = {
        description: editDescription.trim() || null,
        discountType: editDiscountType,
        discountValue: value,
        maxUses: parsedMaxUses,
        isActive: editIsActive,
        startsAt: editStartsAt.trim() || null,
        endsAt: editEndsAt.trim() || null,
      };

      const response = await fetch(
        `${API_BASE_URL}/admin/promo-codes/${editingId}`,
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
          data.message || "Impossible de mettre à jour le code promo."
        );
      }

      setEditSuccess("Code promo mis à jour avec succès.");
      await fetchPromos();
    } catch (err: any) {
      console.error("Erreur PUT /admin/promo-codes/:id :", err);
      setEditError(
        err?.message ||
          "Une erreur est survenue lors de la mise à jour du code promo."
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleArchivePromo = async (promo: PromoCode) => {
    setArchiveError(null);
    setArchiveSuccess(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/promo-codes/${promo.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de désactiver ce code promo."
        );
      }

      setArchiveSuccess(`Le code ${promo.code} a été désactivé.`);
      await fetchPromos();
    } catch (err: any) {
      console.error("Erreur DELETE /admin/promo-codes/:id :", err);
      setArchiveError(
        err?.message ||
          "Une erreur est survenue lors de la désactivation du code promo."
      );
    }
  };

  const formatDiscount = (promo: PromoCode): string => {
    if (promo.discountType === "AMOUNT") {
      return `-${(promo.discountValue / 100).toFixed(2)} €`;
    }
    return `-${promo.discountValue}%`;
  };

  const formatPeriod = (promo: PromoCode): string => {
    const s = promo.startsAt
      ? new Date(promo.startsAt).toISOString().slice(0, 10)
      : "";
    const e = promo.endsAt
      ? new Date(promo.endsAt).toISOString().slice(0, 10)
      : "";

    if (!s && !e) return "Aucune limite de période";
    if (s && !e) return `À partir du ${s}`;
    if (!s && e) return `Jusqu'au ${e}`;
    return `Du ${s} au ${e}`;
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-black">Codes promo</h1>
        <p className="text-xs text-slate-600">
          Créez et gérez des codes de réduction utilisables sur les logiciels
          téléchargeables. Les codes peuvent être limités dans le temps et en
          nombre d&apos;utilisations.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-black">
          Créer un nouveau code promo
        </h2>

        {createError && <p className="text-xs text-red-600">{createError}</p>}
        {createSuccess && (
          <p className="text-xs text-emerald-600">{createSuccess}</p>
        )}

        <form onSubmit={handleCreatePromo} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Code
              </label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="COMPTA10"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Type de réduction
              </label>
              <select
                value={newDiscountType}
                onChange={(e) =>
                  setNewDiscountType(
                    e.target.value === "AMOUNT" ? "AMOUNT" : "PERCENT"
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="PERCENT">Pourcentage (%)</option>
                <option value="AMOUNT">Montant fixe (en €)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Valeur
              </label>
              <input
                type="text"
                value={newDiscountValue}
                onChange={(e) => setNewDiscountValue(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="10 (pour 10% ou 10 €)"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Description (optionnelle)
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Nombre max d&apos;utilisations
              </label>
              <input
                type="text"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Laisser vide pour illimité"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Date de début (optionnel)
              </label>
              <input
                type="text"
                value={newStartsAt}
                onChange={(e) => setNewStartsAt(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="2025-01-01T00:00:00.000Z"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Date de fin (optionnel)
              </label>
              <input
                type="text"
                value={newEndsAt}
                onChange={(e) => setNewEndsAt(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="2025-01-31T23:59:59.000Z"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Code actif
              </span>
              <button
                type="button"
                onClick={() => setNewIsActive((prev) => !prev)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full border transition ${
                  newIsActive
                    ? "border-black bg-black"
                    : "border-slate-300 bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    newIsActive ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Création..." : "Créer le code promo"}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-black">
            Liste des codes promo
          </h2>
          {archiveError && (
            <p className="text-[11px] text-red-600">{archiveError}</p>
          )}
          {archiveSuccess && (
            <p className="text-[11px] text-emerald-600">{archiveSuccess}</p>
          )}
        </div>

        {isLoading && (
          <p className="text-xs text-slate-600">
            Chargement des codes promo...
          </p>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        {!isLoading && !error && promos.length === 0 && (
          <p className="text-xs text-slate-500">
            Aucun code promo pour le moment.
          </p>
        )}

        {!isLoading && !error && promos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Code
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Réduction
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Utilisations
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Période
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Statut
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {promos.map((promo) => {
                  const usesText =
                    promo.maxUses && promo.maxUses > 0
                      ? `${promo.currentUses} / ${promo.maxUses}`
                      : `${promo.currentUses} (illimité)`;

                  return (
                    <tr
                      key={promo.id}
                      className="odd:bg-white even:bg-slate-50"
                    >
                      <td className="px-3 py-2 align-top text-slate-800">
                        <div className="space-y-1">
                          <span className="font-semibold">{promo.code}</span>
                          {promo.description && (
                            <p className="text-[11px] text-slate-600">
                              {promo.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {formatDiscount(promo)}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {usesText}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {formatPeriod(promo)}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            promo.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {promo.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(promo)}
                            className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black transition"
                          >
                            Éditer
                          </button>
                          {promo.isActive && (
                            <button
                              type="button"
                              onClick={() => handleArchivePromo(promo)}
                              className="rounded-full border border-red-300 px-3 py-1 text-[11px] font-semibold text-red-700 hover:border-red-500 hover:text-red-600 transition"
                            >
                              Désactiver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingId && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-black">
              Modifier le code promo
            </h2>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black transition"
            >
              Annuler
            </button>
          </div>

          {editError && <p className="text-xs text-red-600">{editError}</p>}
          {editSuccess && (
            <p className="text-xs text-emerald-600">{editSuccess}</p>
          )}

          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Type de réduction
                </label>
                <select
                  value={editDiscountType}
                  onChange={(e) =>
                    setEditDiscountType(
                      e.target.value === "AMOUNT" ? "AMOUNT" : "PERCENT"
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="PERCENT">Pourcentage (%)</option>
                  <option value="AMOUNT">Montant fixe (en €)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Valeur
                </label>
                <input
                  type="text"
                  value={editDiscountValue}
                  onChange={(e) => setEditDiscountValue(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nombre max d&apos;utilisations
                </label>
                <input
                  type="text"
                  value={editMaxUses}
                  onChange={(e) => setEditMaxUses(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Laisser vide pour illimité"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Date de début (optionnel)
                </label>
                <input
                  type="text"
                  value={editStartsAt}
                  onChange={(e) => setEditStartsAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="2025-01-01T00:00:00.000Z"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Date de fin (optionnel)
                </label>
                <input
                  type="text"
                  value={editEndsAt}
                  onChange={(e) => setEditEndsAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="2025-01-31T23:59:59.000Z"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <span className="text-xs font-semibold text-slate-700">
                  Code actif
                </span>
                <button
                  type="button"
                  onClick={() => setEditIsActive((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full border transition ${
                    editIsActive
                      ? "border-black bg-black"
                      : "border-slate-300 bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      editIsActive ? "translate-x-4" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingEdit}
                className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingEdit
                  ? "Enregistrement..."
                  : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default AdminPromoCodesPage;
