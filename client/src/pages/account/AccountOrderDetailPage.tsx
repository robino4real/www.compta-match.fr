import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface InvoiceDetail {
  id: string;
  invoiceNumber?: string | null;
  downloadUrl?: string | null;
}

interface OrderItemDetail {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  lineTotal: number;
  platform?: string | null;
}

interface OrderAdjustment {
  id: string;
  type: string;
  status: string;
  amountCents: number;
  currency: string;
  clientNote?: string | null;
  adminNote?: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber?: string;
  createdAt: string;
  status: string;
  totalPaid: number;
  currency: string;
  invoice?: InvoiceDetail | null;
  items: OrderItemDetail[];
  adjustments?: OrderAdjustment[];
}

interface DownloadLinkState {
  token: string;
  expiresAt?: string | null;
  downloadUrl: string;
  remainingSeconds?: number | null;
}

interface DownloadState {
  hasDownloadableProduct: boolean;
  activeLink?: DownloadLinkState | null;
  isExpired?: boolean;
}

const statusLabel: Record<string, string> = {
  PAID: "Payée",
  PENDING: "En attente",
  FAILED: "Échouée",
  REFUNDED: "Remboursée",
  CANCELLED: "Annulée",
  EN_ATTENTE_DE_PAIEMENT: "En attente de paiement",
};

const statusColor: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-rose-50 text-rose-700",
  REFUNDED: "bg-sky-50 text-sky-700",
  CANCELLED: "bg-slate-100 text-slate-700",
  EN_ATTENTE_DE_PAIEMENT: "bg-amber-50 text-amber-700",
};

const AccountOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [download, setDownload] = React.useState<DownloadState | null>(null);
  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const fetchOrder = React.useCallback(async () => {
    if (!orderId) {
      setError("Identifiant de commande manquant.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/account/orders/${orderId}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de charger cette commande.");
      }

      setOrder(data?.order as OrderDetail);
      setDownload(data?.download as DownloadState);
      setRemainingSeconds((data?.download?.activeLink?.remainingSeconds as number | undefined) ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  React.useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paidParam = params.get("paid");

    if (paidParam === "1") {
      setSuccessMessage("Paiement reçu. Votre commande est à jour.");
      fetchOrder();
      navigate(location.pathname, { replace: true });
    }
  }, [fetchOrder, location.pathname, location.search, navigate]);

  React.useEffect(() => {
    const expiresAt = download?.activeLink?.expiresAt;

    if (!expiresAt) {
      setRemainingSeconds(null);
      return undefined;
    }

    const updateRemaining = () => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      setRemainingSeconds(diff > 0 ? diff : 0);

      if (diff <= 0) {
        setDownload((prev) =>
          prev
            ? {
                ...prev,
                activeLink: null,
                isExpired: true,
              }
            : prev
        );
      }
    };

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(interval);
  }, [download?.activeLink?.expiresAt]);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount / 100);
  };

  const formatRemaining = (value: number | null) => {
    if (value == null) return null;
    const minutes = Math.floor(value / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(value % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const activeExtraPayment = React.useMemo(() => {
    if (!order?.adjustments?.length) return null;

    return order.adjustments.find(
      (adj) =>
        adj.type === "EXTRA_PAYMENT" &&
        (adj.status === "PENDING" || adj.status === "SENT")
    );
  }, [order]);

  const isAwaitingExtraPayment =
    order?.status === "EN_ATTENTE_DE_PAIEMENT" && Boolean(activeExtraPayment);

  const handleExtraPayment = async () => {
    if (!order || !activeExtraPayment) return;
    setPaymentError(null);
    setSuccessMessage(null);
    setIsRedirecting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/account/orders/${order.id}/extra-payment/session`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de démarrer le paiement.");
      }

      if (data.alreadyPaid) {
        setSuccessMessage("Paiement déjà enregistré. Actualisation en cours...");
        await fetchOrder();
        return;
      }

      if (data?.url) {
        setSuccessMessage("Redirection vers Stripe…");
        window.location.href = data.url as string;
        return;
      }

      throw new Error("Lien de paiement introuvable.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de la redirection.";
      setPaymentError(message);
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!orderId) return;
    setActionError(null);
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/account/orders/${orderId}/download-link`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de générer le lien, contactez le support.");
      }

      const nextDownload: DownloadState = {
        hasDownloadableProduct: true,
        isExpired: false,
        activeLink: data.link as DownloadLinkState,
      };

      setDownload(nextDownload);
      setRemainingSeconds((data.link?.remainingSeconds as number | undefined) ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setActionError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const url = download?.activeLink?.downloadUrl;
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isLinkExpired = (download?.isExpired ?? false) || (remainingSeconds !== null && remainingSeconds <= 0);

  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="h-5 w-48 rounded-full bg-slate-100" />
      <div className="h-28 rounded-2xl bg-slate-100" />
      <div className="h-24 rounded-2xl bg-slate-100" />
    </div>
  );

  return (
    <main className="bg-white min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/compte/commandes")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-black hover:text-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.6}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5m-7.5 7.5h12" />
            </svg>
            Retour aux commandes
          </button>

          {order && (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                statusColor[order.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {statusLabel[order.status] || order.status}
            </span>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Commande</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            {order
              ? `Commande ${order.orderNumber || `${order.id.slice(0, 8)}…`}`
              : "Détail de la commande"}
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Retrouvez les informations de paiement, la facture et vos téléchargements sécurisés.
          </p>
        </div>

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-800 shadow-sm">
            {successMessage}
          </div>
        )}

        {isLoading && renderSkeleton()}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-800 shadow-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && order && (
          <div className="space-y-6">
            {isAwaitingExtraPayment && activeExtraPayment && (
              <section className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1 text-amber-900">
                    <p className="text-sm font-semibold uppercase tracking-wide">Paiement complémentaire requis</p>
                    <p className="text-sm text-amber-800">
                      {activeExtraPayment.clientNote ||
                        "Un complément est nécessaire pour finaliser votre commande."}
                    </p>
                    <p className="text-sm font-semibold">
                      Montant dû : {formatPrice(activeExtraPayment.amountCents, activeExtraPayment.currency)}
                    </p>
                  </div>

                  <button
                    onClick={handleExtraPayment}
                    disabled={isRedirecting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    {isRedirecting ? "Redirection..." : "Payer le complément"}
                  </button>
                </div>

                {paymentError && (
                  <div className="mt-3 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-700">
                    {paymentError}
                  </div>
                )}
              </section>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Résumé</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    Total {formatPrice(order.totalPaid, order.currency)}
                  </p>
                  <p className="text-sm text-slate-600">
                    Passée le {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Articles</p>
                  <ul className="mt-2 space-y-1">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-4">
                        <span className="line-clamp-1 text-slate-700">{item.productName}</span>
                        <span className="text-xs text-slate-500">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Facture</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Téléchargez votre facture officielle au format PDF.
                  </p>
                </div>

                {order.invoice?.downloadUrl ? (
                  <a
                    href={order.invoice.downloadUrl}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                  >
                    Télécharger la facture
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.6}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5h15m-12-6 4.5 4.5 4.5-4.5m-4.5 4.5V3" />
                    </svg>
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">Facture en cours de génération…</span>
                )}
              </div>
            </section>

            {order.status === "PAID" && download?.hasDownloadableProduct && (
              <section className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Téléchargement sécurisé</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Un lien unique valable 1h est généré pour protéger votre logiciel.
                    </p>
                  </div>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75A2.25 2.25 0 0 0 6.75 21.75Z"
                      />
                    </svg>
                  </span>
                </div>

                {actionError && (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {actionError}
                  </div>
                )}

                <div className="mt-4 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  {download.activeLink ? (
                    <>
                      <div className="flex flex-col gap-1 text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">Lien actif</span>
                        {download.activeLink.expiresAt && (
                          <span className="text-xs text-slate-600">
                            Expire le {new Date(download.activeLink.expiresAt).toLocaleString("fr-FR")}
                          </span>
                        )}
                        {remainingSeconds !== null && remainingSeconds > 0 && (
                          <span className="text-xs font-semibold text-emerald-700">
                            Lien valable encore {formatRemaining(remainingSeconds)}
                          </span>
                        )}
                        {isLinkExpired && (
                          <span className="text-xs font-semibold text-amber-700">Lien expiré</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleDownload}
                          disabled={isLinkExpired}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Télécharger
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.6}
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5h15m-12-6 4.5 4.5 4.5-4.5m-4.5 4.5V3" />
                          </svg>
                        </button>

                        <button
                          onClick={handleGenerateLink}
                          disabled={isGenerating}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Régénérer un lien
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm text-slate-700">
                        {isLinkExpired
                          ? "Le lien précédent a expiré. Générer un nouveau lien valable 1h."
                          : "Générez un lien de téléchargement valable 1h pour récupérer votre logiciel."}
                      </div>
                      <button
                        onClick={handleGenerateLink}
                        disabled={isGenerating}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {isGenerating ? "Génération..." : "Générer un lien"}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default AccountOrderDetailPage;
