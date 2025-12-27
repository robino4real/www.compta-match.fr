import React from "react";
import { uploadAdminImage } from "../../lib/adminUpload";

type BlockType =
  | "title"
  | "subtitle"
  | "text"
  | "quote"
  | "image"
  | "list"
  | "cta"
  | "separator";

export type ArticleBlock = {
  id: string;
  type: BlockType;
  body?: string;
  title?: string;
  caption?: string;
  imageUrl?: string | null;
  ctaLabel?: string;
  ctaUrl?: string;
};

type ArticleContentBuilderProps = {
  value: string;
  onChange: (value: string) => void;
};

type ParsedContent = {
  blocks: ArticleBlock[];
};

const defaultBlock = (type: BlockType): ArticleBlock => ({
  id: crypto.randomUUID(),
  type,
  body: "",
  title: "",
  caption: "",
  imageUrl: null,
  ctaLabel: "",
  ctaUrl: "",
});

const parseContent = (value: string): ParsedContent => {
  if (!value) {
    return { blocks: [defaultBlock("title"), defaultBlock("text")] };
  }

  try {
    const parsed = JSON.parse(value) as ParsedContent;
    if (Array.isArray(parsed?.blocks)) {
      return {
        blocks: parsed.blocks.map((block) => ({
          ...defaultBlock(block.type),
          ...block,
          id: block.id || crypto.randomUUID(),
        })),
      };
    }
  } catch (err) {
    // Fallback to simple paragraph content
  }

  return {
    blocks: [
      {
        ...defaultBlock("text"),
        body: value,
      },
    ],
  };
};

const serializeContent = (blocks: ArticleBlock[]) =>
  JSON.stringify({ version: 1, blocks });

const blockTypeLabel: Record<BlockType, string> = {
  title: "Titre de page",
  subtitle: "Sous-titre",
  text: "Paragraphe",
  quote: "Citation",
  image: "Image",
  list: "Liste à puces",
  cta: "Bouton / CTA",
  separator: "Séparateur",
};

const iconByType: Record<BlockType, string> = {
  title: "📝",
  subtitle: "🔎",
  text: "✏️",
  quote: "💬",
  image: "🖼️",
  list: "•",
  cta: "➡️",
  separator: "―",
};

const ArticleContentBuilder: React.FC<ArticleContentBuilderProps> = ({
  value,
  onChange,
}) => {
  const [blocks, setBlocks] = React.useState<ArticleBlock[]>(
    parseContent(value).blocks
  );
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    setBlocks(parseContent(value).blocks);
  }, [value]);

  const persist = React.useCallback(
    (nextBlocks: ArticleBlock[]) => {
      setBlocks(nextBlocks);
      onChange(serializeContent(nextBlocks));
    },
    [onChange]
  );

  const updateBlock = (id: string, patch: Partial<ArticleBlock>) => {
    const next = blocks.map((block) =>
      block.id === id ? { ...block, ...patch } : block
    );
    persist(next);
  };

  const addBlock = (type: BlockType) => {
    const next = [...blocks, defaultBlock(type)];
    persist(next);
  };

  const moveBlock = (id: string, delta: number) => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const next = [...blocks];
    const [removed] = next.splice(index, 1);
    next.splice(Math.max(0, Math.min(index + delta, next.length)), 0, removed);
    persist(next);
  };

  const removeBlock = (id: string) => {
    const next = blocks.filter((block) => block.id !== id);
    persist(next.length ? next : [defaultBlock("text")]);
  };

  const handleImageUpload = async (blockId: string, file: File | null) => {
    if (!file) return;
    try {
      setIsUploading(true);
      const upload = await uploadAdminImage(file);
      updateBlock(blockId, { imageUrl: upload.url });
    } catch (err) {
      console.error("Impossible d'envoyer l'image", err);
      alert("Téléversement impossible. Vérifiez votre connexion ou réessayez.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(blockTypeLabel) as BlockType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-white"
          >
            <span>{iconByType[type]}</span>
            {blockTypeLabel[type]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span>{iconByType[block.type]}</span>
                <span>{blockTypeLabel[block.type]}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, -1)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:border-slate-300"
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, 1)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:border-slate-300"
                  disabled={index === blocks.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="rounded-lg border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:border-red-300"
                >
                  Supprimer
                </button>
              </div>
            </div>

            {block.type === "title" && (
              <input
                type="text"
                placeholder="Titre principal"
                value={block.title || ""}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg font-semibold text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            )}

            {block.type === "subtitle" && (
              <input
                type="text"
                placeholder="Sous-titre ou chapô"
                value={block.body || ""}
                onChange={(e) => updateBlock(block.id, { body: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            )}

            {block.type === "text" && (
              <textarea
                placeholder="Paragraphe, HTML ou markdown léger"
                value={block.body || ""}
                onChange={(e) => updateBlock(block.id, { body: e.target.value })}
                rows={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            )}

            {block.type === "quote" && (
              <div className="space-y-2">
                <textarea
                  placeholder="Citation"
                  value={block.body || ""}
                  onChange={(e) => updateBlock(block.id, { body: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="text"
                  placeholder="Auteur / source"
                  value={block.caption || ""}
                  onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            )}

            {block.type === "image" && (
              <div className="space-y-2">
                {block.imageUrl ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img
                      src={block.imageUrl}
                      alt={block.caption || "Image"}
                      className="h-56 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                    Téléversez une image pour illustrer la section.
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black">
                    Importer une image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(block.id, e.target.files?.[0] || null)}
                      disabled={isUploading}
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="URL d'image"
                    value={block.imageUrl || ""}
                    onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value })}
                    className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Légende de l'image"
                  value={block.caption || ""}
                  onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            )}

            {block.type === "list" && (
              <textarea
                placeholder={"Liste d'éléments (une ligne par puce)"}
                value={block.body || ""}
                onChange={(e) => updateBlock(block.id, { body: e.target.value })}
                rows={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            )}

            {block.type === "cta" && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Label du bouton</label>
                  <input
                    type="text"
                    value={block.ctaLabel || ""}
                    onChange={(e) => updateBlock(block.id, { ctaLabel: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">URL</label>
                  <input
                    type="text"
                    value={block.ctaUrl || ""}
                    onChange={(e) => updateBlock(block.id, { ctaUrl: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            {block.type === "separator" && (
              <div className="py-3 text-center text-slate-300">
                <span className="text-lg">―</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        Les blocs sont enregistrés dans le champ contenu sous forme JSON. Vous
        pouvez combiner titres, paragraphes, images et appels à l'action pour
        modéliser chaque page de l'article.
      </div>
    </div>
  );
};

export default ArticleContentBuilder;
