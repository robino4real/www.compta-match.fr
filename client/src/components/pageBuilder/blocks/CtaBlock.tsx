import React from "react";
import { resolveTextAlignment, resolveTextTemplate } from "./textTemplates";

interface CtaBlockProps {
  data: any;
}

const CtaBlock: React.FC<CtaBlockProps> = ({ data }) => {
  const { title, body, buttonLabel, buttonUrl, textStyle, textAlign } = data || {};

  const template = resolveTextTemplate(textStyle);
  const alignment = resolveTextAlignment(textAlign);

  const containerAlignment =
    alignment === "center" ? "text-center" : alignment === "right" ? "text-right" : "text-left";

  const buttonAlignment =
    alignment === "center" ? "justify-center" : alignment === "right" ? "justify-end" : "justify-start";

  return (
    <div className={`mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 ${containerAlignment}`}>
      {title && <h2 className={`${template.title} text-black`}>{title}</h2>}
      {body && <p className={`mt-3 text-slate-600 ${template.body}`}>{body}</p>}
      {buttonLabel && buttonUrl && (
        <div className={`mt-6 flex ${buttonAlignment}`}>
          <a
            href={buttonUrl}
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            {buttonLabel}
          </a>
        </div>
      )}
    </div>
  );
};

export default CtaBlock;
