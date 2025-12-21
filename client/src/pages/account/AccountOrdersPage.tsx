import React from "react";
import { API_BASE_URL } from "../../config/api";

interface InvoiceSummary {
  id: string;
  invoiceNumber?: string | null;
  pdfPath?: string | null;
}

interface OrderItemSummary {
  id: string;
  product?: { name: string } | null;
  lineTotal: number;
  quantity: number;
}

interface OrderSummary {
  id: string;
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
};

const AccountOrdersPage: React.FC = () => {
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

  return (
    <main className="page-halo-neutral bg-white min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Espace client</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Mes commandes</h1>
          <p className="text-sm text-slate-600 mt-2">
            Accédez à l'historique de vos commandes et à vos factures.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-600 shadow-sm">
            Chargement de vos commandes...
          </div>
        )}

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
                      Montant TTC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Facture
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
                        {order.id.slice(0, 8)}…
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
                          {order.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {order.invoice?.pdfPath ? (
                          <a
                            href={order.invoice.pdfPath}
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
