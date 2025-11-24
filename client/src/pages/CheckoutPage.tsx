import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const { items, totalCents, clearCart } = useCart();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const hasItems = items.length > 0;
  const totalEuros = totalCents / 100;

  const handleConfirmPayment = async () => {
    if (!hasItems || !user) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        items: items.map((it) => ({
          productId: it.id,
          quantity: it.quantity ?? 1,
        })),
      };

      const response = await fetch(`${API_BASE_URL}/orders/downloads`, {
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
          data.message ||
            "Impossible de créer la commande de logiciels téléchargeables."
        );
      }

      clearCart();
      setSuccess(
        "Commande créée. Les liens de téléchargement seront affichés dans votre espace client plus tard."
      );

      window.setTimeout(() => {
        navigate("/mon-compte");
      }, 1200);
    } catch (err: any) {
      console.error("Erreur lors de la création de la commande :", err);
      setError(
        err?.message ||
          "Une erreur est survenue lors de la création de la commande."
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
          Vérifiez le contenu de votre commande avant de finaliser le paiement.
          Cette étape crée une commande dans le système ; la mise en place
          d&apos;un vrai paiement et des liens de téléchargement viendra plus tard.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        {error && <p className="text-[11px] text-red-600">{error}</p>}
        {success && <p className="text-[11px] text-emerald-600">{success}</p>}

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
                  <tr key={item.id} className="odd:bg-white even:bg-slate-50">
                    <td className="px-3 py-2 align-top text-slate-800">{item.name}</td>
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
            onClick={handleConfirmPayment}
            disabled={isSubmitting}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Création de la commande..."
              : "Confirmer le paiement (simulé)"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default CheckoutPage;
