import { prisma } from "../src/config/prisma";

const DEFAULT_PAGES = [
  { key: "HOME", route: "/", name: "Page d'accueil" },
  { key: "PRICING", route: "/logiciels", name: "Logiciels" },
  { key: "CONTACT", route: "/contact", name: "Contact" },
  { key: "ABOUT", route: "/a-propos", name: "À propos" },
];

const DEFAULT_WHY_CHOOSE_ITEMS = [
  {
    iconType: "star",
    title: "Ultra simple",
    description:
      "Interface claire, prise en main immédiate, aucune connaissance comptable avancée nécessaire.",
  },
  {
    iconType: "bolt",
    title: "Local & rapide",
    description:
      "Vos logiciels tournent en local, sans latence ni dépendance à une connexion internet.",
  },
  {
    iconType: "shield-check",
    title: "Conforme & fiable",
    description:
      "Génération automatique de documents comptables structurés et exports faciles pour votre expert-comptable.",
  },
  {
    iconType: "badge-check",
    title: "Prix unique",
    description: "Un achat, une licence : pas d’abonnement mensuel.",
  },
];

async function seedCustomPages() {
  for (const page of DEFAULT_PAGES) {
    const pageRecord = await prisma.customPage.upsert({
      where: { key: page.key },
      update: {
        route: page.route,
        name: page.name,
        status: "ACTIVE",
      },
      create: {
        key: page.key,
        route: page.route,
        name: page.name,
        status: "ACTIVE",
      },
    });

    if (page.key === "HOME") {
      const sectionCount = await prisma.pageSection.count({
        where: { pageId: pageRecord.id },
      });

      if (sectionCount === 0) {
        const heroSection = await prisma.pageSection.create({
          data: {
            pageId: pageRecord.id,
            order: 1,
            label: "Hero principal",
            type: "HERO",
            backgroundColor: "bg-white",
          },
        });

        await prisma.pageBlock.create({
          data: {
            sectionId: heroSection.id,
            order: 1,
            type: "HERO",
            data: {
              title: "Bienvenue sur ComptaMatch",
              subtitle:
                "Un site 100% administrable grâce au nouveau Page Builder.",
              ctaLabel: "En savoir plus",
              ctaUrl: "/contact",
            },
          },
        });
      }

      const whyChooseSection = await prisma.pageSection.findFirst({
        where: { pageId: pageRecord.id, type: "WHY_CHOOSE_COMPTAMATCH" },
      });

      if (!whyChooseSection) {
        const currentMaxOrder = await prisma.pageSection.aggregate({
          where: { pageId: pageRecord.id },
          _max: { order: true },
        });

        const section = await prisma.pageSection.create({
          data: {
            pageId: pageRecord.id,
            order: (currentMaxOrder._max.order ?? 0) + 1,
            label: "Pourquoi choisir ComptaMatch ?",
            type: "WHY_CHOOSE_COMPTAMATCH",
            settings: {
              title: "Pourquoi choisir ComptaMatch ?",
            },
          },
        });

        await prisma.whyChooseItem.createMany({
          data: DEFAULT_WHY_CHOOSE_ITEMS.map((item, index) => ({
            sectionId: section.id,
            order: index + 1,
            iconType: item.iconType,
            title: item.title,
            description: item.description,
          })),
        });
      } else {
        const itemCount = await prisma.whyChooseItem.count({
          where: { sectionId: whyChooseSection.id },
        });

        if (itemCount === 0) {
          await prisma.whyChooseItem.createMany({
            data: DEFAULT_WHY_CHOOSE_ITEMS.map((item, index) => ({
              sectionId: whyChooseSection.id,
              order: index + 1,
              iconType: item.iconType,
              title: item.title,
              description: item.description,
            })),
          });
        }
      }
    }
  }
}

async function seedSeoGeo() {
  await prisma.seoSettingsV2.upsert({
    where: { singletonKey: "global" },
    update: {},
    create: {
      singletonKey: "global",
      canonicalBaseUrl: "https://www.compta-match.fr",
      defaultRobotsIndex: true,
      defaultRobotsFollow: true,
      robotsTxt:
        "User-agent: *\nAllow: /\nSitemap: https://www.compta-match.fr/sitemap.xml",
      sitemapEnabled: true,
      sitemapIncludePages: true,
      sitemapIncludeProducts: true,
      sitemapIncludeArticles: false,
    },
  });

  await prisma.geoIdentity.upsert({
    where: { singletonKey: "global" },
    update: { language: "fr" },
    create: {
      singletonKey: "global",
      language: "fr",
    },
  });
}

async function main() {
  await seedCustomPages();
  await seedSeoGeo();
}

main()
  .catch((error) => {
    console.error("[seed] Erreur pendant l'initialisation des pages", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
