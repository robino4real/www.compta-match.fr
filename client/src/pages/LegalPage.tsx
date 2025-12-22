import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import StructuredDataScript from "../components/StructuredDataScript";

interface LegalPageDto {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  updatedAt?: string;
}

type LegalPageProps = {
  slugOverride?: string;
};

const LegalPage: React.FC<LegalPageProps> = ({ slugOverride }) => {
  const { legalSlug: routeSlug } = useParams<{ legalSlug: string }>();
  const legalSlug = slugOverride || routeSlug;
  const [page, setPage] = useState<LegalPageDto | null>(null);
  const [structuredData, setStructuredData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      if (!legalSlug) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/legal-pages/${legalSlug}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Contenu indisponible pour le moment.");
        }

        setPage(data.page as LegalPageDto);
        setStructuredData(Array.isArray(data.structuredData) ? data.structuredData : null);
      } catch (err: any) {
        console.error("Erreur lors du chargement de la page légale", err);
        setError(err?.message || "Impossible de charger cette page pour le moment.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [legalSlug]);

  useEffect(() => {
    if (page?.title) {
      document.title = `${page.title} | ComptaMatch`;
    }
  }, [page?.title]);

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4">
        {isLoading && (
          <p className="text-sm text-slate-600">Chargement du contenu…</p>
        )}

        {error && !isLoading && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {!isLoading && !error && page && (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-6 border-b border-slate-100 pb-4">
              <h1 className="text-2xl font-semibold text-slate-900">
                {page.title}
              </h1>
              {page.updatedAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Mis à jour le {new Date(page.updatedAt).toLocaleDateString("fr-FR")}
                </p>
              )}
            </header>

            <div
              className="legal-page-content space-y-4 text-sm leading-relaxed text-slate-800"
              dangerouslySetInnerHTML={{ __html: page.content || "" }}
            />
          </article>
        )}
      </div>

      {structuredData && <StructuredDataScript data={structuredData} />}
    </div>
  );
};

export default LegalPage;
