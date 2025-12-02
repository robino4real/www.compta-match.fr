import React from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface InvoiceItem {
  productNameSnapshot: string;
  quantity: number;
  lineTotal: number;
  priceCents: number;
  id: string;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  billingName: string;
  billingEmail: string;
  billingAddress?: string | null;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  currency: string;
  sellerName?: string | null;
  sellerLegalForm?: string | null;
  sellerAddress?: string | null;
  sellerPostalCode?: string | null;
  sellerCity?: string | null;
  sellerCountry?: string | null;
  sellerVatMention?: string | null;
  sellerInvoiceFooterText?: string | null;
  pdfPath?: string | null;
  order: {
    id: string;
    status: string;
    discountAmount: number;
    promoCode?: { code: string } | null;
    items: InvoiceItem[];
  };
}

const AdminInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = React.useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const loadInvoice = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/invoices/${id}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger la facture.");
      }
      setInvoice(data.invoice as InvoiceDetail);
    } catch (err: any) {
      console.error("Erreur chargement facture", err);
      setError(err?.message || "Impossible de charger la facture.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDownload = () => {
    if (!invoice) return;
    const url = `${API_BASE_URL}/admin/invoices/${invoice.id}/download`;
    window.open(url, "_blank");
  };

  const handleRegenerate = async () => {
    if (!invoice) return;
    try {
      setSuccess(null);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/admin/invoices/${invoice.id}/regenerate`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de régénérer la facture.");
      }
      setInvoice(data.invoice as InvoiceDetail);
      setSuccess("Facture régénérée et PDF mis à jour.");
    } catch (err: any) {
      console.error("Erreur régénération facture", err);
      setError(err?.message || "Impossible de régénérer la facture.");
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    `${(amount / 100).toFixed(2)} ${currency}`;

  if (isLoading) {
    return <p className="text-xs text-slate-600">Chargement de la facture...</p>;
  }

  if (!invoice) {
    return <p className="text-xs text-red-600">{error || "Facture introuvable."}</p>;
  }

  return (
    <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">
            Facture {invoice.invoiceNumber}
          </h1>
          <p className="text-xs text-slate-600">
            Détails de la facture et régénération du PDF.
          </p>
        </div>
        <div className="space-x-2">
          <Link
            to={`/admin/orders/${invoice.order.id}`}
            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black"
          >
            Voir la commande
          </Link>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black"
          >
            Télécharger le PDF
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            className="rounded-full bg-black text-white px-3 py-2 text-xs font-semibold hover:bg-slate-800"
          >
            Régénérer
          </button>
        </div>
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {success && <p className="text-[11px] text-green-600">{success}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-black">Vendeur</h2>
          <p className="text-xs text-slate-700">{invoice.sellerName}</p>
          <p className="text-xs text-slate-700">{invoice.sellerLegalForm}</p>
          <p className="text-xs text-slate-700 whitespace-pre-line">
            {invoice.sellerAddress}
          </p>
          <p className="text-xs text-slate-700">
            {[invoice.sellerPostalCode, invoice.sellerCity].filter(Boolean).join(" ")}
          </p>
          <p className="text-xs text-slate-700">{invoice.sellerCountry}</p>
          {invoice.sellerVatMention && (
            <p className="text-[11px] text-slate-500">{invoice.sellerVatMention}</p>
          )}
        </div>

        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-black">Client</h2>
          <p className="text-xs text-slate-700">{invoice.billingName}</p>
          <p className="text-xs text-slate-700">{invoice.billingEmail}</p>
          <p className="text-xs text-slate-700 whitespace-pre-line">
            {invoice.billingAddress || "Adresse non fournie"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-black">Lignes</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-white">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">Désignation</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">Qté</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">PU</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.order.items.map((item) => (
                <tr key={item.id} className="odd:bg-white even:bg-white">
                  <td className="px-3 py-2 text-slate-800">{item.productNameSnapshot}</td>
                  <td className="px-3 py-2 text-slate-800">{item.quantity}</td>
                  <td className="px-3 py-2 text-slate-800">
                    {formatCurrency(item.priceCents, invoice.currency)}
                  </td>
                  <td className="px-3 py-2 text-slate-800">
                    {formatCurrency(item.lineTotal, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1 text-xs text-slate-700">
          <p>Statut commande : {invoice.order.status}</p>
          {invoice.order.promoCode && (
            <p>Code promo : {invoice.order.promoCode.code}</p>
          )}
          {invoice.order.discountAmount > 0 && (
            <p>Remise : -{formatCurrency(invoice.order.discountAmount, invoice.currency)}</p>
          )}
        </div>
        <div className="space-y-1 text-right text-xs text-slate-700">
          <p>Total HT : {formatCurrency(invoice.totalHT, invoice.currency)}</p>
          <p>TVA : {formatCurrency(invoice.totalTVA, invoice.currency)}</p>
          <p className="font-semibold text-black">
            Total TTC : {formatCurrency(invoice.totalTTC, invoice.currency)}
          </p>
        </div>
      </div>

      {invoice.sellerInvoiceFooterText && (
        <p className="text-[11px] text-slate-500 whitespace-pre-line">
          {invoice.sellerInvoiceFooterText}
        </p>
      )}
    </div>
  );
};

export default AdminInvoiceDetailPage;
