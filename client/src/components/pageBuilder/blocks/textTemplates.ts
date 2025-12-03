export type TextTemplate = "balanced" | "display" | "compact" | "accented";
export type TextAlignment = "left" | "center" | "right";

export const TEXT_TEMPLATE_OPTIONS: { value: TextTemplate; label: string }[] = [
  { value: "balanced", label: "Équilibré" },
  { value: "display", label: "Très grand" },
  { value: "compact", label: "Compact" },
  { value: "accented", label: "Accentué" },
];

export const TEXT_ALIGNMENT_OPTIONS: { value: TextAlignment; label: string }[] = [
  { value: "left", label: "Aligné à gauche" },
  { value: "center", label: "Centré" },
  { value: "right", label: "Aligné à droite" },
];

const TEMPLATE_MAP: Record<
  TextTemplate,
  { title: string; body: string; highlight?: string }
> = {
  balanced: {
    title: "text-2xl font-semibold md:text-3xl",
    body: "text-sm leading-relaxed md:text-base",
    highlight: "text-sm font-semibold uppercase tracking-[0.08em] text-emerald-700",
  },
  display: {
    title: "text-3xl font-semibold md:text-5xl",
    body: "text-base leading-relaxed md:text-xl",
    highlight: "text-base font-semibold uppercase tracking-[0.12em] text-emerald-700",
  },
  compact: {
    title: "text-xl font-semibold md:text-2xl",
    body: "text-sm leading-relaxed md:text-sm",
    highlight: "text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700",
  },
  accented: {
    title: "text-base font-semibold uppercase tracking-[0.14em] text-slate-800",
    body: "text-base leading-relaxed md:text-lg",
    highlight: "text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700",
  },
};

export const resolveTextTemplate = (
  template?: string,
  fallback: TextTemplate = "balanced",
) => TEMPLATE_MAP[(template as TextTemplate) || fallback] ?? TEMPLATE_MAP[fallback];

export const resolveTextAlignment = (alignment?: string): TextAlignment => {
  if (alignment === "center" || alignment === "right") return alignment;
  return "left";
};
