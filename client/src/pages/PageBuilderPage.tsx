import React, { useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import PageRenderer from "../components/pageBuilder/PageRenderer";
import { useCustomPage } from "../hooks/useCustomPage";
import { CustomPage, PageSection } from "../types/pageBuilder";

type PageBuilderPageProps = {
  route: string;
  fallback?: React.ReactNode;
};

const buildFallbackPage = (route: string): CustomPage => ({
  id: route,
  key: route.replace("/", "").toUpperCase() || "PAGE",
  name: route.replace("/", "") || "Page",
  route,
  status: "ACTIVE",
});

const PageBuilderPage: React.FC<PageBuilderPageProps> = ({ route, fallback }) => {
  const { data, isLoading, error } = useCustomPage(route);

  const page = data?.page ?? buildFallbackPage(route);

  const sections = useMemo<PageSection[]>(() => {
    return (data?.sections || []).map((section) => ({
      ...section,
      blocks: (section.blocks || []).map((block) => {
        const rawData = (block as any)?.data || {};
        return {
          id: block.id,
          order: block.order ?? 0,
          type: (block as any)?.kind ?? block.type,
          data: {
            ...rawData,
            title: (block as any)?.title ?? rawData.title ?? "",
            subtitle: (block as any)?.subtitle ?? rawData.subtitle ?? "",
            body: (block as any)?.body ?? rawData.body ?? rawData.text ?? "",
            imageUrl: (block as any)?.imageUrl ?? rawData.imageUrl ?? null,
            buttonLabel: (block as any)?.buttonLabel ?? rawData.buttonLabel ?? null,
            buttonUrl:
              (block as any)?.buttonHref ?? rawData.buttonHref ?? rawData.buttonUrl ?? null,
            iconName:
              (block as any)?.iconName ?? rawData.iconName ?? (rawData.icon as string | undefined) ?? null,
            value: (block as any)?.value ?? rawData.value ?? null,
          },
        };
      }),
    }));
  }, [data?.sections]);

  useEffect(() => {
    if (page.name) {
      document.title = `${page.name} | ComptaMatch`;
    }
  }, [page.name]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Chargement de la page…</p>
      </main>
    );
  }

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <Navigate to="/" replace />;
  }

  if (data?.page && sections.length > 0) {
    return (
      <main className="bg-white text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8 page-safe-container">
          <PageRenderer page={page} sections={sections} />
        </div>
      </main>
    );
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <Navigate to="/" replace />;
};

export default PageBuilderPage;
