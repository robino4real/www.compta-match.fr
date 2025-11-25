import React from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface UserDownload {
  id: string;
  token: string;
  productId: string;
  productName: string;
  productDescription?: string | null;
  priceCents: number;
  orderCreatedAt: string;
  downloadFirstAt: string | null;
  downloadExpiresAt: string | null;
  downloadCount: number;
  maxDownloads?: number;
  status?: string;
  remainingMs?: number | null;
  isExpired?: boolean;
}

interface OrderDownloadLinkDto {
  id: string;
  token: string;
  status: string;
  downloadCount: number;
  maxDownloads: number;
}

interface OrderItemDto {
  id: string;
  productNameSnapshot: string;
  quantity: number;
  lineTotal: number;
  downloadLinks?: OrderDownloadLinkDto[];
}

interface OrderDto {
  id: string;
  createdAt: string;
  paidAt?: string | null;
  totalPaid: number;
  totalBeforeDiscount: number;
  discountAmount: number;
  currency: string;
  promoCode?: { code: string } | null;
  invoice?: { id: string; invoiceNumber: string; pdfPath?: string | null } | null;
  items: OrderItemDto[];
}

const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const hasActiveSubscription = false; // TODO: sera remplacé par une vraie info API plus tard

  const [downloads, setDownloads] = React.useState<UserDownload[]>([]);
  const [isLoadingDownloads, setIsLoadingDownloads] = React.useState(false);
  const [downloadsError, setDownloadsError] = React.useState<string | null>(
    null
  );
  const [orders, setOrders] = React.useState<OrderDto[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(false);
  const [ordersError, setOrdersError] = React.useState<string | null>(null);
  const [now, setNow] = React.useState<number>(Date.now());

  React.useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  React.useEffect(() => {
    const fetchDownloads = async () => {
      try {
        setIsLoadingDownloads(true);
        setDownloadsError(null);

        const response = await fetch(`${API_BASE_URL}/downloads/me`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Impossible de récupérer vos logiciels téléchargeables."
          );
        }

        const list: UserDownload[] = Array.isArray(data.downloads)
          ? data.downloads
          : [];

        setDownloads(list);
      } catch (err: any) {
        console.error("Erreur /downloads/me :", err);
        setDownloadsError(
          err?.message ||
            "Une erreur est survenue lors du chargement de vos téléchargements."
        );
      } finally {
        setIsLoadingDownloads(false);
      }
    };

    fetchDownloads();
  }, []);

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoadingOrders(true);
        setOrdersError(null);

        const response = await fetch(`${API_BASE_URL}/orders/me`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Impossible de récupérer votre historique."
          );
        }

        const list: OrderDto[] = Array.isArray(data.orders)
          ? data.orders
          : [];

        setOrders(list);
      } catch (error: any) {
        console.error("Erreur /orders/me :", error);
        setOrdersError(
          error?.message ||
            "Une erreur est survenue lors du chargement de vos commandes."
        );
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, []);

  const formatRemaining = (download: UserDownload): string => {
    if (download.status === "USED") {
      return "Lien déjà utilisé.";
    }

    if (download.status === "EXPIRED") {
      return "Lien expiré.";
    }

    if (
      download.maxDownloads != null &&
      download.downloadCount >= download.maxDownloads
    ) {
      return "Lien déjà utilisé.";
    }

    if (!download.downloadExpiresAt) {
      return "Jamais téléchargé — la première utilisation activera une fenêtre de 1h.";
    }

    const expiresAt = new Date(download.downloadExpiresAt).getTime();
    const diff = expiresAt - now;

    if (diff <= 0) {
      return "Lien expiré.";
    }

    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `Lien actif — expire dans ${minutes} min ${seconds
      .toString()
      .padStart(2, "0")} s.`;
  };

  const isDownloadExpired = (download: UserDownload): boolean => {
    if (download.status === "USED" || download.status === "EXPIRED") {
      return true;
    }

    if (!download.downloadExpiresAt) {
      return false;
    }
    const expiresAt = new Date(download.downloadExpiresAt).getTime();
    return expiresAt <= now;
  };

  const handleDownloadClick = (download: UserDownload) => {
    if (!download.token) return;
    if (isDownloadExpired(download)) return;

    const url = `${API_BASE_URL}/downloads/${download.token}`;
    window.open(url, "_blank");
  };

  const findFirstActiveDownloadToken = (order: OrderDto) => {
    const link = order.items
      .flatMap((item) => item.downloadLinks || [])
      .find((l) => l.status === "ACTIVE");

    return link?.token;
  };

  const handleInvoiceDownload = (invoiceId?: string) => {
    if (!invoiceId) return;
    const url = `${API_BASE_URL}/invoices/${invoiceId}/download`;
    window.open(url, "_blank");
  };

  const handleOrderDownload = (token?: string) => {
    if (!token) return;
    const url = `${API_BASE_URL}/downloads/${token}`;
    window.open(url, "_blank");
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${(amount / 100).toFixed(2)} ${currency}`;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr,0.9fr]">
      <section className="space-y-4">
        {!hasActiveSubscription && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h1 className="text-base font-semibold text-black">
                COMPTABILITÉ – Offres d&apos;application web
              </h1>
              <p className="text-xs text-slate-600">
                Choisissez une formule pour activer l&apos;application comptable dans votre espace client.
                Les textes et tarifs ci-dessous sont indicatifs et seront ajustés plus tard.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-black">Découverte (essai 7 jours)</h2>
                  <p className="text-xs text-slate-500">Pour tester l&apos;application sur vos premiers dossiers.</p>
                </div>
                <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside">
                  <li>Accès guidé aux principales fonctionnalités</li>
                  <li>Support email pendant l&apos;essai</li>
                  <li>Exports simples (PDF/CSV)</li>
                </ul>
                <div className="text-sm font-semibold text-black">0€ pendant 7 jours</div>
                <button
                  type="button"
                  className="w-full rounded-full border border-black px-3 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition"
                  onClick={() => alert("TODO: tunnel de vente")}
                >
                  Essayer
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-black">Standard</h2>
                  <p className="text-xs text-slate-500">Suivi comptable et facturation récurrente pour TPE.</p>
                </div>
                <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside">
                  <li>Automatisations courantes et imports bancaires</li>
                  <li>Tableaux de bord trésorerie et TVA</li>
                  <li>Partage avec votre expert-comptable</li>
                  <li>Support prioritaire</li>
                </ul>
                <div className="text-sm font-semibold text-black">39€ / mois (indicatif)</div>
                <button
                  type="button"
                  className="w-full rounded-full border border-black px-3 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition"
                  onClick={() => alert("TODO: tunnel de vente")}
                >
                  Essayer
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-black">Plus</h2>
                  <p className="text-xs text-slate-500">Fonctionnalités avancées et équipes multi-utilisateurs.</p>
                </div>
                <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside">
                  <li>Workflows personnalisables</li>
                  <li>Gestion des immobilisations et actifs</li>
                  <li>Exports avancés pour reporting</li>
                  <li>Support prioritaire dédié</li>
                </ul>
                <div className="text-sm font-semibold text-black">69€ / mois (indicatif)</div>
                <button
                  type="button"
                  className="w-full rounded-full border border-black px-3 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition"
                  onClick={() => alert("TODO: tunnel de vente")}
                >
                  Essayer
                </button>
              </div>
            </div>

            {/* TODO: afficher un bloc d'accès direct à l'application quand l'abonnement est actif */}
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-black">
                Mes commandes & factures
              </h2>
              <p className="text-[11px] text-slate-600">
                Historique de vos achats de logiciels téléchargeables. Téléchargez
                vos factures et vos logiciels directement depuis cet espace.
              </p>
            </div>
          </div>

          {isLoadingOrders && (
            <p className="text-xs text-slate-500">
              Chargement de vos commandes...
            </p>
          )}

          {ordersError && <p className="text-xs text-red-600">{ordersError}</p>}

          {!isLoadingOrders && !ordersError && orders.length === 0 && (
            <p className="text-xs text-slate-500">
              Vous n&apos;avez pas encore passé de commande.
            </p>
          )}

          {!isLoadingOrders && !ordersError && orders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">
                      Produits
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">
                      Montant TTC
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">
                      Code promo
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">
                      Facture
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">
                      Téléchargement
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const firstItem = order.items[0];
                    const extraCount = Math.max(order.items.length - 1, 0);
                    const productsLabel = `${firstItem?.productNameSnapshot || "Produit"}${
                      extraCount > 0 ? ` + ${extraCount} autre(s)` : ""
                    }`;
                    const invoiceLabel = order.invoice?.invoiceNumber || "—";
                    const downloadToken = findFirstActiveDownloadToken(order);

                    return (
                      <tr key={order.id} className="odd:bg-white even:bg-slate-50">
                        <td className="px-3 py-2 align-top text-slate-700">
                          {new Date(order.paidAt || order.createdAt)
                            .toISOString()
                            .slice(0, 10)}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-800">{productsLabel}</td>
                        <td className="px-3 py-2 align-top text-slate-800">
                          {formatCurrency(order.totalPaid, order.currency)}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-700">
                          {order.promoCode?.code || "—"}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-700">
                          {order.invoice?.id ? (
                            <button
                              type="button"
                              onClick={() => handleInvoiceDownload(order.invoice?.id)}
                              className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black transition"
                            >
                              Télécharger ({invoiceLabel})
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">{invoiceLabel}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-700">
                          {downloadToken ? (
                            <button
                              type="button"
                              onClick={() => handleOrderDownload(downloadToken)}
                              className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black transition"
                            >
                              Télécharger
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Lien non disponible
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-black">
                Mes logiciels téléchargeables
              </h2>
              <p className="text-[11px] text-slate-600">
                Retrouvez ici les logiciels achetés en téléchargement. Les liens de
                téléchargement sont valables pendant une heure après le premier
                téléchargement.
              </p>
            </div>
          </div>

          {isLoadingDownloads && (
            <p className="text-xs text-slate-500">
              Chargement de vos logiciels téléchargeables...
            </p>
          )}

          {downloadsError && (
            <p className="text-xs text-red-600">{downloadsError}</p>
          )}

          {!isLoadingDownloads && !downloadsError && downloads.length === 0 && (
            <p className="text-xs text-slate-500">
              Vous n&apos;avez pas encore de logiciels téléchargeables associés à ce
              compte.
            </p>
          )}

          {!isLoadingDownloads && !downloadsError && downloads.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">
                      Produit
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">
                      Commandé le
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">
                      Téléchargements
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">
                      Statut
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.map((download) => {
                    const priceEuros = (download.priceCents ?? 0) / 100;
                    const orderedAt = download.orderCreatedAt
                      ? new Date(download.orderCreatedAt).toISOString().slice(0, 10)
                      : "—";
                    const expired = isDownloadExpired(download);

                    return (
                      <tr key={download.id} className="odd:bg-white even:bg-slate-50">
                        <td className="px-3 py-2 align-top text-slate-800">
                          <div className="space-y-1">
                            <div className="font-semibold">{download.productName}</div>
                            {download.productDescription && (
                              <div className="text-[11px] text-slate-600">
                                {download.productDescription}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-500">
                              {priceEuros.toFixed(2)} € TTC
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top text-slate-700">{orderedAt}</td>
                        <td className="px-3 py-2 align-top text-slate-700">
                          {download.downloadCount}/{download.maxDownloads ?? 1}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-700">
                          <span className="block text-[11px]">
                            Statut : {download.status || (download.isExpired ? "EXPIRED" : "ACTIVE")}
                          </span>
                          <span className="block text-[11px]">
                            {formatRemaining(download)}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top text-slate-700">
                          <button
                            type="button"
                            onClick={() => handleDownloadClick(download)}
                            disabled={expired}
                            className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Télécharger
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      <aside className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-black">Informations du compte</h3>
          <p className="text-xs text-slate-700">Email : {user?.email}</p>
          <p className="text-xs text-slate-700">Type de compte : Standard</p>
          <p className="text-xs text-slate-500">Vous pourrez modifier certaines informations ultérieurement.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-black">Abonnement</h3>
          {!hasActiveSubscription ? (
            <>
              <p className="text-xs text-slate-700">Aucun abonnement actif pour l&apos;instant.</p>
              <button
                type="button"
                className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
                onClick={() => alert("TODO: gestion abonnement")}
              >
                Gérer mon abonnement
              </button>
            </>
          ) : (
            <p className="text-xs text-slate-700">Votre abonnement COMPTABILITÉ est actif.</p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-black">COMPTABILITÉ</h3>
          <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
            <li>Accès à l&apos;application comptable depuis cet espace une fois l&apos;abonnement actif.</li>
            <li>Paramétrages adaptés à votre type d&apos;entreprise (TODO).</li>
            <li>Historique des actions et des accès (TODO).</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default AccountPage;
