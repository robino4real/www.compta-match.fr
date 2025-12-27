import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface InvoiceSummary {
  id: string;
  invoiceNumber?: string | null;
  pdfPath?: string | null;
}

interface OrderItemSummary {
  id: string;
  product?: { name: string } | null;
  productName?: string;
  lineTotal: number;
  quantity: number;
}

interface OrderSummary {
  id: string;
  orderNumber?: string;
  createdAt: string;
  status: string;
  totalPaid: number;
  currency: string;
  invoice?: InvoiceSummary | null;
  items?: OrderItemSummary[];
}

const statusColor: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-rose-50 text-rose-700",
  REFUNDED: "bg-sky-50 text-sky-700",
  CANCELLED: "bg-slate-100 text-slate-700",
};

const statusLabel: Record<string, string> = {
  PAID: "Payé",
  PENDING: "En attente",
  FAILED: "Échec",
  REFUNDED: "Remboursé",
  CANCELLED: "Annulée",
};

const AccountOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = React.useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/account/orders`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Impossible de charger les commandes.");
        }

        setOrders((data?.orders as OrderSummary[]) || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount / 100);
  };

  const renderSkeleton = () => (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 px-6 py-4 md:grid md:grid-cols-6 md:items-center animate-pulse"
          >
            <div className="h-4 rounded-full bg-slate-100" />
            <div className="h-4 rounded-full bg-slate-100" />
            <div className="h-4 rounded-full bg-slate-100" />
            <div className="h-6 rounded-full bg-slate-100 md:col-span-2" />
            <div className="h-8 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <main className="bg-white min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 space-y-6">
        <div className="flex">
          <button
            onClick={() => navigate("/compte")}
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
            Retour à mon profil
          </button>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Espace client</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Mes commandes</h1>
          <p className="text-sm text-slate-600 mt-2">
            Accédez à l'historique de vos commandes et à vos factures.
          </p>
        </div>

        {isLoading && renderSkeleton()}

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800 shadow-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && orders.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-600 shadow-sm">
            Vous n'avez pas encore passé de commande.
          </div>
        )}

        {!isLoading && !error && orders.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      N° commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Produit(s)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Montant TTC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Facture
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-white">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                        {order.orderNumber || `${order.id.slice(0, 8)}…`}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="flex flex-col gap-1">
                          {(order.items || []).map((item) => (
                            <span key={item.id} className="line-clamp-1">
                              {item.productName || item.product?.name || "Produit"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                        {formatPrice(order.totalPaid, order.currency)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            statusColor[order.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {statusLabel[order.status] || order.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {order.invoice?.downloadUrl || order.invoice?.pdfPath ? (
                          <a
                            href={order.invoice.downloadUrl || order.invoice.pdfPath}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
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
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 19.5h15m-12-6 4.5 4.5 4.5-4.5m-4.5 4.5V3"
                              />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">En attente</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        <button
                          onClick={() => navigate(`/compte/commandes/${order.id}`)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-black hover:text-black"
                        >
                          Voir détail
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.6}
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-600">
              Les liens de téléchargement restent disponibles dans vos emails de confirmation.
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default AccountOrdersPage;
