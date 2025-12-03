import { prisma } from "../config/prisma";
import { buildCategoryKey } from "./promoService";

export interface CartItemInput {
  productId: string;
  quantity?: number;
}

export interface CartComputationResult {
  totalCents: number;
  totalsByCategory: Record<string, number>;
  productMap: Record<string, Awaited<ReturnType<typeof prisma.downloadableProduct.findMany>>[number]>;
  normalizedItems: { productId: string; quantity: number }[];
}

export async function computeCartTotals(
  items: CartItemInput[]
): Promise<CartComputationResult> {
  const normalizedItems = items.map((raw) => ({
    productId: String(raw.productId),
    quantity: raw.quantity && Number(raw.quantity) > 0 ? Number(raw.quantity) : 1,
  }));

  const productIds = normalizedItems.map((it) => it.productId);
  const products = await prisma.downloadableProduct.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
  });

  if (products.length !== normalizedItems.length) {
    throw new Error("INVALID_PRODUCTS");
  }

  const productMap = products.reduce<Record<string, (typeof products)[number]>>(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {}
  );

  const totalsByCategory = normalizedItems.reduce<Record<string, number>>((acc, it) => {
    const product = productMap[it.productId];
    if (!product) return acc;
    const key = buildCategoryKey(product.categoryId);
    acc[key] = (acc[key] || 0) + product.priceCents * it.quantity;
    return acc;
  }, {});

  const totalCents = Object.values(totalsByCategory).reduce(
    (sum, value) => sum + value,
    0
  );

  return { totalCents, totalsByCategory, productMap, normalizedItems };
}
