import React from "react";
import DownloadableProductsSection from "../components/downloadable-products/DownloadableProductsSection";

export default function DownloadableProductsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f5f7ff] via-white to-white py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 lg:px-8">
        <section className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Logiciels ComptaMatch
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900 md:text-5xl">
            Logiciels de comptabilité
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Découvrez nos logiciels de comptabilité et ajoutez-les à votre boîte à outils pour une gestion financière simplifiée.
          </p>
        </section>

        <DownloadableProductsSection />
      </div>
    </main>
  );
}
