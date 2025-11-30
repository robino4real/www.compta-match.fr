import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import StructuredDataScript from "../components/StructuredDataScript";
import { API_BASE_URL } from "../config/api";
import { useCart } from "../context/CartContext";

interface DownloadableProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  priceCents: number;
  currency: string;
  isActive: boolean;
}

const formatPrice = (priceCents: number, currency: string) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 2,
  }).format(priceCents / 100);
};

const DownloadDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addDownloadableProduct } = useCart();

  const [product, setProduct] = React.useState<DownloadableProduct | null>(null);
  const [structuredData, setStructuredData] = React.useState<any[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/public/products/${slug}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            (data as { message?: string }).message ||
              "Impossible de charger ce produit téléchargeable."
          );
        }

        setProduct((data as { product?: DownloadableProduct }).product ?? null);
        setStructuredData(
          Array.isArray((data as any)?.structuredData) ? (data as any).structuredData : null
        );
      } catch (err: any) {
        console.error("Erreur produit public", err);
        setError(
          err?.message || "Une erreur est survenue lors du chargement du produit."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addDownloadableProduct({
      id: product.id,
      name: product.name,
      priceCents: product.priceCents,
    });
    navigate("/panier");
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-slate-600">
        Chargement du produit...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12 text-center text-sm text-slate-600">
        Ce produit n&apos;est plus disponible.
      </div>
    );
  }

  const priceLabel = formatPrice(product.priceCents, product.currency);

  return (
    <div className="space-y-6">
      <StructuredDataScript data={structuredData} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          Logiciel téléchargeable
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 lg:max-w-2xl">
            <h1 className="text-2xl font-semibold text-black">{product.name}</h1>
            {product.shortDescription && (
              <p className="text-sm leading-relaxed text-slate-700">
                {product.shortDescription}
              </p>
            )}
          </div>
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-black">
            <p className="text-lg font-semibold">{priceLabel}</p>
            <p className="text-[11px] text-slate-600">Paiement unique – TTC</p>
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black"
            >
              Ajouter au panier
            </button>
          </div>
        </div>
      </section>

      {product.longDescription && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-black">Description détaillée</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-800">
            {product.longDescription}
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-black">Comment récupérer votre fichier ?</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Passez votre commande et procédez au paiement sécurisé.</li>
          <li>Accédez à vos téléchargements depuis l’espace client.</li>
          <li>Les liens restent disponibles selon les conditions de téléchargement.</li>
        </ul>
      </section>
    </div>
  );
};

export default DownloadDetailPage;
