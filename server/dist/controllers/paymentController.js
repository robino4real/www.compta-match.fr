"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDownloadCheckoutSession = createDownloadCheckoutSession;
exports.handleStripeWebhook = handleStripeWebhook;
exports.listRecentStripeWebhookEvents = listRecentStripeWebhookEvents;
exports.getStripeSessionById = getStripeSessionById;
exports.getDownloadCheckoutConfirmation = getDownloadCheckoutConfirmation;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
const stripeClient_1 = require("../config/stripeClient");
const invoiceService_1 = require("../services/invoiceService");
const downloadLinkService_1 = require("../services/downloadLinkService");
const orderNumberService_1 = require("../services/orderNumberService");
const promoService_1 = require("../services/promoService");
const cartService_1 = require("../services/cartService");
const transactionalEmailService_1 = require("../services/transactionalEmailService");
const env_1 = require("../config/env");
function sanitizeString(value) {
    if (typeof value !== "string")
        return "";
    return value.trim();
}
function normalizeBilling(raw) {
    return {
        firstName: sanitizeString(raw?.firstName),
        lastName: sanitizeString(raw?.lastName),
        company: sanitizeString(raw?.company),
        address1: sanitizeString(raw?.address1),
        address2: sanitizeString(raw?.address2),
        postalCode: sanitizeString(raw?.postalCode),
        city: sanitizeString(raw?.city),
        country: sanitizeString(raw?.country) || "France",
        email: sanitizeString(raw?.email),
        vatNumber: sanitizeString(raw?.vatNumber),
    };
}
function getBillingValidationError(billing) {
    if (!billing.firstName || !billing.lastName) {
        return "Le nom et le prénom sont requis.";
    }
    if (!billing.address1 || !billing.postalCode || !billing.city || !billing.country) {
        return "L'adresse de facturation est incomplète.";
    }
    if (!billing.email) {
        return "L'email de facturation est requis.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(billing.email)) {
        return "L'email de facturation n'est pas valide.";
    }
    return null;
}
function buildBillingAddress(billing) {
    const parts = [
        billing.address1,
        billing.address2,
        `${billing.postalCode} ${billing.city}`.trim(),
        billing.country,
    ].filter(Boolean);
    return parts.join(", ");
}
function buildSuccessUrl(baseUrl) {
    if (baseUrl.includes("{CHECKOUT_SESSION_ID}")) {
        return baseUrl;
    }
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}session_id={CHECKOUT_SESSION_ID}`;
}
function buildFreeOrderSuccessUrl(baseUrl, orderId) {
    const cleanedBase = baseUrl.replace(/([?&])session_id=\{CHECKOUT_SESSION_ID\}/, "");
    const separator = cleanedBase.includes("?") ? "&" : "?";
    return `${cleanedBase}${separator}order_id=${encodeURIComponent(orderId)}`;
}
function buildOrderItemsPayload(normalizedItems, productMap) {
    return normalizedItems.map((it) => ({
        productId: it.productId,
        productNameSnapshot: productMap[it.productId].name,
        priceCents: productMap[it.productId].priceCents,
        quantity: it.quantity,
        lineTotal: productMap[it.productId].priceCents * it.quantity,
        binaryId: it.binaryId,
        platform: it.platform,
    }));
}
function generateOrderDownloadToken() {
    if (typeof crypto_1.default.randomUUID === "function") {
        return crypto_1.default.randomUUID();
    }
    return crypto_1.default.randomBytes(32).toString("hex");
}
function extractPaymentIntentId(value) {
    if (!value)
        return null;
    if (typeof value === "string") {
        return value;
    }
    if (typeof value.id === "string") {
        return value.id;
    }
    return null;
}
async function upsertWebhookLog(params) {
    return prisma_1.prisma.webhookEventLog.upsert({
        where: { eventId: params.eventId },
        update: {
            type: params.type,
            status: params.status,
            sessionId: params.sessionId || undefined,
            paymentIntentId: params.paymentIntentId || undefined,
            orderId: params.orderId || undefined,
            message: params.message || undefined,
            rawPayload: params.rawPayload || undefined,
        },
        create: {
            eventId: params.eventId,
            type: params.type,
            status: params.status || client_1.WebhookEventStatus.RECEIVED,
            sessionId: params.sessionId || undefined,
            paymentIntentId: params.paymentIntentId || undefined,
            orderId: params.orderId || undefined,
            message: params.message || undefined,
            rawPayload: params.rawPayload || undefined,
        },
    });
}
/**
 * Création d'une session Stripe Checkout pour les logiciels téléchargeables.
 * Nécessite un utilisateur connecté.
 * Les informations utiles (userId + liste des produits) sont stockées dans metadata
 * pour être récupérées dans le webhook Stripe après paiement.
 */
async function createDownloadCheckoutSession(req, res) {
    const request = req;
    try {
        const userId = request.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }
        const { items, promoCode, billing, acceptedTerms, acceptedLicense } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res
                .status(400)
                .json({ message: "La liste des produits est vide ou invalide." });
        }
        const billingInfo = normalizeBilling(billing);
        const billingError = getBillingValidationError(billingInfo);
        if (billingError) {
            return res.status(400).json({ message: billingError });
        }
        if (!acceptedTerms || !acceptedLicense) {
            return res.status(400).json({
                message: "Merci d'accepter les conditions d'utilisation et le contrat de licence avant de payer.",
            });
        }
        let cartComputation;
        try {
            cartComputation = await (0, cartService_1.computeCartTotals)(items);
        }
        catch (error) {
            const isInvalidProducts = error instanceof Error && error.message === "INVALID_PRODUCTS";
            return res.status(isInvalidProducts ? 400 : 500).json({
                message: isInvalidProducts
                    ? "Certains produits demandés sont introuvables ou ne sont plus disponibles."
                    : "Impossible de calculer le panier pour le paiement.",
            });
        }
        const { totalCents, totalsByCategory, normalizedItems, productMap } = cartComputation;
        let appliedPromo = null;
        let promoDiscountCents = 0;
        if (promoCode && promoCode.trim()) {
            const result = await (0, promoService_1.validatePromoCodeForTotal)(promoCode, totalCents, {
                context: "PRODUCT",
                categoryTotals: totalsByCategory,
            });
            if (!result) {
                return res.status(400).json({
                    message: "Ce code promo est invalide, expiré ou n'est plus disponible.",
                });
            }
            appliedPromo = result.promo;
            promoDiscountCents = result.discountCents;
        }
        const payableCents = totalCents - promoDiscountCents;
        const billingName = `${billingInfo.firstName} ${billingInfo.lastName}`.trim();
        const billingAddress = buildBillingAddress(billingInfo);
        const frontendBaseUrl = env_1.env.frontendBaseUrl.replace(/\/$/, "");
        const baseSuccessUrl = process.env.STRIPE_SUCCESS_URL || `${frontendBaseUrl}/checkout/success`;
        const cancelUrl = process.env.STRIPE_CANCEL_URL || `${frontendBaseUrl}/panier`;
        if (payableCents <= 0) {
            const currency = productMap[normalizedItems[0].productId]?.currency?.toUpperCase() ||
                (process.env.CURRENCY || "EUR").toUpperCase();
            const order = await prisma_1.prisma.order.create({
                data: {
                    userId,
                    orderNumber: await (0, orderNumberService_1.generateOrderNumber)(client_1.OrderType.DOWNLOADABLE),
                    orderType: client_1.OrderType.DOWNLOADABLE,
                    totalBeforeDiscount: totalCents,
                    discountAmount: promoDiscountCents > 0 ? promoDiscountCents : 0,
                    totalPaid: 0,
                    currency,
                    status: "PAID",
                    paidAt: new Date(),
                    downloadToken: generateOrderDownloadToken(),
                    promoCodeId: appliedPromo ? appliedPromo.id : null,
                    billingNameSnapshot: billingName,
                    billingEmailSnapshot: billingInfo.email,
                    billingAddressSnapshot: billingAddress || null,
                    acceptedTerms,
                    acceptedLicense,
                    items: {
                        create: buildOrderItemsPayload(normalizedItems, productMap),
                    },
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
            await (0, downloadLinkService_1.generateDownloadLinksForOrder)(order.id, userId);
            const invoice = await (0, invoiceService_1.createInvoiceForOrder)({
                order,
                user,
                billingEmail: billingInfo.email,
                billingName,
                billingAddress,
            });
            if (appliedPromo && promoDiscountCents > 0) {
                await prisma_1.prisma.promoCode.update({
                    where: { id: appliedPromo.id },
                    data: {
                        currentUses: {
                            increment: 1,
                        },
                    },
                });
            }
            await (0, transactionalEmailService_1.sendOrderConfirmationEmail)(order.id);
            if (invoice) {
                await (0, transactionalEmailService_1.sendInvoiceAvailableEmail)(invoice.id);
            }
            const successUrl = buildFreeOrderSuccessUrl(baseSuccessUrl, order.id);
            return res.status(201).json({ url: successUrl });
        }
        // On stocke les infos nécessaires dans metadata pour les récupérer dans le webhook
        const currency = (process.env.CURRENCY || "eur").toLowerCase();
        const order = await prisma_1.prisma.order.create({
            data: {
                userId,
                orderNumber: await (0, orderNumberService_1.generateOrderNumber)(client_1.OrderType.DOWNLOADABLE),
                orderType: client_1.OrderType.DOWNLOADABLE,
                totalBeforeDiscount: totalCents,
                discountAmount: promoDiscountCents > 0 ? promoDiscountCents : 0,
                totalPaid: payableCents,
                currency: currency.toUpperCase(),
                status: "PENDING",
                downloadToken: null,
                promoCodeId: appliedPromo ? appliedPromo.id : null,
                billingNameSnapshot: billingName,
                billingEmailSnapshot: billingInfo.email,
                billingAddressSnapshot: billingAddress || null,
                acceptedTerms,
                acceptedLicense,
                items: { create: buildOrderItemsPayload(normalizedItems, productMap) },
            },
            include: { items: true },
        });
        const metadata = {
            userId: String(userId),
            orderId: order.id,
            environment: env_1.env.nodeEnv,
        };
        if (normalizedItems?.length) {
            metadata.items = JSON.stringify(normalizedItems.map((it) => ({
                productId: it.productId,
                quantity: it.quantity,
                binaryId: it.binaryId || "",
                platform: it.platform || "",
            })));
        }
        if (appliedPromo) {
            metadata.promoCodeId = appliedPromo.id;
            metadata.promoCode = appliedPromo.code;
        }
        metadata.promoDiscountCents = promoDiscountCents.toString();
        metadata.billingName = billingName;
        metadata.billingEmail = billingInfo.email;
        metadata.billingCompany = billingInfo.company || "";
        metadata.billingAddress = billingAddress;
        metadata.billingVatNumber = billingInfo.vatNumber || "";
        metadata.acceptedTerms = acceptedTerms ? "true" : "false";
        metadata.acceptedLicense = acceptedLicense ? "true" : "false";
        const successUrl = buildSuccessUrl(baseSuccessUrl);
        if (order.stripeSessionId) {
            try {
                const existingSession = await stripeClient_1.stripe.checkout.sessions.retrieve(order.stripeSessionId);
                if (existingSession?.url) {
                    console.log("[Stripe checkout] Session existante réutilisée", existingSession.id, order.id);
                    return res.status(200).json({ url: existingSession.url });
                }
            }
            catch (err) {
                console.warn("[Stripe checkout] Impossible de récupérer la session existante", order.stripeSessionId, err);
            }
        }
        const session = await stripeClient_1.stripe.checkout.sessions.create({
            mode: "payment",
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency,
                        unit_amount: payableCents,
                        product_data: {
                            name: "Commande de logiciels téléchargeables",
                        },
                    },
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: billingInfo.email,
            client_reference_id: order.id,
            metadata,
        });
        await prisma_1.prisma.order.update({
            where: { id: order.id },
            data: {
                stripeSessionId: session.id,
                stripePaymentIntentId: extractPaymentIntentId(session.payment_intent) || undefined,
            },
        });
        return res.status(201).json({ url: session.url });
    }
    catch (error) {
        console.error("Erreur lors de la création de la session de paiement Stripe :", error);
        const stripeMessage = typeof error === "object" &&
            error !== null &&
            "message" in error &&
            typeof error.message === "string"
            ? error.message
            : null;
        return res.status(500).json({
            message: stripeMessage ||
                "Erreur lors de la création de la session de paiement Stripe.",
        });
    }
}
async function handleStripeWebhook(req, res) {
    const correlationId = crypto_1.default.randomUUID?.() || `stripe-${Date.now()}`;
    const rawSignatureHeader = req.headers["stripe-signature"];
    const signature = Array.isArray(rawSignatureHeader)
        ? rawSignatureHeader.find((value) => typeof value === "string")
        : typeof rawSignatureHeader === "string"
            ? rawSignatureHeader
            : undefined;
    const rawBody = req.body;
    const webhookSecret = env_1.env.stripeActiveWebhookSecret;
    console.log(`[Stripe webhook] inbound correlationId=${correlationId} method=${req.method} url=${req.originalUrl}`);
    console.log(`[Stripe webhook] headers content-type=${req.headers["content-type"] || "unknown"} content-length=${req.headers["content-length"] || "unknown"}`, correlationId);
    console.log(`[Stripe webhook] stripe-signature header type=${Array.isArray(rawSignatureHeader) ? "array" : typeof rawSignatureHeader}`, { isArray: Array.isArray(rawSignatureHeader) }, correlationId);
    console.log(`[Stripe webhook] body diagnostic type=${typeof rawBody} isBuffer=${Buffer.isBuffer(rawBody)} bufferLength=${Buffer.isBuffer(rawBody) ? rawBody.length : "n/a"}`, correlationId);
    console.log(`[Stripe webhook] webhook secret selection mode=${env_1.env.stripeMode} source=${env_1.env.stripeActiveWebhookSecretSource || "none"} present=${Boolean(webhookSecret)}`, correlationId);
    if (!webhookSecret) {
        console.error("[Stripe webhook] Secret manquant dans l'env. Ignoré.", correlationId);
        return res.status(500).json({ received: false });
    }
    if (!signature) {
        console.error("[Stripe webhook] Signature Stripe manquante", correlationId);
        return res.status(400).send("Missing Stripe-Signature");
    }
    let event;
    if (!Buffer.isBuffer(rawBody)) {
        const receivedType = Array.isArray(rawBody)
            ? "array"
            : rawBody === null
                ? "null"
                : typeof rawBody;
        console.error(`[Stripe webhook] Body non-raw (Buffer attendu). Type reçu: ${receivedType}`, correlationId);
        return res.status(400).send("Invalid raw body");
    }
    try {
        event = stripeClient_1.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    }
    catch (error) {
        console.error("[Stripe webhook] Erreur de vérification de signature :", error, correlationId);
        return res.status(400).send("Webhook signature verification failed");
    }
    const sessionLike = event.data?.object;
    const sessionId = sessionLike?.id || null;
    const paymentIntentId = extractPaymentIntentId(sessionLike?.payment_intent);
    const metadataOrderId = typeof sessionLike?.metadata?.orderId === "string"
        ? sessionLike.metadata.orderId
        : null;
    const clientReferenceId = typeof sessionLike?.client_reference_id === "string"
        ? sessionLike.client_reference_id
        : null;
    const existingLog = await prisma_1.prisma.webhookEventLog.findUnique({
        where: { eventId: event.id },
    });
    if (existingLog?.status === client_1.WebhookEventStatus.PROCESSED) {
        console.log("[Stripe webhook] événement déjà traité", event.id, correlationId);
        return res.status(200).json({ received: true, idempotent: true });
    }
    await upsertWebhookLog({
        eventId: event.id,
        type: event.type,
        status: client_1.WebhookEventStatus.RECEIVED,
        sessionId,
        paymentIntentId,
        orderId: metadataOrderId || clientReferenceId,
        rawPayload: {
            eventId: event.id,
            type: event.type,
            sessionId,
            paymentIntentId,
            orderId: metadataOrderId || clientReferenceId,
        },
    });
    console.log(`[Stripe webhook] received type=${event.type} eventId=${event.id} sessionId=${sessionId} orderId=${metadataOrderId || clientReferenceId || "unknown"}`, correlationId);
    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const result = await processCheckoutCompletedEvent(session, event.id, correlationId);
            const statusForLog = result?.status === "ERROR"
                ? client_1.WebhookEventStatus.ERROR
                : client_1.WebhookEventStatus.PROCESSED;
            await upsertWebhookLog({
                eventId: event.id,
                type: event.type,
                status: statusForLog,
                sessionId,
                paymentIntentId,
                orderId: result?.orderId || metadataOrderId || clientReferenceId,
                message: result?.message ||
                    (statusForLog === client_1.WebhookEventStatus.ERROR
                        ? "checkout.session.completed en erreur"
                        : "checkout.session.completed traité"),
                rawPayload: statusForLog === client_1.WebhookEventStatus.ERROR
                    ? event.data.object
                    : undefined,
            });
            return res.status(200).json({ received: true });
        }
        if (event.type === "payment_intent.succeeded") {
            await upsertWebhookLog({
                eventId: event.id,
                type: event.type,
                status: client_1.WebhookEventStatus.PROCESSED,
                sessionId,
                paymentIntentId,
                message: "payment_intent.succeeded reçu (aucune action requise)",
            });
            return res.status(200).json({ received: true });
        }
        await upsertWebhookLog({
            eventId: event.id,
            type: event.type,
            status: client_1.WebhookEventStatus.PROCESSED,
            sessionId,
            paymentIntentId,
            message: "Type d'événement ignoré",
        });
        return res.status(200).json({ received: true });
    }
    catch (error) {
        console.error("[Stripe webhook] Erreur dans le handler :", error);
        await upsertWebhookLog({
            eventId: event.id,
            type: event.type,
            status: client_1.WebhookEventStatus.ERROR,
            sessionId,
            paymentIntentId,
            message: error instanceof Error ? error.message : "Erreur inconnue dans le webhook",
        });
        return res.status(400).json({ received: false });
    }
}
async function listRecentStripeWebhookEvents(req, res) {
    try {
        const events = await prisma_1.prisma.webhookEventLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
        });
        return res.status(200).json({ events });
    }
    catch (error) {
        console.error("[Stripe webhook] Erreur lors de la lecture des logs :", error);
        return res.status(500).json({ message: "Impossible de récupérer les logs." });
    }
}
async function getStripeSessionById(req, res) {
    const sessionId = req.params.id;
    if (!sessionId) {
        return res.status(400).json({ message: "Identifiant de session requis" });
    }
    try {
        const session = await stripeClient_1.stripe.checkout.sessions.retrieve(sessionId);
        return res.status(200).json({ session });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Impossible de récupérer la session Stripe.";
        console.error("[Stripe webhook] Impossible de récupérer la session Stripe", { sessionId, error: errorMessage });
        return res.status(404).json({ message: "Session Stripe introuvable" });
    }
}
async function processCheckoutCompletedEvent(session, stripeEventId, correlationId) {
    const metadata = session?.metadata || {};
    const metaOrderId = metadata.orderId;
    const clientReferenceId = typeof session.client_reference_id === "string"
        ? session.client_reference_id
        : undefined;
    const userIdFromMetadata = metadata.userId;
    const itemsJson = metadata.items;
    const billingNameFromMetadata = metadata.billingName?.trim() || "";
    const billingEmailFromMetadata = metadata.billingEmail?.trim() || "";
    const billingAddressFromMetadata = metadata.billingAddress?.trim() || "";
    const acceptedTerms = metadata.acceptedTerms === "true";
    const acceptedLicense = metadata.acceptedLicense === "true";
    const paymentIntentId = extractPaymentIntentId(session.payment_intent);
    const sessionId = session?.id || null;
    let order = null;
    let resolvedBy = "unknown";
    if (metaOrderId) {
        order = await prisma_1.prisma.order.findUnique({
            where: { id: metaOrderId },
            include: { items: true, invoice: true },
        });
        if (order) {
            resolvedBy = "metadata";
        }
    }
    if (!order && clientReferenceId) {
        order = await prisma_1.prisma.order.findUnique({
            where: { id: clientReferenceId },
            include: { items: true, invoice: true },
        });
        if (order) {
            resolvedBy = "client_reference_id";
        }
    }
    if (!order && sessionId) {
        order = await prisma_1.prisma.order.findFirst({
            where: { stripeSessionId: sessionId },
            include: { items: true, invoice: true },
        });
        if (order) {
            resolvedBy = "stripeSessionId";
        }
    }
    if (!order) {
        console.error("[Stripe webhook] Order introuvable pour checkout.session.completed", {
            eventId: stripeEventId,
            sessionId,
            clientReferenceId,
            metadataOrderId: metaOrderId,
            resolvedBy,
        }, correlationId);
        return {
            message: "Order introuvable (metadata absente + pas de match stripeSessionId)",
            status: "NOT_FOUND",
        };
    }
    console.log(`[Stripe webhook] checkout.session.completed eventId=${stripeEventId} sessionId=${sessionId} orderId=${order.id} resolvedBy=${resolvedBy}`, correlationId);
    const userId = userIdFromMetadata || order.userId;
    const normalizePlatform = (value) => {
        if (typeof value !== "string")
            return undefined;
        const upper = value.trim().toUpperCase();
        return upper === "WINDOWS" || upper === "MACOS"
            ? upper
            : undefined;
    };
    let parsedItems = [];
    if (itemsJson) {
        try {
            const raw = JSON.parse(itemsJson);
            if (Array.isArray(raw)) {
                parsedItems = raw.map((it) => ({
                    productId: String(it.productId),
                    quantity: it.quantity && Number(it.quantity) > 0 ? Number(it.quantity) : 1,
                    binaryId: it.binaryId ? String(it.binaryId) : null,
                    platform: normalizePlatform(it.platform) || null,
                }));
            }
        }
        catch (err) {
            console.error("[Stripe webhook] Impossible de parser metadata.items :", err, correlationId);
            return { orderId: order.id, message: "items invalides", status: "ERROR" };
        }
    }
    else if (order.items?.length) {
        parsedItems = order.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            binaryId: it.binaryId,
            platform: it.platform,
        }));
    }
    if (parsedItems.length === 0) {
        console.error("[Stripe webhook] Liste des produits vide après parsing metadata.items.", correlationId);
        return { orderId: order.id, message: "aucun produit", status: "ERROR" };
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        console.error("[Stripe webhook] Utilisateur introuvable pour userId :", userId, correlationId);
        return { message: "utilisateur introuvable", status: "ERROR" };
    }
    let orderOwner = user;
    const productIds = parsedItems.map((it) => it.productId);
    const products = await prisma_1.prisma.downloadableProduct.findMany({
        where: {
            id: { in: productIds },
            isActive: true,
        },
        include: { binaries: true },
    });
    if (products.length === 0) {
        console.error("[Stripe webhook] Aucun produit valide trouvé pour la commande. userId :", userId, correlationId);
        return { message: "produits invalides", status: "ERROR" };
    }
    const productMap = products.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
    }, {});
    const hasInvalidBinary = parsedItems.some((item) => {
        const product = productMap[item.productId];
        if (!product)
            return true;
        if (!product.binaries?.length)
            return false;
        if (item.binaryId) {
            return !product.binaries.some((binary) => binary.id === item.binaryId);
        }
        if (item.platform) {
            return !product.binaries.some((binary) => binary.platform === item.platform);
        }
        return false;
    });
    if (hasInvalidBinary) {
        console.error("[Stripe webhook] Binaire sélectionné introuvable pour la commande. userId :", userId, correlationId);
        return { message: "binaire invalide", status: "ERROR" };
    }
    const payableCents = session.amount_total || 0;
    const currency = session.currency?.toUpperCase() ||
        products[0]?.currency ||
        "EUR";
    const promoCodeId = metadata.promoCodeId || order.promoCodeId || "";
    const promoDiscountCentsRaw = metadata.promoDiscountCents || order.discountAmount?.toString() || "0";
    const promoDiscountCents = Number(promoDiscountCentsRaw) || 0;
    const promoCodeUsed = metadata.promoCode || (order.promoCodeId ? "promo-applied" : "");
    const orderWasAlreadyPaid = order.status === "PAID";
    if (order.userId !== user.id) {
        console.warn("[Stripe webhook] userId du webhook différent de celui de la commande", { metadataUserId: user.id, orderUserId: order.userId }, correlationId);
        const refreshedOwner = await prisma_1.prisma.user.findUnique({
            where: { id: order.userId },
        });
        if (refreshedOwner) {
            orderOwner = refreshedOwner;
        }
    }
    if (!orderOwner) {
        console.error("[Stripe webhook] Impossible de résoudre l'utilisateur propriétaire de la commande", order.id, correlationId);
        return { orderId: order.id, message: "utilisateur manquant", status: "ERROR" };
    }
    const orderAlreadyPaid = orderWasAlreadyPaid || order.status === "PAID";
    if (order.stripeEventId === stripeEventId || order.status === "PAID") {
        console.log("[Stripe webhook] Événement déjà appliqué sur la commande", { orderId: order.id, stripeEventId }, correlationId);
        return {
            orderId: order.id,
            message: "événement déjà traité",
            status: "PROCESSED",
        };
    }
    if (!order.items?.length) {
        await prisma_1.prisma.order.update({
            where: { id: order.id },
            data: {
                items: { create: buildOrderItemsPayload(parsedItems, productMap) },
            },
        });
    }
    const orderUpdatePayload = {
        status: "PAID",
        paidAt: order.paidAt || new Date(),
        stripeSessionId: session?.id || order.stripeSessionId,
        stripePaymentIntentId: paymentIntentId || order.stripePaymentIntentId,
        stripeEventId: stripeEventId,
        totalPaid: payableCents || order.totalPaid,
        currency,
        billingNameSnapshot: order.billingNameSnapshot || billingNameFromMetadata || null,
        billingEmailSnapshot: order.billingEmailSnapshot || billingEmailFromMetadata || null,
        billingAddressSnapshot: order.billingAddressSnapshot || billingAddressFromMetadata || null,
        downloadToken: order.downloadToken || generateOrderDownloadToken(),
    };
    await prisma_1.prisma.order.update({
        where: { id: order.id },
        data: orderUpdatePayload,
    });
    console.log("[Stripe webhook] Commande passée en PAID", { orderId: order.id }, correlationId);
    await (0, downloadLinkService_1.generateDownloadLinksForOrder)(order.id, order.userId);
    const orderWithRelations = await prisma_1.prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true, invoice: true },
    });
    let invoice = orderWithRelations?.invoice || null;
    if (!invoice && orderWithRelations) {
        invoice = await (0, invoiceService_1.createInvoiceForOrder)({
            order: orderWithRelations,
            user: orderOwner,
            billingEmail: billingEmailFromMetadata || orderWithRelations.billingEmailSnapshot ||
                orderOwner.email,
            billingName: billingNameFromMetadata || orderWithRelations.billingNameSnapshot ||
                undefined,
            billingAddress: billingAddressFromMetadata || orderWithRelations.billingAddressSnapshot,
        });
    }
    const invoiceCreatedNow = !orderWithRelations?.invoice && Boolean(invoice);
    if (!orderAlreadyPaid && promoCodeId && promoDiscountCents > 0) {
        await prisma_1.prisma.promoCode.update({
            where: { id: promoCodeId },
            data: {
                currentUses: {
                    increment: 1,
                },
            },
        });
        if (promoCodeUsed) {
            console.log("[Stripe webhook] Code promo appliqué et incrémenté :", promoCodeUsed, correlationId);
        }
    }
    if (!orderAlreadyPaid) {
        await (0, transactionalEmailService_1.sendOrderConfirmationEmail)(order.id);
    }
    if (invoice && (invoiceCreatedNow || !orderAlreadyPaid)) {
        await (0, transactionalEmailService_1.sendInvoiceAvailableEmail)(invoice.id);
    }
    console.log(`[Stripe webhook] Order finalized orderId=${order.id}`, correlationId);
    return { orderId: order.id, message: "Commande validée", status: "PROCESSED" };
}
async function getDownloadCheckoutConfirmation(req, res) {
    const request = req;
    try {
        const userId = request.user?.id;
        const sessionId = req.query.session_id;
        const orderId = req.query.order_id;
        if (!userId) {
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }
        if ((!sessionId || !sessionId.trim()) && (!orderId || !orderId.trim())) {
            return res
                .status(400)
                .json({ message: "Identifiant de paiement manquant." });
        }
        const order = await prisma_1.prisma.order.findFirst({
            where: orderId
                ? { id: orderId, userId }
                : { stripeSessionId: sessionId || "", userId },
            include: {
                items: {
                    include: {
                        product: true,
                        downloadLinks: true,
                    },
                },
            },
        });
        if (!order) {
            return res.status(202).json({ message: "Commande en cours de validation." });
        }
        if (order.status !== "PAID" || !order.paidAt) {
            return res
                .status(202)
                .json({ message: "Paiement en cours de validation.", status: order.status });
        }
        const activeDownloadLink = order.items
            .flatMap((item) => item.downloadLinks)
            .find((link) => link.status === "ACTIVE");
        const primaryItem = order.items[0];
        return res.status(200).json({
            status: order.status,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                paidAt: order.paidAt,
                currency: order.currency,
                totalPaid: order.totalPaid,
                firstProductName: primaryItem?.productNameSnapshot || primaryItem?.product?.name || "",
            },
            orderDownloadToken: order.downloadToken,
            download: activeDownloadLink && primaryItem
                ? {
                    token: activeDownloadLink.token,
                    productName: primaryItem.productNameSnapshot || primaryItem.product?.name,
                }
                : null,
        });
    }
    catch (error) {
        console.error("Erreur lors de la confirmation Stripe :", error);
        return res.status(500).json({
            message: "Impossible de vérifier la confirmation de paiement. Merci de réessayer.",
        });
    }
}
