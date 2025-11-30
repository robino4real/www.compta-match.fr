import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { useClientAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { trackEvent } from "../lib/analytics";

type BillingForm = {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  vatNumber?: string;
};

type BillingErrors = Partial<Record<keyof BillingForm, string>>;

const countries = [
  "France",
  "Belgique",
  "Suisse",
  "Luxembourg",
  "Canada",
  "Autre",
];

const CheckoutSummaryPage: React.FC = () => {
  const { user, isLoading } = useClientAuth();
  const { items, totalCents } = useCart();
  const navigate = useNavigate();

  const hasItems = items.length > 0;
  const [billing, setBilling] = React.useState<BillingForm>({
    firstName: "",
    lastName: "",
    company: "",
    address1: "",
    address2: "",
    postalCode: "",
    city: "",
    country: "France",
    email: "",
    vatNumber: "",
  });
  const [billingErrors, setBillingErrors] = React.useState<BillingErrors>({});
  const [promoCode, setPromoCode] = React.useState("");
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = React.useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = React.useState<
    { code: string; discountCents: number } | null
  >(null);
  const [promoStatus, setPromoStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [showModal, setShowModal] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [acceptedLicense, setAcceptedLicense] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  const discountCents = appliedPromo?.discountCents ?? 0;
  const totalAfterDiscountCents = Math.max(totalCents - discountCents, 0);
  const totalEuros = totalAfterDiscountCents / 100;

  React.useEffect(() => {
    if (!hasItems) {
      navigate("/panier");
    }
  }, [hasItems, navigate]);

  React.useEffect(() => {
    if (user) {
      setBilling((prev) => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  React.useEffect(() => {
    if (!hasItems) {
      setAppliedPromo(null);
      setPromoCode("");
      setPromoStatus("idle");
      setPromoSuccess(null);
      setPromoError(null);
    }
  }, [hasItems]);

  const validateBilling = (data: BillingForm): BillingErrors => {
    const errors: BillingErrors = {};

    if (!data.firstName.trim()) errors.firstName = "Prénom requis";
    if (!data.lastName.trim()) errors.lastName = "Nom requis";
    if (!data.address1.trim()) errors.address1 = "Adresse requise";
    if (!data.postalCode.trim()) errors.postalCode = "Code postal requis";
    if (!data.city.trim()) errors.city = "Ville requise";
    if (!data.country.trim()) errors.country = "Pays requis";
    if (!data.email.trim()) {
      errors.email = "Email requis";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.email = "Format d'email invalide";
      }
    }

    return errors;
  };

  const handleBillingChange = (
    field: keyof BillingForm,
    value: string
  ) => {
    setBilling((prev) => ({ ...prev, [field]: value }));
    setBillingErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !hasItems) {
      setPromoError("Ajoutez un code promo et des produits avant de continuer.");
      return;
    }

    try {
      setPromoStatus("loading");
      setPromoError(null);
      setPromoSuccess(null);

      const response = await fetch(`${API_BASE_URL}/cart/apply-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: promoCode.trim(),
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        setPromoStatus("error");
        setAppliedPromo(null);
        setPromoError(
          data.message ||
            "Impossible d'appliquer ce code. Vérifiez sa validité puis réessayez."
        );
        return;
      }

      setAppliedPromo({
        code: data.code,
        discountCents: data.discountAmount,
      });
      setPromoStatus("success");
      setPromoSuccess(data.message || "Réduction appliquée.");
    } catch (error) {
      console.error("Erreur lors de l'application du code promo", error);
      setPromoStatus("error");
      setPromoError(
        "Une erreur est survenue lors de la validation du code promo."
      );
    }
  };

  const handleRemovePromo = async () => {
    try {
      setPromoStatus("loading");

      const response = await fetch(`${API_BASE_URL}/cart/remove-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      await response.json().catch(() => ({}));

      setAppliedPromo(null);
      setPromoStatus("idle");
      setPromoCode("");
      setPromoError(null);
      setPromoSuccess("Code promo retiré.");
    } catch (error) {
      console.error("Erreur lors du retrait du code promo", error);
      setPromoStatus("error");
      setPromoError("Impossible de retirer le code promo pour le moment.");
    }
  };

  const handleProceedToPayment = () => {
    const errors = validateBilling(billing);
    setBillingErrors(errors);
    setModalError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setShowModal(true);
  };

  const handlePayNow = async () => {
    const errors = validateBilling(billing);
    setBillingErrors(errors);

    if (!hasItems) {
      setModalError("Votre panier est vide.");
      return;
    }

    if (Object.keys(errors).length > 0) {
      setModalError("Merci de corriger les informations de facturation.");
      setShowModal(false);
      return;
    }

    if (!acceptedTerms || !acceptedLicense) {
      setModalError(
        "Vous devez accepter les conditions d'utilisation et le contrat de licence."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);

      trackEvent({
        type: "CHECKOUT_STARTED",
        meta: {
          cartValue: totalCents,
          productIds: items.map((it) => it.id),
        },
      });

      const payload = {
        items: items.map((it) => ({
          productId: it.id,
          quantity: it.quantity ?? 1,
        })),
        promoCode: appliedPromo?.code || (promoCode.trim() || undefined),
        billing: {
          ...billing,
          country: billing.country || "France",
        },
        acceptedTerms: true,
        acceptedLicense: true,
      };

      const response = await fetch(
        `${API_BASE_URL}/payments/downloads/checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        setModalError(
          data.message ||
            "Impossible de créer la session de paiement. Merci de réessayer."
        );
        return;
      }

      window.location.href = data.url as string;
    } catch (error) {
      console.error("Erreur lors de la création de la session de paiement :", error);
      setModalError(
        "Une erreur est survenue lors de la création de la session de paiement."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-xs text-slate-600">
        Vérification de votre session en cours...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <h1 className="text-xl font-semibold text-black">
            Récapitulatif de commande
          </h1>
          <p className="text-xs text-slate-600">
            Vous devez être connecté pour finaliser votre commande et accéder aux liens de téléchargement.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <p className="text-xs text-slate-600">
            Connectez-vous ou créez un compte pour poursuivre.
          </p>
          <button
            type="button"
            onClick={() => navigate("/auth/login")}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
          >
            Se connecter / Créer un compte
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
          Étape 2 / 3
        </p>
        <h1 className="text-xl font-semibold text-black">Récapitulatif de commande</h1>
        <p className="text-xs text-slate-600">
          Validez votre adresse de facturation, appliquez votre code promo et acceptez les conditions avant le paiement Stripe.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-black">Adresse de facturation</h2>
              <p className="text-[11px] text-slate-500">Ces informations seront utilisées pour la facture.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
              Obligatoire
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-slate-700 space-y-1">
              Prénom*
              <input
                type="text"
                value={billing.firstName}
                onChange={(e) => handleBillingChange("firstName", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
              />
              {billingErrors.firstName && (
                <span className="text-[11px] text-red-600">{billingErrors.firstName}</span>
              )}
            </label>
            <label className="text-xs text-slate-700 space-y-1">
              Nom*
              <input
                type="text"
                value={billing.lastName}
                onChange={(e) => handleBillingChange("lastName", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
              />
              {billingErrors.lastName && (
                <span className="text-[11px] text-red-600">{billingErrors.lastName}</span>
              )}
            </label>
          </div>

          <label className="text-xs text-slate-700 space-y-1">
            Nom de l'entreprise (optionnel)
            <input
              type="text"
              value={billing.company}
              onChange={(e) => handleBillingChange("company", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-slate-700 space-y-1">
              Adresse*
              <input
                type="text"
                value={billing.address1}
                onChange={(e) => handleBillingChange("address1", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
              />
              {billingErrors.address1 && (
                <span className="text-[11px] text-red-600">{billingErrors.address1}</span>
              )}
            </label>
            <label className="text-xs text-slate-700 space-y-1">
              Complément d'adresse
              <input
                type="text"
                value={billing.address2}
                onChange={(e) => handleBillingChange("address2", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs text-slate-700 space-y-1">
              Code postal*
              <input
                type="text"
                value={billing.postalCode}
                onChange={(e) => handleBillingChange("postalCode", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
              />
              {billingErrors.postalCode && (
                <span className="text-[11px] text-red-600">{billingErrors.postalCode}</span>
              )}
            </label>
            <label className="text-xs text-slate-700 space-y-1 md:col-span-2">
              Ville*
              <input
                type="text"
                value={billing.city}
                onChange={(e) => handleBillingChange("city", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
              />
              {billingErrors.city && (
                <span className="text-[11px] text-red-600">{billingErrors.city}</span>
              )}
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-slate-700 space-y-1">
              Pays*
              <select
                value={billing.country}
                onChange={(e) => handleBillingChange("country", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {billingErrors.country && (
                <span className="text-[11px] text-red-600">{billingErrors.country}</span>
              )}
            </label>
            <label className="text-xs text-slate-700 space-y-1">
              Email de facturation*
              <input
                type="email"
                value={billing.email}
                onChange={(e) => handleBillingChange("email", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
              />
              {billingErrors.email && (
                <span className="text-[11px] text-red-600">{billingErrors.email}</span>
              )}
            </label>
          </div>

          <label className="text-xs text-slate-700 space-y-1">
            Numéro de TVA (optionnel)
            <input
              type="text"
              value={billing.vatNumber}
              onChange={(e) => handleBillingChange("vatNumber", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-black">Récapitulatif commande</h2>
              <span className="text-[11px] text-slate-500">{items.length} article(s)</span>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {items.map((item) => {
                const priceEuros = item.priceCents / 100;
                return (
                  <div key={item.id} className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-black">{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.quantity ?? 1} x Logiciel téléchargeable
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-black">
                      {(priceEuros * (item.quantity ?? 1)).toFixed(2)} €
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={promoStatus === "loading" || !!appliedPromo}
                  placeholder="Code promo"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black disabled:bg-slate-100"
                />
                {appliedPromo ? (
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    disabled={promoStatus === "loading"}
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Retirer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoStatus === "loading" || !promoCode.trim()}
                    className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {promoStatus === "loading" ? "Validation..." : "Appliquer"}
                  </button>
                )}
              </div>
              {appliedPromo && (
                <p className="text-[11px] text-green-700">Code appliqué : {appliedPromo.code}</p>
              )}
              {promoSuccess && !appliedPromo && (
                <p className="text-[11px] text-green-700">{promoSuccess}</p>
              )}
              {promoError && <p className="text-[11px] text-red-600">{promoError}</p>}
            </div>

            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{(totalCents / 100).toFixed(2)} €</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-green-700">
                  <span>Code promo ({appliedPromo.code})</span>
                  <span>-{(discountCents / 100).toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-black">
                <span>Total TTC</span>
                <span>{totalEuros.toFixed(2)} €</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={!hasItems}
              className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Procéder au paiement
            </button>
            <p className="text-[11px] text-slate-500">
              Le paiement Stripe sera proposé après validation des conditions d'utilisation et du contrat de licence.
            </p>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-black">
                Conditions avant paiement
              </h3>
              <p className="text-xs text-slate-600">
                Merci de confirmer avoir lu et accepté nos conditions avant de poursuivre vers Stripe.
              </p>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-400"
                />
                <span>
                  J'accepte les <a className="text-black underline" href="/cgv">conditions d'utilisation</a>.
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={acceptedLicense}
                  onChange={(e) => setAcceptedLicense(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-400"
                />
                <span>
                  Je reconnais avoir lu et compris le <a className="text-black underline" href="/cgv">contrat de licence utilisateur</a>.
                </span>
              </label>
            </div>

            {modalError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
                {modalError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-black hover:text-black"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handlePayNow}
                disabled={!acceptedTerms || !acceptedLicense || isSubmitting}
                className="rounded-full bg-black px-5 py-2 text-xs font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Création de la session..." : "Payer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutSummaryPage;
