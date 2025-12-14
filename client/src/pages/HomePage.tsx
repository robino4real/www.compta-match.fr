import React, { useEffect, useMemo } from "react";
import PageRenderer from "../components/pageBuilder/PageRenderer";
import { useHomepageSettings } from "../hooks/useHomepageSettings";
import { CustomPage, PageSection } from "../types/pageBuilder";

const DEFAULT_PAGE: CustomPage = {
  id: "home",
  key: "HOME",
  name: "Accueil",
  route: "/",
  status: "ACTIVE",
};

const HomePage: React.FC = () => {
  const { data, isLoading, error, reload } = useHomepageSettings();

  useEffect(() => {
    const title = data.seo?.title || "ComptaMatch | Solutions comptables";
    if (title) {
      document.title = title;
    }

    const description = data.seo?.description;
    if (description) {
      let meta = document.querySelector<HTMLMetaElement>("meta[name='description']");
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;
    }
  }, [data.seo]);

  const mappedSections = useMemo<PageSection[]>(() => {
    return (data.sections || []).map((section) => ({
      ...section,
      blocks: (section.blocks || []).map((block) => {
        const rawData = (block.data || {}) as Record<string, any>;
        return {
          id: block.id,
          order: block.order ?? 0,
          type: block.kind,
          data: {
            ...rawData,
            title: block.title ?? (rawData.title as string | undefined) ?? "",
            subtitle: block.subtitle ?? (rawData.subtitle as string | undefined) ?? "",
            body: block.body ?? (rawData.body as string | undefined) ?? (rawData.text as string | undefined) ?? "",
            imageUrl: block.imageUrl ?? (rawData.imageUrl as string | undefined) ?? null,
            buttonLabel: block.buttonLabel ?? (rawData.buttonLabel as string | undefined) ?? null,
            buttonUrl:
              block.buttonHref ??
              (rawData.buttonHref as string | undefined) ??
              (rawData.buttonUrl as string | undefined) ??
              (rawData.ctaUrl as string | undefined) ??
              null,
            iconName: block.iconName ?? (rawData.iconName as string | undefined) ?? (rawData.icon as string | undefined) ?? null,
            value: block.value ?? (rawData.value as string | undefined) ?? null,
          },
        };
      }),
    }));
  }, [data.sections]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Chargement de la page d'accueil…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-3 text-center">
          <p className="text-base font-semibold text-slate-900">Impossible de charger la page d'accueil</p>
          <p className="text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => reload()}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  if (!data.sections.length || data.isEmpty) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-3 text-center">
          <p className="text-base font-semibold text-slate-900">Page d'accueil en cours de construction</p>
          <p className="text-sm text-slate-500">
            Ajoutez des sections depuis le back-office pour alimenter la page publique.
          </p>
          <a
            href="/admin/pages"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-black"
          >
            Ouvrir le Page Builder
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8 page-safe-container">
        <PageRenderer page={DEFAULT_PAGE} sections={mappedSections} />
      </div>
    </main>
  );
};

export default HomePage;
