export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  active?: boolean;
  downloadPath?: string;
}
