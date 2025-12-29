import React from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

type QuestionRow = {
  id: string;
  createdAt: string;
  subject?: string | null;
  questionPreview: string;
  published: boolean;
  hasAnswer: boolean;
  user: { id: string; email: string };
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const statusLabel = (item: QuestionRow) => {
  if (item.published) return "Publié";
  if (item.hasAnswer) return "Répondu";
  return "Nouveau";
};

const statusClass = (item: QuestionRow) => {
  if (item.published) return "bg-emerald-100 text-emerald-700";
  if (item.hasAnswer) return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-800";
};

const AdminClientQuestionsPage: React.FC = () => {
  const [questions, setQuestions] = React.useState<QuestionRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState("");

  const loadQuestions = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const response = await fetch(`${API_BASE_URL}/admin/client-questions?${params.toString()}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Impossible de charger les questions.");
      }
      const payload = (data as any)?.data;
      setQuestions(Array.isArray(payload?.items) ? (payload.items as QuestionRow[]) : []);
      setTotal(Number(payload?.total) || 0);
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  React.useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Support</p>
          <h1 className="text-xl font-semibold text-black">Questions client</h1>
          <p className="text-xs text-slate-600">
            Consultez les questions envoyées par les clients, répondez et publiez dans la FAQ publique.
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-700">Recherche (sujet, email, question)</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                loadQuestions();
              }}
              className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900"
            >
              Appliquer
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
                loadQuestions();
              }}
              className="w-full rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {isLoading && <p className="text-xs text-slate-600">Chargement…</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Sujet</th>
                  <th className="px-3 py-2">Question</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-white">
                    <td className="px-3 py-2 text-xs text-slate-600">{formatDate(item.createdAt)}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-slate-900">{item.user?.email}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusClass(item)}`}>
                        {statusLabel(item)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-800">{item.subject || "—"}</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{item.questionPreview}</td>
                    <td className="px-3 py-2 text-sm">
                      <Link
                        to={`/admin/client-questions/${item.id}`}
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-black"
                      >
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {questions.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-600">Aucune question trouvée.</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-700">
          <div>
            Page {page} / {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminClientQuestionsPage;
