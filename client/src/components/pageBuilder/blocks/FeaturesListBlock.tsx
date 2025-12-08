import React from "react";

interface FeaturesListBlockProps {
  data: any;
}

const FeaturesListBlock: React.FC<FeaturesListBlockProps> = ({ data }) => {
  const { title, items } = data || {};
  const features = Array.isArray(items)
    ? items.filter((item) => item?.title || item?.description || item?.imageUrl)
    : [];

  if (!features.length) return null;

  return (
    <div className="space-y-8">
      {title && <h2 className="text-2xl font-semibold text-black">{title}</h2>}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((item: any, idx: number) => (
          <div key={`${item.title || "feature"}-${idx}`} className="space-y-4">
            {item.imageUrl && (
              <div className="overflow-hidden rounded-2xl bg-slate-100">
                <img
                  src={item.imageUrl}
                  alt={item.title || "Illustration de l'avantage"}
                  className="h-64 w-full object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-black">{item.title || "Avantage"}</h3>
              {item.description && (
                <p className="text-base text-slate-600 leading-relaxed">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesListBlock;
