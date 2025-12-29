import React from "react";
import { API_BASE_URL } from "../config/api";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  category?: "ARTICLE" | "TUTORIAL" | null;
  readTimeMinutes?: number | null;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  createdAt?: string;
};

type TabKey = "articles" | "faq" | "tutorials";

const tabs: { key: TabKey; label: string }[] = [
  { key: "articles", label: "Articles" },
  { key: "faq", label: "Foire aux questions" },
  { key: "tutorials", label: "Tutoriels" },
];

const FaqPage: React.FC = () => {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tutorials, setTutorials] = React.useState<Article[]>([]);
  const [isTutorialLoading, setIsTutorialLoading] = React.useState(false);
  const [tutorialError, setTutorialError] = React.useState<string | null>(null);
  const [faqItems, setFaqItems] = React.useState<FaqItem[]>([]);
  const [isFaqLoading, setIsFaqLoading] = React.useState(false);
  const [faqError, setFaqError] = React.useState<string | null>(null);
  const [subject, setSubject] = React.useState("");
  const [question, setQuestion] = React.useState("");
  const [formStatus, setFormStatus] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabKey>("articles");
  const { user, isLoading: isAuthLoading } = useAuth();

  React.useEffect(() => {
    const loadArticles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/articles?category=ARTICLE`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error((data as { message?: string }).message || "Impossible de charger les articles");
        }
        const list = Array.isArray((data as any)?.articles)
          ? ((data as any).articles as Article[])
          : [];
        setArticles(list);
      } catch (err: any) {
        setError(err?.message || "Impossible de charger la FAQ");
      } finally {
        setIsLoading(false);
      }
    };

    loadArticles();
  }, []);

  React.useEffect(() => {
    const loadTutorials = async () => {
      try {
        setIsTutorialLoading(true);
        setTutorialError(null);
        const response = await fetch(`${API_BASE_URL}/articles?category=TUTORIAL`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error((data as { message?: string }).message || "Impossible de charger les tutoriels");
        }
        const list = Array.isArray((data as any)?.articles)
          ? ((data as any).articles as Article[])
          : [];
        setTutorials(list);
      } catch (err: any) {
        setTutorialError(err?.message || "Impossible de charger les tutoriels");
      } finally {
        setIsTutorialLoading(false);
      }
    };

    loadTutorials();
  }, []);

  React.useEffect(() => {
    const loadFaq = async () => {
      try {
        setIsFaqLoading(true);
        setFaqError(null);
        const response = await fetch(`${API_BASE_URL}/public/faq`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error((data as { message?: string }).message || "Impossible de charger la FAQ");
        }
        const items = Array.isArray((data as any)?.data?.items)
          ? ((data as any).data.items as FaqItem[])
          : [];
        setFaqItems(items);
      } catch (err: any) {
        setFaqError(err?.message || "Impossible de charger la FAQ");
      } finally {
        setIsFaqLoading(false);
      }
    };

    loadFaq();
  }, []);

  const categoryLabel = (category?: Article["category"]) => {
    if (category === "TUTORIAL") return "Tutoriel";
    return "Article";
  };

  const renderArticles = (items: Article[], loading: boolean) => (
    <div className="space-y-4">
      {items.map((article) => (
        <Link
          key={article.id}
          to={`/articles/${article.slug}`}
          className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {article.coverImageUrl && (
                <img
                  src={article.coverImageUrl}
                  alt=""
                  className="h-14 w-20 rounded-lg object-cover ring-1 ring-slate-200"
                />
              )}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {categoryLabel(article.category)}
                </p>
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700">
                  {article.title}
                </h2>
              </div>
            </div>
            {article.readTimeMinutes ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                {article.readTimeMinutes} min
              </span>
            ) : null}
          </div>
          {article.excerpt && (
            <p className="text-sm text-slate-600 line-clamp-2">{article.excerpt}</p>
          )}
        </Link>
      ))}

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Aucun article publié pour le moment.
        </div>
      )}
    </div>
  );

  const renderFaqTab = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">FAQ publique</p>
          <h2 className="text-lg font-semibold text-slate-900">Questions fréquentes</h2>
          <p className="text-sm text-slate-600">
            Les questions publiées par notre équipe support après réponse apparaissent ci-dessous.
          </p>
        </div>

        {isFaqLoading && <p className="text-sm text-slate-500">Chargement…</p>}
        {faqError && <p className="text-sm text-red-600">{faqError}</p>}

        {!isFaqLoading && !faqError && faqItems.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Aucune question publiée pour le moment.
          </div>
        )}

        <div className="space-y-3">
          {faqItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={(event) => {
                  const target = event.currentTarget.nextElementSibling as HTMLDivElement | null;
                  if (target) {
                    target.classList.toggle("hidden");
                  }
                }}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  Réponse
                </span>
              </button>
              <div className="mt-3 hidden text-sm text-slate-700">
                {item.answer}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Support client</p>
          <h2 className="text-lg font-semibold text-slate-900">Poser une question</h2>
          <p className="text-sm text-slate-600">Envoyez votre question à notre équipe. Réponse et publication possibles par l'administrateur.</p>
        </div>

        {isAuthLoading ? (
          <p className="text-sm text-slate-500">Chargement de votre session…</p>
        ) : user ? (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setFormError(null);
              setFormStatus(null);
              const trimmedQuestion = question.trim();
              if (trimmedQuestion.length < 10) {
                setFormError("La question doit contenir au moins 10 caractères.");
                return;
              }
              setIsSubmitting(true);
              try {
                const response = await fetch(`${API_BASE_URL}/client/questions`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ subject: subject.trim() || undefined, question: trimmedQuestion }),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                  throw new Error((data as { message?: string }).message || "Impossible d'envoyer la question.");
                }
                setSubject("");
                setQuestion("");
                setFormStatus("Question envoyée, en attente de réponse.");
              } catch (err: any) {
                setFormError(err?.message || "Impossible d'envoyer la question.");
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Sujet (optionnel)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                placeholder="Résumé en quelques mots"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Question *</label>
              <textarea
                required
                minLength={10}
                maxLength={2000}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={5}
                placeholder="Décrivez votre question"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
            {formStatus && <p className="text-sm text-emerald-700">{formStatus}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {isSubmitting ? "Envoi…" : "Envoyer"}
            </button>
          </form>
        ) : (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
            <p className="font-semibold">Connectez-vous pour poser une question.</p>
            <p className="mt-1 text-emerald-800">
              Accédez à votre compte pour soumettre votre question à notre équipe support.
            </p>
            <Link
              to="/auth/login"
              className="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Se connecter
            </Link>
          </div>
        )}
      </section>
    </div>
  );

  const renderContent = () => {
    if (activeTab === "articles") {
      if (isLoading) {
        return <p className="text-center text-sm text-slate-500">Chargement…</p>;
      }
      if (error) {
        return <p className="text-center text-sm text-red-600">{error}</p>;
      }
      return renderArticles(articles, isLoading);
    }
    if (activeTab === "faq") return renderFaqTab();
    if (isTutorialLoading) {
      return <p className="text-center text-sm text-slate-500">Chargement…</p>;
    }
    if (tutorialError) {
      return <p className="text-center text-sm text-red-600">{tutorialError}</p>;
    }
    return renderArticles(tutorials, isTutorialLoading);
  };

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-2 pb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Articles et FAQ</p>
          <h1 className="text-3xl font-semibold text-slate-900">Ressources ComptaMatch</h1>
          <p className="text-sm text-slate-600">
            Retrouvez l'ensemble des articles publiés. Cliquez sur une carte pour ouvrir la page détaillée.
          </p>
        </div>

        <div className="flex justify-center pb-8">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm">
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-50 ${
                    isActive
                      ? "bg-white text-emerald-700 shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        {renderContent()}
      </div>
    </main>
  );
};

export default FaqPage;
