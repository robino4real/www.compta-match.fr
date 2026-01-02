import React from "react";
import { resolveTextAlignment, resolveTextTemplate } from "./textTemplates";

interface HeroBlockProps {
  data: any;
  pageKey?: string;
}

const HeroBlock: React.FC<HeroBlockProps> = ({ data, pageKey }) => {
  const { title, subtitle, buttonLabel, buttonUrl, align = "center", textStyle, textAlign } = data || {};
  const alignment = resolveTextAlignment(textAlign || align);
  const alignmentClasses =
    alignment === "left"
      ? "items-start text-left"
      : alignment === "right"
      ? "items-end text-right"
      : "items-center text-center";

  const template = resolveTextTemplate(textStyle, "display");

  const HeadingTag = pageKey === "HOME" ? "h1" : "h2";

  const normalizedLabel = (buttonLabel as string | undefined)?.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const resolvedButtonUrl =
    pageKey === "HOME" && normalizedLabel?.includes("decouvr") ? "/découverte" : (buttonUrl as string | undefined);

  return (
    <div className={`mx-auto flex max-w-5xl flex-col gap-4 ${alignmentClasses}`}>
      <HeadingTag className={`${template.title} text-black`}>
        {title || "Titre principal"}
      </HeadingTag>
      {subtitle && <p className={`${template.body} text-slate-700`}>{subtitle}</p>}
      {buttonLabel && resolvedButtonUrl && (
        <div
          className={`flex flex-wrap gap-3 ${
            alignment === "center" ? "justify-center" : alignment === "right" ? "justify-end" : "justify-start"
          }`}
        >
          <a
            href={resolvedButtonUrl}
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            {buttonLabel}
          </a>
        </div>
      )}
    </div>
  );
};

export default HeroBlock;
