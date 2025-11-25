import crypto from "crypto";
import { prisma } from "../config/prisma";

export async function generateDownloadLinksForOrder(orderId: string, userId: string) {
  const orderWithItems = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!orderWithItems) return;

  if (orderWithItems.items.length === 0) return;

  await prisma.$transaction(
    orderWithItems.items.map((item) =>
      prisma.downloadLink.create({
        data: {
          orderItemId: item.id,
          userId,
          productId: item.productId,
          token: crypto.randomBytes(24).toString("hex"),
          status: "ACTIVE",
          maxDownloads: 1,
          downloadCount: 0,
        },
      })
    )
  );
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
      token: crypto.randomBytes(24).toString("hex"),
      status: "ACTIVE",
      maxDownloads: 1,
      downloadCount: 0,
    },
  });

  return link;
}
