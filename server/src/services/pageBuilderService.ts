import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

const ALLOWED_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;
type CustomPageStatus = (typeof ALLOWED_STATUSES)[number];

function normalizeKey(value?: string | null) {
  if (!value) return "";
  return value
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();
}

function normalizeRoute(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return `/${trimmed}`;
  return trimmed;
}

function normalizeStatus(value?: string | null): CustomPageStatus {
  const fallback: CustomPageStatus = "ACTIVE";
  if (!value) return fallback;
  const normalized = value.trim().toUpperCase();
  return ALLOWED_STATUSES.includes(normalized as CustomPageStatus)
    ? (normalized as CustomPageStatus)
    : fallback;
}

async function assertUniqueKeyAndRoute(
  key: string,
  route: string,
  excludePageId?: string
) {
  const existing = await prisma.customPage.findFirst({
    where: {
      OR: [{ key }, { route }],
      NOT: excludePageId ? { id: excludePageId } : undefined,
    },
  });

  if (existing) {
    if (existing.key === key) {
      throw new Error("Une page avec cette clé existe déjà.");
    }
    if (existing.route === route) {
      throw new Error("Une page avec cette route existe déjà.");
    }
  }
}

export async function getAllCustomPages() {
  return prisma.customPage.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomPageWithStructureById(id: string) {
  return prisma.customPage.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          blocks: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
}

export async function getCustomPageWithStructureByKeyOrRoute(value: string) {
  return prisma.customPage.findFirst({
    where: {
      OR: [{ key: value }, { route: value }],
    },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          blocks: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
}

export async function getPublishedCustomPageByRoute(route: string) {
  const normalizedRoute = normalizeRoute(route);

  return prisma.customPage.findFirst({
    where: {
      route: normalizedRoute,
      status: "ACTIVE",
    },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          blocks: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
}

export async function createCustomPage(data: {
  key: string;
  route: string;
  name: string;
  status?: string;
}) {
  const key = normalizeKey(data.key);
  const route = normalizeRoute(data.route);
  const status = normalizeStatus(data.status);

  if (!key) {
    throw new Error("La clé de page est requise.");
  }

  if (!route) {
    throw new Error("La route de la page est requise.");
  }

  await assertUniqueKeyAndRoute(key, route);

  return prisma.customPage.create({
    data: {
      key,
      route,
      name: data.name?.trim() || key,
      status,
    },
  });
}

export async function updateCustomPage(
  id: string,
  data: Partial<Pick<Prisma.CustomPageUpdateInput, "name" | "route" | "status">>
) {
  const existing = await prisma.customPage.findUnique({ where: { id } });
  if (!existing) return null;

  const key = existing.key;
  const route = normalizeRoute(
    typeof data.route === "string" ? data.route : existing.route
  );
  const status = normalizeStatus(
    typeof data.status === "string" ? data.status : existing.status
  );
  const name =
    typeof data.name === "string" && data.name.trim().length > 0
      ? data.name.trim()
      : existing.name;

  await assertUniqueKeyAndRoute(key, route, id);

  return prisma.customPage.update({
    where: { id },
    data: {
      route,
      status,
      name,
    },
  });
}

export async function deleteCustomPage(id: string) {
  const existing = await prisma.customPage.findUnique({ where: { id } });
  if (!existing) return null;

  const sections = await prisma.pageSection.findMany({
    where: { pageId: id },
    select: { id: true },
  });

  const sectionIds = sections.map((section) => section.id);

  await prisma.$transaction([
    prisma.pageBlock.deleteMany({
      where: { sectionId: { in: sectionIds } },
    }),
    prisma.pageSection.deleteMany({ where: { pageId: id } }),
    prisma.customPage.delete({ where: { id } }),
  ]);

  return existing;
}

export async function createPageSection(
  pageId: string,
  data: {
    label?: string | null;
    type: string;
    backgroundColor?: string | null;
    backgroundImageUrl?: string | null;
    settings?: Prisma.JsonValue | null;
  }
) {
  const page = await prisma.customPage.findUnique({ where: { id: pageId } });
  if (!page) {
    throw new Error("Page introuvable.");
  }

  const maxOrder = await prisma.pageSection.aggregate({
    where: { pageId },
    _max: { order: true },
  });

  const nextOrder = (maxOrder._max.order ?? 0) + 1;

  const normalizedSettings =
    typeof data.settings === "undefined"
      ? Prisma.JsonNull
      : data.settings === null
      ? Prisma.JsonNull
      : data.settings;

  return prisma.pageSection.create({
    data: {
      pageId,
      order: nextOrder,
      label: data.label?.trim() || null,
      type: data.type,
      backgroundColor: data.backgroundColor?.trim() || null,
      backgroundImageUrl: data.backgroundImageUrl?.trim() || null,
      settings: normalizedSettings,
    },
  });
}

export async function updatePageSection(
  sectionId: string,
  data: {
    label?: string | null;
    type?: string;
    backgroundColor?: string | null;
    backgroundImageUrl?: string | null;
    settings?: Prisma.JsonValue | null;
  }
) {
  const existing = await prisma.pageSection.findUnique({ where: { id: sectionId } });
  if (!existing) return null;

  const normalizedSettings =
    typeof data.settings === "undefined"
      ? existing.settings ?? Prisma.JsonNull
      : data.settings === null
      ? Prisma.JsonNull
      : data.settings;

  return prisma.pageSection.update({
    where: { id: sectionId },
    data: {
      label:
        typeof data.label === "undefined"
          ? existing.label
          : data.label?.trim() || null,
      type: data.type ?? existing.type,
      backgroundColor:
        typeof data.backgroundColor === "undefined"
          ? existing.backgroundColor
          : data.backgroundColor?.trim() || null,
      backgroundImageUrl:
        typeof data.backgroundImageUrl === "undefined"
          ? existing.backgroundImageUrl
          : data.backgroundImageUrl?.trim() || null,
      settings: normalizedSettings,
    },
  });
}

export async function deletePageSection(sectionId: string) {
  const existing = await prisma.pageSection.findUnique({ where: { id: sectionId } });
  if (!existing) return null;

  await prisma.$transaction([
    prisma.pageBlock.deleteMany({ where: { sectionId } }),
    prisma.pageSection.delete({ where: { id: sectionId } }),
  ]);

  return existing;
}

export async function reorderPageSections(pageId: string, sectionIds: string[]) {
  const existingSections = await prisma.pageSection.findMany({
    where: { pageId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  const existingIds = existingSections.map((section) => section.id);

  const allIdsProvided =
    sectionIds.length === existingIds.length &&
    sectionIds.every((id) => existingIds.includes(id));

  if (!allIdsProvided) {
    throw new Error("Les sections fournies ne correspondent pas à la page.");
  }

  const updates = sectionIds.map((id, index) =>
    prisma.pageSection.update({ where: { id }, data: { order: index + 1 } })
  );

  await prisma.$transaction(updates);
}

export async function createPageBlock(
  sectionId: string,
  data: { type: string; data?: Prisma.JsonValue | null; order?: number }
) {
  const section = await prisma.pageSection.findUnique({ where: { id: sectionId } });
  if (!section) {
    throw new Error("Section introuvable.");
  }

  const maxOrder = await prisma.pageBlock.aggregate({
    where: { sectionId },
    _max: { order: true },
  });

  const nextOrder = (maxOrder._max.order ?? 0) + 1;

  const normalizedData: Prisma.InputJsonValue | Prisma.JsonNullValueInput =
    typeof data.data === "undefined"
      ? {}
      : data.data === null
      ? Prisma.JsonNull
      : data.data;

  return prisma.pageBlock.create({
    data: {
      sectionId,
      order: data.order ?? nextOrder,
      type: data.type,
      data: normalizedData,
    },
  });
}

export async function updatePageBlock(
  blockId: string,
  data: { type?: string; data?: Prisma.JsonValue | null }
) {
  const existing = await prisma.pageBlock.findUnique({ where: { id: blockId } });
  if (!existing) return null;

  const normalizedData =
    typeof data.data === "undefined"
      ? (existing.data as Prisma.InputJsonValue)
      : data.data === null
      ? Prisma.JsonNull
      : (data.data as Prisma.InputJsonValue);

  return prisma.pageBlock.update({
    where: { id: blockId },
    data: {
      type: data.type ?? existing.type,
      data: normalizedData,
    },
  });
}

export async function deletePageBlock(blockId: string) {
  const existing = await prisma.pageBlock.findUnique({ where: { id: blockId } });
  if (!existing) return null;

  await prisma.pageBlock.delete({ where: { id: blockId } });
  return existing;
}

export async function reorderPageBlocks(sectionId: string, blockIds: string[]) {
  const existingBlocks = await prisma.pageBlock.findMany({
    where: { sectionId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  const existingIds = existingBlocks.map((block) => block.id);
  const allIdsProvided =
    blockIds.length === existingIds.length &&
    blockIds.every((id) => existingIds.includes(id));

  if (!allIdsProvided) {
    throw new Error("Les blocs fournis ne correspondent pas à la section.");
  }

  const updates = blockIds.map((id, index) =>
    prisma.pageBlock.update({ where: { id }, data: { order: index + 1 } })
  );

  await prisma.$transaction(updates);
}
