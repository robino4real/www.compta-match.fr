import { prisma } from "../src/config/prisma";

const DEFAULT_PAGES = [
  { key: "HOME", route: "/", name: "Page d'accueil" },
  { key: "PRICING", route: "/tarifs", name: "Tarifs" },
  { key: "CONTACT", route: "/contact", name: "Contact" },
  { key: "ABOUT", route: "/a-propos", name: "À propos" },
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
    }
  }
}

async function main() {
  await seedCustomPages();
}

main()
  .catch((error) => {
    console.error("[seed] Erreur pendant l'initialisation des pages", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
