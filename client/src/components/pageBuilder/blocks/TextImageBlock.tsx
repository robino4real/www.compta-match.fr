import React from "react";

interface TextImageBlockProps {
  data: any;
}

const TextImageBlock: React.FC<TextImageBlockProps> = ({ data }) => {
  const { title, body, imageUrl, imagePosition = "right" } = data || {};
  const imageFirst = imagePosition === "left";

  return (
    <div className="grid items-center gap-8 md:grid-cols-2">
      {imageFirst && imageUrl && (
        <div className="flex justify-center">
          <img
            src={imageUrl}
            alt={title || "Illustration"}
            className="max-h-72 w-full max-w-md rounded-xl object-cover shadow-sm"
          />
        </div>
      )}

      <div className="space-y-3">
        {title && <h2 className="text-2xl font-semibold text-black">{title}</h2>}
        {body && (
          <div
            className="prose prose-slate max-w-none text-sm leading-relaxed md:text-base"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}
      </div>

      {!imageFirst && imageUrl && (
        <div className="flex justify-center">
          <img
            src={imageUrl}
            alt={title || "Illustration"}
            className="max-h-72 w-full max-w-md rounded-xl object-cover shadow-sm"
          />
        </div>
      )}
    </div>
  );
};

export default TextImageBlock;
