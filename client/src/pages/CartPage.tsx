import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import useCartProducts from "../hooks/useCartProducts";
import { formatPrice } from "../lib/formatPrice";

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem, clearCart } = useCart();
  const { enrichedItems, loading, error, baseTotalCents, missingProductIds } =
    useCartProducts(items);

  const hasItems = enrichedItems.length > 0;

  const platformLabel = (platform?: string | null) =>
    platform === "MACOS" ? "MacOS" : platform === "WINDOWS" ? "Windows" : null;

  const handleProceed = () => {
    navigate("/commande");
  };

  return (
    <main className="bg-white min-h-screen py-10">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Votre sélection
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900 md:text-4xl">
              Panier logiciels téléchargeables
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Revérifiez vos logiciels avant de passer à la facturation.
            </p>
          </div>
          {hasItems && (
            <button
              type="button"
              onClick={clearCart}
              className="self-start rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-black hover:text-black"
            >
              Vider le panier
            </button>
          )}
        </header>

        {!hasItems ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Votre panier est vide
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Ajoutez un logiciel pour démarrer votre commande.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/logiciels"
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Découvrir les logiciels
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-black hover:text-black"
              >
                Retour à l’accueil
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <section className="space-y-4">
              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {missingProductIds.length > 0 && (
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                  Certains produits ne sont plus disponibles. Merci de les retirer avant de poursuivre.
                </div>
              )}

              <div className="space-y-4">
                {enrichedItems.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                          {item.product?.name?.charAt(0) || "CM"}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {item.product?.name || item.name}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {item.product?.shortDescription || "Licence logicielle téléchargeable"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                          Téléchargement immédiat
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                          Licence perpétuelle
                        </span>
                        {platformLabel(item.platform) && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                            Version {platformLabel(item.platform)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 sm:w-48">
                      <p className="text-lg font-semibold text-slate-900">
                        {formatPrice(item.unitPriceCents / 100)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-xs font-semibold text-red-600 underline decoration-red-200 underline-offset-4 transition hover:text-red-700"
                      >
                        Retirer du panier
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Récapitulatif</h2>
                {loading && (
                  <span className="text-xs font-semibold text-slate-500">
                    Mise à jour...
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm">
                {enrichedItems.map((item) => (
                  <div key={`summary-${item.id}`} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-slate-600">{item.product?.name || item.name}</span>
                      {platformLabel(item.platform) && (
                        <span className="text-[11px] text-slate-500">
                          Version {platformLabel(item.platform)}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-slate-900">
                      {formatPrice(item.lineTotalCents / 100)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Total TTC</span>
                  <span>{formatPrice(baseTotalCents / 100)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Les tarifs incluent la TVA. Vous pourrez ajouter vos informations de facturation à l'étape suivante.
                </p>
              </div>
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  disabled={!hasItems || loading || missingProductIds.length > 0}
                  onClick={handleProceed}
                  className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Valider le panier
                </button>
                <Link
                  to="/logiciels"
                  className="flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-black hover:text-black"
                >
                  Continuer mes achats
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
};

export default CartPage;
