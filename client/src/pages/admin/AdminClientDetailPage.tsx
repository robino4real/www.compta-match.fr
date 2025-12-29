import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface ClientProfile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  accountType?: string | null;
  createdAt: string;
  profile?: {
    companyName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    billingCity?: string | null;
    billingCountry?: string | null;
  } | null;
}

interface ClientStats {
  ordersCount: number;
  totalRevenueCents: number;
  lastOrderAt: string | null;
  downloadsCount: number;
  invoicesCount: number;
}

interface OrderItem {
  id: string;
  orderNumber?: string | null;
  status: string;
  createdAt: string;
  totalPaid: number;
  invoice?: { id: string; invoiceNumber?: string | null } | null;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  totalTTC: number;
  currency: string;
  order: { id: string; orderNumber: string | null };
}

interface DownloadItem {
  id: string;
  token: string;
  status: string;
  createdAt: string;
  downloadCount: number;
  maxDownloads: number;
  orderItem?: { order?: { orderNumber?: string | null }; product?: { title?: string | null } };
  product?: { title?: string | null } | null;
}

type TabKey = "overview" | "orders" | "invoices" | "downloads" | "notes";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR");
}

function formatEuro(cents?: number | null) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(((cents || 0) as number) / 100);
}

const AdminClientDetailPage: React.FC = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = React.useState<ClientProfile | null>(null);
  const [stats, setStats] = React.useState<ClientStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [activeTab, setActiveTab] = React.useState<TabKey>("overview");
  const [orders, setOrders] = React.useState<OrderItem[]>([]);
  const [ordersMeta, setOrdersMeta] = React.useState({ page: 1, pageSize: 10, total: 0 });
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([]);
  const [invoiceMeta, setInvoiceMeta] = React.useState({ page: 1, pageSize: 10, total: 0 });
  const [downloads, setDownloads] = React.useState<DownloadItem[]>([]);
  const [downloadMeta, setDownloadMeta] = React.useState({ page: 1, pageSize: 10, total: 0 });
  const [tabLoading, setTabLoading] = React.useState(false);

  React.useEffect(() => {
    if (!clientId) return;
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}`, {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error((data as { message?: string }).message || "Impossible de charger le client");
        }
        setClient((data as { customer?: ClientProfile }).customer || null);
        setStats((data as { stats?: ClientStats }).stats || null);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Erreur chargement fiche client", err);
        setError(err?.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [clientId]);

  const fetchTabData = React.useCallback(
    async (tab: TabKey, page: number) => {
      if (!clientId) return;
      setTabLoading(true);
      try {
        if (tab === "orders") {
          const response = await fetch(
            `${API_BASE_URL}/admin/clients/${clientId}/orders?page=${page}&pageSize=${ordersMeta.pageSize}`,
            { credentials: "include" }
          );
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error((data as { message?: string }).message || "Impossible de charger les commandes");
          setOrders((data as { items?: OrderItem[] }).items || []);
          setOrdersMeta((prev) => ({ ...prev, page, total: (data as { total?: number }).total || 0 }));
        }

        if (tab === "invoices") {
          const response = await fetch(
            `${API_BASE_URL}/admin/clients/${clientId}/invoices?page=${page}&pageSize=${invoiceMeta.pageSize}`,
            { credentials: "include" }
          );
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error((data as { message?: string }).message || "Impossible de charger les factures");
          setInvoices((data as { items?: InvoiceItem[] }).items || []);
          setInvoiceMeta((prev) => ({ ...prev, page, total: (data as { total?: number }).total || 0 }));
        }

        if (tab === "downloads") {
          const response = await fetch(
            `${API_BASE_URL}/admin/clients/${clientId}/downloads?page=${page}&pageSize=${downloadMeta.pageSize}`,
            { credentials: "include" }
          );
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error((data as { message?: string }).message || "Impossible de charger les téléchargements");
          setDownloads((data as { items?: DownloadItem[] }).items || []);
          setDownloadMeta((prev) => ({ ...prev, page, total: (data as { total?: number }).total || 0 }));
        }
      } catch (err: any) {
        console.error("Erreur chargement onglet client", err);
        setError(err?.message || "Une erreur est survenue");
      } finally {
        setTabLoading(false);
      }
    },
    [clientId, downloadMeta.pageSize, invoiceMeta.pageSize, ordersMeta.pageSize]
  );

  React.useEffect(() => {
    if (activeTab === "orders") fetchTabData("orders", ordersMeta.page);
    if (activeTab === "invoices") fetchTabData("invoices", invoiceMeta.page);
    if (activeTab === "downloads") fetchTabData("downloads", downloadMeta.page);
  }, [activeTab, fetchTabData, ordersMeta.page, invoiceMeta.page, downloadMeta.page]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Aperçu" },
    { key: "orders", label: "Commandes" },
    { key: "invoices", label: "Factures" },
    { key: "downloads", label: "Téléchargements" },
    { key: "notes", label: "Notes" },
  ];

  const clientName = client?.profile?.companyName || `${client?.firstName || client?.profile?.firstName || ""} ${
    client?.lastName || client?.profile?.lastName || ""
  }`.trim() || client?.email || "Client";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Retour
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">{clientName}</h1>
              {client?.accountType && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {client.accountType}
                </span>
              )}
            </div>
            {client?.email && <p className="text-sm text-slate-600">{client.email}</p>}
          </div>
        </div>
        <div className="text-xs text-slate-600">
          {client?.createdAt && <span className="rounded-full bg-slate-100 px-3 py-1">Créé le {formatDate(client.createdAt)}</span>}
        </div>
      </div>

      {(loading || error) && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          {loading && <p className="text-slate-600">Chargement...</p>}
          {error && <p className="text-red-600">{error}</p>}
        </div>
      )}

      {client && stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Commandes</p>
            <p className="text-2xl font-semibold text-slate-900">{stats.ordersCount}</p>
            <p className="text-xs text-slate-500">Dernière : {formatDate(stats.lastOrderAt)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Chiffre d'affaires</p>
            <p className="text-2xl font-semibold text-slate-900">{formatEuro(stats.totalRevenueCents)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Factures</p>
            <p className="text-2xl font-semibold text-slate-900">{stats.invoicesCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Téléchargements</p>
            <p className="text-2xl font-semibold text-slate-900">{stats.downloadsCount}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-3 py-1 ${activeTab === tab.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === "overview" && (
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Email :</span> {client?.email}
              </p>
              <p>
                <span className="font-semibold">Société :</span> {client?.profile?.companyName || "—"}
              </p>
              <p>
                <span className="font-semibold">Localisation :</span> {client?.profile?.billingCity || "—"} {client?.profile?.billingCountry}
              </p>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-3">
              {tabLoading && <p className="text-sm text-slate-600">Chargement...</p>}
              {!tabLoading && !orders.length && <p className="text-sm text-slate-600">Aucune commande.</p>}
              {!tabLoading && orders.length > 0 && (
                <div className="divide-y divide-slate-100 text-sm text-slate-700">
                  {orders.map((order) => (
                    <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                      <div>
                        <p className="font-semibold">Commande {order.orderNumber || order.id}</p>
                        <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{order.status}</span>
                        <span className="font-semibold">{formatEuro(order.totalPaid)}</span>
                        {order.invoice?.invoiceNumber && (
                          <span className="text-xs text-slate-600">Facture {order.invoice.invoiceNumber}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <button
                  className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
                  onClick={() => fetchTabData("orders", Math.max(1, ordersMeta.page - 1))}
                  disabled={ordersMeta.page <= 1 || tabLoading}
                >
                  Précédent
                </button>
                <span>
                  Page {ordersMeta.page} / {Math.max(1, Math.ceil((ordersMeta.total || 0) / ordersMeta.pageSize))}
                </span>
                <button
                  className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
                  onClick={() =>
                    fetchTabData("orders", Math.min(Math.max(1, Math.ceil((ordersMeta.total || 0) / ordersMeta.pageSize)), ordersMeta.page + 1))
                  }
                  disabled={ordersMeta.page >= Math.max(1, Math.ceil((ordersMeta.total || 0) / ordersMeta.pageSize)) || tabLoading}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="space-y-3">
              {tabLoading && <p className="text-sm text-slate-600">Chargement...</p>}
              {!tabLoading && !invoices.length && <p className="text-sm text-slate-600">Aucune facture.</p>}
              {!tabLoading && invoices.length > 0 && (
                <div className="divide-y divide-slate-100 text-sm text-slate-700">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                      <div>
                        <p className="font-semibold">Facture {invoice.invoiceNumber}</p>
                        <p className="text-xs text-slate-500">Émise le {formatDate(invoice.issueDate)}</p>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <span className="text-xs text-slate-600">Commande {invoice.order?.orderNumber || invoice.order?.id}</span>
                        <span className="font-semibold">{formatEuro(invoice.totalTTC)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <button
                  className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
                  onClick={() => fetchTabData("invoices", Math.max(1, invoiceMeta.page - 1))}
                  disabled={invoiceMeta.page <= 1 || tabLoading}
                >
                  Précédent
                </button>
                <span>
                  Page {invoiceMeta.page} / {Math.max(1, Math.ceil((invoiceMeta.total || 0) / invoiceMeta.pageSize))}
                </span>
                <button
                  className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
                  onClick={() =>
                    fetchTabData(
                      "invoices",
                      Math.min(Math.max(1, Math.ceil((invoiceMeta.total || 0) / invoiceMeta.pageSize)), invoiceMeta.page + 1)
                    )
                  }
                  disabled={invoiceMeta.page >= Math.max(1, Math.ceil((invoiceMeta.total || 0) / invoiceMeta.pageSize)) || tabLoading}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {activeTab === "downloads" && (
            <div className="space-y-3">
              {tabLoading && <p className="text-sm text-slate-600">Chargement...</p>}
              {!tabLoading && !downloads.length && <p className="text-sm text-slate-600">Aucun téléchargement.</p>}
              {!tabLoading && downloads.length > 0 && (
                <div className="divide-y divide-slate-100 text-sm text-slate-700">
                  {downloads.map((dl) => (
                    <div key={dl.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                      <div>
                        <p className="font-semibold">{dl.product?.title || dl.orderItem?.product?.title || "Téléchargement"}</p>
                        <p className="text-xs text-slate-500">Token {dl.token}</p>
                      </div>
                      <div className="flex gap-3 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{dl.status}</span>
                        <span>
                          {dl.downloadCount}/{dl.maxDownloads} téléchargements
                        </span>
                        <span>{formatDate(dl.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <button
                  className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
                  onClick={() => fetchTabData("downloads", Math.max(1, downloadMeta.page - 1))}
                  disabled={downloadMeta.page <= 1 || tabLoading}
                >
                  Précédent
                </button>
                <span>
                  Page {downloadMeta.page} / {Math.max(1, Math.ceil((downloadMeta.total || 0) / downloadMeta.pageSize))}
                </span>
                <button
                  className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
                  onClick={() =>
                    fetchTabData(
                      "downloads",
                      Math.min(Math.max(1, Math.ceil((downloadMeta.total || 0) / downloadMeta.pageSize)), downloadMeta.page + 1)
                    )
                  }
                  disabled={downloadMeta.page >= Math.max(1, Math.ceil((downloadMeta.total || 0) / downloadMeta.pageSize)) || tabLoading}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="text-sm text-slate-600">
              <p>Zone de notes internes (à implémenter selon vos besoins).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminClientDetailPage;
