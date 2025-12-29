import crypto from "crypto";
import { prisma } from "../config/prisma";
import { CustomerActivityEventType } from "@prisma/client";
import { trackCustomerEvent } from "./customerActivityService";

export async function generateDownloadLinksForOrder(orderId: string, userId: string) {
  const orderWithItems = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!orderWithItems) return;

  if (orderWithItems.items.length === 0) return;

  for (const item of orderWithItems.items) {
    const existing = await prisma.downloadLink.findFirst({
      where: { orderItemId: item.id },
    });

    if (existing) {
      continue;
    }

    await prisma.downloadLink.create({
      data: {
        orderItemId: item.id,
        userId,
        productId: item.productId,
        token: crypto.randomBytes(32).toString("hex"),
        status: "ACTIVE",
        maxDownloads: 1,
        downloadCount: 0,
      },
    });

    await trackCustomerEvent(CustomerActivityEventType.DOWNLOAD_CREATED, {
      userId,
      meta: { orderItemId: item.id, productId: item.productId },
    });
  }
}

export async function regenerateDownloadLinkForOrderItem(orderItemId: string) {
  const existingLinks = await prisma.downloadLink.findMany({
    where: { orderItemId, status: "ACTIVE" },
  });

  if (existingLinks.length > 0) {
    await prisma.downloadLink.updateMany({
      where: { orderItemId },
      data: { status: "EXPIRED" },
    });
  }

  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: true },
  });

  if (!orderItem) {
    throw new Error("Order item introuvable");
  }

  const link = await prisma.downloadLink.create({
    data: {
      orderItemId,
      userId: orderItem.order.userId,
      productId: orderItem.productId,
      token: crypto.randomBytes(32).toString("hex"),
      status: "ACTIVE",
      maxDownloads: 1,
      downloadCount: 0,
    },
  });

  return link;
}
