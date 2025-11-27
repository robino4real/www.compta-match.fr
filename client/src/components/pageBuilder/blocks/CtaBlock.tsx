import React from "react";

interface CtaBlockProps {
  data: any;
}

const CtaBlock: React.FC<CtaBlockProps> = ({ data }) => {
  const { title, body, buttonLabel, buttonUrl } = data || {};

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      {title && <h2 className="text-2xl font-semibold text-black">{title}</h2>}
      {body && <p className="mt-3 text-sm text-slate-600 md:text-base">{body}</p>}
      {buttonLabel && buttonUrl && (
        <div className="mt-6 flex justify-center">
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
