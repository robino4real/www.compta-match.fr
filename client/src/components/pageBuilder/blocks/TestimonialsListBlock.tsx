import React from "react";

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
            className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-700 leading-relaxed">“{item.text}”</p>
            <div className="mt-3 text-xs font-semibold text-black">
              {item.name}
              {item.role && <span className="text-slate-500"> — {item.role}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsListBlock;
