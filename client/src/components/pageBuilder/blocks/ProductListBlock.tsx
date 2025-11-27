import React from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface ProductListBlockProps {
  data: any;
}

interface DownloadableProduct {
  id: string;
  name: string;
  shortDescription?: string | null;
  priceCents: number;
  currency: string;
  slug: string;
  imageUrl?: string | null;
}

const formatPrice = (priceCents: number, currency: string) => {
  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 0,
  });
  return formatter.format(priceCents / 100);
};

const ProductListBlock: React.FC<ProductListBlockProps> = ({ data }) => {
  const { title, mode = "latest", productIds = [], maxItems = 3 } = data || {};
  const [products, setProducts] = React.useState<DownloadableProduct[]>([]);

  React.useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/catalog/downloads`);
        const json = await response.json().catch(() => ({}));
        const incoming = Array.isArray(json?.products) ? json.products : [];

        let selected = incoming as DownloadableProduct[];
        if (mode === "selected" && productIds.length > 0) {
          selected = incoming.filter((p: DownloadableProduct) =>
            productIds.includes(p.id)
          );
        }

        if (mode === "latest") {
          selected = incoming.slice(0, maxItems);
        } else {
          selected = selected.slice(0, maxItems);
        }

        if (isMounted) {
          setProducts(selected);
        }
      } catch (error) {
        console.error("Impossible de charger les produits", error);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [mode, productIds, maxItems]);

  if (!products.length) return null;

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-semibold text-black">{title}</h2>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="mb-4 h-40 w-full rounded-lg object-cover"
              />
            )}
            <h3 className="text-base font-semibold text-black">{product.name}</h3>
            {product.shortDescription && (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {product.shortDescription}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between text-sm font-semibold text-black">
              <span>{formatPrice(product.priceCents, product.currency)}</span>
              <a
                href={`/telechargements/${product.slug}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-500"
              >
                Découvrir
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductListBlock;
