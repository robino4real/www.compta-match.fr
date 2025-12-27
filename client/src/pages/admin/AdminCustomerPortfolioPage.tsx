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

  const navigate = useNavigate();

  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalRevenueCents, 0);
  const totalOrders = customers.reduce((sum, customer) => sum + customer.ordersCount, 0);

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
    </div>
  );
};

export default AdminCustomerPortfolioPage;
