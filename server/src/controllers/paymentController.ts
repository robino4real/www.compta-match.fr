import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { stripe } from "../config/stripeClient";

interface CheckoutItemInput {
  productId: string;
  quantity?: number;
}

export async function createDownloadCheckoutSession(
  req: Request,
  res: Response
) {
  try {
    const { items } = req.body as { items?: CheckoutItemInput[] };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Aucun article n'a été fourni pour le paiement.",
      });
    }

    const normalizedItems = items.map((raw) => ({
      productId: String(raw.productId),
      quantity:
        raw.quantity && Number(raw.quantity) > 0
          ? Number(raw.quantity)
          : 1,
    }));

    const productIds = normalizedItems.map((it) => it.productId);

    const products = await prisma.downloadableProduct.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    if (products.length !== normalizedItems.length) {
      return res.status(400).json({
        message:
          "Certains produits demandés sont introuvables ou ne sont plus disponibles.",
      });
    }

    const productMap = products.reduce<Record<string, (typeof products)[number]>>(
      (acc, p) => {
        acc[p.id] = p;
        return acc;
      },
      {}
    );

    const successUrl =
      process.env.STRIPE_SUCCESS_URL ||
      "http://localhost:5173/paiement/success";
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL || "http://localhost:5173/paiement/cancel";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: normalizedItems.map((it) => {
        const product = productMap[it.productId];
        return {
          quantity: it.quantity,
          price_data: {
            currency: (product.currency || "EUR").toLowerCase(),
            unit_amount: product.priceCents,
            product_data: {
              name: product.name,
              description: product.shortDescription || undefined,
            },
          },
        };
      }),
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(201).json({ url: session.url });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la session de paiement Stripe :",
      error
    );
    return res.status(500).json({
      message: "Erreur lors de la création de la session de paiement Stripe.",
    });
  }
}
