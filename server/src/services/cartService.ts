import { DownloadPlatform } from "@prisma/client";
import { prisma } from "../config/prisma";
import { buildCategoryKey } from "./promoService";

export interface CartItemInput {
  productId: string;
  quantity?: number;
  binaryId?: string;
  platform?: DownloadPlatform | string;
}

export interface CartComputationResult {
  totalCents: number;
  totalsByCategory: Record<string, number>;
  productMap: Record<string, Awaited<ReturnType<typeof prisma.downloadableProduct.findMany>>[number]>;
  normalizedItems: {
    productId: string;
    quantity: number;
    binaryId?: string | null;
    platform?: DownloadPlatform | null;
  }[];
}

const normalizePlatform = (value: unknown): DownloadPlatform | undefined => {
  if (typeof value !== "string") return undefined;
  const upper = value.trim().toUpperCase();
  return upper === "WINDOWS" || upper === "MACOS"
    ? (upper as DownloadPlatform)
    : undefined;
};

export async function computeCartTotals(
  items: CartItemInput[]
): Promise<CartComputationResult> {
  const normalizedItems = items.map((raw) => ({
    productId: String(raw.productId),
    quantity: raw.quantity && Number(raw.quantity) > 0 ? Number(raw.quantity) : 1,
    binaryId: raw.binaryId ? String(raw.binaryId) : undefined,
    platform: normalizePlatform(raw.platform),
  }));

  const productIds = normalizedItems.map((it) => it.productId);
  const uniqueProductIds = Array.from(new Set(productIds));
  const products = await prisma.downloadableProduct.findMany({
    where: {
      id: { in: uniqueProductIds },
      isActive: true,
    },
    include: { binaries: true },
  });

  const productMap = products.reduce<Record<string, (typeof products)[number]>>(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {}
  );

  const missingProduct = normalizedItems.find((item) => !productMap[item.productId]);
  if (missingProduct) {
    throw new Error("INVALID_PRODUCTS");
  }

  const normalizedItemsWithBinaries = normalizedItems.map((item) => {
    const product = productMap[item.productId];
    if (!product) return item;

    if (!product.binaries?.length) {
      return { ...item, binaryId: null, platform: item.platform ?? null };
    }

    let selectedBinary = item.binaryId
      ? product.binaries.find((binary) => binary.id === item.binaryId)
      : undefined;

    if (item.binaryId && !selectedBinary) {
      throw new Error("INVALID_BINARY");
    }

    if (!selectedBinary && item.platform) {
      selectedBinary = product.binaries.find(
        (binary) => binary.platform === item.platform
      );

      if (!selectedBinary) {
        throw new Error("INVALID_BINARY");
      }
    }

    if (!selectedBinary) {
      selectedBinary = product.binaries[0];
    }

    if (!selectedBinary) {
      throw new Error("INVALID_BINARY");
    }

    return {
      ...item,
      binaryId: selectedBinary.id,
      platform: selectedBinary.platform,
    };
  });

  const totalsByCategory = normalizedItemsWithBinaries.reduce<Record<string, number>>((acc, it) => {
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

  return {
    totalCents,
    totalsByCategory,
    productMap,
    normalizedItems: normalizedItemsWithBinaries,
  };
}
