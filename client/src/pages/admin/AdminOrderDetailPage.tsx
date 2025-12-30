import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

type AdjustmentMode = "PARTIAL_REFUND" | "EXTRA_PAYMENT";

interface OrderAdjustmentDto {
  id: string;
  type: AdjustmentMode;
  status: "PENDING" | "SENT" | "PAID" | "CANCELLED";
  amountCents: number;
  currency: string;
  adminNote?: string | null;
  clientNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrderItemDto {
  id: string;
  productNameSnapshot: string;
  quantity: number;
  priceCents: number;
  lineTotal: number;
  product?: { name: string; sku?: string | null };
}

interface OrderDetailDto {
  id: string;
  orderNumber?: string;
  createdAt: string;
  paidAt?: string | null;
  status: string;
  totalPaid: number;
  totalBeforeDiscount: number;
  discountAmount: number;
  currency: string;
  promoCode?: { code: string } | null;
  paymentMethod?: string | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    issueDate?: string | null;
    billingName?: string;
    billingEmail?: string;
    totalTTC?: number;
    pdfPath?: string | null;
  } | null;
  user?: { email: string; firstName?: string | null; lastName?: string | null } | null;
  items: OrderItemDto[];
  adjustments?: OrderAdjustmentDto[];
}

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, title, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-black"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="space-y-4 px-5 py-4 text-sm text-slate-800">{children}</div>
      </div>
    </div>
  );
};

const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = React.useState<OrderDetailDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [showRefundModal, setShowRefundModal] = React.useState(false);
  const [showAdjustModal, setShowAdjustModal] = React.useState(false);
  const [refundForm, setRefundForm] = React.useState({ amount: "", note: "" });
  const [adjustMode, setAdjustMode] = React.useState<AdjustmentMode>("PARTIAL_REFUND");
  const [adjustAmount, setAdjustAmount] = React.useState("");
  const [adjustAdminNote, setAdjustAdminNote] = React.useState("");
  const [adjustClientNote, setAdjustClientNote] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);
  const [refundLoading, setRefundLoading] = React.useState(false);
  const [adjustLoading, setAdjustLoading] = React.useState(false);

  const showTimedToast = React.useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadOrder = React.useCallback(async () => {
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
  }, [id]);

  React.useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const formatCurrency = (amount: number, currency: string) => `${(amount / 100).toFixed(2)} ${currency}`;

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PAID":
        return "Payée";
      case "PENDING":
      case "EN_ATTENTE_DE_PAIEMENT":
        return "En attente de paiement";
      case "CANCELLED":
        return "Annulée";
      case "REFUNDED":
        return "Remboursée";
      default:
        return status || "—";
    }
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-100 text-emerald-800";
      case "PENDING":
      case "EN_ATTENTE_DE_PAIEMENT":
        return "bg-amber-100 text-amber-800";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
      case "FAILED":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getAdjustmentStatus = (status: OrderAdjustmentDto["status"]) => {
    switch (status) {
      case "PENDING":
        return "En attente d'envoi";
      case "SENT":
        return "Envoyée";
      case "PAID":
        return "Payée";
      case "CANCELLED":
        return "Annulée";
      default:
        return status;
    }
  };

  const openRefundModal = () => {
    const defaultAmount = order ? (order.totalPaid / 100).toFixed(2) : "";
    setRefundForm({ amount: defaultAmount, note: "" });
    setShowRefundModal(true);
  };

  const openAdjustModal = (mode: AdjustmentMode) => {
    setAdjustMode(mode);
    setAdjustAmount("");
    setAdjustAdminNote("");
    setAdjustClientNote("");
    setShowAdjustModal(true);
  };

  const parseAmountToCents = (value: string) => {
    const normalized = value.replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    if (!Number.isFinite(parsed)) return NaN;
    return Math.round(parsed * 100);
  };

  const handleCancelOrder = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible d'annuler la commande.");
      }
      showTimedToast("success", data.message || "Commande annulée.");
      setShowCancelModal(false);
      await loadOrder();
    } catch (err: any) {
      showTimedToast("error", err?.message || "Erreur lors de l'annulation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!id) return;
    const amountValue = refundForm.amount.trim();
    const amountCents = amountValue ? parseAmountToCents(amountValue) : undefined;
    if (amountValue && (!amountCents || amountCents <= 0)) {
      showTimedToast("error", "Montant de remboursement invalide.");
      return;
    }

    setRefundLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amountCents,
          reason: refundForm.note || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de rembourser la commande.");
      }
      showTimedToast("success", data.message || "Remboursement effectué.");
      setShowRefundModal(false);
      await loadOrder();
    } catch (err: any) {
      showTimedToast("error", err?.message || "Erreur lors du remboursement.");
    } finally {
      setRefundLoading(false);
    }
  };

  const sendAdjustmentEmail = async (adjustmentId: string) => {
    if (!id || !adjustmentId) return;
    const response = await fetch(
      `${API_BASE_URL}/admin/orders/${id}/adjustments/${adjustmentId}/send`,
      {
        method: "POST",
        credentials: "include",
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Impossible d'envoyer la proposition.");
    }
    return data;
  };

  const handleAdjustSubmit = async () => {
    if (!id) return;
    const cents = parseAmountToCents(adjustAmount.trim());
    if (!Number.isFinite(cents) || cents <= 0) {
      showTimedToast("error", "Montant d'ajustement invalide.");
      return;
    }

    setAdjustLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mode: adjustMode,
          amountCents: cents,
          adminNote: adjustAdminNote || undefined,
          clientNote: adjustClientNote || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de modifier la commande.");
      }

      if (adjustMode === "EXTRA_PAYMENT" && data.adjustment?.id) {
        try {
          await sendAdjustmentEmail(data.adjustment.id as string);
          showTimedToast("success", "Proposition envoyée au client.");
        } catch (sendError: any) {
          showTimedToast("error", sendError?.message || "Proposition créée mais email non envoyé.");
        }
      } else {
        showTimedToast("success", data.message || "Ajustement appliqué.");
      }

      setShowAdjustModal(false);
      await loadOrder();
    } catch (err: any) {
      showTimedToast("error", err?.message || "Erreur lors de la modification.");
    } finally {
      setAdjustLoading(false);
    }
  };

  if (isLoading) {
    return <p className="text-xs text-slate-600">Chargement de la commande...</p>;
  }

  if (!order) {
    return <p className="text-xs text-red-600">{error || "Commande introuvable."}</p>;
  }

  const totalLabel = formatCurrency(order.totalPaid, order.currency);
  const buyerName = `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim();
  const adjustments = order.adjustments || [];

  return (
    <div className="space-y-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Commandes</p>
          <h1 className="text-xl font-semibold text-black">Détails de la commande</h1>
          <p className="text-sm text-slate-700">Commande {order.orderNumber || order.id}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:border-black"
              onClick={() => setShowCancelModal(true)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:border-black"
              onClick={openRefundModal}
            >
              Rembourser
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-black"
              onClick={() => openAdjustModal("EXTRA_PAYMENT")}
            >
              Modifier
            </button>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 text-right md:items-end">
          <button
            type="button"
            className="text-[11px] text-slate-600 hover:text-black"
            onClick={() => navigate(-1)}
          >
            ← Retour aux commandes
          </button>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(order.status)}`}
          >
            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Informations commande</h2>
          <dl className="grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.05em] text-slate-500">Numéro</dt>
              <dd className="font-semibold text-slate-900">{order.orderNumber || order.id}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.05em] text-slate-500">Date</dt>
              <dd>{formatDateTime(order.paidAt || order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.05em] text-slate-500">Code promo</dt>
              <dd>{order.promoCode?.code || "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.05em] text-slate-500">Mode de paiement</dt>
              <dd>{order.paymentMethod || "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.05em] text-slate-500">Facture</dt>
              <dd>{order.invoice?.invoiceNumber || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Client et montants</h2>
          <dl className="grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.05em] text-slate-500">Client</dt>
              <dd className="font-semibold text-slate-900">{buyerName || "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.05em] text-slate-500">Email</dt>
              <dd>{order.user?.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.05em] text-slate-500">Sous-total</dt>
              <dd>{formatCurrency(order.totalBeforeDiscount, order.currency)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.05em] text-slate-500">Remise</dt>
              <dd>
                {order.discountAmount > 0
                  ? `-${formatCurrency(order.discountAmount, order.currency)}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.05em] text-slate-500">Total TTC</dt>
              <dd className="font-semibold text-slate-900">{totalLabel}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black">Articles achetés</h2>
          <span className="text-[11px] text-slate-600">
            {order.items.length} article{order.items.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Désignation</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">SKU</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Quantité</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Sous-total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="odd:bg-white even:bg-slate-50">
                  <td className="px-3 py-3 text-slate-800">
                    {item.productNameSnapshot || item.product?.name || "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{item.product?.sku || "—"}</td>
                  <td className="px-3 py-3 text-slate-800">{item.quantity}</td>
                  <td className="px-3 py-3 text-slate-800">
                    {formatCurrency(item.lineTotal, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black">Ajustements & actions</h2>
          <button
            type="button"
            className="text-[11px] font-semibold text-slate-700 underline-offset-2 hover:underline"
            onClick={() => openAdjustModal("PARTIAL_REFUND")}
          >
            Nouveau remboursement partiel
          </button>
        </div>
        {adjustments.length === 0 ? (
          <p className="text-xs text-slate-600">Aucun ajustement pour cette commande.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Type</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Montant</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Statut</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Notes</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="odd:bg-white even:bg-slate-50">
                    <td className="px-3 py-3 text-slate-800">
                      {adjustment.type === "PARTIAL_REFUND"
                        ? "Remboursement partiel"
                        : "Paiement complémentaire"}
                    </td>
                    <td className="px-3 py-3 text-slate-800">
                      {formatCurrency(adjustment.amountCents, adjustment.currency)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                        {getAdjustmentStatus(adjustment.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <div>{adjustment.adminNote || "—"}</div>
                      {adjustment.clientNote && (
                        <div className="text-[11px] text-slate-500">Client : {adjustment.clientNote}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {formatDateTime(adjustment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={showCancelModal}
        title="Annuler la commande"
        onClose={() => setShowCancelModal(false)}
      >
        <p className="text-sm text-slate-700">
          Confirmer l'annulation ? Cette opération ne rembourse pas automatiquement le client.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-black"
            onClick={() => setShowCancelModal(false)}
          >
            Retour
          </button>
          <button
            type="button"
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            onClick={handleCancelOrder}
            disabled={actionLoading}
          >
            {actionLoading ? "Annulation..." : "Confirmer"}
          </button>
        </div>
      </Modal>

      <Modal
        open={showRefundModal}
        title="Rembourser la commande"
        onClose={() => setShowRefundModal(false)}
      >
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            Montant à rembourser (laisse vide pour rembourser le total)
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={refundForm.amount}
              onChange={(e) => setRefundForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="Ex: 49.90"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Note interne (raison)
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={refundForm.note}
              onChange={(e) => setRefundForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Ex: erreur de facturation"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-black"
            onClick={() => setShowRefundModal(false)}
          >
            Annuler
          </button>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={handleRefund}
            disabled={refundLoading}
          >
            {refundLoading ? "En cours..." : "Valider le remboursement"}
          </button>
        </div>
      </Modal>

      <Modal
        open={showAdjustModal}
        title={
          adjustMode === "PARTIAL_REFUND" ? "Remboursement partiel" : "Paiement complémentaire"
        }
        onClose={() => setShowAdjustModal(false)}
      >
        <div className="flex gap-3 text-xs font-semibold text-slate-700">
          <button
            type="button"
            className={`rounded-full px-3 py-1 ${
              adjustMode === "PARTIAL_REFUND"
                ? "bg-slate-900 text-white"
                : "border border-slate-300 text-slate-800"
            }`}
            onClick={() => setAdjustMode("PARTIAL_REFUND")}
          >
            Remboursement partiel
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 ${
              adjustMode === "EXTRA_PAYMENT"
                ? "bg-slate-900 text-white"
                : "border border-slate-300 text-slate-800"
            }`}
            onClick={() => setAdjustMode("EXTRA_PAYMENT")}
          >
            Paiement supplémentaire
          </button>
        </div>

        <div className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-slate-700">
            {adjustMode === "PARTIAL_REFUND" ? "Montant à rembourser" : "Montant du complément"}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="Ex: 29.90"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Note interne
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={adjustAdminNote}
              onChange={(e) => setAdjustAdminNote(e.target.value)}
              placeholder="Information pour l'équipe back-office"
            />
          </label>
          {adjustMode === "EXTRA_PAYMENT" && (
            <label className="block text-xs font-semibold text-slate-700">
              Note visible client (sera envoyée par email)
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={adjustClientNote}
                onChange={(e) => setAdjustClientNote(e.target.value)}
                placeholder="Expliquer le complément demandé"
              />
            </label>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-black"
            onClick={() => setShowAdjustModal(false)}
          >
            Annuler
          </button>
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            onClick={handleAdjustSubmit}
            disabled={adjustLoading}
          >
            {adjustLoading
              ? "Traitement..."
              : adjustMode === "EXTRA_PAYMENT"
              ? "Envoyer la proposition"
              : "Valider"
            }
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminOrderDetailPage;
