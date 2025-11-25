import React from "react";
import { Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface AdminOrderItem {
  id: string;
  createdAt: string;
  paidAt?: string | null;
  totalPaid: number;
  currency: string;
  status: string;
  promoCode?: { code: string } | null;
  invoice?: { id: string; invoiceNumber: string } | null;
  user?: { email: string } | null;
}

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = React.useState<AdminOrderItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchEmail, setSearchEmail] = React.useState("");
  const [searchStatus, setSearchStatus] = React.useState("");
  const [searchPromo, setSearchPromo] = React.useState("");

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchEmail) params.append("email", searchEmail);
      if (searchStatus) params.append("status", searchStatus);
      if (searchPromo) params.append("promoCode", searchPromo);
      const url = `${API_BASE_URL}/admin/orders${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url, { credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les commandes.");
      }
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err: any) {
      console.error("Erreur chargement commandes", err);
      setError(err?.message || "Erreur lors du chargement des commandes.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount: number, currency: string) =>
    `${(amount / 100).toFixed(2)} ${currency}`;

  return (
    <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Commandes</h1>
          <p className="text-xs text-slate-600">
            Suivi des commandes payées et accès rapide aux factures.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Email client</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="client@exemple.fr"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Statut</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="PAID">Payé</option>
            <option value="PENDING">En attente</option>
            <option value="FAILED">Échoué</option>
            <option value="REFUNDED">Remboursé</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Code promo</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={searchPromo}
            onChange={(e) => setSearchPromo(e.target.value)}
            placeholder="COMPTA20"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={loadOrders}
            className="rounded-full bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800"
          >
            Filtrer
          </button>
        </div>
      </div>

      {isLoading && (
        <p className="text-[11px] text-slate-600">Chargement des commandes...</p>
      )}
      {error && <p className="text-[11px] text-red-600">{error}</p>}

      {!isLoading && orders.length === 0 && !error && (
        <p className="text-[11px] text-slate-600">Aucune commande pour le moment.</p>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Date
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Commande
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Client
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Montant TTC
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Statut
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Code promo
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="odd:bg-white even:bg-slate-50">
                  <td className="px-3 py-2 align-top text-slate-700">
                    {new Date(order.paidAt || order.createdAt)
                      .toISOString()
                      .slice(0, 10)}
                  </td>
                  <td className="px-3 py-2 align-top text-slate-800">{order.id}</td>
                  <td className="px-3 py-2 align-top text-slate-800">
                    {order.user?.email || "—"}
                  </td>
                  <td className="px-3 py-2 align-top text-slate-800">
                    {formatCurrency(order.totalPaid, order.currency)}
                  </td>
                  <td className="px-3 py-2 align-top text-slate-800">{order.status}</td>
                  <td className="px-3 py-2 align-top text-slate-800">
                    {order.promoCode?.code || "—"}
                  </td>
                  <td className="px-3 py-2 align-top text-slate-800 space-x-2">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black"
                    >
                      Détail
                    </Link>
                    {order.invoice?.id && (
                      <Link
                        to={`/admin/invoices/${order.invoice.id}`}
                        className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black"
                      >
                        Facture
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
