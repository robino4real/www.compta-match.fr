import React from "react";
import { API_BASE_URL } from "../../config/api";

type DiscountType = "PERCENT" | "AMOUNT";

interface PromoCode {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType | string;
  discountValue: number;
  isReferral?: boolean;
  sponsorName?: string | null;
  sponsorEmail?: string | null;
  sponsorPhone?: string | null;
  sponsorAddress?: string | null;
  sponsorBankName?: string | null;
  sponsorIban?: string | null;
  sponsorBic?: string | null;
  referralRate?: number | null;
  maxUses?: number | null;
  currentUses: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface PromoCodeStats {
  promoId: string;
  totalUses: number;
  totalBeforeDiscountCents: number;
  totalDiscountCents: number;
  totalRevenueCents: number;
  referralCommissionCents: number;
  groupBy: "day" | "month" | null;
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  groups: Array<{
    period: string;
    uses: number;
    totalRevenueCents: number;
    totalDiscountCents: number;
    totalBeforeDiscountCents: number;
    referralCommissionCents: number;
  }>;
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
  const [newIsReferral, setNewIsReferral] = React.useState(false);
  const [newSponsorName, setNewSponsorName] = React.useState("");
  const [newSponsorEmail, setNewSponsorEmail] = React.useState("");
  const [newSponsorPhone, setNewSponsorPhone] = React.useState("");
  const [newSponsorAddress, setNewSponsorAddress] = React.useState("");
  const [newSponsorBankName, setNewSponsorBankName] = React.useState("");
  const [newSponsorIban, setNewSponsorIban] = React.useState("");
  const [newSponsorBic, setNewSponsorBic] = React.useState("");
  const [newReferralRate, setNewReferralRate] = React.useState("");
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
  const [editIsReferral, setEditIsReferral] = React.useState(false);
  const [editSponsorName, setEditSponsorName] = React.useState("");
  const [editSponsorEmail, setEditSponsorEmail] = React.useState("");
  const [editSponsorPhone, setEditSponsorPhone] = React.useState("");
  const [editSponsorAddress, setEditSponsorAddress] = React.useState("");
  const [editSponsorBankName, setEditSponsorBankName] = React.useState("");
  const [editSponsorIban, setEditSponsorIban] = React.useState("");
  const [editSponsorBic, setEditSponsorBic] = React.useState("");
  const [editReferralRate, setEditReferralRate] = React.useState("");
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [editSuccess, setEditSuccess] = React.useState<string | null>(null);

  const [archiveError, setArchiveError] = React.useState<string | null>(null);
  const [archiveSuccess, setArchiveSuccess] = React.useState<string | null>(
    null
  );

  const [statsPromo, setStatsPromo] = React.useState<PromoCode | null>(null);
  const [statsData, setStatsData] = React.useState<PromoCodeStats | null>(null);
  const [statsError, setStatsError] = React.useState<string | null>(null);
  const [isLoadingStats, setIsLoadingStats] = React.useState(false);
  const [statsGroupBy, setStatsGroupBy] = React.useState<"month" | "day">(
    "month"
  );
  const [statsStartDate, setStatsStartDate] = React.useState("");
  const [statsEndDate, setStatsEndDate] = React.useState("");

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

      let parsedReferralRate: number | null = null;
      if (newIsReferral) {
        if (!newSponsorName.trim()) {
          throw new Error(
            "Le nom ou la dénomination du parrain est obligatoire en mode parrainage."
          );
        }

        const rate = Number(newReferralRate.replace(",", "."));
        if (!Number.isFinite(rate) || rate <= 0 || rate > 100) {
          throw new Error(
            "Le pourcentage de redevance doit être un nombre entre 0 et 100."
          );
        }
        parsedReferralRate = Math.round(rate);

        const trimmedIban = newSponsorIban.replace(/\s+/g, "");
        if (!trimmedIban || trimmedIban.length < 14) {
          throw new Error(
            "Le RIB/IBAN du parrain est obligatoire et doit être valide."
          );
        }

        const trimmedBic = newSponsorBic.replace(/\s+/g, "");
        if (!trimmedBic || trimmedBic.length < 8) {
          throw new Error(
            "Le code BIC du parrain est obligatoire et doit être valide."
          );
        }
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
        isReferral: newIsReferral,
        sponsorName: newIsReferral ? newSponsorName.trim() : null,
        sponsorEmail: newIsReferral ? newSponsorEmail.trim() || null : null,
        sponsorPhone: newIsReferral ? newSponsorPhone.trim() || null : null,
        sponsorAddress: newIsReferral ? newSponsorAddress.trim() || null : null,
        sponsorBankName: newIsReferral ? newSponsorBankName.trim() || null : null,
        sponsorIban: newIsReferral ? newSponsorIban.replace(/\s+/g, "") : null,
        sponsorBic: newIsReferral ? newSponsorBic.replace(/\s+/g, "") : null,
        referralRate: newIsReferral ? parsedReferralRate : null,
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
      setNewIsReferral(false);
      setNewSponsorName("");
      setNewSponsorEmail("");
      setNewSponsorPhone("");
      setNewSponsorAddress("");
      setNewSponsorBankName("");
      setNewSponsorIban("");
      setNewSponsorBic("");
      setNewReferralRate("");

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
    setEditIsReferral(Boolean(promo.isReferral));
    setEditSponsorName(promo.sponsorName ?? "");
    setEditSponsorEmail(promo.sponsorEmail ?? "");
    setEditSponsorPhone(promo.sponsorPhone ?? "");
    setEditSponsorAddress(promo.sponsorAddress ?? "");
    setEditSponsorBankName(promo.sponsorBankName ?? "");
    setEditSponsorIban(promo.sponsorIban ?? "");
    setEditSponsorBic(promo.sponsorBic ?? "");
    setEditReferralRate(
      typeof promo.referralRate === "number" ? promo.referralRate.toString() : ""
    );
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
    setEditIsReferral(false);
    setEditSponsorName("");
    setEditSponsorEmail("");
    setEditSponsorPhone("");
    setEditSponsorAddress("");
    setEditSponsorBankName("");
    setEditSponsorIban("");
    setEditSponsorBic("");
    setEditReferralRate("");
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

      let parsedReferralRate: number | null = null;
      if (editIsReferral) {
        if (!editSponsorName.trim()) {
          throw new Error(
            "Le nom ou la dénomination du parrain est obligatoire en mode parrainage."
          );
        }

        const rate = Number(editReferralRate.replace(",", "."));
        if (!Number.isFinite(rate) || rate <= 0 || rate > 100) {
          throw new Error(
            "Le pourcentage de redevance doit être un nombre entre 0 et 100."
          );
        }
        parsedReferralRate = Math.round(rate);

        const trimmedIban = editSponsorIban.replace(/\s+/g, "");
        if (!trimmedIban || trimmedIban.length < 14) {
          throw new Error(
            "Le RIB/IBAN du parrain est obligatoire et doit être valide."
          );
        }

        const trimmedBic = editSponsorBic.replace(/\s+/g, "");
        if (!trimmedBic || trimmedBic.length < 8) {
          throw new Error(
            "Le code BIC du parrain est obligatoire et doit être valide."
          );
        }
      }

      const payload: any = {
        description: editDescription.trim() || null,
        discountType: editDiscountType,
        discountValue: value,
        maxUses: parsedMaxUses,
        isActive: editIsActive,
        startsAt: editStartsAt.trim() || null,
        endsAt: editEndsAt.trim() || null,
        isReferral: editIsReferral,
        sponsorName: editIsReferral ? editSponsorName.trim() : null,
        sponsorEmail: editIsReferral ? editSponsorEmail.trim() || null : null,
        sponsorPhone: editIsReferral ? editSponsorPhone.trim() || null : null,
        sponsorAddress: editIsReferral ? editSponsorAddress.trim() || null : null,
        sponsorBankName: editIsReferral
          ? editSponsorBankName.trim() || null
          : null,
        sponsorIban: editIsReferral
          ? editSponsorIban.replace(/\s+/g, "")
          : null,
        sponsorBic: editIsReferral ? editSponsorBic.replace(/\s+/g, "") : null,
        referralRate: editIsReferral ? parsedReferralRate : null,
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

  const formatCurrency = (valueCents: number): string => {
    return `${(valueCents / 100).toFixed(2)} €`;
  };

  const fetchPromoStats = async (
    promo: PromoCode,
    group: "month" | "day",
    start: string,
    end: string
  ) => {
    try {
      setIsLoadingStats(true);
      setStatsError(null);

      const params = new URLSearchParams();
      params.set("groupBy", group);
      if (start.trim()) params.set("startDate", start.trim());
      if (end.trim()) params.set("endDate", end.trim());

      const response = await fetch(
        `${API_BASE_URL}/admin/promo-codes/${promo.id}/stats?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de récupérer les statistiques."
        );
      }

      setStatsData(data as PromoCodeStats);
    } catch (err: any) {
      console.error("Erreur GET /admin/promo-codes/:id/stats :", err);
      setStatsError(
        err?.message || "Impossible de charger les statistiques pour ce code."
      );
    } finally {
      setIsLoadingStats(false);
    }
  };

  const openStatsModal = (promo: PromoCode) => {
    const defaultStart = promo.startsAt ? promo.startsAt.slice(0, 10) : "";
    const defaultEnd = promo.endsAt ? promo.endsAt.slice(0, 10) : "";
    setStatsPromo(promo);
    setStatsStartDate(defaultStart);
    setStatsEndDate(defaultEnd);
    fetchPromoStats(promo, statsGroupBy, defaultStart, defaultEnd);
  };

  const closeStatsModal = () => {
    setStatsPromo(null);
    setStatsData(null);
    setStatsError(null);
    setIsLoadingStats(false);
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

          <div className="flex items-center gap-2 pt-1">
            <input
              id="new-is-referral"
              type="checkbox"
              checked={newIsReferral}
              onChange={(e) => setNewIsReferral(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
            />
            <label
              htmlFor="new-is-referral"
              className="text-xs font-semibold text-slate-700"
            >
              Code de parrainage
            </label>
          </div>

          {newIsReferral && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nom ou dénomination du parrain
                </label>
                <input
                  type="text"
                  value={newSponsorName}
                  onChange={(e) => setNewSponsorName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Entreprise partenaire"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Pourcentage de redevance
                </label>
                <input
                  type="text"
                  value={newReferralRate}
                  onChange={(e) => setNewReferralRate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="10 (pour 10%)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Contact email
                </label>
                <input
                  type="email"
                  value={newSponsorEmail}
                  onChange={(e) => setNewSponsorEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="contact@parrain.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Téléphone
                </label>
                <input
                  type="text"
                  value={newSponsorPhone}
                  onChange={(e) => setNewSponsorPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="06 01 02 03 04"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Adresse
                </label>
                <input
                  type="text"
                  value={newSponsorAddress}
                  onChange={(e) => setNewSponsorAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="12 rue du Parrain, 75000 Paris"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Banque (optionnel)
                </label>
                <input
                  type="text"
                  value={newSponsorBankName}
                  onChange={(e) => setNewSponsorBankName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Nom de la banque"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  IBAN (RIB)
                </label>
                <input
                  type="text"
                  value={newSponsorIban}
                  onChange={(e) => setNewSponsorIban(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="FR76 3000 6000 ..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  BIC
                </label>
                <input
                  type="text"
                  value={newSponsorBic}
                  onChange={(e) => setNewSponsorBic(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="AGRIFRPP"
                />
              </div>
            </div>
          )}

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
              <thead className="bg-white">
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
                      className="odd:bg-white even:bg-white"
                    >
                      <td className="px-3 py-2 align-top text-slate-800">
                        <div className="space-y-1">
                          <span className="font-semibold">{promo.code}</span>
                          {promo.description && (
                            <p className="text-[11px] text-slate-600">
                              {promo.description}
                            </p>
                          )}
                          {promo.isReferral && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                              Parrainage
                            </span>
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
                          <button
                            type="button"
                            onClick={() => openStatsModal(promo)}
                            className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black transition"
                          >
                            Statistiques
                          </button>
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

            <div className="flex items-center gap-2 pt-1">
              <input
                id="edit-is-referral"
                type="checkbox"
                checked={editIsReferral}
                onChange={(e) => setEditIsReferral(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
              />
              <label
                htmlFor="edit-is-referral"
                className="text-xs font-semibold text-slate-700"
              >
                Code de parrainage
              </label>
            </div>

            {editIsReferral && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Nom ou dénomination du parrain
                  </label>
                  <input
                    type="text"
                    value={editSponsorName}
                    onChange={(e) => setEditSponsorName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Entreprise partenaire"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Pourcentage de redevance
                  </label>
                  <input
                    type="text"
                    value={editReferralRate}
                    onChange={(e) => setEditReferralRate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="10 (pour 10%)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Contact email
                  </label>
                  <input
                    type="email"
                    value={editSponsorEmail}
                    onChange={(e) => setEditSponsorEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="contact@parrain.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={editSponsorPhone}
                    onChange={(e) => setEditSponsorPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="06 01 02 03 04"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={editSponsorAddress}
                    onChange={(e) => setEditSponsorAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="12 rue du Parrain, 75000 Paris"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Banque (optionnel)
                  </label>
                  <input
                    type="text"
                    value={editSponsorBankName}
                    onChange={(e) => setEditSponsorBankName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Nom de la banque"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    IBAN (RIB)
                  </label>
                  <input
                    type="text"
                    value={editSponsorIban}
                    onChange={(e) => setEditSponsorIban(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="FR76 3000 6000 ..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    BIC
                  </label>
                  <input
                    type="text"
                    value={editSponsorBic}
                    onChange={(e) => setEditSponsorBic(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="AGRIFRPP"
                  />
                </div>
              </div>
            )}

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

      {statsPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                  Statistiques
                </p>
                <h3 className="text-lg font-semibold text-black">
                  Code {statsPromo.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeStatsModal}
                className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black transition"
              >
                Fermer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-[11px] text-slate-600">Utilisations</p>
                <p className="text-lg font-semibold text-black">
                  {statsData?.totalUses ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-[11px] text-slate-600">Chiffre réalisé</p>
                <p className="text-lg font-semibold text-black">
                  {formatCurrency(statsData?.totalRevenueCents ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-[11px] text-slate-600">Chiffre perdu</p>
                <p className="text-lg font-semibold text-black">
                  {formatCurrency(statsData?.totalDiscountCents ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-[11px] text-slate-600">Tarif normal</p>
                <p className="text-lg font-semibold text-black">
                  {formatCurrency(statsData?.totalBeforeDiscountCents ?? 0)}
                </p>
              </div>
            </div>

            {statsPromo.isReferral && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-3 bg-blue-50">
                  <p className="text-[11px] text-blue-700 font-semibold">
                    Redevance ({statsPromo.referralRate ?? 0}%)
                  </p>
                  <p className="text-lg font-semibold text-blue-900">
                    {formatCurrency(statsData?.referralCommissionCents ?? 0)}
                  </p>
                  {statsPromo.sponsorName && (
                    <p className="text-[11px] text-blue-800 mt-1">
                      Parrain : {statsPromo.sponsorName}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 p-3 bg-blue-50">
                  <p className="text-[11px] text-blue-700 font-semibold">
                    Coordonnées parrain
                  </p>
                  <div className="text-[11px] text-blue-900 space-y-1">
                    {statsPromo.sponsorEmail && <p>{statsPromo.sponsorEmail}</p>}
                    {statsPromo.sponsorPhone && <p>{statsPromo.sponsorPhone}</p>}
                    {statsPromo.sponsorAddress && <p>{statsPromo.sponsorAddress}</p>}
                    {statsPromo.sponsorBankName && (
                      <p>Banque : {statsPromo.sponsorBankName}</p>
                    )}
                    {statsPromo.sponsorIban && (
                      <p>IBAN : {statsPromo.sponsorIban}</p>
                    )}
                    {statsPromo.sponsorBic && <p>BIC : {statsPromo.sponsorBic}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">
                  Date de début
                </label>
                <input
                  type="date"
                  value={statsStartDate}
                  onChange={(e) => setStatsStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={statsEndDate}
                  onChange={(e) => setStatsEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Regroupement
                </label>
                <select
                  value={statsGroupBy}
                  onChange={(e) =>
                    setStatsGroupBy(e.target.value === "day" ? "day" : "month")
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="month">Par mois</option>
                  <option value="day">Par jour</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  statsPromo &&
                  fetchPromoStats(statsPromo, statsGroupBy, statsStartDate, statsEndDate)
                }
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
                disabled={isLoadingStats}
              >
                {isLoadingStats ? "Chargement..." : "Actualiser"}
              </button>
            </div>

            {statsError && <p className="text-xs text-red-600">{statsError}</p>}

            {!isLoadingStats && statsData?.groups?.length === 0 && (
              <p className="text-xs text-slate-600">
                Pas encore de données pour cette période.
              </p>
            )}

            {isLoadingStats && (
              <p className="text-xs text-slate-600">Chargement des données...</p>
            )}

            {!isLoadingStats && statsData?.groups && statsData.groups.length > 0 && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Période</th>
                      <th className="px-3 py-2 text-left font-semibold">Utilisations</th>
                      <th className="px-3 py-2 text-left font-semibold">Tarif normal</th>
                      <th className="px-3 py-2 text-left font-semibold">Promotion</th>
                      <th className="px-3 py-2 text-left font-semibold">Chiffre réalisé</th>
                      {statsPromo.isReferral && (
                        <th className="px-3 py-2 text-left font-semibold">Redevance</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {statsData.groups.map((group) => (
                      <tr key={group.period} className="odd:bg-white even:bg-slate-50">
                        <td className="px-3 py-2 text-slate-800 font-semibold">
                          {group.period}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{group.uses}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {formatCurrency(group.totalBeforeDiscountCents)}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {formatCurrency(group.totalDiscountCents)}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {formatCurrency(group.totalRevenueCents)}
                        </td>
                        {statsPromo.isReferral && (
                          <td className="px-3 py-2 text-slate-700">
                            {formatCurrency(group.referralCommissionCents)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
  );
};

export default AdminPromoCodesPage;
