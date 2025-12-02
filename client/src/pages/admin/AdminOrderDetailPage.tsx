import React from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface DownloadLinkDto {
  id: string;
  token: string;
  status: string;
  downloadCount: number;
  maxDownloads: number;
  firstDownloadedAt?: string | null;
  lastDownloadedAt?: string | null;
  expiresAt?: string | null;
}

interface OrderItemDto {
  id: string;
  productNameSnapshot: string;
  quantity: number;
  priceCents: number;
  lineTotal: number;
  downloadLinks?: DownloadLinkDto[];
  product?: { name: string };
}

interface OrderDetailDto {
  id: string;
  createdAt: string;
  paidAt?: string | null;
  status: string;
  totalPaid: number;
  totalBeforeDiscount: number;
  discountAmount: number;
  currency: string;
  promoCode?: { code: string } | null;
  invoice?: { id: string; invoiceNumber: string } | null;
  user?: { email: string; firstName?: string | null; lastName?: string | null } | null;
  items: OrderItemDto[];
}

const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = React.useState<OrderDetailDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const loadOrder = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger la commande.");
      }
      setOrder(data.order as OrderDetailDto);
    } catch (err: any) {
      console.error("Erreur chargement commande", err);
      setError(err?.message || "Erreur lors du chargement de la commande.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleMarkRefunded = async () => {
    if (!order) return;
    try {
      setError(null);
      setSuccess(null);
      const response = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/refund`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de mettre à jour le statut.");
      }
      setOrder(data.order as OrderDetailDto);
      setSuccess("Commande mise à jour en remboursée.");
    } catch (err: any) {
      console.error("Erreur remboursement commande", err);
      setError(err?.message || "Impossible de mettre à jour la commande.");
    }
  };

  const handleRegenerateLink = async (orderItemId: string) => {
    try {
      setError(null);
      setSuccess(null);
      const response = await fetch(
        `${API_BASE_URL}/admin/orders/${orderItemId}/regenerate-link`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de régénérer le lien de téléchargement."
        );
      }
      setSuccess("Lien de téléchargement régénéré.");
      await loadOrder();
    } catch (err: any) {
      console.error("Erreur régénération lien", err);
      setError(err?.message || "Impossible de régénérer le lien.");
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    `${(amount / 100).toFixed(2)} ${currency}`;

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  };

  if (isLoading) {
    return <p className="text-xs text-slate-600">Chargement de la commande...</p>;
  }

  if (!order) {
    return <p className="text-xs text-red-600">{error || "Commande introuvable."}</p>;
  }

  const totalLabel = formatCurrency(order.totalPaid, order.currency);
  const buyerName = `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim();

  return (
    <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Commande {order.id}</h1>
          <p className="text-xs text-slate-600">
            Détails de la commande et gestion des liens de téléchargement.
          </p>
        </div>
        <div className="space-x-2">
          <button
            type="button"
            onClick={handleMarkRefunded}
            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black"
          >
            Marquer remboursée
          </button>
        </div>
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {success && <p className="text-[11px] text-green-600">{success}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1 text-xs text-slate-700">
          <p>Date création : {formatDateTime(order.createdAt)}</p>
          <p>Date paiement : {formatDateTime(order.paidAt)}</p>
          <p>Statut : {order.status}</p>
          {order.promoCode?.code && <p>Code promo : {order.promoCode.code}</p>}
        </div>
        <div className="space-y-1 text-xs text-slate-700">
          <p>Client : {buyerName || "—"}</p>
          <p>Email : {order.user?.email || "—"}</p>
          <p>Total TTC : {totalLabel}</p>
          {order.discountAmount > 0 && (
            <p>Remise : -{formatCurrency(order.discountAmount, order.currency)}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-black">Produits</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-white">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">Désignation</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">Qté</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">PU</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">Total</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">Liens</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="odd:bg-white even:bg-white">
                  <td className="px-3 py-2 text-slate-800">
                    {item.productNameSnapshot || item.product?.name}
                  </td>
                  <td className="px-3 py-2 text-slate-800">{item.quantity}</td>
                  <td className="px-3 py-2 text-slate-800">
                    {formatCurrency(item.priceCents, order.currency)}
                  </td>
                  <td className="px-3 py-2 text-slate-800">
                    {formatCurrency(item.lineTotal, order.currency)}
                  </td>
                  <td className="px-3 py-2 text-slate-800">
                    <div className="space-y-1">
                      {(item.downloadLinks || []).map((link) => {
                        const shortToken = `${link.token.slice(0, 8)}…${link.token.slice(-4)}`;
                        return (
                          <div
                            key={link.id}
                            className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-[11px]"
                          >
                            <div>
                              <div className="font-semibold text-slate-800">{shortToken}</div>
                              <div className="text-slate-500">
                                Statut : {link.status} – {link.downloadCount}/{link.maxDownloads}
                              </div>
                              <div className="text-slate-500">
                                Première utilisation : {formatDateTime(link.firstDownloadedAt)}
                              </div>
                              <div className="text-slate-500">
                                Expiration : {formatDateTime(link.expiresAt)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  `${API_BASE_URL}/downloads/${link.token}`
                                )
                              }
                              className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black"
                            >
                              Copier
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => handleRegenerateLink(item.id)}
                        className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black"
                      >
                        Régénérer le lien
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {order.invoice?.id && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-black">Facture</h2>
          <p className="text-xs text-slate-700">
            Numéro : {order.invoice.invoiceNumber || "—"}
          </p>
          <div className="space-x-2">
            <Link
              to={`/admin/invoices/${order.invoice.id}`}
              className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black"
            >
              Voir la facture
            </Link>
            <button
              type="button"
              onClick={() =>
                window.open(
                  `${API_BASE_URL}/admin/invoices/${order.invoice?.id}/download`,
                  "_blank"
                )
              }
              className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black"
            >
              Télécharger le PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetailPage;
