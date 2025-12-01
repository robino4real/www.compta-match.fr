export type DownloadableProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  priceTtc: number;
  currency: "EUR";
  badge?: string;
  tags?: string[];
  heroImageUrl?: string;
  galleryUrls?: string[];
  isPublished?: boolean;
};
