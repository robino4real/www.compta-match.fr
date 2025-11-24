import React from "react";
import { useNavigate, Link } from "react-router-dom";

type ProductId = "comptamini_general" | "comptamini_simple" | "comptamini_pack";

interface ProductInfo {
  id: ProductId;
  name: string;
  price: number; // en euros
}

const productCatalog: ProductInfo[] = [
  {
    id: "comptamini_general",
    name: "ComptaMini - Edition comptabilité générale",
    price: 49,
  },
  {
    id: "comptamini_simple",
    name: "ComptaMini - Edition comptabilité simplifiée",
    price: 39,
  },
  {
    id: "comptamini_pack",
    name: "ComptaMini - Pack complet",
    price: 79,
  },
];

const productMap: Record<ProductId, ProductInfo> = productCatalog.reduce(
  (acc, product) => {
    acc[product.id] = product;
    return acc;
  },
  {} as Record<ProductId, ProductInfo>
);

interface CartItem {
  id: ProductId;
  quantity: number;
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = React.useState<CartItem[]>([]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("comptamatch_cart");
      if (!raw) {
        setItems([]);
        return;
      }
      const parsed: CartItem[] = JSON.parse(raw);
      setItems(parsed);
    } catch (error) {
      console.error("Erreur lors de la lecture du panier", error);
      setItems([]);
    }
  }, []);

  const updateCart = (nextItems: CartItem[]) => {
    setItems(nextItems);
    window.localStorage.setItem("comptamatch_cart", JSON.stringify(nextItems));
  };

  const incrementQuantity = (productId: ProductId) => {
    updateCart(
      items.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decrementQuantity = (productId: ProductId) => {
    updateCart(
      items
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        )
    );
  };

  const removeItem = (productId: ProductId) => {
    updateCart(items.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    updateCart([]);
  };

  const total = items.reduce((sum, item) => {
    const product = productMap[item.id];
    if (!product) return sum;
    return sum + product.price * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (items.length === 0) {
      alert("Votre panier est vide.");
      return;
    }

    // TODO: plus tard :
    // - Si l'utilisateur est déjà connecté : lancer un vrai processus de paiement en plusieurs étapes.
    // - Sinon : demander connexion / création de compte, puis rediriger vers le paiement.
    navigate("/auth/login");
  };

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-black">Panier</h1>
        <p className="text-sm text-slate-600">
          Retrouvez ici les logiciels téléchargeables COMPTAMATCH ajoutés à votre panier.
          Vous pourrez accéder au paiement une fois votre sélection validée.
        </p>
      </section>

      {items.length === 0 ? (
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
          <p className="text-sm text-slate-700">Votre panier est actuellement vide.</p>
          <Link
            to="/telechargements"
            className="inline-flex items-center text-xs font-semibold text-black underline-offset-2 hover:underline"
          >
            Retourner à la liste des logiciels téléchargeables
          </Link>
        </section>
      ) : (
        <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Produit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Prix unitaire</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Quantité</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Sous-total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const product = productMap[item.id];
                  if (!product) return null;
                  const lineTotal = product.price * item.quantity;
                  return (
                    <tr key={item.id} className="odd:bg-white even:bg-slate-50">
                      <td className="px-4 py-3 align-top text-xs text-slate-700">{product.name}</td>
                      <td className="px-4 py-3 align-top text-right text-xs text-slate-700">
                        {product.price.toFixed(2)} € TTC
                      </td>
                      <td className="px-4 py-3 align-top text-center text-xs text-slate-700">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => decrementQuantity(item.id)}
                            className="h-6 w-6 rounded-full border border-slate-300 text-[11px] text-slate-700 hover:border-black hover:text-black transition"
                          >
                            -
                          </button>
                          <span className="min-w-[1.5rem] text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => incrementQuantity(item.id)}
                            className="h-6 w-6 rounded-full border border-slate-300 text-[11px] text-slate-700 hover:border-black hover:text-black transition"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-right text-xs text-slate-700">
                        {lineTotal.toFixed(2)} € TTC
                      </td>
                      <td className="px-4 py-3 align-top text-center text-xs text-slate-700">
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

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                Total TTC :{" "}
                <span className="font-semibold text-black">{total.toFixed(2)} € TTC</span>
              </p>
              <button
                type="button"
                onClick={clearCart}
                className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-[11px] text-slate-700 hover:border-black hover:text-black transition"
              >
                Vider le panier
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-2">
              <Link
                to="/telechargements"
                className="inline-flex items-center justify-center rounded-full border border-black px-4 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition"
              >
                Continuer vos achats
              </Link>
              <button
                type="button"
                onClick={handleCheckout}
                className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
              >
                Accéder au paiement
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default CartPage;
