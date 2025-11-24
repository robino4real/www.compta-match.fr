import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalCents, removeItem, clearCart } = useCart();

  const hasItems = items.length > 0;
  const totalEuros = totalCents / 100;

  const handleCheckout = () => {
    if (!hasItems) {
      return;
    }
    navigate("/paiement");
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <h1 className="text-xl font-semibold text-black">Panier</h1>
        <p className="text-xs text-slate-600">
          Retrouvez ici les logiciels téléchargeables ajoutés à votre panier.
          Le paiement et le lien de téléchargement seront mis en place
          ultérieurement.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        {!hasItems && (
          <p className="text-xs text-slate-500">
            Votre panier est vide pour le moment.
          </p>
        )}

        {hasItems && (
          <>
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
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">
                      Actions
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
                        <td className="px-3 py-2 align-top text-slate-700">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded-full border border-slate-300 px-3 py-1 text-[11px] text-slate-700 hover:border-black hover:text-black transition"
                          >
                            Supprimer
                          </button>
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
                >
                  Vider le panier
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
                >
                  Procéder au paiement
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default CartPage;
