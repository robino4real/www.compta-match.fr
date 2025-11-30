import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const CartPage: React.FC = () => {
  const { items, totalCents, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const hasItems = items.length > 0;
  const totalEuros = totalCents / 100;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
              Étape 1 / 3
            </p>
            <h1 className="text-xl font-semibold text-black">Panier</h1>
            <p className="text-xs text-slate-600">
              Vérifiez les logiciels ajoutés avant de passer au récapitulatif et au paiement.
            </p>
          </div>
          {hasItems && (
            <button
              type="button"
              onClick={clearCart}
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
            >
              Vider le panier
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          {!hasItems ? (
            <p className="text-xs text-slate-500">Votre panier est vide pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const priceEuros = item.priceCents / 100;
                const lineTotal = priceEuros * (item.quantity ?? 1);

                return (
                  <div
                    key={item.id}
                    className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[120px_1fr]"
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <span className="text-xs font-semibold">
                        Image
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                            Logiciel téléchargeable
                          </p>
                          <h2 className="text-base font-semibold text-black">{item.name}</h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-red-600"
                        >
                          Supprimer
                        </button>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                          <p className="text-[11px] text-slate-500">Prix unitaire</p>
                          <p className="font-semibold text-black">{priceEuros.toFixed(2)} €</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                          <p className="text-[11px] text-slate-500">Quantité</p>
                          <p className="font-semibold text-black">{item.quantity ?? 1}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                          <p className="text-[11px] text-slate-500">Total</p>
                          <p className="font-semibold text-black">{lineTotal.toFixed(2)} €</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-black">Résumé du panier</h3>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{(totalCents / 100).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-semibold text-black">
              <span>Total TTC</span>
              <span>{totalEuros.toFixed(2)} €</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/checkout/summary")}
            disabled={!hasItems}
            className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            Valider le panier
          </button>
          <p className="text-[11px] text-slate-500">
            Étape suivante : récapitulatif de commande (adresse de facturation, code promo, validation des conditions).
          </p>
        </div>
      </section>
    </div>
  );
};

export default CartPage;
