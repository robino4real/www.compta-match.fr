import { OrderType, SubscriptionBrand } from "@prisma/client";
import { prisma } from "../config/prisma";
import { generateOrderNumber, isOrderNumberValid } from "../services/orderNumberService";

async function resolveOrderType(orderType?: OrderType | null): Promise<OrderType> {
  return orderType || OrderType.DOWNLOADABLE;
}

async function resolveSubscriptionBrand(
  orderType: OrderType,
  subscriptionBrand?: SubscriptionBrand | null
): Promise<SubscriptionBrand | null> {
  if (orderType !== OrderType.SUBSCRIPTION) {
    return null;
  }

  return subscriptionBrand || SubscriptionBrand.CP;
}

async function backfillMissingOrderNumbers() {
  const orders = await prisma.order.findMany({
    include: {
      items: true,
    },
  });

  let updated = 0;

  for (const order of orders) {
    if (isOrderNumberValid(order.orderNumber)) {
      continue;
    }

    const orderType = await resolveOrderType(order.orderType);
    const brand = await resolveSubscriptionBrand(orderType, order.subscriptionBrand);
    const orderNumber = await generateOrderNumber(orderType, brand);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        orderNumber,
        orderType,
        subscriptionBrand: brand,
      },
    });

    updated += 1;
    console.log(`Order ${order.id} backfilled with number ${orderNumber}`);
  }

  console.log(`Backfill complete. Updated ${updated} order(s).`);
}

backfillMissingOrderNumbers()
  .catch((error) => {
    console.error("Failed to backfill order numbers", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
