import React from "react";
import { resolveTextAlignment, resolveTextTemplate } from "./textTemplates";

interface TextBlockProps {
  data: any;
}

const TextBlock: React.FC<TextBlockProps> = ({ data }) => {
  const { title, body, textStyle, textAlign } = data || {};

  const template = resolveTextTemplate(textStyle);
  const alignment = resolveTextAlignment(textAlign);

  const containerAlignmentClass =
    alignment === "center"
      ? "text-center"
      : alignment === "right"
      ? "text-right"
      : "text-left";

  const proseAlignmentClass =
    alignment === "center"
      ? "mx-auto text-center"
      : alignment === "right"
      ? "ml-auto text-right"
      : "text-left";

  return (
    <div className={`mx-auto max-w-4xl space-y-3 ${containerAlignmentClass}`}>
      {title && <h2 className={`${template.title} text-black`}>{title}</h2>}
      {body && (
        <div
          className={`prose prose-slate max-w-none ${template.body} ${proseAlignmentClass}`}
          dangerouslySetInnerHTML={{ __html: body }}
        />
      )}
    </div>
  );
};

export default TextBlock;
