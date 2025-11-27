import React from "react";
import StructuredDataScript from "../components/StructuredDataScript";
import PageRenderer from "../components/pageBuilder/PageRenderer";
import { useCustomPage } from "../hooks/useCustomPage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type Feature = { title: string; description: string };
type Testimonial = { name: string; role: string; text: string };

type HomepageSettings = {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonLabel: string;
  heroButtonUrl: string;
  heroImageUrl?: string | null;
  heroBackgroundImageUrl?: string | null;
  features?: Feature[];
  highlightedProductIds?: string[];
  testimonials?: Testimonial[];
  contentBlockTitle?: string | null;
  contentBlockBody?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type HighlightedProduct = {
  id: string;
  name: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  priceCents: number;
  currency: string;
  slug: string;
};

const FALLBACK_SETTINGS: HomepageSettings = {
  heroTitle: "Bienvenue chez COMPTAMATCH",
  heroSubtitle:
    "Outils et contenus pour aider les TPE, micro-entreprises et indépendants à piloter leur comptabilité.",
  heroButtonLabel: "Découvrir nos offres",
  heroButtonUrl: "/offres",
  heroImageUrl: null,
  heroBackgroundImageUrl: null,
  features: [
    {
      title: "Simplicité",
      description:
        "Une interface claire pour suivre vos obligations et vos documents sans jargon inutile.",
    },
    {
      title: "Souplesse",
      description: "Choisissez entre outils téléchargeables et ressources en ligne.",
    },
    {
      title: "Support",
      description:
        "Une équipe disponible et des guides pour vous accompagner au quotidien.",
    },
  ],
  highlightedProductIds: [],
  testimonials: [],
  contentBlockTitle: "Une approche pragmatique",
  contentBlockBody:
    "ComptaMatch privilégie des outils sobres, des explications concrètes et des téléchargements fiables pour vos logiciels.",
  seoTitle: "ComptaMatch | Solutions comptables pour petites entreprises",
  seoDescription:
    "Logiciels et contenus pour simplifier la comptabilité des TPE, indépendants et micro-entrepreneurs.",
};

const HomePage: React.FC = () => {
  const [settings, setSettings] = React.useState<HomepageSettings>(FALLBACK_SETTINGS);
  const [highlightedProducts, setHighlightedProducts] = React.useState<
    HighlightedProduct[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [structuredData, setStructuredData] = React.useState<any[] | null>(null);
  const {
    data: builderData,
    isLoading: isBuilderLoading,
    error: builderError,
  } = useCustomPage("/");

  const parseFeatures = (value: unknown): Feature[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => ({
        title: typeof item?.title === "string" ? item.title : "",
        description:
          typeof item?.description === "string" ? item.description : "",
      }))
      .filter((item) => item.title || item.description);
  };

  const parseTestimonials = (value: unknown): Testimonial[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => ({
        name: typeof item?.name === "string" ? item.name : "",
        role: typeof item?.role === "string" ? item.role : "",
        text: typeof item?.text === "string" ? item.text : "",
      }))
      .filter((item) => item.name || item.role || item.text);
  };

  React.useEffect(() => {
    const fetchHomepage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/public/homepage-settings`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || "Impossible de charger la page d'accueil.");
        }

        const incomingSettings = (data as { settings?: HomepageSettings }).settings;
        const normalized: HomepageSettings = {
          ...FALLBACK_SETTINGS,
          ...(incomingSettings || {}),
          features: parseFeatures(incomingSettings?.features),
          testimonials: parseTestimonials(incomingSettings?.testimonials),
        };

        setSettings(normalized);
        const products = Array.isArray((data as any)?.highlightedProducts)
          ? ((data as any).highlightedProducts as HighlightedProduct[])
          : [];
        setHighlightedProducts(products);
        setStructuredData(
          Array.isArray((data as any)?.structuredData) ? (data as any).structuredData : null
        );
      } catch (err: any) {
        console.error("Erreur home", err);
        setError(err?.message || "Impossible de charger la page d'accueil.");
        setSettings(FALLBACK_SETTINGS);
        setHighlightedProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomepage();
  }, []);

  React.useEffect(() => {
    if (!settings) return;
    document.title = settings.seoTitle || "ComptaMatch";
    const descriptionTag = document.querySelector("meta[name='description']");
    if (descriptionTag) {
      descriptionTag.setAttribute(
        "content",
        settings.seoDescription ||
          "ComptaMatch simplifie la comptabilité des petites entreprises."
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content =
        settings.seoDescription ||
        "ComptaMatch simplifie la comptabilité des petites entreprises.";
      document.head.appendChild(meta);
    }
  }, [settings]);

  const features = parseFeatures(settings.features);
  const testimonials = parseTestimonials(settings.testimonials);

  const heroStyle = settings.heroBackgroundImageUrl
    ? {
        backgroundImage: `url(${settings.heroBackgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  const shouldRenderBuilder =
    builderData && Array.isArray(builderData.sections) && builderData.sections.length > 0;

  if (isBuilderLoading && !shouldRenderBuilder && isLoading) {
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
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Accueil ComptaMatch
              </p>
              <h1 className="text-3xl font-semibold text-black">
                {settings.heroTitle}
              </h1>
              <p className="text-sm leading-relaxed text-slate-700">
                {settings.heroSubtitle}
              </p>
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
              <p className="text-sm leading-relaxed text-slate-700">
                {feature.description}
              </p>
            </div>
          ))}
        </section>
      )}

      {!shouldRenderBuilder && highlightedProducts.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">Produits mis en avant</h3>
            <a
              href="/telechargements"
              className="text-xs font-semibold text-black hover:underline"
            >
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
                  <h4 className="text-sm font-semibold text-black">
                    {product.name}
                  </h4>
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
                <p className="text-sm leading-relaxed text-slate-800">
                  “{testimonial.text}”
                </p>
                <p className="text-xs font-semibold text-black">
                  {testimonial.name}
                </p>
                <p className="text-[11px] text-slate-600">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!shouldRenderBuilder && (settings.contentBlockTitle || settings.contentBlockBody) && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          {settings.contentBlockTitle && (
            <h3 className="text-lg font-semibold text-black">
              {settings.contentBlockTitle}
            </h3>
          )}
          {settings.contentBlockBody && (
            <div
              className="prose prose-sm max-w-none text-slate-800"
              dangerouslySetInnerHTML={{ __html: settings.contentBlockBody }}
            />
          )}
        </section>
      )}

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}

      {isLoading && (
        <p className="text-xs text-slate-600">Chargement de la page...</p>
      )}
    </div>
  );
};

export default HomePage;
