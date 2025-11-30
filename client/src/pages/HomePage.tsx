import React from "react";
import StructuredDataScript from "../components/StructuredDataScript";
import PageRenderer from "../components/pageBuilder/PageRenderer";
import { useCustomPage } from "../hooks/useCustomPage";
import { useHomepageSettings } from "../hooks/useHomepageSettings";

const HomePage: React.FC = () => {
  const {
    settings,
    highlightedProducts,
    structuredData,
    isLoading: isHomepageLoading,
    error,
  } = useHomepageSettings();
  const {
    data: builderData,
    isLoading: isBuilderLoading,
    error: builderError,
  } = useCustomPage("/");

  React.useEffect(() => {
    document.title = settings.seoTitle || "ComptaMatch";
    const descriptionTag = document.querySelector("meta[name='description']");
    if (descriptionTag) {
      descriptionTag.setAttribute(
        "content",
        settings.seoDescription || "ComptaMatch simplifie la comptabilité des petites entreprises."
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = settings.seoDescription || "ComptaMatch simplifie la comptabilité des petites entreprises.";
      document.head.appendChild(meta);
    }

    const faviconUrl = settings.faviconUrl?.trim();
    const existingFavicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;

    if (faviconUrl) {
      if (existingFavicon) {
        existingFavicon.href = faviconUrl;
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = faviconUrl;
        document.head.appendChild(link);
      }
    } else if (existingFavicon) {
      existingFavicon.remove();
    }
  }, [settings]);

  const features = Array.isArray(settings.features) ? settings.features : [];
  const testimonials = Array.isArray(settings.testimonials) ? settings.testimonials : [];

  const heroStyle = settings.heroBackgroundImageUrl
    ? {
        backgroundImage: `url(${settings.heroBackgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  const shouldRenderBuilder =
    builderData && Array.isArray(builderData.sections) && builderData.sections.length > 0;

  if (isBuilderLoading && !shouldRenderBuilder && isHomepageLoading) {
    return (
      <div className="py-12 text-center text-sm text-slate-600">Chargement de la page...</div>
    );
  }

  if (builderError) {
    console.warn("Page builder indisponible", builderError);
  }

  return (
    <div className="space-y-8 text-slate-900">
      <StructuredDataScript data={structuredData} />
      {shouldRenderBuilder ? (
        <PageRenderer page={builderData!.page} sections={builderData!.sections} />
      ) : (
        <section
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm"
          style={heroStyle}
        >
          <div className="md:flex md:items-center md:gap-8">
            <div className="space-y-4 md:w-1/2">
              {settings.siteLogoUrl && (
                <div className="flex items-center gap-3">
                  <img
                    src={settings.siteLogoUrl}
                    alt="Logo ComptaMatch"
                    className="h-10 w-auto rounded bg-white/80 p-1 shadow-sm"
                  />
                </div>
              )}
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Accueil ComptaMatch</p>
              <h1 className="text-3xl font-semibold text-black">{settings.heroTitle}</h1>
              <p className="text-sm leading-relaxed text-slate-700">{settings.heroSubtitle}</p>
              <div className="flex items-center gap-3">
                <a
                  href={settings.heroButtonUrl}
                  className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  {settings.heroButtonLabel}
                </a>
              </div>
            </div>

            {settings.heroImageUrl && (
              <div className="mt-6 md:mt-0 md:w-1/2">
                <img
                  src={settings.heroImageUrl}
                  alt="Visuel principal ComptaMatch"
                  className="w-full rounded-xl border border-slate-200 bg-white object-cover shadow-sm"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {!shouldRenderBuilder && features.length > 0 && (
        <section className="grid gap-4 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={`${feature.title}-${index}`}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2"
            >
              <h2 className="text-base font-semibold text-black">{feature.title}</h2>
              <p className="text-sm leading-relaxed text-slate-700">{feature.description}</p>
            </div>
          ))}
        </section>
      )}

      {!shouldRenderBuilder && highlightedProducts.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">Produits mis en avant</h3>
            <a href="/telechargements" className="text-xs font-semibold text-black hover:underline">
              Voir tous les logiciels
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {highlightedProducts.map((product) => (
              <article
                key={product.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-black">{product.name}</h4>
                  <p className="text-[11px] text-slate-600">
                    {product.shortDescription ||
                      product.longDescription ||
                      "Logiciel téléchargeable proposé par ComptaMatch."}
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-black">
                    {(product.priceCents / 100).toFixed(2)} €
                    <span className="text-[11px] font-normal text-slate-500">
                      {" "}
                      TTC – paiement unique
                    </span>
                  </p>
                  <a
                    href={`/telechargements`}
                    className="inline-flex w-full items-center justify-center rounded-full border border-black px-4 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white"
                  >
                    Découvrir
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!shouldRenderBuilder && testimonials.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="text-lg font-semibold text-black">Ils utilisent ComptaMatch</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2"
              >
                <p className="text-sm leading-relaxed text-slate-800">“{testimonial.text}”</p>
                <p className="text-xs font-semibold text-black">{testimonial.name}</p>
                <p className="text-[11px] text-slate-600">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!shouldRenderBuilder && (settings.contentBlockTitle || settings.contentBlockBody) && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          {settings.contentBlockTitle && (
            <h3 className="text-lg font-semibold text-black">{settings.contentBlockTitle}</h3>
          )}
          {settings.contentBlockBody && (
            <div
              className="prose prose-sm max-w-none text-slate-800"
              dangerouslySetInnerHTML={{ __html: settings.contentBlockBody }}
            />
          )}
        </section>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {isHomepageLoading && <p className="text-xs text-slate-600">Chargement de la page...</p>}
    </div>
  );
};

export default HomePage;
