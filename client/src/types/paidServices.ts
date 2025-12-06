export type PaidServiceType = "COMPTAPRO" | "COMPTASSO";

export type PaidServicePlan = {
  id: string;
  slug: string;
  name: string;
  subtitle?: string | null;
  priceAmount: number;
  priceCurrency: string;
  pricePeriod: string;
  isHighlighted: boolean;
  sortOrder?: number;
  serviceType?: PaidServiceType;
};

export type PaidServiceComparison = {
  plans: { id: string; name: string; slug: string }[];
  rows: {
    id: string;
    label: string;
    description?: string | null;
    planAIncluded: boolean;
    planBIncluded: boolean;
  }[];
};

export type PaidServiceSection = {
  id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  sortOrder?: number;
  isPublished?: boolean;
  serviceType?: PaidServiceType;
};
