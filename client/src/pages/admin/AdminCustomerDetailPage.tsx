import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface CustomerProfile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  accountType?: string;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    billingStreet?: string | null;
    billingCity?: string | null;
    billingZip?: string | null;
    billingCountry?: string | null;
    phone?: string | null;
  } | null;
}

interface CustomerOrder {
  id: string;
  orderNumber?: string | null;
  status: string;
  createdAt: string;
  totalPaid: number;
}

interface AnalyticsSnapshot {
  pageViews7: number;
  pageViews30: number;
  topPages: { page: string | null; _count: { _all: number } }[];
  lastEvents: { id: string; eventType: string; page?: string | null; createdAt: string }[];
}

const accountTypeLabels: Record<string, string> = {
  ASSOCIATION: "Association",
  PROFESSIONAL: "Professionnel",
  INDIVIDUAL: "Particulier",
  COMPANY: "Société",
  ENTREPRENEUR: "Entrepreneur",
};

const AdminCustomerDetailPage: React.FC = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = React.useState<CustomerProfile | null>(null);
  const [orders, setOrders] = React.useState<CustomerOrder[]>([]);
  const [analytics, setAnalytics] = React.useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    billingStreet: "",
    billingCity: "",
    billingZip: "",
    billingCountry: "",
    phone: "",
    accountType: "",
  });

  const fetchCustomer = React.useCallback(async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/customers/${customerId}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Impossible de charger la fiche client.");
      }
      const fetchedCustomer = (data as { customer?: CustomerProfile }).customer || null;
      setCustomer(fetchedCustomer);
      setOrders((data as { orders?: CustomerOrder[] }).orders || []);
      setAnalytics((data as { analytics?: AnalyticsSnapshot }).analytics || null);
      if (fetchedCustomer) {
        setForm({
          firstName: fetchedCustomer.profile?.firstName || fetchedCustomer.firstName || "",
          lastName: fetchedCustomer.profile?.lastName || fetchedCustomer.lastName || "",
          companyName: fetchedCustomer.profile?.companyName || "",
          email: fetchedCustomer.email || "",
          billingStreet: fetchedCustomer.profile?.billingStreet || "",
          billingCity: fetchedCustomer.profile?.billingCity || "",
          billingZip: fetchedCustomer.profile?.billingZip || "",
          billingCountry: fetchedCustomer.profile?.billingCountry || "",
          phone: fetchedCustomer.profile?.phone || "",
          accountType: fetchedCustomer.accountType || "",
        });
      }
    } catch (err: any) {
      console.error("Erreur chargement client", err);
      setError(err?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  React.useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const updateProfile = async () => {
    if (!customerId) return;
    try {
      setSaving(true);
      setMessage(null);
      const response = await fetch(`${API_BASE_URL}/admin/customers/${customerId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Mise à jour impossible.");
      }
      setMessage((data as { message?: string }).message || "Profil mis à jour");
      await fetchCustomer();
    } catch (err: any) {
      console.error("Erreur mise à jour profil", err);
      setError(err?.message || "Impossible de mettre à jour le profil");
    } finally {
      setSaving(false);
    }
  };

  const handleOrderAction = async (orderId: string, action: "cancel" | "delete" | "refund") => {
    try {
      setMessage(null);
      const options: RequestInit = { credentials: "include", method: "POST" };
      let url = `${API_BASE_URL}/admin/orders/${orderId}/${action}`;
      if (action === "delete") {
        options.method = "DELETE";
        url = `${API_BASE_URL}/admin/orders/${orderId}`;
      }
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Action impossible");
      }
      setMessage((data as { message?: string }).message || "Action réalisée");
      await fetchCustomer();
    } catch (err: any) {
      console.error("Erreur action commande", err);
      setError(err?.message || "Impossible d'exécuter l'action sur la commande");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded border border-slate-300 px-3 py-1 text-xs"
        >
          Retour
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-black">Fiche client</h1>
          {customer && <p className="text-sm text-slate-600">{customer.email}</p>}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {message && <p className="text-xs text-emerald-700">{message}</p>}
      {loading && <p className="text-xs text-slate-500">Chargement...</p>}

      {!loading && customer && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-black">Profil client</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                Prénom
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700">
                Nom
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700">
                Email
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700">
                Société / Raison sociale
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700">
                Adresse
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={form.billingStreet}
                  onChange={(e) => setForm((f) => ({ ...f, billingStreet: e.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700">
                Ville
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={form.billingCity}
                  onChange={(e) => setForm((f) => ({ ...f, billingCity: e.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700">
                Code postal
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={form.billingZip}
                  onChange={(e) => setForm((f) => ({ ...f, billingZip: e.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700">
                Pays
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={form.billingCountry}
                  onChange={(e) => setForm((f) => ({ ...f, billingCountry: e.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700">
                Téléphone
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700">
                Type de compte
                <select
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={form.accountType}
                  onChange={(e) => setForm((f) => ({ ...f, accountType: e.target.value }))}
                >
                  {Object.entries(accountTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={updateProfile}
                disabled={saving}
                className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-black">Activité (analytics)</h3>
            <p className="text-xs text-slate-700">Pages vues 7j : {analytics?.pageViews7 ?? 0}</p>
            <p className="text-xs text-slate-700">Pages vues 30j : {analytics?.pageViews30 ?? 0}</p>
            <div>
              <p className="text-xs font-semibold text-slate-800">Pages les plus consultées</p>
              <ul className="text-xs text-slate-700">
                {(analytics?.topPages || []).map((page) => (
                  <li key={page.page || "unknown"}>
                    {page.page || "(non renseigné)"} – {page._count._all} vues
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Derniers événements</p>
              <ul className="space-y-1 text-xs text-slate-700">
                {(analytics?.lastEvents || []).map((event) => (
                  <li key={event.id} className="rounded bg-slate-50 px-2 py-1">
                    <span className="font-semibold">{event.eventType}</span> – {event.page || "(page inconnue)"} –
                    {" "}
                    {new Date(event.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">Commandes</h2>
            <p className="text-xs text-slate-600">Actions sensibles loggées.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="px-3 py-2">Commande</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="px-3 py-2">{order.orderNumber || order.id}</td>
                    <td className="px-3 py-2">{new Date(order.createdAt).toISOString().slice(0, 10)}</td>
                    <td className="px-3 py-2">{order.status}</td>
                    <td className="px-3 py-2 text-right">{(order.totalPaid / 100).toFixed(2)} €</td>
                    <td className="px-3 py-2 space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOrderAction(order.id, "cancel")}
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOrderAction(order.id, "refund")}
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                      >
                        Rembourser
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOrderAction(order.id, "delete")}
                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomerDetailPage;
