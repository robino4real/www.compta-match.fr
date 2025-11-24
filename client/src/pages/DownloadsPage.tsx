import React from "react";

type ProductId = "comptamini_general" | "comptamini_simple" | "comptamini_pack";

interface Product {
  id: ProductId;
  name: string;
  shortDescription: string;
  features: string[];
  price: string;
}

interface CartItem {
  id: ProductId;
  quantity: number;
}

const products: Product[] = [
  {
    id: "comptamini_general",
    name: "ComptaMini – Edition comptabilité générale",
    shortDescription: "Solution complète pour suivre votre comptabilité générale avec simplicité et rigueur.",
    features: [
      "Plans comptables préconfigurés pour les petites structures",
      "Suivi des journaux, grand livre et balances en temps réel",
      "Exports PDF et Excel pour vos échanges avec l'expert-comptable",
      "Gestion simplifiée des immobilisations et amortissements",
      "Rapports mensuels prêts à envoyer",
    ],
    price: "79 € TTC",
  },
  {
    id: "comptamini_simple",
    name: "ComptaMini – Edition comptabilité simplifiée",
    shortDescription: "Idéal pour les micro-entrepreneurs qui veulent une saisie ultra rapide.",
    features: [
      "Tableau de bord clair avec indicateurs clés",
      "Catégorisation automatique des dépenses récurrentes",
      "Modèles d'écritures pour gagner du temps",
      "Exports fiscaux simplifiés pour vos déclarations",
      "Assistance guidée pour la clôture annuelle",
    ],
    price: "49 € TTC",
  },
  {
    id: "comptamini_pack",
    name: "ComptaMini – Pack complet",
    shortDescription: "Le bundle intégral pour gérer votre comptabilité et vos factures sans friction.",
    features: [
      "Inclut comptabilité générale et facturation avancée",
      "Suivi des règlements et relances automatiques",
      "Bibliothèque de modèles personnalisables",
      "Multi-utilisateur avec rôles et permissions",
      "Assistance premium prioritaire",
      "Sauvegarde locale et export sécurisé",
    ],
    price: "129 € TTC",
  },
];

const DownloadsPage: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(products[0]);
  const cardsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const detailSectionRef = React.useRef<HTMLDivElement | null>(null);

  const scrollCards = (direction: "left" | "right") => {
    const container = cardsContainerRef.current;
    if (!container) return;

    const distance = 320;
    const delta = direction === "left" ? -distance : distance;

    container.scrollBy({ left: delta, behavior: "smooth" });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    if (detailSectionRef.current) {
      detailSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAddToCart = (product: Product) => {
    try {
      const existing = window.localStorage.getItem("comptamatch_cart");
      const current: CartItem[] = existing ? JSON.parse(existing) : [];

      const index = current.findIndex((item) => item.id === product.id);
      if (index === -1) {
        current.push({ id: product.id, quantity: 1 });
      } else {
        current[index].quantity += 1;
      }

      window.localStorage.setItem("comptamatch_cart", JSON.stringify(current));
      alert(`${product.name} a été ajouté au panier.`);
    } catch (error) {
      console.error("Erreur lors de l'ajout au panier", error);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-black">Logiciels téléchargeables COMPTAMATCH</h1>
        <p className="text-sm text-slate-600">
          Retrouvez ici les logiciels COMPTAMATCH à installer sur votre ordinateur. Sélectionnez un produit
          pour afficher son descriptif détaillé, puis ajoutez-le au panier.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-black">Sélection des logiciels</h2>
            <p className="text-xs text-slate-500">
              Faites défiler les cartes, puis cliquez sur un logiciel pour afficher son descriptif détaillé.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCards("left")}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:border-black hover:text-black transition"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollCards("right")}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:border-black hover:text-black transition"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex md:hidden justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollCards("left")}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:border-black hover:text-black transition"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollCards("right")}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:border-black hover:text-black transition"
          >
            →
          </button>
        </div>

        <div ref={cardsContainerRef} className="flex gap-4 overflow-x-auto pb-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative min-w-[260px] max-w-xs flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer transform transition-transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md"
              onClick={() => handleSelectProduct(product)}
            >
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-black">{product.name}</h3>
                <ul className="space-y-1 text-xs text-slate-500">
                  {product.features.slice(0, 5).map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="font-semibold text-black">{product.price}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleAddToCart(product);
                  }}
                  className="rounded-full border border-black px-3 py-1 font-semibold text-[11px] text-black hover:bg-black hover:text-white transition"
                >
                  Ajouter au panier
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedProduct && (
        <section ref={detailSectionRef} className="space-y-4">
          <h2 className="text-lg font-semibold text-black">Détails du logiciel : {selectedProduct.name}</h2>

          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white rounded-2xl p-6 md:p-8 shadow-md">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1 space-y-3">
                <p className="text-sm text-slate-100">{selectedProduct.shortDescription}</p>
                <ul className="space-y-1 text-xs text-slate-200">
                  {selectedProduct.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(selectedProduct)}
                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-slate-200 transition"
                  >
                    Ajouter au panier
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <div className="h-40 md:h-56 rounded-xl bg-gradient-to-tr from-slate-700 via-slate-600 to-slate-500 flex items-center justify-center text-[11px] text-slate-100">
                  Zone image produit (placeholder) — une capture d'écran pourra être insérée ici plus tard.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black">{selectedProduct.name}</p>
              <p className="text-xs text-slate-500">
                Prix : {selectedProduct.price} — logiciel téléchargeable COMPTAMATCH.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddToCart(selectedProduct)}
              className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
            >
              Ajouter au panier
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default DownloadsPage;
