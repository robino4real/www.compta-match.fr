import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface AdminClientListItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  ordersCount: number;
  totalRevenueCents: number;
  lastOrderAt: string | null;
}

interface ClientsResponse {
  items: AdminClientListItem[];
  total: number;
  page: number;
  pageSize: number;
}

type SortKey = "createdAt_desc" | "createdAt_asc" | "revenue_desc" | "revenue_asc" | "orders_desc" | "orders_asc";
type PeriodKey = "30d" | "month" | "year" | "all";

function formatEuro(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format((cents || 0) / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

function getPeriodRange(period: PeriodKey): { from?: string; to?: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const end = formatter.format(now);
  const [year, month] = end.split("-").map(Number);

  if (period === "all") return {};

  if (period === "year") {
    return { from: `${new Date().getFullYear()}-01-01`, to: end };
  }

  if (period === "month") {
    return { from: `${year}-${String(month).padStart(2, "0")}-01`, to: end };
  }

  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 29);
  const formattedStart = formatter.format(start);
  return { from: formattedStart, to: end };
}

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "createdAt_desc", label: "Récents" },
  { value: "createdAt_asc", label: "Anciens" },
  { value: "revenue_desc", label: "CA décroissant" },
  { value: "revenue_asc", label: "CA croissant" },
  { value: "orders_desc", label: "Nb commandes décroissant" },
  { value: "orders_asc", label: "Nb commandes croissant" },
];

const periodOptions: { value: PeriodKey; label: string }[] = [
  { value: "30d", label: "30 derniers jours" },
  { value: "month", label: "Mois en cours" },
  { value: "year", label: "Année en cours" },
  { value: "all", label: "Depuis l'origine" },
];

const AdminClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = React.useState<AdminClientListItem[]>([]);
  const [page, setPage] = React.useState(Number(searchParams.get("page")) || 1);
  const [pageSize] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState(searchParams.get("query") || "");
  const [sort, setSort] = React.useState<SortKey>((searchParams.get("sort") as SortKey) || "createdAt_desc");
  const [period, setPeriod] = React.useState<PeriodKey>((searchParams.get("period") as PeriodKey) || "30d");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params: Record<string, string> = { page: String(page), pageSize: String(pageSize), sort };
    if (search.trim()) params.query = search.trim();
    if (period) params.period = period;
    setSearchParams(params, { replace: true });
  }, [page, pageSize, sort, search, period, setSearchParams]);

  React.useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const range = getPeriodRange(period);
        const query = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          sort,
        });
        if (search.trim()) query.set("query", search.trim());
        if (range.from) query.set("from", range.from);
        if (range.to) query.set("to", range.to);

        const response = await fetch(`${API_BASE_URL}/admin/clients?${query.toString()}`, {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error((data as { message?: string }).message || "Impossible de charger les clients");
        }
        const payload = data as ClientsResponse;
        setClients(payload.items || []);
        setTotal(payload.total || 0);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Erreur chargement clients", err);
        setError(err?.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [page, pageSize, search, sort, period]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-600">Base client unifiée avec commandes et CA.</p>
        </div>
        <div className="flex gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">{total} clients</span>
          <button
            type="button"
            onClick={() => setPeriod("30d")}
            className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-1 flex-col gap-1 min-w-[220px]">
          <label className="text-xs font-semibold text-slate-600">Recherche</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Email, nom, société"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Tri</label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Période (commandes)</label>
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value as PeriodKey);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-6 items-center bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-600">
          <div className="col-span-2">Client</div>
          <div>Date d'inscription</div>
          <div>Nb commandes</div>
          <div>CA total</div>
          <div>Dernière commande</div>
        </div>
        {loading && <div className="px-4 py-6 text-sm text-slate-600">Chargement...</div>}
        {error && !loading && <div className="px-4 py-6 text-sm text-red-600">{error}</div>}
        {!loading && !error && !clients.length && <div className="px-4 py-6 text-sm text-slate-600">Aucun client pour ce filtre.</div>}
        {!loading && !error && clients.length > 0 && (
          <div className="divide-y divide-slate-100">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => navigate(`/admin/clients/${client.id}`)}
                className="grid w-full grid-cols-6 items-center px-4 py-3 text-left text-sm hover:bg-slate-50"
              >
                <div className="col-span-2">
                  <div className="font-semibold text-slate-900">{client.name}</div>
                  <div className="text-xs text-slate-600">{client.email}</div>
                </div>
                <div className="text-slate-700">{formatDate(client.createdAt)}</div>
                <div className="text-slate-700">{client.ordersCount}</div>
                <div className="text-slate-900">{formatEuro(client.totalRevenueCents)}</div>
                <div className="text-slate-700">{formatDate(client.lastOrderAt)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-700">
        <button
          className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          Précédent
        </button>
        <div>
          Page {page} / {totalPages}
        </div>
        <button
          className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default AdminClientsPage;
