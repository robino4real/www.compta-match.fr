import React from "react";
import { resolveAssetUrl } from "../../../lib/resolveAssetUrl";

interface TestimonialsListBlockProps {
  data: any;
}

const TestimonialsListBlock: React.FC<TestimonialsListBlockProps> = ({ data }) => {
  const { title, testimonials } = data || {};
  const items = Array.isArray(testimonials)
    ? testimonials.filter((item) => item?.text || item?.name)
    : [];

  if (!items.length) return null;

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-semibold text-black">{title}</h2>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item: any, idx: number) => (
          <div
            key={`${item.name || "testimonial"}-${idx}`}
            className="flex h-full min-h-[260px] flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="flex-1 text-sm leading-relaxed text-slate-700">“{item.text}”</p>
            <div className="flex items-center gap-3">
              {item.avatarUrl ? (
                <div className="h-14 w-14 overflow-hidden rounded-full bg-slate-100">
                  <img
                    src={resolveAssetUrl(item.avatarUrl)}
                    alt={item.name || "Avatar"}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                  {(item.name || "?").slice(0, 1)}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-black">{item.name}</div>
                {item.role && <div className="text-xs text-slate-500">{item.role}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsListBlock;
