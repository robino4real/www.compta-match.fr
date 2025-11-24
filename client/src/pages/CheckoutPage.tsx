import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const { items, totalCents, clearCart } = useCart();
  const navigate = useNavigate();

  const hasItems = items.length > 0;
  const totalEuros = totalCents / 100;

  const handleSimulatePayment = () => {
    if (!hasItems) return;

    alert(
      "Paiement simulé. Plus tard, cette étape créera une commande et activera les liens de téléchargement dans votre espace client."
    );
    clearCart();
    navigate("/mon-compte");
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
          Vérifiez le contenu de votre commande avant de finaliser le paiement. Le paiement est pour l'instant simulé ; la création réelle de la commande et l'activation des liens de téléchargement seront ajoutées ultérieurement.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
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
            onClick={handleSimulatePayment}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
          >
            Simuler le paiement
          </button>
        </div>
      </section>
    </div>
  );
};

export default CheckoutPage;
