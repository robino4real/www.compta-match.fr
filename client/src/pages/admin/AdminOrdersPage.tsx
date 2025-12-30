import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

type PeriodPreset =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "current_month"
  | "previous_month"
  | "current_year"
  | "custom";

type SortOption = "createdAt_desc" | "createdAt_asc" | "amount_desc" | "amount_asc";

interface AdminOrderItem {
  id: string;
  orderNumber?: string;
  createdAt: string;
  paidAt?: string | null;
  totalPaid: number;
  currency: string;
  status: string;
  paymentMethod?: string | null;
  promoCode?: { code: string } | null;
  invoice?: { id: string; invoiceNumber: string; issueDate?: string | null } | null;
  user?: { email: string; firstName?: string | null; lastName?: string | null } | null;
  items?: { id: string; productNameSnapshot?: string; product?: { name?: string; sku?: string | null } }[];
}

interface FiltersState {
  period: PeriodPreset;
  sort: SortOption;
  status: string;
  search: string;
  page: number;
  pageSize: number;
  customFrom: string;
  customTo: string;
}

const parisDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "createdAt_desc", label: "Plus récentes" },
  { value: "createdAt_asc", label: "Plus anciennes" },
  { value: "amount_desc", label: "Montant décroissant" },
  { value: "amount_asc", label: "Montant croissant" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "PAID", label: "Payé" },
  { value: "PENDING", label: "En attente" },
  { value: "EN_ATTENTE_DE_PAIEMENT", label: "En attente (complément)" },
  { value: "CANCELLED", label: "Annulée" },
  { value: "REFUNDED", label: "Remboursée" },
  { value: "FAILED", label: "Échouée" },
];

function formatDate(date: Date): string {
  return parisDateFormatter.format(date);
}

function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getParisToday(): string {
  return formatDate(new Date());
}

function getMonthRangeFrom(dateString: string): { from: string; to: string } {
  const [year, month] = dateString.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

function getPreviousMonthRange(dateString: string): { from: string; to: string } {
  const [year, month] = dateString.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 2, 1));
  const end = new Date(Date.UTC(year, month - 1, 0));
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

function getCurrentYearRange(dateString: string): { from: string; to: string } {
  const [year] = dateString.split("-").map(Number);
  const from = `${year.toString().padStart(4, "0")}-01-01`;
  const today = dateString;
  return { from, to: today };
}

function getDefaultRange(): { from: string; to: string } {
  const today = getParisToday();
  return { from: addDays(today, -29), to: today };
}

function getPresetRange(
  preset: PeriodPreset,
  customFrom?: string,
  customTo?: string
): { from: string; to: string } {
  const today = getParisToday();
  const defaultRange = getDefaultRange();

  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "last_7_days":
      return { from: addDays(today, -6), to: today };
    case "current_month":
      return getMonthRangeFrom(today);
    case "previous_month":
      return getPreviousMonthRange(today);
    case "current_year":
      return getCurrentYearRange(today);
    case "custom":
      return {
        from: customFrom && /^\d{4}-\d{2}-\d{2}$/.test(customFrom) ? customFrom : defaultRange.from,
        to: customTo && /^\d{4}-\d{2}-\d{2}$/.test(customTo) ? customTo : defaultRange.to,
      };
    case "last_30_days":
    default:
      return defaultRange;
  }
}

function getValidatedPeriod(value: string | null): PeriodPreset {
  const allowed: PeriodPreset[] = [
    "today",
    "last_7_days",
    "last_30_days",
    "current_month",
    "previous_month",
    "current_year",
    "custom",
  ];

  return (value && allowed.includes(value as PeriodPreset) ? (value as PeriodPreset) : "last_30_days");
}

function getValidatedSort(value: string | null): SortOption {
  const allowed: SortOption[] = ["createdAt_desc", "createdAt_asc", "amount_desc", "amount_asc"];
  return (value && allowed.includes(value as SortOption) ? (value as SortOption) : "createdAt_desc");
}

function deriveFiltersFromSearchParams(params: URLSearchParams): FiltersState {
  const period = getValidatedPeriod(params.get("period"));
  const sort = getValidatedSort(params.get("sort"));
  const status = params.get("status") || "";
  const search = params.get("query") || "";
  const page = Math.max(parseInt(params.get("page") || "1", 10) || 1, 1);
  const pageSize = Math.max(parseInt(params.get("pageSize") || "20", 10) || 20, 1);
  const customFrom = params.get("from") || "";
  const customTo = params.get("to") || "";

  return {
    period,
    sort,
    status,
    search,
    page,
    pageSize,
    customFrom: period === "custom" ? customFrom : "",
    customTo: period === "custom" ? customTo : "",
  };
}

function buildSearchParams(filters: FiltersState): URLSearchParams {
  const params = new URLSearchParams();
  const { from, to } = getPresetRange(filters.period, filters.customFrom, filters.customTo);

  params.set("period", filters.period);
  params.set("sort", filters.sort);
  params.set("page", filters.page.toString());
  params.set("pageSize", filters.pageSize.toString());
  params.set("from", from);
  params.set("to", to);

  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.search) {
    params.set("query", filters.search);
  }
  if (filters.period === "custom") {
    if (filters.customFrom) params.set("from", filters.customFrom);
    if (filters.customTo) params.set("to", filters.customTo);
  }

  return params;
}

function areFiltersEqual(a: FiltersState, b: FiltersState): boolean {
  return (
    a.period === b.period &&
    a.sort === b.sort &&
    a.status === b.status &&
    a.search === b.search &&
    a.page === b.page &&
    a.pageSize === b.pageSize &&
    a.customFrom === b.customFrom &&
    a.customTo === b.customTo
  );
}

const AdminOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = React.useState<FiltersState>(() => deriveFiltersFromSearchParams(searchParams));
  const [orders, setOrders] = React.useState<AdminOrderItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const activeRange = React.useMemo(
    () => getPresetRange(filters.period, filters.customFrom, filters.customTo),
    [filters]
  );

  const syncFiltersToParams = (updater: (prev: FiltersState) => FiltersState) => {
    setFilters((prev) => {
      const next = updater(prev);
      setSearchParams(buildSearchParams(next), { replace: true });
      return next;
    });
  };

  React.useEffect(() => {
    const nextFilters = deriveFiltersFromSearchParams(searchParams);
    setFilters((current) => (areFiltersEqual(current, nextFilters) ? current : nextFilters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  React.useEffect(() => {
    const controller = new AbortController();
    const params = buildSearchParams(filters);

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/admin/orders?${params.toString()}`, {
          credentials: "include",
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Impossible de charger les commandes.");
        }

        setOrders(Array.isArray(data.items) ? data.items : []);
        setTotal(typeof data.total === "number" ? data.total : 0);

        const nextPage = typeof data.page === "number" ? data.page : filters.page;
        const nextPageSize = typeof data.pageSize === "number" ? data.pageSize : filters.pageSize;

        if (nextPage !== filters.page || nextPageSize !== filters.pageSize) {
          syncFiltersToParams((prev) => ({
            ...prev,
            page: nextPage,
            pageSize: nextPageSize,
          }));
        }
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error("Erreur chargement commandes", err);
        setError(err?.message || "Erreur lors du chargement des commandes.");
        setOrders([]);
        setTotal(0);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();

    return () => controller.abort();
  }, [filters]);

  const formatCurrency = (amount: number, currency: string) => `${(amount / 100).toFixed(2)} ${currency}`;

  const resetFilters = () => {
    const defaults = getDefaultRange();
    setSearchParams(
      buildSearchParams({
        period: "last_30_days",
        sort: "createdAt_desc",
        status: "",
        search: "",
        page: 1,
        pageSize: filters.pageSize,
        customFrom: defaults.from,
        customTo: defaults.to,
      })
    );
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

  const describeItems = (order: AdminOrderItem) => {
    const primaryItem = order.items?.[0];
    if (!primaryItem) return "—";
    const label = primaryItem.productNameSnapshot || primaryItem.product?.name;
    if (!label) return "—";
    if ((order.items?.length || 0) > 1) {
      return `${label} (+${(order.items?.length || 1) - 1} autre${(order.items?.length || 1) - 1 > 1 ? "s" : ""})`;
    }
    return label;
  };

  const totalPages = Math.max(Math.ceil(total / filters.pageSize), 1);

  return (
    <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Commandes</h1>
          <p className="text-xs text-slate-600">Suivi des commandes payées et accès rapide aux factures.</p>
        </div>
        <div className="text-[11px] text-slate-600">
          Période : {activeRange.from} → {activeRange.to}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Période</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={filters.period}
            onChange={(e) =>
              syncFiltersToParams((prev) => ({
                ...prev,
                period: e.target.value as PeriodPreset,
                page: 1,
                customFrom: prev.customFrom,
                customTo: prev.customTo,
              }))
            }
          >
            <option value="today">Aujourd'hui</option>
            <option value="last_7_days">7 derniers jours</option>
            <option value="last_30_days">30 derniers jours</option>
            <option value="current_month">Mois en cours</option>
            <option value="previous_month">Mois précédent</option>
            <option value="current_year">Année en cours</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>

        {filters.period === "custom" && (
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Date de début</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={filters.customFrom}
              onChange={(e) =>
                syncFiltersToParams((prev) => ({ ...prev, customFrom: e.target.value, page: 1 }))
              }
            />
          </div>
        )}

        {filters.period === "custom" && (
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Date de fin</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={filters.customTo}
              onChange={(e) =>
                syncFiltersToParams((prev) => ({ ...prev, customTo: e.target.value, page: 1 }))
              }
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Tri</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={filters.sort}
            onChange={(e) =>
              syncFiltersToParams((prev) => ({ ...prev, sort: e.target.value as SortOption, page: 1 }))
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-slate-600">Statut</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) =>
              syncFiltersToParams((prev) => ({ ...prev, status: e.target.value, page: 1 }))
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-[11px] text-slate-600">Recherche</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={filters.search}
            onChange={(e) =>
              syncFiltersToParams((prev) => ({ ...prev, search: e.target.value, page: 1 }))
            }
            placeholder="Email client, référence commande ou facture"
          />
        </div>

        <div className="flex items-end space-x-2">
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-black hover:text-black"
          >
            Reset
          </button>
        </div>
      </div>

      {isLoading && <p className="text-[11px] text-slate-600">Chargement des commandes...</p>}
      {error && <p className="text-[11px] text-red-600">{error}</p>}

      {!isLoading && orders.length === 0 && !error && (
        <p className="text-[11px] text-slate-600">Aucune commande pour le moment.</p>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 text-[11px] text-slate-600 lg:flex-row lg:items-center lg:justify-between">
            <span>
              Page {filters.page} / {totalPages} — {total} commande{total > 1 ? "s" : ""}
            </span>
            <div className="space-x-2">
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() =>
                  syncFiltersToParams((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))
                }
                className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 disabled:opacity-50 hover:border-black hover:text-black"
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={filters.page >= totalPages}
                onClick={() =>
                  syncFiltersToParams((prev) => ({
                    ...prev,
                    page: Math.min(prev.page + 1, totalPages),
                  }))
                }
                className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 disabled:opacity-50 hover:border-black hover:text-black"
              >
                Suivant
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-xs">
              <thead className="bg-white">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">N° commande</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Client</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Article(s)</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Montant total</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Statut</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Mode de paiement</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Code promo</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 text-right">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="odd:bg-white even:bg-slate-50 cursor-pointer transition hover:bg-slate-100"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/admin/orders/${order.id}`);
                      }
                    }}
                  >
                    <td className="px-3 py-3 align-top text-slate-800 font-semibold">{order.orderNumber || order.id}</td>
                    <td className="px-3 py-3 align-top text-slate-700">
                      {formatDate(new Date(order.paidAt || order.createdAt))}
                    </td>
                    <td className="px-3 py-3 align-top text-slate-800">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          {`${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() || "—"}
                        </span>
                        <span className="text-[11px] text-slate-600">{order.user?.email || "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-slate-800">{describeItems(order)}</td>
                    <td className="px-3 py-3 align-top text-slate-800">
                      {formatCurrency(order.totalPaid, order.currency)}
                    </td>
                    <td className="px-3 py-3 align-top text-slate-800">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top text-slate-800">{order.paymentMethod || "—"}</td>
                    <td className="px-3 py-3 align-top text-slate-800">{order.promoCode?.code || "—"}</td>
                    <td className="px-3 py-3 align-top text-right text-slate-400">›</td>
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

export default AdminOrdersPage;
