import React, { useEffect, useRef } from "react";

const FONT_SIZE_MAP: Record<string, string> = {
  "1": "12px",
  "2": "14px",
  "3": "16px",
  "4": "18px",
  "5": "24px",
  "6": "32px",
  "7": "40px",
};

const FONT_SIZE_OPTIONS = [
  { label: "12 px", value: "1" },
  { label: "14 px", value: "2" },
  { label: "16 px", value: "3" },
  { label: "18 px", value: "4" },
  { label: "24 px", value: "5" },
  { label: "32 px", value: "6" },
  { label: "40 px", value: "7" },
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const syncContent = () => {
    const html = editorRef.current?.innerHTML ?? "";
    onChange(html);
  };

  const normalizeFontTags = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const fontTags = editor.querySelectorAll("font[size]");
    fontTags.forEach((font) => {
      const size = font.getAttribute("size") || "3";
      const span = document.createElement("span");
      span.style.fontSize = FONT_SIZE_MAP[size] || FONT_SIZE_MAP["3"];
      span.innerHTML = font.innerHTML;
      font.replaceWith(span);
    });
  };

  const handleCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    normalizeFontTags();
    syncContent();
  };

  const handleFontSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const sizeValue = event.target.value;
    handleCommand("fontSize", sizeValue);
  };

  const handleInput = () => {
    normalizeFontTags();
    syncContent();
  };

  const handleClear = () => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = "";
    syncContent();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
        <select
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm focus:border-black focus:outline-none"
          aria-label="Taille de police"
          onChange={handleFontSizeChange}
          defaultValue=""
        >
          <option value="" disabled>
            Taille
          </option>
          {FONT_SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => handleCommand("bold")}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-black hover:text-black"
          >
            Gras
          </button>
          <button
            type="button"
            onClick={() => handleCommand("italic")}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-black hover:text-black"
          >
            Italique
          </button>
          <button
            type="button"
            onClick={() => handleCommand("underline")}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-black hover:text-black"
          >
            Souligné
          </button>
          <button
            type="button"
            onClick={() => handleCommand("insertUnorderedList")}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-black hover:text-black"
          >
            Puces
          </button>
          <button
            type="button"
            onClick={() => handleCommand("insertOrderedList")}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-black hover:text-black"
          >
            Liste numérotée
          </button>
          <button
            type="button"
            onClick={() => handleCommand("formatBlock", "H2")}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-black hover:text-black"
          >
            Titre
          </button>
          <button
            type="button"
            onClick={() => handleCommand("removeFormat")}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-black hover:text-black"
          >
            Effacer le style
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm hover:border-rose-500 hover:text-rose-700"
          >
            Supprimer le contenu
          </button>
        </div>
      </div>

      <div
        ref={editorRef}
        className="rich-text-editor-content min-h-[240px] w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 shadow-sm focus-within:border-black"
        contentEditable
        data-placeholder={placeholder || "Commencez à rédiger ou collez du contenu avec sa mise en forme."}
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;
