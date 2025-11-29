import React from "react";
import { API_BASE_URL } from "../config/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { trackEvent } from "../lib/analytics";

const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const { items, totalCents } = useCart();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasItems = items.length > 0;
  const totalEuros = totalCents / 100;

  const handleStartStripeCheckout = async () => {
    if (!user || !hasItems) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        items: items.map((it) => ({
          productId: it.id,
          quantity: it.quantity ?? 1,
        })),
      };

      trackEvent({
        type: "CHECKOUT_STARTED",
        meta: {
          cartValue: totalCents,
          productIds: items.map((it) => it.id),
        },
      });

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
        throw new Error(
          data.message ||
            "Impossible de créer la session de paiement Stripe."
        );
      }

      // Redirection vers la page de paiement Stripe
      window.location.href = data.url as string;
    } catch (err: any) {
      console.error("Erreur lors de la création de la session Stripe :", err);
      setError(
        err?.message ||
          "Une erreur est survenue lors de la préparation du paiement."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <h1 className="text-xl font-semibold text-black">
            Paiement des logiciels téléchargeables
          </h1>
          <p className="text-xs text-slate-600">
            Vous devez être connecté pour finaliser votre commande et accéder ensuite aux liens de téléchargement dans votre espace client.
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

  if (!hasItems) {
    return (
      <div className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <h1 className="text-xl font-semibold text-black">
            Paiement des logiciels téléchargeables
          </h1>
          <p className="text-xs text-slate-600">
            Votre panier est actuellement vide. Ajoutez des logiciels téléchargeables avant de passer au paiement.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <button
            type="button"
            onClick={() => navigate("/telechargements")}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
          >
            Voir les logiciels téléchargeables
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <h1 className="text-xl font-semibold text-black">
          Paiement des logiciels téléchargeables
        </h1>
        <p className="text-xs text-slate-600">
          Vérifiez le contenu de votre commande puis lancez le paiement sécurisé avec Stripe. Une fois le paiement validé, vous serez redirigé vers le site.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        {error && (
          <p className="text-[11px] text-red-600">
            {error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Produit
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Type
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Prix
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const priceEuros = item.priceCents / 100;
                return (
                  <tr
                    key={item.id}
                    className="odd:bg-white even:bg-slate-50"
                  >
                    <td className="px-3 py-2 align-top text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-700">
                      Logiciel téléchargeable
                    </td>
                    <td className="px-3 py-2 align-top text-slate-700">
                      {priceEuros.toFixed(2)} €
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-end gap-3 pt-3 border-t border-slate-200">
          <p className="text-sm font-semibold text-black">
            Total : {totalEuros.toFixed(2)} € TTC
          </p>
          <button
            type="button"
            onClick={handleStartStripeCheckout}
            disabled={isSubmitting}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Création de la session de paiement..."
              : "Payer avec Stripe"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default CheckoutPage;
