import React from 'react';

interface Props {
  title: string;
  subtitle?: string;
}

const SectionTitle: React.FC<Props> = ({ title, subtitle }) => (
  <div className="text-center max-w-2xl mx-auto mb-8">
    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h2>
    {subtitle && <p className="text-slate-600 mt-2">{subtitle}</p>}
  </div>
);

export default SectionTitle;
