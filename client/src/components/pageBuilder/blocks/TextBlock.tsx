import React from "react";

interface TextBlockProps {
  data: any;
}

const TextBlock: React.FC<TextBlockProps> = ({ data }) => {
  const { title, body } = data || {};

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {title && <h2 className="text-2xl font-semibold text-black">{title}</h2>}
      {body && (
        <div
          className="prose prose-slate max-w-none text-sm leading-relaxed md:text-base"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      )}
    </div>
  );
};

export default TextBlock;
