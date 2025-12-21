import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import useCartProducts from "../hooks/useCartProducts";
import { formatPrice } from "../lib/formatPrice";
import { applyPromoCode, removePromoCode } from "../services/cartApi";
import { createDownloadCheckoutSession } from "../services/paymentsApi";

interface BillingFormState {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  vatNumber: string;
}

interface AppliedPromoState {
  code: string;
  discountCents: number;
  newTotalCents: number;
  message?: string;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, removeItem, clearCart } = useCart();
  const {
    enrichedItems,
    baseTotalCents,
    loading,
    missingProductIds,
    error,
    refresh,
  } = useCartProducts(items);

  const cartSignature = React.useMemo(
    () =>
      enrichedItems
        .map((item) => `${item.id}:${item.quantity}`)
        .sort()
        .join("|"),
    [enrichedItems]
  );

  const [billing, setBilling] = React.useState<BillingFormState>({
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
  const [promoCode, setPromoCode] = React.useState("");
  const [promoLoading, setPromoLoading] = React.useState(false);
  const [promoFeedback, setPromoFeedback] = React.useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = React.useState<AppliedPromoState | null>(
    null
  );
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [acceptedLicense, setAcceptedLicense] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!items.length) {
      navigate("/panier");
    }
  }, [items, navigate]);

  React.useEffect(() => {
    setBilling((prev) => ({
      ...prev,
      firstName: prev.firstName || user?.firstName || "",
      lastName: prev.lastName || user?.lastName || "",
      email: prev.email || user?.email || "",
      company: prev.company || user?.profile?.companyName || "",
      address1: prev.address1 || user?.profile?.billingStreet || "",
      postalCode: prev.postalCode || user?.profile?.billingZip || "",
      city: prev.city || user?.profile?.billingCity || "",
      country: prev.country || user?.profile?.billingCountry || "France",
      vatNumber: prev.vatNumber || user?.profile?.vatNumber || "",
    }));
  }, [user]);

  React.useEffect(() => {
    if (!appliedPromo) return;
    setAppliedPromo(null);
    setPromoCode("");
    setPromoFeedback(null);
  }, [cartSignature]);

  const discountCents = appliedPromo?.discountCents || 0;
  const payableCents = appliedPromo?.newTotalCents || baseTotalCents;

  const platformLabel = (platform?: string | null) =>
    platform === "MACOS" ? "MacOS" : platform === "WINDOWS" ? "Windows" : null;

  const handleBillingChange = (
    field: keyof BillingFormState,
    value: string
  ) => {
    setBilling((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoFeedback("Merci d’indiquer un code avant de l’appliquer.");
      return;
    }

    if (!enrichedItems.length) {
      setPromoFeedback("Votre panier est vide ou invalide.");
      return;
    }

    setPromoLoading(true);
    setPromoFeedback(null);

    try {
      const data = await applyPromoCode(promoCode, enrichedItems);
      setAppliedPromo({
        code: data.code,
        discountCents: data.discountAmount,
        newTotalCents: data.newTotal,
        message: data.message,
      });
      setPromoFeedback(data?.message || "Réduction appliquée avec succès.");
    } catch (err) {
      console.error("Erreur lors de l'application du code promo", err);
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de vérifier ce code pour le moment.";
      setPromoFeedback(message);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = async () => {
    if (!enrichedItems.length) {
      setPromoFeedback("Votre panier est vide ou invalide.");
      return;
    }

    setPromoLoading(true);
    setPromoFeedback(null);

    try {
      const data = await removePromoCode(enrichedItems);
      setAppliedPromo(null);
      setPromoCode("");
      setPromoFeedback(data?.message || "Code promo retiré.");
    } catch (err) {
      console.error("Erreur lors du retrait du code promo", err);
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de retirer le code promo pour le moment.";
      setPromoFeedback(message);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!enrichedItems.length) {
      navigate("/panier");
      return;
    }

    if (missingProductIds.length > 0) {
      setSubmitError(
        "Certains produits ne sont plus disponibles. Merci de mettre à jour votre panier."
      );
      return;
    }

    if (!acceptedTerms || !acceptedLicense) {
      setSubmitError(
        "Merci de confirmer les conditions d'utilisation et de licence pour continuer."
      );
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const data = await createDownloadCheckoutSession({
        items: enrichedItems,
        promoCode: appliedPromo?.code || undefined,
        billing,
        acceptedTerms,
        acceptedLicense,
      });

      if (!data?.url) {
        setSubmitError(
          data?.message || "Impossible de créer la session de paiement Stripe."
        );
        return;
      }

      window.location.href = data.url as string;
    } catch (err) {
      console.error("Erreur lors de la création de la session de paiement", err);
      const message =
        (err as any)?.status === 401
          ? "Connectez-vous à votre compte pour poursuivre le paiement."
          : "Une erreur est survenue lors de la préparation du paiement. Merci de réessayer.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-white min-h-screen py-10">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Étape 2
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900 md:text-4xl">
              Coordonnées de facturation
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Ajoutez vos informations, un code promo éventuel puis confirmez les conditions pour procéder au paiement sécurisé.
            </p>
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="self-start rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-black hover:text-black"
          >
            Vider le panier
          </button>
        </header>

        <form
          className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
          onSubmit={handleSubmit}
        >
          <div className="space-y-6">
            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
                <button
                  type="button"
                  onClick={refresh}
                  className="ml-3 inline-flex items-center text-xs font-semibold underline decoration-red-200 underline-offset-4 hover:text-red-800"
                >
                  Réessayer
                </button>
              </div>
            )}

            {missingProductIds.length > 0 && (
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                Certains produits ne sont plus disponibles. Merci de mettre à jour votre panier avant de payer.
              </div>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Informations de facturation</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Prénom</span>
                  <input
                    type="text"
                    required
                    value={billing.firstName}
                    onChange={(e) => handleBillingChange("firstName", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Nom</span>
                  <input
                    type="text"
                    required
                    value={billing.lastName}
                    onChange={(e) => handleBillingChange("lastName", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Société (optionnel)</span>
                  <input
                    type="text"
                    value={billing.company}
                    onChange={(e) => handleBillingChange("company", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Adresse email de facturation</span>
                  <input
                    type="email"
                    required
                    value={billing.email}
                    onChange={(e) => handleBillingChange("email", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                  <span>Adresse de facturation</span>
                  <input
                    type="text"
                    required
                    value={billing.address1}
                    onChange={(e) => handleBillingChange("address1", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                  <span>Complément d'adresse (optionnel)</span>
                  <input
                    type="text"
                    value={billing.address2}
                    onChange={(e) => handleBillingChange("address2", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Code postal</span>
                  <input
                    type="text"
                    required
                    value={billing.postalCode}
                    onChange={(e) => handleBillingChange("postalCode", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Ville</span>
                  <input
                    type="text"
                    required
                    value={billing.city}
                    onChange={(e) => handleBillingChange("city", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Pays</span>
                  <input
                    type="text"
                    required
                    value={billing.country}
                    onChange={(e) => handleBillingChange("country", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Numéro de TVA (optionnel)</span>
                  <input
                    type="text"
                    value={billing.vatNumber}
                    onChange={(e) => handleBillingChange("vatNumber", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Code promo</h2>
                  <p className="text-xs text-slate-600">Appliquez une réduction avant de payer.</p>
                </div>
                {appliedPromo && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    {appliedPromo.code}
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="PROMO2024"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm focus:border-slate-900 focus:outline-none sm:flex-1"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="inline-flex items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Appliquer
                  </button>
                  {appliedPromo && (
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      disabled={promoLoading}
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
              {promoFeedback && (
                <p className="mt-2 text-xs font-semibold text-slate-700">{promoFeedback}</p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Récapitulatif de la commande</h2>
              <div className="mt-4 space-y-4">
                {enrichedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.product?.name || item.name}
                      </p>
                      <p className="text-xs text-slate-600">
                        {item.product?.shortDescription || "Logiciel téléchargeable"}
                      </p>
                      {platformLabel(item.platform) && (
                        <p className="text-[11px] text-slate-500">
                          Version {platformLabel(item.platform)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                      <span>{formatPrice(item.unitPriceCents / 100)}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-xs font-semibold text-red-600 underline decoration-red-200 underline-offset-4 transition hover:text-red-700"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="accept-license"
                  checked={acceptedLicense}
                  onChange={(e) => setAcceptedLicense(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
                  required
                />
                <label htmlFor="accept-license" className="text-sm text-slate-700">
                  J’ai lu et j’accepte le contrat de licence d’utilisation du logiciel.
                </label>
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
                  required
                />
                <label htmlFor="accept-terms" className="text-sm text-slate-700">
                  Je confirme avoir pris connaissance des conditions générales d’utilisation.
                </label>
              </div>
            </section>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Total TTC</h2>
              {loading && (
                <span className="text-xs font-semibold text-slate-500">
                  Mise à jour...
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm">
              <div className="flex items-center justify-between text-slate-700">
                <span>Sous-total</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(baseTotalCents / 100)}
                </span>
              </div>
              {appliedPromo && (
                <div className="flex items-center justify-between text-green-700">
                  <span>Code {appliedPromo.code}</span>
                  <span className="font-semibold">- {formatPrice(discountCents / 100)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl bg-white px-4 py-3">
              <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                <span>Montant à payer</span>
                <span>{formatPrice(payableCents / 100)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Paiement sécurisé via Stripe. Les logiciels restent accessibles dans votre espace client après paiement.
              </p>
            </div>

            {submitError && (
              <p className="mt-3 text-sm font-semibold text-red-700">{submitError}</p>
            )}

            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={
                  submitting ||
                  !acceptedTerms ||
                  !acceptedLicense ||
                  !!missingProductIds.length ||
                  !enrichedItems.length
                }
                className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? "Création de la session..." : "Procéder au paiement"}
              </button>
              <Link
                to="/panier"
                className="flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-black hover:text-black"
              >
                Retour au panier
              </Link>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
};

export default CheckoutPage;
