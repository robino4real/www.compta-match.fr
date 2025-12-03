export type DownloadableCategory = {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
};

export type DownloadableProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  priceTtc: number;
  priceDisplayMode?: "HT" | "TTC";
  currency: "EUR";
  badge?: string;
  tags?: string[];
  cardImageUrl?: string;
  heroImageUrl?: string;
  galleryUrls?: string[];
  detailSlides?: { imageUrl?: string | null; description?: string | null }[];
  isPublished?: boolean;
  category?: DownloadableCategory | null;
};
