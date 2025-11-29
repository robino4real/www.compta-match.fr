import React from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  billingName: string;
  billingEmail: string;
  totalTTC: number;
  currency: string;
  order?: { status: string };
}

const AdminInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = React.useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchEmail, setSearchEmail] = React.useState("");
  const [searchInvoice, setSearchInvoice] = React.useState("");

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchEmail) params.append("email", searchEmail);
      if (searchInvoice) params.append("invoiceNumber", searchInvoice);
      const url = `${API_BASE_URL}/admin/invoices${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url, { credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les factures.");
      }
      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
    } catch (err: any) {
      console.error("Erreur chargement factures", err);
      setError(err?.message || "Erreur lors du chargement des factures.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount: number, currency: string) =>
    `${(amount / 100).toFixed(2)} ${currency}`;

  return (
    <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Factures</h1>
          <p className="text-xs text-slate-600">
            Liste des factures générées suite aux paiements.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
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
          <label className="text-[11px] text-slate-600">Numéro de facture</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            placeholder="2024-0001"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={loadInvoices}
            className="rounded-full bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800"
          >
            Filtrer
          </button>
        </div>
      </div>

      {isLoading && (
        <p className="text-[11px] text-slate-600">Chargement des factures...</p>
      )}
      {error && <p className="text-[11px] text-red-600">{error}</p>}

      {!isLoading && invoices.length === 0 && (
        <p className="text-[11px] text-slate-600">Aucune facture pour le moment.</p>
      )}

      {!isLoading && invoices.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Date
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Numéro
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Client
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Montant TTC
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Statut commande
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="odd:bg-white even:bg-slate-50">
                  <td className="px-3 py-2 align-top text-slate-700">
                    {new Date(inv.issueDate).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-3 py-2 align-top text-slate-800">{inv.invoiceNumber}</td>
                  <td className="px-3 py-2 align-top text-slate-800">
                    <div>{inv.billingName}</div>
                    <div className="text-slate-500 text-[11px]">{inv.billingEmail}</div>
                  </td>
                  <td className="px-3 py-2 align-top text-slate-800">
                    {formatCurrency(inv.totalTTC, inv.currency)}
                  </td>
                  <td className="px-3 py-2 align-top text-slate-800">
                    {inv.order?.status || "PAID"}
                  </td>
                  <td className="px-3 py-2 align-top text-slate-800">
                    <Link
                      to={`/admin/invoices/${inv.id}`}
                      className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black"
                    >
                      Détail
                    </Link>
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

export default AdminInvoicesPage;
