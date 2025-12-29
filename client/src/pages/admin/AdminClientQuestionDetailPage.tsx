import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

type QuestionDetail = {
  id: string;
  subject?: string | null;
  question: string;
  answer?: string | null;
  published: boolean;
  createdAt: string;
  user?: { id: string; email: string };
};

const AdminClientQuestionDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = React.useState<QuestionDetail | null>(null);
  const [answer, setAnswer] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const loadQuestion = React.useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/client-questions/${id}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Impossible de charger la question.");
      }
      const payload = (data as any)?.data as QuestionDetail;
      setQuestion(payload);
      setAnswer(payload?.answer || "");
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const saveAnswer = async () => {
    if (!id) return;
    setActionLoading(true);
    setStatusMessage(null);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/client-questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answer }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Impossible d'enregistrer la réponse.");
      }
      const payload = (data as any)?.data as QuestionDetail;
      setQuestion(payload);
      setStatusMessage("Réponse enregistrée.");
    } catch (err: any) {
      setError(err?.message || "Impossible d'enregistrer la réponse.");
    } finally {
      setActionLoading(false);
    }
  };

  const publish = async () => {
    if (!id) return;
    setActionLoading(true);
    setStatusMessage(null);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/client-questions/${id}/publish`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Impossible de publier la réponse.");
      }
      const payload = (data as any)?.data as QuestionDetail;
      setQuestion(payload);
      setStatusMessage("Réponse publiée dans la FAQ publique.");
    } catch (err: any) {
      setError(err?.message || "Impossible de publier la réponse.");
    } finally {
      setActionLoading(false);
    }
  };

  const unpublish = async () => {
    if (!id) return;
    setActionLoading(true);
    setStatusMessage(null);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/client-questions/${id}/unpublish`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Impossible de dépublier la réponse.");
      }
      const payload = (data as any)?.data as QuestionDetail;
      setQuestion(payload);
      setStatusMessage("Réponse dépubliée.");
    } catch (err: any) {
      setError(err?.message || "Impossible de dépublier la réponse.");
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = () => {
    if (!question) return null;
    const base = "rounded-full px-3 py-1 text-[11px] font-semibold";
    if (question.published) return <span className={`${base} bg-emerald-100 text-emerald-700`}>Publié</span>;
    if (question.answer) return <span className={`${base} bg-blue-100 text-blue-700`}>Répondu</span>;
    return <span className={`${base} bg-amber-100 text-amber-800`}>Nouveau</span>;
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-black"
      >
        ← Retour
      </button>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Support</p>
            <h1 className="text-xl font-semibold text-black">Question client</h1>
            {question?.user?.email && <p className="text-xs text-slate-600">Client : {question.user.email}</p>}
          </div>
          <div>{statusBadge()}</div>
        </div>

        {isLoading && <p className="text-sm text-slate-600">Chargement…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {question && !isLoading && !error && (
          <div className="space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Sujet</p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                {question.subject || "—"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Question</p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 whitespace-pre-line">
                {question.question}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Réponse</label>
              <textarea
                rows={6}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Rédigez la réponse à destination du client"
              />
              <p className="text-xs text-slate-500">La réponse peut être enregistrée en brouillon, puis publiée.</p>
            </div>

            {statusMessage && <p className="text-sm text-emerald-700">{statusMessage}</p>}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={saveAnswer}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                Enregistrer la réponse
              </button>
              <button
                type="button"
                disabled={actionLoading || !answer.trim()}
                onClick={publish}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Publier la réponse
              </button>
              {question.published && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={unpublish}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Dépublier
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminClientQuestionDetailPage;
