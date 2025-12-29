import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  city: string;
  type: string;
  createdAt: string;
  ordersCount: number;
  totalRevenueCents: number;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

const accountTypeLabels: Record<string, string> = {
  ASSOCIATION: "Association",
  PROFESSIONAL: "Professionnel",
  INDIVIDUAL: "Particulier",
  COMPANY: "Société",
  ENTREPRENEUR: "Entrepreneur",
};

const sortOptions = [
  { value: "name:asc", label: "Nom" },
  { value: "city:asc", label: "Ville" },
  { value: "type:asc", label: "Type" },
  { value: "createdAt:desc", label: "Date d'inscription" },
];

const AdminCustomerPortfolioPage: React.FC = () => {
  const [customers, setCustomers] = React.useState<AdminCustomer[]>([]);
  const [pagination, setPagination] = React.useState<PaginationMeta | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [city, setCity] = React.useState("");
  const [type, setType] = React.useState("");
  const [sort, setSort] = React.useState("createdAt:desc");
  const [activeTab, setActiveTab] = React.useState<"list" | "stats">("list");

  const [period, setPeriod] = React.useState("30d");
  const [customStart, setCustomStart] = React.useState("");
  const [customEnd, setCustomEnd] = React.useState("");
  const [customerStatus, setCustomerStatus] = React.useState("all");
  const [productFilter, setProductFilter] = React.useState("all");
  const [promoFilter, setPromoFilter] = React.useState("all");
  const [filterFeedback, setFilterFeedback] = React.useState<string | null>(null);
  const [activityMetric, setActivityMetric] = React.useState<
    "revenue" | "orders" | "new_customers"
  >("revenue");

  const navigate = useNavigate();

  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalRevenueCents, 0);
  const totalOrders = customers.reduce((sum, customer) => sum + customer.ordersCount, 0);

  const topClients = [
    { id: "client-1", name: "Client 1", revenue: "12 500 €", orders: 32, lastActivity: "2024-05-18" },
    { id: "client-2", name: "Client 2", revenue: "9 800 €", orders: 24, lastActivity: "2024-05-12" },
    { id: "client-3", name: "Client 3", revenue: "7 200 €", orders: 18, lastActivity: "2024-05-02" },
  ];

  const inactiveClients = [
    { id: "inactive-1", name: "Client 4", lastActivity: "2024-02-10", lastOrder: "2024-01-28" },
    { id: "inactive-2", name: "Client 5", lastActivity: "2024-01-14", lastOrder: "2023-12-30" },
    { id: "inactive-3", name: "Client 6", lastActivity: "2023-12-05", lastOrder: "2023-11-22" },
  ];

  const newClients = [
    { id: "new-1", name: "Client 7", createdAt: "2024-05-20", status: "Actif" },
    { id: "new-2", name: "Client 8", createdAt: "2024-05-18", status: "Actif" },
    { id: "new-3", name: "Client 9", createdAt: "2024-05-15", status: "Inactif" },
  ];

  const topProductsSales = [
    { name: "Produit A", value: "320 ventes" },
    { name: "Produit B", value: "280 ventes" },
    { name: "Produit C", value: "190 ventes" },
    { name: "Produit D", value: "170 ventes" },
    { name: "Produit E", value: "150 ventes" },
  ];

  const topProductsDownloads = [
    { name: "Modèle 1", value: "540 téléchargements" },
    { name: "Modèle 2", value: "480 téléchargements" },
    { name: "Modèle 3", value: "410 téléchargements" },
    { name: "Modèle 4", value: "360 téléchargements" },
    { name: "Modèle 5", value: "290 téléchargements" },
  ];

  const kpis = [
    { label: "Clients totaux", sub: "sur la période", value: "—" },
    { label: "Clients actifs (30j)", sub: "actifs récemment", value: "—" },
    { label: "Nouveaux clients (période)", sub: "inscriptions", value: "0" },
    { label: "Chiffre d’affaires (période)", sub: "placeholder", value: "—" },
    { label: "Commandes (période)", sub: "total commandes", value: "0" },
    { label: "Panier moyen", sub: "placeholder", value: "—" },
    { label: "Téléchargements (période)", sub: "ressources", value: "0" },
    { label: "Utilisation codes promo (%)", sub: "sur commandes", value: "—" },
  ];

  const applyFilters = () => {
    setFilterFeedback("Filtres appliqués (placeholder)");
    setTimeout(() => setFilterFeedback(null), 3000);
  };

  const resetFilters = () => {
    setPeriod("30d");
    setCustomStart("");
    setCustomEnd("");
    setCustomerStatus("all");
    setProductFilter("all");
    setPromoFilter("all");
    setFilterFeedback(null);
  };

  const fetchCustomers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        city,
        type,
        sort,
      });
      const response = await fetch(`${API_BASE_URL}/admin/customers?${params.toString()}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Impossible de charger les clients.");
      }
      setCustomers((data as { customers?: AdminCustomer[] }).customers || []);
      setPagination((data as { pagination?: PaginationMeta }).pagination || null);
    } catch (err: any) {
      console.error("Erreur chargement clients", err);
      setError(err?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, city, type, sort]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-black">Portefeuille client</h1>
            <p className="text-sm text-slate-600">Vue consolidée, filtrée et triée des clients.</p>
          </div>
          {pagination && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {pagination.total} clients
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "list"
                ? "bg-indigo-600 text-white shadow"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Liste
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "stats"
                ? "bg-indigo-600 text-white shadow"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Statistiques
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">CA global</p>
            <p className="text-2xl font-semibold text-slate-900">{(totalRevenue / 100).toFixed(2)} €</p>
            <p className="text-xs text-slate-500">Somme des clients listés</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Commandes</p>
            <p className="text-2xl font-semibold text-slate-900">{totalOrders}</p>
            <p className="text-xs text-slate-500">Total historique</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Affichage</p>
            <p className="text-2xl font-semibold text-slate-900">{customers.length}</p>
            <p className="text-xs text-slate-500">Clients affichés</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Page</p>
            <p className="text-2xl font-semibold text-slate-900">
              {pagination ? `${pagination.page}/${Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}` : "-"}
            </p>
            <p className="text-xs text-slate-500">Navigation courante</p>
          </div>
        </div>
      </div>

      {activeTab === "list" ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              Recherche
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                placeholder="Nom, email, société"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              Ville
              <input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                placeholder="Ville"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              Type de compte
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
              >
                <option value="">Tous</option>
                {Object.entries(accountTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              Tri
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex flex-wrap gap-2">
              {search && <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Recherche : {search}</span>}
              {city && <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Ville : {city}</span>}
              {type && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
                  Type : {accountTypeLabels[type] || type}
                </span>
              )}
            </div>
            {pagination && (
              <span className="rounded-full bg-slate-50 px-3 py-1 font-semibold">Page {pagination.page}</span>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {loading && <p className="text-xs text-slate-500">Chargement...</p>}

          {!loading && customers.length === 0 && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
              Aucun client ne correspond au filtre.
            </div>
          )}

          {!loading && customers.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                    <th className="px-4 py-2">Nom / Société</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Ville</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Inscription</th>
                    <th className="px-4 py-2 text-right">Commandes</th>
                    <th className="px-4 py-2 text-right">CA total</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-slate-50"
                      onClick={() => navigate(`/admin/customers/${customer.id}`)}
                    >
                      <td className="px-4 py-2 text-slate-900">{customer.name}</td>
                      <td className="px-4 py-2 text-slate-700">{customer.email}</td>
                      <td className="px-4 py-2 text-slate-700">{customer.city || "-"}</td>
                      <td className="px-4 py-2 text-slate-700">
                        {accountTypeLabels[customer.type] || customer.type}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {new Date(customer.createdAt).toISOString().slice(0, 10)}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-900 font-semibold">{customer.ordersCount}</td>
                      <td className="px-4 py-2 text-right text-slate-900 font-semibold">
                        {(customer.totalRevenueCents / 100).toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-full border border-slate-300 px-3 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page <= 1}
              >
                Précédent
              </button>
              <span className="rounded-full bg-slate-50 px-3 py-1 font-semibold">
                {pagination.total} lignes • Page {page} / {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((p) =>
                    pagination ? Math.min(Math.ceil(pagination.total / pagination.pageSize), p + 1) : p + 1
                  )
                }
                className="rounded-full border border-slate-300 px-3 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pagination ? page >= Math.ceil(pagination.total / pagination.pageSize) : false}
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-5">
              <label className="space-y-1 text-xs font-semibold text-slate-700">
                Période
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                >
                  <option value="7d">7 jours</option>
                  <option value="30d">30 jours</option>
                  <option value="90d">90 jours</option>
                  <option value="12m">12 mois</option>
                  <option value="custom">Personnalisé</option>
                </select>
              </label>

              <label className="space-y-1 text-xs font-semibold text-slate-700">
                Statut client
                <select
                  value={customerStatus}
                  onChange={(e) => setCustomerStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                >
                  <option value="all">Tous</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>
              </label>

              <label className="space-y-1 text-xs font-semibold text-slate-700">
                Produit
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                >
                  <option value="all">Tous</option>
                  <option value="loading">Chargement produits…</option>
                </select>
              </label>

              <label className="space-y-1 text-xs font-semibold text-slate-700">
                Promo
                <select
                  value={promoFilter}
                  onChange={(e) => setPromoFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                >
                  <option value="all">Tous</option>
                  <option value="with">Avec promo</option>
                  <option value="without">Sans promo</option>
                </select>
              </label>

              <label className="space-y-1 text-xs font-semibold text-slate-700">
                Statut filtre
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  Placeholders UI
                </div>
              </label>
            </div>

            {period === "custom" && (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold text-slate-700">
                  Du
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-700">
                  Au
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  />
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {period && <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Période : {period}</span>}
                {customerStatus !== "all" && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Statut : {customerStatus}</span>
                )}
                {productFilter !== "all" && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Produit : {productFilter}</span>
                )}
                {promoFilter !== "all" && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Promo : {promoFilter}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700"
                >
                  Appliquer
                </button>
              </div>
            </div>

            {filterFeedback && (
              <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                <span>{filterFeedback}</span>
                <span className="text-[11px] uppercase tracking-wide">Toast UI placeholder</span>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <p className="text-sm font-semibold text-slate-700">{kpi.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{kpi.value}</p>
                <p className="text-xs text-slate-500">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">Activité dans le temps</p>
                <p className="text-sm text-slate-600">Graphique placeholder (CA / Commandes / Nouveaux clients)</p>
              </div>
              <div className="flex gap-2 rounded-full bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActivityMetric("revenue")}
                  className={`rounded-full px-3 py-1 ${
                    activityMetric === "revenue" ? "bg-white text-slate-900 shadow" : "text-slate-600"
                  }`}
                >
                  CA
                </button>
                <button
                  type="button"
                  onClick={() => setActivityMetric("orders")}
                  className={`rounded-full px-3 py-1 ${
                    activityMetric === "orders" ? "bg-white text-slate-900 shadow" : "text-slate-600"
                  }`}
                >
                  Commandes
                </button>
                <button
                  type="button"
                  onClick={() => setActivityMetric("new_customers")}
                  className={`rounded-full px-3 py-1 ${
                    activityMetric === "new_customers" ? "bg-white text-slate-900 shadow" : "text-slate-600"
                  }`}
                >
                  Nouveaux clients
                </button>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              <p className="font-semibold text-slate-700">Graphique CA / Commandes / Nouveaux clients</p>
              <p>Placeholder — à connecter à l'API ({activityMetric})</p>
              <div className="mt-4 h-48 rounded-lg border border-slate-200 bg-white" />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">Top clients</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">Placeholder</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                      <th className="px-4 py-2">Client</th>
                      <th className="px-4 py-2 text-right">CA total</th>
                      <th className="px-4 py-2 text-right">Commandes</th>
                      <th className="px-4 py-2">Dernière activité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients.map((client) => (
                      <tr key={client.id} className="border-b last:border-0">
                        <td className="px-4 py-2 text-slate-900">{client.name}</td>
                        <td className="px-4 py-2 text-right text-slate-900 font-semibold">{client.revenue}</td>
                        <td className="px-4 py-2 text-right text-slate-900 font-semibold">{client.orders}</td>
                        <td className="px-4 py-2 text-slate-700">{client.lastActivity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">Clients inactifs</p>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">Placeholder</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                      <th className="px-4 py-2">Client</th>
                      <th className="px-4 py-2">Dernière activité</th>
                      <th className="px-4 py-2">Dernière commande</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveClients.map((client) => (
                      <tr key={client.id} className="border-b last:border-0">
                        <td className="px-4 py-2 text-slate-900">{client.name}</td>
                        <td className="px-4 py-2 text-slate-700">{client.lastActivity}</td>
                        <td className="px-4 py-2 text-slate-700">{client.lastOrder}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/customers/${client.id}`)}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">Nouveaux clients</p>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Placeholder</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                      <th className="px-4 py-2">Client</th>
                      <th className="px-4 py-2">Date création</th>
                      <th className="px-4 py-2">Statut</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newClients.map((client) => (
                      <tr key={client.id} className="border-b last:border-0">
                        <td className="px-4 py-2 text-slate-900">{client.name}</td>
                        <td className="px-4 py-2 text-slate-700">{client.createdAt}</td>
                        <td className="px-4 py-2 text-slate-700">{client.status}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/customers/${client.id}`)}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">Top produits (ventes)</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">Placeholder</span>
              </div>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {topProductsSales.map((product) => (
                  <div key={product.name} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="font-semibold text-slate-800">{product.name}</span>
                    <span className="text-slate-600">{product.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">Top produits (téléchargements)</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">Placeholder</span>
              </div>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {topProductsDownloads.map((product) => (
                  <div key={product.name} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="font-semibold text-slate-800">{product.name}</span>
                    <span className="text-slate-600">{product.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomerPortfolioPage;
