import React from "react";
import { useCart } from "../../context/CartContext";

const FADE_DURATION_MS = 300;
const DISPLAY_DURATION_MS = 2000;

export const CartAdditionToast: React.FC = () => {
  const { lastAdditionTimestamp, lastAddedItemName } = useCart();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isFading, setIsFading] = React.useState(false);
  const [message, setMessage] = React.useState("Produit ajouté au panier");

  React.useEffect(() => {
    if (!lastAdditionTimestamp) return;

    setMessage(
      lastAddedItemName
        ? `${lastAddedItemName} a été ajouté au panier`
        : "Produit ajouté au panier"
    );
    setIsVisible(true);
    setIsFading(false);

    const fadeTimeout = window.setTimeout(
      () => setIsFading(true),
      DISPLAY_DURATION_MS
    );
    const hideTimeout = window.setTimeout(
      () => setIsVisible(false),
      DISPLAY_DURATION_MS + FADE_DURATION_MS
    );

    return () => {
      window.clearTimeout(fadeTimeout);
      window.clearTimeout(hideTimeout);
    };
  }, [lastAdditionTimestamp, lastAddedItemName]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-6 z-50 flex justify-center px-4">
      <div
        className={`flex items-center gap-3 rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 shadow-2xl shadow-emerald-900/20 backdrop-blur-xl transition-opacity duration-300 ${
          isFading ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-900/30">
          ✓
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default CartAdditionToast;
