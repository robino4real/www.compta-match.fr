import React from "react";
import { resolveTextAlignment, resolveTextTemplate } from "./textTemplates";

interface TextImageBlockProps {
  data: any;
}

const TextImageBlock: React.FC<TextImageBlockProps> = ({ data }) => {
  const {
    title,
    body,
    imageUrl,
    imagePosition = "right",
    imageSize = "large",
    textStyle,
    textAlign,
  } = data || {};
  const imageFirst = imagePosition === "left";
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

  const sizeClasses: Record<string, string> = {
    small: "max-h-52 max-w-xs",
    medium: "max-h-64 max-w-sm",
    large: "max-h-72 max-w-md",
    full: "max-h-96 max-w-full",
  };

  const imageClasses = `${sizeClasses[imageSize] || sizeClasses.large} w-full object-contain`;

  return (
    <div className="grid items-center gap-8 md:grid-cols-2">
      {imageFirst && imageUrl && (
        <div className="flex justify-center">
          <img src={imageUrl} alt={title || "Illustration"} className={imageClasses} />
        </div>
      )}

      <div className={`space-y-3 ${containerAlignmentClass}`}>
        {title && <h2 className={`${template.title} text-black`}>{title}</h2>}
        {body && (
          <div
            className={`prose prose-slate max-w-none ${template.body} ${proseAlignmentClass}`}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}
      </div>

      {!imageFirst && imageUrl && (
        <div className="flex justify-center">
          <img src={imageUrl} alt={title || "Illustration"} className={imageClasses} />
        </div>
      )}
    </div>
  );
};

export default TextImageBlock;
