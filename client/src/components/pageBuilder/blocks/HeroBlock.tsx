import React from "react";

interface HeroBlockProps {
  data: any;
  pageKey?: string;
}

const HeroBlock: React.FC<HeroBlockProps> = ({ data, pageKey }) => {
  const { title, subtitle, buttonLabel, buttonUrl, align = "center" } = data || {};
  const alignment =
    align === "left" ? "items-start text-left" : align === "right" ? "items-end text-right" : "items-center text-center";

  const HeadingTag = pageKey === "HOME" ? "h1" : "h2";

  return (
    <div className={`mx-auto flex max-w-5xl flex-col gap-4 ${alignment}`}>
      <HeadingTag className="text-3xl font-semibold text-black md:text-4xl">
        {title || "Titre principal"}
      </HeadingTag>
      {subtitle && <p className="text-base text-slate-700 md:text-lg">{subtitle}</p>}
      {buttonLabel && buttonUrl && (
        <div className="flex flex-wrap gap-3">
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

export default HeroBlock;
