import React from "react";
import { API_BASE_URL } from "../../config/api";

interface Subscriber {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status: "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED" | "COMPLAINED";
  source: string;
  consentAt: string;
  createdAt: string;
  tags: string[];
  score?: { score: number } | null;
}

interface SubscribersResponse {
  items: Subscriber[];
  total: number;
  page: number;
  pageSize: number;
}

interface KpiResponse {
  activeCount: number;
  unsubscribedCount: number;
  newActiveInPeriod: number;
}

interface NewsletterSegment {
  id: string;
  name: string;
  description?: string | null;
  rulesJson: any;
  previewCount: number;
  updatedAt: string;
}

interface NewsletterAutomation {
  id: string;
  name: string;
  status: string;
  trigger: string;
  segmentId?: string | null;
  steps: { stepOrder: number; templateId: string; delayMinutes: number }[];
}

interface NewsletterAnalyticsOverview {
  sentCount: number;
  opens: number;
  clicks: number;
  revenue: number;
}

const statusOptions = [
  { value: "", label: "Tous les statuts" },
  { value: "ACTIVE", label: "Actif" },
  { value: "UNSUBSCRIBED", label: "Désinscrit" },
  { value: "BOUNCED", label: "Bounce" },
  { value: "COMPLAINED", label: "Plainte" },
];

const sourceOptions = [
  { value: "", label: "Toutes les sources" },
  { value: "CHECKOUT", label: "Checkout" },
  { value: "POPUP", label: "Popup" },
  { value: "ACCOUNT", label: "Compte" },
  { value: "ADMIN_IMPORT", label: "Import admin" },
  { value: "ADMIN_MANUAL", label: "Ajout manuel" },
];

const tabs = [
  { key: "subscribers", label: "Abonnés" },
  { key: "segments", label: "Segments" },
  { key: "campaigns", label: "Campagnes" },
  { key: "automations", label: "Automations" },
  { key: "templates", label: "Templates" },
  { key: "settings", label: "Paramètres" },
  { key: "analytics", label: "Analytics" },
  { key: "deliverability", label: "Délivrabilité" },
];

const emptyPlaceholder = (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-900">Bientôt disponible</h3>
    <p className="text-sm text-slate-600">
      Cette section sera activée dans les prochains jalons (segments, campagnes, automations, templates, paramètres).
    </p>
  </div>
);

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

const SubscriberForm: React.FC<{
  initial?: Partial<Subscriber>;
  onSubmit: (payload: Partial<Subscriber>) => Promise<void>;
  onClose: () => void;
}> = ({ initial, onSubmit, onClose }) => {
  const [email, setEmail] = React.useState(initial?.email || "");
  const [firstName, setFirstName] = React.useState(initial?.firstName || "");
  const [lastName, setLastName] = React.useState(initial?.lastName || "");
  const [status, setStatus] = React.useState(initial?.status || "ACTIVE");
  const [source, setSource] = React.useState(initial?.source || "ADMIN_MANUAL");
  const [tags, setTags] = React.useState((initial?.tags || []).join(", "));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        email,
        firstName,
        lastName,
        status: status as Subscriber["status"],
        source,
        tags: tags
          .split(/[,;]+/)
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Newsletter</p>
            <h3 className="text-lg font-semibold text-slate-900">
              {initial?.id ? "Modifier l'abonné" : "Ajouter un abonné"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {!initial?.id && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Prénom</label>
              <input
                type="text"
                value={firstName || ""}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Nom</label>
              <input
                type="text"
                value={lastName || ""}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {statusOptions
                  .filter((opt) => opt.value)
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {sourceOptions
                  .filter((opt) => opt.value)
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Tags (séparés par virgule)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-50"
            >
              {loading ? "En cours..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminNewsletterPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<string>("subscribers");
  const [subscribers, setSubscribers] = React.useState<Subscriber[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [source, setSource] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [sort] = React.useState("createdAt_desc");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Subscriber | null>(null);
  const [kpis, setKpis] = React.useState<KpiResponse | null>(null);
  const [templates, setTemplates] = React.useState<NewsletterTemplate[]>([]);
  const [campaigns, setCampaigns] = React.useState<NewsletterCampaign[]>([]);
  const [settings, setSettings] = React.useState<NewsletterSettings | null>(null);
  const [fromNameInput, setFromNameInput] = React.useState("");
  const [fromEmailInput, setFromEmailInput] = React.useState("");
  const [replyToInput, setReplyToInput] = React.useState("");
  const [segments, setSegments] = React.useState<NewsletterSegment[]>([]);
  const [segmentName, setSegmentName] = React.useState("");
  const [segmentDescription, setSegmentDescription] = React.useState("");
  const [segmentRules, setSegmentRules] = React.useState(
    JSON.stringify(
      { operator: "AND", conditions: [{ field: "status", op: "=", value: "ACTIVE" }] },
      null,
      2
    )
  );
  const [automations, setAutomations] = React.useState<NewsletterAutomation[]>([]);
  const [automationName, setAutomationName] = React.useState("");
  const [automationTrigger, setAutomationTrigger] = React.useState("USER_REGISTERED");
  const [automationTemplateId, setAutomationTemplateId] = React.useState("");
  const [automationDelay, setAutomationDelay] = React.useState(0);
  const [analyticsOverview, setAnalyticsOverview] = React.useState<NewsletterAnalyticsOverview | null>(null);
  const [campaignAnalytics, setCampaignAnalytics] = React.useState<Array<{ campaignId: string; campaignName: string; revenue: number }>>([]);
  const [segmentAnalytics, setSegmentAnalytics] = React.useState<Array<{ segmentId: string; name: string; size: number }>>([]);
  const [deliverabilityStatus, setDeliverabilityStatus] = React.useState<any>(null);
  const [alerts, setAlerts] = React.useState<any[]>([]);

  const fetchKpis = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/newsletter/kpis?period=30d`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setKpis(data as KpiResponse);
      }
    } catch (err) {
      console.warn("KPI load failed", err);
    }
  }, []);

  const fetchSubscribers = React.useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort,
    });
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (source) params.set("source", source);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/newsletter/subscribers?${params.toString()}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Erreur de chargement");
      }
      const payload = data as SubscribersResponse;
      setSubscribers(payload.items || []);
      setTotal(payload.total || 0);
    } catch (err: any) {
      setError(err?.message || "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }, [from, page, pageSize, query, sort, source, status, to]);

  const fetchTemplates = React.useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/admin/newsletter/templates`, {
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      setTemplates(data as NewsletterTemplate[]);
    }
  }, []);

  const fetchCampaigns = React.useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/admin/newsletter/campaigns`, {
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      setCampaigns(data as NewsletterCampaign[]);
    }
  }, []);

  const fetchSegments = React.useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/admin/newsletter/segments`, { credentials: "include" });
    if (response.ok) {
      const data = await response.json();
      setSegments(data as NewsletterSegment[]);
    }
  }, []);

  const fetchAutomations = React.useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/admin/newsletter/automations`, { credentials: "include" });
    if (response.ok) {
      const data = await response.json();
      setAutomations(data as NewsletterAutomation[]);
    }
  }, []);

  const fetchAnalytics = React.useCallback(async () => {
    const overviewRes = await fetch(`${API_BASE_URL}/admin/newsletter/analytics/overview`, { credentials: "include" });
    if (overviewRes.ok) {
      setAnalyticsOverview((await overviewRes.json()) as NewsletterAnalyticsOverview);
    }
    const campaignRes = await fetch(`${API_BASE_URL}/admin/newsletter/analytics/campaigns`, { credentials: "include" });
    if (campaignRes.ok) {
      setCampaignAnalytics(
        (await campaignRes.json()) as Array<{ campaignId: string; campaignName: string; revenue: number }>
      );
    }
    const segRes = await fetch(`${API_BASE_URL}/admin/newsletter/analytics/segments`, { credentials: "include" });
    if (segRes.ok) {
      setSegmentAnalytics((await segRes.json()) as Array<{ segmentId: string; name: string; size: number }>);
    }
  }, []);

  const fetchDeliverability = React.useCallback(async () => {
    try {
      const [statusRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/newsletter/deliverability`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/admin/newsletter/alerts`, { credentials: "include" }),
      ]);
      if (statusRes.ok) {
        setDeliverabilityStatus(await statusRes.json());
      }
      if (alertsRes.ok) {
        setAlerts(await alertsRes.json());
      }
    } catch (err) {
      console.warn("deliverability fetch failed", err);
    }
  }, []);

  const fetchSettings = React.useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/admin/newsletter/settings`, {
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      setSettings(data as NewsletterSettings);
    }
  }, []);

  const handleCreateSegment = async () => {
    try {
      const payload = {
        name: segmentName || "Segment sans nom",
        description: segmentDescription,
        rulesJson: JSON.parse(segmentRules || "{}"),
      };
      await fetch(`${API_BASE_URL}/admin/newsletter/segments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSegmentName("");
      setSegmentDescription("");
      fetchSegments();
    } catch (err) {
      console.error("Segment create failed", err);
    }
  };

  const handleCreateAutomation = async () => {
    try {
      await fetch(`${API_BASE_URL}/admin/newsletter/automations`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: automationName || "Automation",
          trigger: automationTrigger,
          steps: [
            {
              stepOrder: 0,
              type: "EMAIL",
              templateId: automationTemplateId,
              delayMinutes: automationDelay,
            },
          ],
        }),
      });
      setAutomationName("");
      setAutomationTemplateId("");
      setAutomationDelay(0);
      fetchAutomations();
    } catch (err) {
      console.error("Automation create failed", err);
    }
  };

  React.useEffect(() => {
    if (activeTab === "subscribers") {
      fetchSubscribers();
      fetchKpis();
    } else if (activeTab === "templates") {
      fetchTemplates();
    } else if (activeTab === "campaigns") {
      fetchCampaigns();
    } else if (activeTab === "settings") {
      fetchSettings();
    } else if (activeTab === "segments") {
      fetchSegments();
    } else if (activeTab === "automations") {
      fetchAutomations();
    } else if (activeTab === "analytics") {
      fetchAnalytics();
    } else if (activeTab === "deliverability") {
      fetchDeliverability();
    }
  }, [
    activeTab,
    fetchAnalytics,
    fetchAutomations,
    fetchCampaigns,
    fetchKpis,
    fetchSegments,
    fetchSettings,
    fetchSubscribers,
    fetchTemplates,
    fetchDeliverability,
  ]);

  React.useEffect(() => {
    if (settings) {
      setFromNameInput(settings.fromName || "");
      setFromEmailInput(settings.fromEmailDefault || "");
      setReplyToInput(settings.replyToEmailDefault || "");
    }
  }, [settings]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSave = async (payload: Partial<Subscriber>) => {
    const isEdit = Boolean(editing?.id);
    const url = isEdit
      ? `${API_BASE_URL}/admin/newsletter/subscribers/${editing?.id}`
      : `${API_BASE_URL}/admin/newsletter/subscribers`;
    const method = isEdit ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error((data as { message?: string }).message || "Impossible d'enregistrer");
    }

    setEditing(null);
    setShowForm(false);
    await fetchSubscribers();
  };

  const handleTemplateCreate = async () => {
    const name = prompt("Nom du template ?");
    const subjectDefault = prompt("Sujet par défaut ?");
    const html = prompt("HTML (rapide)", "<p>Bonjour {{firstName}}</p>") || "";
    if (!name || !subjectDefault) return;
    await fetch(`${API_BASE_URL}/admin/newsletter/templates`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subjectDefault, html }),
    });
    fetchTemplates();
  };

  const handleCampaignCreate = async () => {
    const name = prompt("Nom de campagne ?");
    const subject = prompt("Sujet d'email ?");
    if (!name || !subject) return;
    await fetch(`${API_BASE_URL}/admin/newsletter/campaigns`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, audienceJson: { include: { sources: [] } } }),
    });
    fetchCampaigns();
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_BASE_URL}/admin/newsletter/settings`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromName: fromNameInput,
        fromEmailDefault: fromEmailInput,
        replyToEmailDefault: replyToInput,
      }),
    });
    fetchSettings();
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (source) params.set("source", source);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const response = await fetch(`${API_BASE_URL}/admin/newsletter/subscribers/export?${params.toString()}`, {
      credentials: "include",
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "newsletter-subscribers.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE_URL}/admin/newsletter/subscribers/import`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Import impossible");
    }
    await fetchSubscribers();
  };

  const handleStatusChange = async (subscriber: Subscriber, target: "unsubscribe" | "resubscribe") => {
    const response = await fetch(
      `${API_BASE_URL}/admin/newsletter/subscribers/${subscriber.id}/${target === "unsubscribe" ? "unsubscribe" : "resubscribe"}`,
      { method: "POST", credentials: "include" }
    );
    if (response.ok) {
      await fetchSubscribers();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Marketing</p>
          <h1 className="text-2xl font-semibold text-slate-900">Newsletter</h1>
          <p className="text-sm text-slate-600">Pilotez votre audience, les abonnés et les futures campagnes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
          >
            Ajouter un abonné
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImport(file).catch((err) => setError(err?.message || "Import impossible"));
                  e.target.value = "";
                }
              }}
            />
          </label>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              activeTab === tab.key
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "subscribers" && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Abonnés actifs</p>
              <p className="text-2xl font-semibold text-slate-900">{kpis?.activeCount ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Désinscrits</p>
              <p className="text-2xl font-semibold text-slate-900">{kpis?.unsubscribedCount ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Croissance 30j</p>
              <p className="text-2xl font-semibold text-emerald-700">{kpis?.newActiveInPeriod ?? "—"}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-5">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Recherche</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Email, nom, tag"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Statut</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Source</label>
                <select
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {sourceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Du</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Au</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Score</th>
                  <th className="px-4 py-3 text-left">Consentement</th>
                  <th className="px-4 py-3 text-left">Créé</th>
                  <th className="px-4 py-3 text-left">Tags</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{subscriber.email}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {[subscriber.firstName, subscriber.lastName].filter(Boolean).join(" ") || "—"}
                      </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {subscriber.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{subscriber.source}</td>
                    <td className="px-4 py-3 text-slate-700">{subscriber.score?.score ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(subscriber.consentAt)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(subscriber.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {subscriber.tags?.length ? subscriber.tags.join(", ") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(subscriber);
                              setShowForm(true);
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Éditer
                          </button>
                          {subscriber.status === "ACTIVE" ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(subscriber, "unsubscribe")}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                            >
                              Désinscrire
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(subscriber, "resubscribe")}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              Réactiver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!subscribers.length && (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-slate-600" colSpan={8}>
                        {loading ? "Chargement..." : "Aucun abonné pour ces filtres."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
              <span>
                Page {page} / {totalPages} — {total} abonnés
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "templates" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Templates</p>
              <h3 className="text-lg font-semibold text-slate-900">Bibliothèque HTML</h3>
            </div>
            <button
              type="button"
              onClick={handleTemplateCreate}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
            >
              Nouveau template
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {templates.map((tpl) => (
              <div key={tpl.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{tpl.name}</p>
                <p className="text-xs text-slate-600">Sujet par défaut : {tpl.subjectDefault}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{tpl.html?.slice(0, 120)}</p>
              </div>
            ))}
            {!templates.length && <p className="text-sm text-slate-600">Aucun template créé pour le moment.</p>}
          </div>
        </div>
      )}

      {activeTab === "campaigns" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Campagnes</p>
              <h3 className="text-lg font-semibold text-slate-900">One-shot</h3>
            </div>
            <button
              type="button"
              onClick={handleCampaignCreate}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
            >
              Nouvelle campagne
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Nom</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Statut</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Planifiée</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Envoyés</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Ouverts</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Clicks</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Désinscrits</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-semibold text-slate-900">{camp.name}</td>
                    <td className="px-3 py-2 text-slate-700">{camp.status}</td>
                    <td className="px-3 py-2 text-slate-700">{formatDate(camp.scheduledAt)}</td>
                    <td className="px-3 py-2 text-slate-700">{camp.sentCount}</td>
                    <td className="px-3 py-2 text-slate-700">{camp.openCount}</td>
                    <td className="px-3 py-2 text-slate-700">{camp.clickCount}</td>
                    <td className="px-3 py-2 text-slate-700">{camp.unsubCount}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                        onClick={async () => {
                          await fetch(`${API_BASE_URL}/admin/newsletter/campaigns/${camp.id}/send-now`, {
                            method: "POST",
                            credentials: "include",
                          });
                          fetchCampaigns();
                        }}
                      >
                        Envoyer maintenant
                      </button>
                    </td>
                  </tr>
                ))}
                {!campaigns.length && (
                  <tr>
                    <td className="px-3 py-4 text-sm text-slate-600" colSpan={8}>
                      Aucune campagne pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "segments" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Segments</p>
              <h3 className="text-lg font-semibold text-slate-900">Ciblage dynamique</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Nom du segment"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Description"
                value={segmentDescription}
                onChange={(e) => setSegmentDescription(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleCreateSegment}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Créer un segment
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Règles (JSON)</label>
            <textarea
              value={segmentRules}
              onChange={(e) => setSegmentRules(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Nom</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Taille</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Dernière maj</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => (
                  <tr key={segment.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-semibold text-slate-900">{segment.name}</td>
                    <td className="px-3 py-2 text-slate-700">{segment.previewCount}</td>
                    <td className="px-3 py-2 text-slate-700">{formatDate(segment.updatedAt)}</td>
                  </tr>
                ))}
                {!segments.length && (
                  <tr>
                    <td className="px-3 py-4 text-sm text-slate-600" colSpan={3}>
                      Aucun segment défini pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "automations" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Automations</p>
              <h3 className="text-lg font-semibold text-slate-900">Flows déclenchés</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Nom"
                value={automationName}
                onChange={(e) => setAutomationName(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={automationTrigger}
                onChange={(e) => setAutomationTrigger(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="USER_REGISTERED">Inscription</option>
                <option value="ORDER_PAID">Commande payée</option>
                <option value="NO_LOGIN_X_DAYS">Inactif</option>
              </select>
              <select
                value={automationTemplateId}
                onChange={(e) => setAutomationTemplateId(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Template</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={automationDelay}
                onChange={(e) => setAutomationDelay(Number(e.target.value) || 0)}
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Délai (min)"
              />
              <button
                type="button"
                onClick={handleCreateAutomation}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Ajouter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Nom</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Trigger</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Statut</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Steps</th>
                </tr>
              </thead>
              <tbody>
                {automations.map((auto) => (
                  <tr key={auto.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-semibold text-slate-900">{auto.name}</td>
                    <td className="px-3 py-2 text-slate-700">{auto.trigger}</td>
                    <td className="px-3 py-2 text-slate-700">{auto.status}</td>
                    <td className="px-3 py-2 text-slate-700">{auto.steps.length} étape(s)</td>
                  </tr>
                ))}
                {!automations.length && (
                  <tr>
                    <td className="px-3 py-4 text-sm text-slate-600" colSpan={4}>
                      Aucune automation configurée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Analytics</p>
            <h3 className="text-lg font-semibold text-slate-900">Performance & ROI</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-600">Emails envoyés</p>
              <p className="text-2xl font-semibold text-slate-900">{analyticsOverview?.sentCount ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-600">Ouverts</p>
              <p className="text-2xl font-semibold text-slate-900">{analyticsOverview?.opens ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-600">Clicks</p>
              <p className="text-2xl font-semibold text-slate-900">{analyticsOverview?.clicks ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-600">CA attribué (€)</p>
              <p className="text-2xl font-semibold text-slate-900">
                {analyticsOverview ? (analyticsOverview.revenue / 100).toFixed(2) : "—"}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-800">Revenu par campagne</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                {campaignAnalytics.map((row) => (
                  <li key={row.campaignId} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span>{row.campaignName}</span>
                    <span className="font-semibold">{((row.revenue || 0) / 100).toFixed(2)} €</span>
                  </li>
                ))}
                {!campaignAnalytics.length && <p className="text-sm text-slate-600">Pas encore de ventes attribuées.</p>}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-800">Taille des segments</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                {segmentAnalytics.map((row) => (
                  <li key={row.segmentId} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span>{row.name}</span>
                    <span className="font-semibold">{row.size}</span>
                  </li>
                ))}
                {!segmentAnalytics.length && <p className="text-sm text-slate-600">Aucun segment calculé.</p>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === "deliverability" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Délivrabilité</p>
            <h3 className="text-lg font-semibold text-slate-900">Checklist domaine</h3>
            <p className="text-sm text-slate-600">Contrôlez SPF / DKIM / DMARC et vos alertes récentes.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["spfStatus", "dkimStatus", "dmarcStatus"] as const).map((key) => (
              <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-600">{key.replace("Status", "").toUpperCase()}</p>
                <p className="text-lg font-semibold text-slate-900">{deliverabilityStatus?.[key] || "UNKNOWN"}</p>
                <p className="text-xs text-slate-500">Marquez comme vérifié une fois le DNS prêt.</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Alertes</p>
                <p className="text-sm text-amber-900">Surveillez les bounce/spam ou volume inhabituel.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800">{alerts.length} alertes</span>
            </div>
            <ul className="mt-3 space-y-2">
              {alerts.map((alert) => (
                <li key={alert.id} className="rounded-lg bg-white/60 p-3 text-sm text-amber-900">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{alert.type}</span>
                    <span className="text-xs uppercase">{alert.severity}</span>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                </li>
              ))}
              {!alerts.length && <li className="text-sm text-amber-800">Aucune alerte active.</li>}
            </ul>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <form
          onSubmit={handleSettingsSave}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paramètres d'envoi</p>
            <h3 className="text-lg font-semibold text-slate-900">Expéditeur SMTP</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">From name</label>
              <input
                type="text"
                value={fromNameInput}
                onChange={(e) => setFromNameInput(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">From email</label>
              <input
                type="email"
                value={fromEmailInput}
                onChange={(e) => setFromEmailInput(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Reply-to</label>
              <input
                type="email"
                value={replyToInput}
                onChange={(e) => setReplyToInput(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
            >
              Enregistrer
            </button>
          </div>
        </form>
      )}

      {activeTab !== "subscribers" &&
        activeTab !== "templates" &&
        activeTab !== "campaigns" &&
        activeTab !== "settings" &&
        activeTab !== "analytics" &&
        activeTab !== "segments" &&
        activeTab !== "automations" &&
        activeTab !== "deliverability" && emptyPlaceholder}

      {showForm && (
        <SubscriberForm
          initial={editing || undefined}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
};

export default AdminNewsletterPage;
