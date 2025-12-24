import { PrismaClient } from "@prisma/client";
import { normalizeUploadUrl } from "../utils/assetPaths";

const prisma = new PrismaClient();

const LEGACY_UPLOAD_PREFIXES = [
  "https://compta-match.fr/uploads/",
  "https://www.compta-match.fr/uploads/",
  "https://api.compta-match.fr/uploads/",
];

function normalizeString(value: string) {
  let updated = value;
  for (const prefix of LEGACY_UPLOAD_PREFIXES) {
    if (updated.includes(prefix)) {
      updated = updated.replace(prefix, "/uploads/");
    }
  }

  const normalized = normalizeUploadUrl(updated);
  return normalized || updated;
}

function normalizeValue<T>(value: T): { value: T; changed: boolean } {
  if (typeof value === "string") {
    const normalized = normalizeString(value);
    return { value: normalized as T, changed: normalized !== value };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((entry) => {
      const result = normalizeValue(entry);
      changed = changed || result.changed;
      return result.value;
    });
    return { value: next as T, changed };
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    let changed = false;
    const next: Record<string, unknown> = Array.isArray(value) ? [] : {};

    for (const [key, entry] of Object.entries(value)) {
      const result = normalizeValue(entry as any);
      changed = changed || result.changed;
      next[key] = result.value;
    }

    return { value: next as T, changed };
  }

  return { value, changed: false };
}

async function migrateDownloadableProducts() {
  const products = await prisma.downloadableProduct.findMany();
  let updatedCount = 0;

  for (const product of products) {
    const updateData: any = {};

    const cardImage = normalizeString(product.cardImageUrl || "");
    if (cardImage !== (product.cardImageUrl || "")) {
      updateData.cardImageUrl = cardImage || null;
    }

    const thumbnail = normalizeString(product.thumbnailUrl || "");
    if (thumbnail !== (product.thumbnailUrl || "")) {
      updateData.thumbnailUrl = thumbnail || null;
    }

    const ogImage = normalizeString(product.ogImageUrl || "");
    if (ogImage !== (product.ogImageUrl || "")) {
      updateData.ogImageUrl = ogImage || null;
    }

    const slides = normalizeValue(product.detailSlides || []);
    if (slides.changed) {
      updateData.detailSlides = slides.value;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.downloadableProduct.update({ where: { id: product.id }, data: updateData });
      updatedCount += 1;
    }
  }

  console.log(`DownloadableProduct: ${updatedCount} row(s) updated.`);
}

async function migrateArticles() {
  const articles = await prisma.article.findMany();
  let updatedCount = 0;

  for (const article of articles) {
    const updateData: any = {};

    const cover = normalizeString(article.coverImageUrl || "");
    if (cover !== (article.coverImageUrl || "")) {
      updateData.coverImageUrl = cover || null;
    }

    const og = normalizeString(article.ogImageUrl || "");
    if (og !== (article.ogImageUrl || "")) {
      updateData.ogImageUrl = og || null;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.article.update({ where: { id: article.id }, data: updateData });
      updatedCount += 1;
    }
  }

  console.log(`Article: ${updatedCount} row(s) updated.`);
}

async function migrateHomepageSettings() {
  const settings = await prisma.homepageSettings.findFirst();
  if (!settings) return console.log("HomepageSettings: no rows found.");

  const updateData: any = {};

  const heroImage = normalizeString(settings.heroImageUrl || "");
  if (heroImage !== (settings.heroImageUrl || "")) {
    updateData.heroImageUrl = heroImage || null;
  }

  const heroBackground = normalizeString(settings.heroBackgroundImageUrl || "");
  if (heroBackground !== (settings.heroBackgroundImageUrl || "")) {
    updateData.heroBackgroundImageUrl = heroBackground || null;
  }

  const siteLogo = normalizeString(settings.siteLogoUrl || "");
  if (siteLogo !== (settings.siteLogoUrl || "")) {
    updateData.siteLogoUrl = siteLogo || null;
  }

  const navbarLogo = normalizeString(settings.navbarLogoUrl || "");
  if (navbarLogo !== (settings.navbarLogoUrl || "")) {
    updateData.navbarLogoUrl = navbarLogo || null;
  }

  const favicon = normalizeString(settings.faviconUrl || "");
  if (favicon !== (settings.faviconUrl || "")) {
    updateData.faviconUrl = favicon || null;
  }

  const heroIllustration = normalizeString(settings.heroIllustrationUrl || "");
  if (heroIllustration !== (settings.heroIllustrationUrl || "")) {
    updateData.heroIllustrationUrl = heroIllustration || null;
  }

  const heroSections = normalizeValue(settings.heroSections || []);
  if (heroSections.changed) {
    updateData.heroSections = heroSections.value;
  }

  const features = normalizeValue(settings.features || []);
  if (features.changed) {
    updateData.features = features.value;
  }

  const blocks = normalizeValue(settings.blocks || []);
  if (blocks.changed) {
    updateData.blocks = blocks.value;
  }

  if (Object.keys(updateData).length === 0) {
    console.log("HomepageSettings: no updates needed.");
    return;
  }

  await prisma.homepageSettings.update({ where: { id: settings.id }, data: updateData });
  console.log("HomepageSettings: updated.");
}

async function migrateSeoSettings() {
  const settings = await prisma.seoSettings.findFirst();
  if (!settings) return console.log("SeoSettings: no rows found.");

  const defaultOg = normalizeString(settings.defaultOgImageUrl || "");
  if (defaultOg !== (settings.defaultOgImageUrl || "")) {
    await prisma.seoSettings.update({
      where: { id: settings.id },
      data: { defaultOgImageUrl: defaultOg || null },
    });
    console.log("SeoSettings: updated.");
    return;
  }

  console.log("SeoSettings: no updates needed.");
}

async function migrateSeoStaticPages() {
  const pages = await prisma.seoStaticPage.findMany();
  let updatedCount = 0;

  for (const page of pages) {
    const og = normalizeString(page.ogImageUrl || "");
    if (og !== (page.ogImageUrl || "")) {
      await prisma.seoStaticPage.update({ where: { id: page.id }, data: { ogImageUrl: og || null } });
      updatedCount += 1;
    }
  }

  console.log(`SeoStaticPage: ${updatedCount} row(s) updated.`);
}

async function migrateCompanySettings() {
  const settings = await prisma.companySettings.findFirst();
  if (!settings) return console.log("CompanySettings: no rows found.");

  const logo = normalizeString(settings.logoUrl || "");
  if (logo !== (settings.logoUrl || "")) {
    await prisma.companySettings.update({ where: { id: settings.id }, data: { logoUrl: logo || null } });
    console.log("CompanySettings: updated.");
  } else {
    console.log("CompanySettings: no updates needed.");
  }
}

async function migratePaidServiceSections() {
  const sections = await prisma.paidServiceSection.findMany();
  let updatedCount = 0;

  for (const section of sections) {
    const image = normalizeString(section.imageUrl || "");
    if (image !== (section.imageUrl || "")) {
      await prisma.paidServiceSection.update({ where: { id: section.id }, data: { imageUrl: image || null } });
      updatedCount += 1;
    }
  }

  console.log(`PaidServiceSection: ${updatedCount} row(s) updated.`);
}

async function migratePageSections() {
  const sections = await prisma.pageSection.findMany({ include: { blocks: true } });
  let updatedSections = 0;
  let updatedBlocks = 0;

  for (const section of sections) {
    const updateSectionData: any = {};
    const bg = normalizeString(section.backgroundImageUrl || "");
    if (bg !== (section.backgroundImageUrl || "")) {
      updateSectionData.backgroundImageUrl = bg || null;
    }

    const settingsValue = normalizeValue(section.settings || {});
    if (settingsValue.changed) {
      updateSectionData.settings = settingsValue.value;
    }

    if (Object.keys(updateSectionData).length > 0) {
      await prisma.pageSection.update({ where: { id: section.id }, data: updateSectionData });
      updatedSections += 1;
    }

    for (const block of section.blocks) {
      const dataValue = normalizeValue(block.data || {});
      if (dataValue.changed) {
        await prisma.pageBlock.update({ where: { id: block.id }, data: { data: dataValue.value } });
        updatedBlocks += 1;
      }
    }
  }

  console.log(`PageSection: ${updatedSections} row(s) updated.`);
  console.log(`PageBlock: ${updatedBlocks} row(s) updated.`);
}

async function main() {
  await migrateDownloadableProducts();
  await migrateArticles();
  await migrateHomepageSettings();
  await migrateSeoSettings();
  await migrateSeoStaticPages();
  await migrateCompanySettings();
  await migratePaidServiceSections();
  await migratePageSections();
}

main()
  .catch((error) => {
    console.error("Migration failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
