export type PageBlockType =
  | "HERO"
  | "TEXT"
  | "TEXT_IMAGE"
  | "IMAGE"
  | "CTA"
  | "FEATURES_LIST"
  | "PRODUCT_LIST"
  | "ARTICLES_LIST"
  | "TESTIMONIALS_LIST"
  | "SPACER";

export interface PageBlock {
  id: string;
  order: number;
  type: PageBlockType | string;
  data: any;
}

export interface PageSection {
  id: string;
  order: number;
  label?: string | null;
  type: string;
  backgroundColor?: string | null;
  backgroundImageUrl?: string | null;
  settings?: any;
  blocks?: PageBlock[];
}

export interface CustomPage {
  id: string;
  key: string;
  name: string;
  route: string;
  status: string;
}

export interface CustomPageResponse {
  page: CustomPage;
  sections: PageSection[];
}
