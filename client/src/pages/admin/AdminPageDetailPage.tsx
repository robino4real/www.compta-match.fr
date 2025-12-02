import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

type SectionType =
  | "FULL_WIDTH"
  | "TWO_COLUMNS"
  | "FEATURES_GRID"
  | "TESTIMONIALS"
  | "CUSTOM";

type BlockType =
  | "TEXT"
  | "HERO"
  | "TEXT_IMAGE"
  | "IMAGE"
  | "CTA"
  | "FEATURES_LIST"
  | "PRODUCT_LIST"
  | "ARTICLES_LIST"
  | "TESTIMONIALS_LIST"
  | "SPACER";

interface PageBlock {
  id: string;
  order: number;
  type: BlockType;
  data: any;
}

interface PageSection {
  id: string;
  order: number;
  label?: string | null;
  type: SectionType | string;
  backgroundColor?: string | null;
  backgroundImageUrl?: string | null;
  settings?: any;
  blocks: PageBlock[];
}

interface CustomPageDetail {
  id: string;
  key: string;
  route: string;
  name: string;
  status: string;
  sections: PageSection[];
}

interface ProductOption {
  id: string;
  name: string;
}

interface ArticleOption {
  id: string;
  title: string;
}

const BLOCK_DEFAULTS: Record<BlockType, () => any> = {
  TEXT: () => ({
    title: "Titre de section",
    body: "<p>Votre texte ici...</p>",
  }),
  HERO: () => ({
    title: "Titre principal de la page",
    subtitle: "Sous-titre ou phrase d'accroche.",
    buttonLabel: "En savoir plus",
    buttonUrl: "/logiciels",
    align: "center",
  }),
  TEXT_IMAGE: () => ({
    title: "Titre",
    body: "<p>Texte de présentation...</p>",
    imageUrl: "",
    imagePosition: "right",
  }),
  IMAGE: () => ({
    imageUrl: "",
    alt: "Description de l'image",
  }),
  CTA: () => ({
    title: "Titre d'appel à l'action",
    body: "Texte de description de l'offre.",
    buttonLabel: "Je commence",
    buttonUrl: "/achat",
  }),
  FEATURES_LIST: () => ({
    title: "Pourquoi ComptaMatch ?",
    items: [
      { title: "Avantage 1", description: "Description de l'avantage 1." },
      { title: "Avantage 2", description: "Description de l'avantage 2." },
    ],
  }),
  PRODUCT_LIST: () => ({
    title: "Nos logiciels",
    mode: "selected",
    productIds: [],
    maxItems: 3,
  }),
  ARTICLES_LIST: () => ({
    title: "Derniers articles",
    mode: "latest",
    articleIds: [],
    maxItems: 3,
  }),
  TESTIMONIALS_LIST: () => ({
    title: "Ils utilisent ComptaMatch",
    testimonials: [
      {
        name: "Nom",
        role: "Micro-entrepreneur",
        text: "Témoignage...",
        avatarUrl: "",
      },
    ],
  }),
  SPACER: () => ({
    size: "medium",
  }),
};

const SECTION_TYPES: { label: string; value: SectionType }[] = [
  { label: "Full width", value: "FULL_WIDTH" },
  { label: "Deux colonnes", value: "TWO_COLUMNS" },
  { label: "Grille de features", value: "FEATURES_GRID" },
  { label: "Témoignages", value: "TESTIMONIALS" },
  { label: "Custom", value: "CUSTOM" },
];

const BLOCK_TYPES: { label: string; value: BlockType }[] = [
  { label: "Texte", value: "TEXT" },
  { label: "Hero", value: "HERO" },
  { label: "Texte + image", value: "TEXT_IMAGE" },
  { label: "Image", value: "IMAGE" },
  { label: "Call-to-action", value: "CTA" },
  { label: "Liste d'avantages", value: "FEATURES_LIST" },
  { label: "Liste de produits", value: "PRODUCT_LIST" },
  { label: "Liste d'articles", value: "ARTICLES_LIST" },
  { label: "Témoignages", value: "TESTIMONIALS_LIST" },
  { label: "Espace", value: "SPACER" },
];

const clone = (value: any) => JSON.parse(JSON.stringify(value));

const AdminPageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [page, setPage] = React.useState<CustomPageDetail | null>(null);
  const [sections, setSections] = React.useState<PageSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingPageInfo, setSavingPageInfo] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);

  const [sectionForm, setSectionForm] = React.useState<{
    label: string;
    type: string;
    backgroundColor: string;
    backgroundImageUrl: string;
  } | null>(null);
  const [sectionCreation, setSectionCreation] = React.useState({
    label: "",
    type: "FULL_WIDTH" as SectionType,
    backgroundColor: "",
  });
  const [isCreatingSection, setIsCreatingSection] = React.useState(false);
  const [isUpdatingSection, setIsUpdatingSection] = React.useState(false);

  const [blockDraft, setBlockDraft] = React.useState<any | null>(null);
  const [blockTypeToAdd, setBlockTypeToAdd] = React.useState<BlockType>("TEXT");
  const [isSavingBlock, setIsSavingBlock] = React.useState(false);

  const [productOptions, setProductOptions] = React.useState<ProductOption[]>([]);
  const [articleOptions, setArticleOptions] = React.useState<ArticleOption[]>([]);

  const selectedSection = sections.find((section) => section.id === selectedSectionId);
  const selectedBlock = selectedSection?.blocks.find((block) => block.id === selectedBlockId);

  const loadPage = React.useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/pages/${id}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger la page.");
      }

      const incomingPage = data.page as CustomPageDetail;
      setPage(incomingPage);
      setSections(Array.isArray(incomingPage?.sections) ? incomingPage.sections : []);
      setSelectedSectionId((incomingPage.sections?.[0]?.id as string | undefined) ?? null);
      setSelectedBlockId((incomingPage.sections?.[0]?.blocks?.[0]?.id as string | undefined) ?? null);
    } catch (err: any) {
      console.error("Erreur lors du chargement de la page", err);
      setError(err?.message || "Impossible de charger la page.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadPage();
  }, [loadPage]);

  React.useEffect(() => {
    if (selectedSection) {
      setSectionForm({
        label: selectedSection.label || "",
        type: selectedSection.type,
        backgroundColor: selectedSection.backgroundColor || "",
        backgroundImageUrl: selectedSection.backgroundImageUrl || "",
      });
    } else {
      setSectionForm(null);
    }
  }, [selectedSection]);

  React.useEffect(() => {
    if (selectedBlock) {
      setBlockDraft(clone(selectedBlock.data ?? {}));
    } else {
      setBlockDraft(null);
    }
  }, [selectedBlock]);

  const loadProductOptions = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalog/downloads`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;
      const list = Array.isArray((data as any)?.products)
        ? ((data as any)?.products as any[]).map((item) => ({
            id: String(item.id),
            name: String(item.name || "Produit"),
          }))
        : [];
      setProductOptions(list);
    } catch (err) {
      console.error("Impossible de charger les produits", err);
    }
  }, []);

  const loadArticleOptions = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/articles`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;
      const list = Array.isArray((data as any)?.articles)
        ? ((data as any)?.articles as any[]).map((item) => ({
            id: String(item.id),
            title: String(item.title || "Article"),
          }))
        : [];
      setArticleOptions(list);
    } catch (err) {
      console.error("Impossible de charger les articles", err);
    }
  }, []);

  React.useEffect(() => {
    loadProductOptions();
    loadArticleOptions();
  }, [loadArticleOptions, loadProductOptions]);

  const updatePageInfo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!page) return;

    setSavingPageInfo(true);
    setActionMessage(null);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/pages/${page.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: page.name,
          route: page.route,
          status: page.status,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de mettre à jour la page.");
      }

      setPage(data.page as CustomPageDetail);
      setActionMessage("Informations de la page mises à jour.");
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour de la page", err);
      setError(err?.message || "Impossible de mettre à jour la page.");
    } finally {
      setSavingPageInfo(false);
    }
  };

  const deletePage = async () => {
    if (!page) return;
    const confirmDelete = window.confirm(
      "Supprimer cette page et toute sa structure ? Cette action est irréversible."
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/pages/${page.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Suppression impossible.");
      }
      navigate("/admin/pages");
    } catch (err: any) {
      console.error("Erreur lors de la suppression de la page", err);
      setError(err?.message || "Impossible de supprimer la page.");
    }
  };

  const reorderSections = async (updated: PageSection[]) => {
    if (!page) return;
    const withOrder = updated.map((section, index) => ({ ...section, order: index + 1 }));
    setSections(withOrder);

    try {
      await fetch(`${API_BASE_URL}/admin/pages/${page.id}/sections/reorder`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionIds: withOrder.map((s) => s.id) }),
      });
    } catch (err) {
      console.error("Erreur lors du réordonnancement", err);
      loadPage();
    }
  };

  const moveSection = async (sectionId: string, direction: "up" | "down") => {
    const currentIndex = sections.findIndex((s) => s.id === sectionId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const updated = [...sections];
    const temp = updated[currentIndex];
    updated[currentIndex] = updated[targetIndex];
    updated[targetIndex] = temp;
    await reorderSections(updated);
  };

  const createSection = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!page) return;

    setIsCreatingSection(true);
    setError(null);
    setActionMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/pages/${page.id}/sections`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: sectionCreation.label.trim(),
          type: sectionCreation.type,
          backgroundColor: sectionCreation.backgroundColor || null,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de créer la section.");
      }

      const newSection = data.section as PageSection;
      const newList = [...sections, { ...newSection, blocks: newSection.blocks ?? [] }].sort(
        (a, b) => a.order - b.order
      );
      setSections(newList);
      setSelectedSectionId(newSection.id);
      setSelectedBlockId(newSection.blocks?.[0]?.id ?? null);
      setSectionCreation({ label: "", type: "FULL_WIDTH", backgroundColor: "" });
      setActionMessage("Section ajoutée.");
    } catch (err: any) {
      console.error("Erreur lors de la création de la section", err);
      setError(err?.message || "Impossible de créer la section.");
    } finally {
      setIsCreatingSection(false);
    }
  };

  const updateSection = async () => {
    if (!selectedSection || !sectionForm) return;
    setIsUpdatingSection(true);
    setError(null);
    setActionMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/sections/${selectedSection.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: sectionForm.label,
          type: sectionForm.type,
          backgroundColor: sectionForm.backgroundColor || null,
          backgroundImageUrl: sectionForm.backgroundImageUrl || null,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de mettre à jour la section.");
      }

      const updatedSection = data.section as PageSection;
      setSections((prev) =>
        prev.map((section) => (section.id === updatedSection.id ? { ...section, ...updatedSection } : section))
      );
      setActionMessage("Section mise à jour.");
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour de la section", err);
      setError(err?.message || "Impossible de mettre à jour la section.");
    } finally {
      setIsUpdatingSection(false);
    }
  };

  const deleteSection = async (sectionId: string) => {
    const confirmDelete = window.confirm(
      "Supprimer la section et tous ses blocs ? Cette action est irréversible."
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/sections/${sectionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Suppression impossible.");
      }

      const filtered = sections.filter((section) => section.id !== sectionId);
      setSections(filtered.map((section, index) => ({ ...section, order: index + 1 })));
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(filtered[0]?.id ?? null);
        setSelectedBlockId(filtered[0]?.blocks?.[0]?.id ?? null);
      }
      setActionMessage("Section supprimée.");
    } catch (err: any) {
      console.error("Erreur lors de la suppression de la section", err);
      setError(err?.message || "Impossible de supprimer la section.");
    }
  };

  const reorderBlocks = async (sectionId: string, blocks: PageBlock[]) => {
    const updatedSection = sections.find((section) => section.id === sectionId);
    if (!updatedSection) return;

    const orderedBlocks = blocks.map((block, index) => ({ ...block, order: index + 1 }));
    const updatedSections = sections.map((section) =>
      section.id === sectionId ? { ...section, blocks: orderedBlocks } : section
    );
    setSections(updatedSections);

    try {
      await fetch(`${API_BASE_URL}/admin/sections/${sectionId}/blocks/reorder`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockIds: orderedBlocks.map((block) => block.id) }),
      });
    } catch (err) {
      console.error("Erreur lors du réordonnancement des blocs", err);
      loadPage();
    }
  };

  const moveBlock = async (blockId: string, direction: "up" | "down") => {
    if (!selectedSection) return;
    const currentIndex = selectedSection.blocks.findIndex((block) => block.id === blockId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= selectedSection.blocks.length) return;

    const updatedBlocks = [...selectedSection.blocks];
    const temp = updatedBlocks[currentIndex];
    updatedBlocks[currentIndex] = updatedBlocks[targetIndex];
    updatedBlocks[targetIndex] = temp;
    await reorderBlocks(selectedSection.id, updatedBlocks);
  };

  const addBlock = async () => {
    if (!selectedSection) return;
    setIsSavingBlock(true);
    setError(null);
    setActionMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/sections/${selectedSection.id}/blocks`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: blockTypeToAdd,
          data: BLOCK_DEFAULTS[blockTypeToAdd](),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de créer le bloc.");
      }

      const newBlock = data.block as PageBlock;
      setSections((prev) =>
        prev.map((section) =>
          section.id === selectedSection.id
            ? { ...section, blocks: [...section.blocks, newBlock].sort((a, b) => a.order - b.order) }
            : section
        )
      );
      setSelectedBlockId(newBlock.id);
      setActionMessage("Bloc ajouté.");
    } catch (err: any) {
      console.error("Erreur lors de la création du bloc", err);
      setError(err?.message || "Impossible de créer le bloc.");
    } finally {
      setIsSavingBlock(false);
    }
  };

  const updateBlock = async () => {
    if (!selectedBlock || !selectedSection) return;
    setIsSavingBlock(true);
    setError(null);
    setActionMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/blocks/${selectedBlock.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedBlock.type,
          data: blockDraft ?? {},
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de mettre à jour le bloc.");
      }

      const updatedBlock = data.block as PageBlock;
      setSections((prev) =>
        prev.map((section) =>
          section.id === selectedSection.id
            ? {
                ...section,
                blocks: section.blocks.map((block) =>
                  block.id === updatedBlock.id ? { ...block, ...updatedBlock } : block
                ),
              }
            : section
        )
      );
      setActionMessage("Bloc mis à jour.");
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour du bloc", err);
      setError(err?.message || "Impossible de mettre à jour le bloc.");
    } finally {
      setIsSavingBlock(false);
    }
  };

  const deleteBlock = async (blockId: string) => {
    const confirmDelete = window.confirm("Supprimer ce bloc ?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/blocks/${blockId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Suppression impossible.");
      }

      if (!selectedSection) return;
      const updatedBlocks = selectedSection.blocks.filter((block) => block.id !== blockId);
      await reorderBlocks(selectedSection.id, updatedBlocks);
      setSelectedBlockId(updatedBlocks[0]?.id ?? null);
      setActionMessage("Bloc supprimé.");
    } catch (err: any) {
      console.error("Erreur lors de la suppression du bloc", err);
      setError(err?.message || "Impossible de supprimer le bloc.");
    }
  };

  const handleBlockDraftChange = (path: string, value: any) => {
    setBlockDraft((prev: any) => {
      const next = prev ? { ...prev } : {};
      next[path] = value;
      return next;
    });
  };

  const updateNestedArray = (
    key: string,
    index: number,
    field: string,
    value: string,
    remove?: boolean
  ) => {
    setBlockDraft((prev: any) => {
      const arr = Array.isArray(prev?.[key]) ? [...prev[key]] : [];
      if (remove) {
        arr.splice(index, 1);
      } else {
        arr[index] = { ...(arr[index] || {}), [field]: value };
      }
      return { ...(prev || {}), [key]: arr };
    });
  };

  const addNestedItem = (key: string, value: any) => {
    setBlockDraft((prev: any) => {
      const arr = Array.isArray(prev?.[key]) ? [...prev[key]] : [];
      arr.push(value);
      return { ...(prev || {}), [key]: arr };
    });
  };

  const toggleIdInList = (key: string, idValue: string) => {
    setBlockDraft((prev: any) => {
      const current = Array.isArray(prev?.[key]) ? [...prev[key]] : [];
      const exists = current.includes(idValue);
      const next = exists ? current.filter((id) => id !== idValue) : [...current, idValue];
      return { ...(prev || {}), [key]: next };
    });
  };

  const blockPreview = (block: PageBlock) => {
    if (block.type === "TEXT" && block.data?.title) return block.data.title;
    if (block.type === "HERO" && block.data?.title) return block.data.title;
    if (block.type === "CTA" && block.data?.title) return block.data.title;
    if (block.type === "TEXT_IMAGE" && block.data?.title) return block.data.title;
    if (block.type === "PRODUCT_LIST") return "Liste produits";
    if (block.type === "ARTICLES_LIST") return "Liste articles";
    if (block.type === "FEATURES_LIST") return block.data?.title || "Avantages";
    if (block.type === "TESTIMONIALS_LIST") return block.data?.title || "Témoignages";
    if (block.type === "SPACER") return `Taille: ${block.data?.size || "medium"}`;
    return "Bloc";
  };

  const renderBlockEditor = () => {
    if (!selectedBlock || !blockDraft) {
      return <p className="text-xs text-slate-600">Sélectionnez un bloc pour l'éditer.</p>;
    }

    switch (selectedBlock.type) {
      case "TEXT":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Titre</label>
              <input
                type="text"
                value={blockDraft.title || ""}
                onChange={(e) => handleBlockDraftChange("title", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Contenu</label>
              <textarea
                value={blockDraft.body || ""}
                onChange={(e) => handleBlockDraftChange("body", e.target.value)}
                className="h-32 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>
        );
      case "HERO":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Titre</label>
              <input
                type="text"
                value={blockDraft.title || ""}
                onChange={(e) => handleBlockDraftChange("title", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Sous-titre</label>
              <textarea
                value={blockDraft.subtitle || ""}
                onChange={(e) => handleBlockDraftChange("subtitle", e.target.value)}
                className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Label bouton</label>
                <input
                  type="text"
                  value={blockDraft.buttonLabel || ""}
                  onChange={(e) => handleBlockDraftChange("buttonLabel", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">URL bouton</label>
                <input
                  type="text"
                  value={blockDraft.buttonUrl || ""}
                  onChange={(e) => handleBlockDraftChange("buttonUrl", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Alignement</label>
              <select
                value={blockDraft.align || "center"}
                onChange={(e) => handleBlockDraftChange("align", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              >
                <option value="left">Gauche</option>
                <option value="center">Centre</option>
                <option value="right">Droite</option>
              </select>
            </div>
          </div>
        );
      case "TEXT_IMAGE":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Titre</label>
              <input
                type="text"
                value={blockDraft.title || ""}
                onChange={(e) => handleBlockDraftChange("title", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Contenu</label>
              <textarea
                value={blockDraft.body || ""}
                onChange={(e) => handleBlockDraftChange("body", e.target.value)}
                className="h-28 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Image URL</label>
                <input
                  type="text"
                  value={blockDraft.imageUrl || ""}
                  onChange={(e) => handleBlockDraftChange("imageUrl", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Position</label>
                <select
                  value={blockDraft.imagePosition || "right"}
                  onChange={(e) => handleBlockDraftChange("imagePosition", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                >
                  <option value="left">Image à gauche</option>
                  <option value="right">Image à droite</option>
                </select>
              </div>
            </div>
          </div>
        );
      case "IMAGE":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Image URL</label>
              <input
                type="text"
                value={blockDraft.imageUrl || ""}
                onChange={(e) => handleBlockDraftChange("imageUrl", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Alt</label>
              <input
                type="text"
                value={blockDraft.alt || ""}
                onChange={(e) => handleBlockDraftChange("alt", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>
        );
      case "CTA":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Titre</label>
              <input
                type="text"
                value={blockDraft.title || ""}
                onChange={(e) => handleBlockDraftChange("title", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <textarea
                value={blockDraft.body || ""}
                onChange={(e) => handleBlockDraftChange("body", e.target.value)}
                className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Label bouton</label>
                <input
                  type="text"
                  value={blockDraft.buttonLabel || ""}
                  onChange={(e) => handleBlockDraftChange("buttonLabel", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">URL</label>
                <input
                  type="text"
                  value={blockDraft.buttonUrl || ""}
                  onChange={(e) => handleBlockDraftChange("buttonUrl", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
            </div>
          </div>
        );
      case "FEATURES_LIST":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Titre</label>
              <input
                type="text"
                value={blockDraft.title || ""}
                onChange={(e) => handleBlockDraftChange("title", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">Avantages</p>
                <button
                  type="button"
                  onClick={() => addNestedItem("items", { title: "", description: "" })}
                  className="text-xs font-semibold text-slate-700 hover:text-black"
                >
                  Ajouter un avantage
                </button>
              </div>
              <div className="space-y-2">
                {(blockDraft.items || []).map((item: any, index: number) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Titre</label>
                      <input
                        type="text"
                        value={item?.title || ""}
                        onChange={(e) => updateNestedArray("items", index, "title", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Description</label>
                      <textarea
                        value={item?.description || ""}
                        onChange={(e) => updateNestedArray("items", index, "description", e.target.value)}
                        className="h-16 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => updateNestedArray("items", index, "", "", true)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                {(!blockDraft.items || blockDraft.items.length === 0) && (
                  <p className="text-[11px] text-slate-600">Aucun avantage pour l'instant.</p>
                )}
              </div>
            </div>
          </div>
        );
      case "PRODUCT_LIST":
        return (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Titre</label>
                <input
                  type="text"
                  value={blockDraft.title || ""}
                  onChange={(e) => handleBlockDraftChange("title", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mode</label>
                <select
                  value={blockDraft.mode || "selected"}
                  onChange={(e) => handleBlockDraftChange("mode", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                >
                  <option value="selected">Sélection manuelle</option>
                  <option value="latest">Derniers produits</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nombre max</label>
                <input
                  type="number"
                  min={1}
                  value={blockDraft.maxItems ?? 3}
                  onChange={(e) => handleBlockDraftChange("maxItems", Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
            </div>
            {blockDraft.mode !== "latest" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">Produits sélectionnés</p>
                <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  {productOptions.map((product) => {
                    const checked = Array.isArray(blockDraft.productIds)
                      ? blockDraft.productIds.includes(product.id)
                      : false;
                    return (
                      <label key={product.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleIdInList("productIds", product.id)}
                        />
                        <span>{product.name}</span>
                      </label>
                    );
                  })}
                  {productOptions.length === 0 && (
                    <p className="text-[11px] text-slate-600">Aucun produit disponible.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case "ARTICLES_LIST":
        return (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Titre</label>
                <input
                  type="text"
                  value={blockDraft.title || ""}
                  onChange={(e) => handleBlockDraftChange("title", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mode</label>
                <select
                  value={blockDraft.mode || "latest"}
                  onChange={(e) => handleBlockDraftChange("mode", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                >
                  <option value="latest">Derniers articles</option>
                  <option value="selected">Sélection manuelle</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nombre max</label>
                <input
                  type="number"
                  min={1}
                  value={blockDraft.maxItems ?? 3}
                  onChange={(e) => handleBlockDraftChange("maxItems", Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
            </div>
            {blockDraft.mode === "selected" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">Articles sélectionnés</p>
                <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  {articleOptions.map((article) => {
                    const checked = Array.isArray(blockDraft.articleIds)
                      ? blockDraft.articleIds.includes(article.id)
                      : false;
                    return (
                      <label key={article.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleIdInList("articleIds", article.id)}
                        />
                        <span>{article.title}</span>
                      </label>
                    );
                  })}
                  {articleOptions.length === 0 && (
                    <p className="text-[11px] text-slate-600">Aucun article disponible.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case "TESTIMONIALS_LIST":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Titre</label>
              <input
                type="text"
                value={blockDraft.title || ""}
                onChange={(e) => handleBlockDraftChange("title", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">Témoignages</p>
                <button
                  type="button"
                  onClick={() => addNestedItem("testimonials", { name: "", role: "", text: "", avatarUrl: "" })}
                  className="text-xs font-semibold text-slate-700 hover:text-black"
                >
                  Ajouter un témoignage
                </button>
              </div>
              <div className="space-y-2">
                {(blockDraft.testimonials || []).map((testimonial: any, index: number) => (
                  <div key={index} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">Nom</label>
                        <input
                          type="text"
                          value={testimonial?.name || ""}
                          onChange={(e) => updateNestedArray("testimonials", index, "name", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">Rôle</label>
                        <input
                          type="text"
                          value={testimonial?.role || ""}
                          onChange={(e) => updateNestedArray("testimonials", index, "role", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Texte</label>
                      <textarea
                        value={testimonial?.text || ""}
                        onChange={(e) => updateNestedArray("testimonials", index, "text", e.target.value)}
                        className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Avatar (URL)</label>
                      <input
                        type="text"
                        value={testimonial?.avatarUrl || ""}
                        onChange={(e) => updateNestedArray("testimonials", index, "avatarUrl", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => updateNestedArray("testimonials", index, "", "", true)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                {(!blockDraft.testimonials || blockDraft.testimonials.length === 0) && (
                  <p className="text-[11px] text-slate-600">Aucun témoignage pour l'instant.</p>
                )}
              </div>
            </div>
          </div>
        );
      case "SPACER":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Taille</label>
              <select
                value={blockDraft.size || "medium"}
                onChange={(e) => handleBlockDraftChange("size", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              >
                <option value="small">Petite</option>
                <option value="medium">Moyenne</option>
                <option value="large">Grande</option>
              </select>
            </div>
          </div>
        );
      default:
        return <p className="text-xs text-slate-600">Bloc non supporté pour le moment.</p>;
    }
  };

  if (isLoading) {
    return <p className="text-xs text-slate-600">Chargement de la page...</p>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-red-600">{error}</p>
        <button
          type="button"
          onClick={loadPage}
          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!page) {
    return <p className="text-xs text-slate-600">Page introuvable.</p>;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Page Builder</p>
          <h1 className="text-xl font-semibold text-black">{page.name}</h1>
          <p className="text-xs text-slate-600">Clé : {page.key} — Route : {page.route}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={page.route}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-black hover:text-black"
          >
            Voir la page
          </a>
          <button
            type="button"
            onClick={deletePage}
            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
          >
            Supprimer la page
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[2fr,3fr]">
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-black">Informations de base</h2>
            <form className="space-y-3" onSubmit={updatePageInfo}>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nom</label>
                <input
                  type="text"
                  value={page.name}
                  onChange={(e) => setPage({ ...page, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Route</label>
                <input
                  type="text"
                  value={page.route}
                  onChange={(e) => setPage({ ...page, route: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Statut</label>
                <select
                  value={page.status}
                  onChange={(e) => setPage({ ...page, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={savingPageInfo}
                  className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
                >
                  {savingPageInfo ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-black">Sections</h2>
                <p className="text-[11px] text-slate-600">Ajoutez, sélectionnez et réordonnez les sections.</p>
              </div>
              <button
                type="button"
                onClick={loadPage}
                className="text-[11px] font-semibold text-slate-700 hover:text-black"
              >
                Rafraîchir
              </button>
            </div>

            <form className="space-y-2 rounded-xl border border-dashed border-slate-200 bg-white p-3" onSubmit={createSection}>
              <div className="grid gap-2 md:grid-cols-[1.2fr,1fr]">
                <input
                  type="text"
                  value={sectionCreation.label}
                  onChange={(e) => setSectionCreation({ ...sectionCreation, label: e.target.value })}
                  placeholder="Label de la section"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
                <select
                  value={sectionCreation.type}
                  onChange={(e) => setSectionCreation({ ...sectionCreation, type: e.target.value as SectionType })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                >
                  {SECTION_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 md:grid-cols-[1.2fr,1fr]">
                <input
                  type="text"
                  value={sectionCreation.backgroundColor}
                  onChange={(e) => setSectionCreation({ ...sectionCreation, backgroundColor: e.target.value })}
                  placeholder="Couleur de fond (optionnel)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isCreatingSection}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-50"
                >
                  {isCreatingSection ? "Création..." : "Ajouter une section"}
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {sections.map((section) => {
                const isActive = section.id === selectedSectionId;
                return (
                  <div
                    key={section.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                      isActive ? "border-slate-900 bg-slate-900/5" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="space-y-[2px]">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSectionId(section.id);
                          setSelectedBlockId(section.blocks?.[0]?.id ?? null);
                        }}
                        className="text-left font-semibold text-black"
                      >
                        {section.label || `Section #${section.order}`}
                      </button>
                      <p className="text-[11px] text-slate-600">
                        {section.type} — {section.blocks.length} bloc(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(section.id, "up")}
                        className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(section.id, "down")}
                        className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSection(section.id)}
                        className="rounded-full border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:border-rose-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
              {sections.length === 0 && (
                <p className="text-[11px] text-slate-600">Aucune section pour le moment.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black">Édition de la section</h2>
            {actionMessage && <p className="text-[11px] font-semibold text-emerald-700">{actionMessage}</p>}
            {error && <p className="text-[11px] font-semibold text-rose-700">{error}</p>}
          </div>

          {!selectedSection && (
            <p className="text-xs text-slate-600">Sélectionnez une section pour commencer.</p>
          )}

          {selectedSection && sectionForm && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Label</label>
                  <input
                    type="text"
                    value={sectionForm.label}
                    onChange={(e) => setSectionForm({ ...sectionForm, label: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Type</label>
                  <select
                    value={sectionForm.type}
                    onChange={(e) => setSectionForm({ ...sectionForm, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  >
                    {SECTION_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Couleur de fond</label>
                  <input
                    type="text"
                    value={sectionForm.backgroundColor}
                    onChange={(e) => setSectionForm({ ...sectionForm, backgroundColor: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    placeholder="bg-white, bg-white..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Image de fond (URL)</label>
                  <input
                    type="text"
                    value={sectionForm.backgroundImageUrl}
                    onChange={(e) => setSectionForm({ ...sectionForm, backgroundImageUrl: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={updateSection}
                  disabled={isUpdatingSection}
                  className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
                >
                  {isUpdatingSection ? "Mise à jour..." : "Mettre à jour la section"}
                </button>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-black">Blocs</h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={blockTypeToAdd}
                      onChange={(e) => setBlockTypeToAdd(e.target.value as BlockType)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-black focus:outline-none"
                    >
                      {BLOCK_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addBlock}
                      disabled={isSavingBlock}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-50"
                    >
                      {isSavingBlock ? "Ajout..." : "Ajouter"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedSection.blocks.map((block) => {
                    const active = block.id === selectedBlockId;
                    return (
                      <div
                        key={block.id}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                          active ? "border-slate-900 bg-white" : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="space-y-[2px]">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBlockId(block.id);
                              setBlockDraft(clone(block.data ?? {}));
                            }}
                            className="text-left font-semibold text-black"
                          >
                            {block.type}
                          </button>
                          <p className="text-[11px] text-slate-600">{blockPreview(block)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveBlock(block.id, "up")}
                            className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(block.id, "down")}
                            className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBlock(block.id)}
                            className="rounded-full border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:border-rose-400"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {selectedSection.blocks.length === 0 && (
                    <p className="text-[11px] text-slate-600">Aucun bloc pour cette section.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-black">Édition du bloc sélectionné</h3>
                  {selectedBlock && (
                    <span className="text-[11px] font-semibold text-slate-600">{selectedBlock.type}</span>
                  )}
                </div>
                {renderBlockEditor()}
                {selectedBlock && (
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={updateBlock}
                      disabled={isSavingBlock}
                      className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
                    >
                      {isSavingBlock ? "Enregistrement..." : "Mettre à jour le bloc"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminPageDetailPage;
