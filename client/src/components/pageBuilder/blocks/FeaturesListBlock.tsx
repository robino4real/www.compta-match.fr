import React from "react";

interface FeaturesListBlockProps {
  data: any;
}

const FeaturesListBlock: React.FC<FeaturesListBlockProps> = ({ data }) => {
  const { title, items } = data || {};
  const features = Array.isArray(items)
    ? items.filter((item) => item?.title || item?.description)
    : [];

  if (!features.length) return null;

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-semibold text-black">{title}</h2>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((item: any, idx: number) => (
          <div
            key={`${item.title || "feature"}-${idx}`}
            className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h3 className="text-base font-semibold text-black">{item.title || "Avantage"}</h3>
            {item.description && (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesListBlock;
