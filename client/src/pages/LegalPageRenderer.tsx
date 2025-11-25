import React from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type LegalPageKey =
  | "MENTIONS_LEGALES"
  | "CGV"
  | "CONFIDENTIALITE"
  | "COOKIES";

interface LegalPageResponse {
  id: string;
  key: LegalPageKey;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  updatedAt?: string;
}

interface LegalPageRendererProps {
  pageKey: LegalPageKey;
  defaultTitle: string;
  defaultDescription?: string;
}

const LegalPageRenderer: React.FC<LegalPageRendererProps> = ({
  pageKey,
  defaultTitle,
  defaultDescription,
}) => {
  const [page, setPage] = React.useState<LegalPageResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isUnavailable, setIsUnavailable] = React.useState(false);

  const effectiveTitle = page?.title || defaultTitle;
  const effectiveDescription =
    defaultDescription ||
    `Consultez ${effectiveTitle} sur ComptaMatch pour obtenir les informations légales à jour.`;

  React.useEffect(() => {
    const fetchPage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setIsUnavailable(false);

        const response = await fetch(`${API_BASE_URL}/legal-pages/${pageKey}`);
        const data = await response.json().catch(() => ({}));

        if (response.status === 404) {
          setIsUnavailable(true);
          setPage(null);
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Impossible de charger le contenu légal demandé."
          );
        }

        setPage(data.page as LegalPageResponse);
      } catch (err: any) {
        console.error("Erreur lors du chargement d'une page légale", err);
        setError(
          err?.message ||
            "Une erreur est survenue lors de la récupération de la page légale."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [pageKey]);

  React.useEffect(() => {
    const title = `${effectiveTitle} – ComptaMatch`;
    document.title = title;
    const descriptionTag = document.querySelector(
      "meta[name='description']"
    );
    if (descriptionTag) {
      descriptionTag.setAttribute("content", effectiveDescription);
    }
  }, [effectiveTitle, effectiveDescription]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold text-black">{effectiveTitle}</h1>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm text-slate-700">
        {isLoading && (
          <p className="text-sm text-slate-600">Chargement du contenu...</p>
        )}

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {isUnavailable && !isLoading && !error && (
          <p className="text-sm text-slate-700">
            Le contenu de cette page n&apos;est pas encore disponible. Merci de
            revenir ultérieurement.
          </p>
        )}

        {!isLoading && !error && !isUnavailable && page && (
          <div
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content || "" }}
          />
        )}

        {!isLoading && !error && !isUnavailable && !page && (
          <p className="text-sm text-slate-700">
            Le contenu de cette page sera bientôt publié.
          </p>
        )}
      </div>
    </div>
  );
};

export default LegalPageRenderer;
