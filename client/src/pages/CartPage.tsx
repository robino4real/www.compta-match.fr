import React from "react";
import { useCart } from "../context/CartContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const CartPage: React.FC = () => {
  const { items, totalCents, removeItem, clearCart } = useCart();

  const [promoCode, setPromoCode] = React.useState("");
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const hasItems = items.length > 0;
  const totalEuros = totalCents / 100;

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      setPromoError(null);

      if (!hasItems) {
        setPromoError("Votre panier est vide.");
        return;
      }

      const payload: Record<string, unknown> = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity ?? 1,
        })),
      };

      if (promoCode.trim()) {
        payload.promoCode = promoCode.trim();
      }

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

      if (!response.ok) {
        const message =
          data.message ||
          "Impossible de créer la session de paiement. Vérifiez le code promo ou réessayez.";
        setPromoError(message);
        return;
      }

      if (data.url) {
        window.location.href = data.url as string;
      } else {
        setPromoError(
          "La session de paiement a été créée, mais aucune URL n'a été renvoyée."
        );
      }
    } catch (error) {
      console.error("Erreur lors de la création de la session de paiement :", error);
      setPromoError(
        "Une erreur est survenue lors de la création de la session de paiement."
      );
    } finally {
      setIsProcessing(false);
    }
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-3 border-t border-slate-200">
              <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 md:col-span-1 lg:col-span-2">
                <h2 className="text-sm font-semibold text-black">Code promo</h2>
                <p className="text-[11px] text-slate-500">
                  Si vous disposez d&apos;un code promo, saisissez-le ci-dessous.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="COMPTA10"
                  />
                  {promoCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setPromoCode("");
                        setPromoError(null);
                      }}
                      className="rounded-full border border-slate-300 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black transition"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {promoError && (
                  <p className="text-[11px] text-red-600">{promoError}</p>
                )}
              </section>

              <div className="flex flex-col justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
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
                    disabled={isProcessing || !hasItems}
                    className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing
                      ? "Redirection vers le paiement..."
                      : "Accéder au paiement"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default CartPage;
