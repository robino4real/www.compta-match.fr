import React from "react";
import DownloadableProductsSection from "../components/downloadable-products/DownloadableProductsSection";

export default function DownloadableProductsPage() {
  return (
    <main className="bg-white min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-8">
        <section className="bg-white rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.06)] border border-slate-100 px-6 py-8 md:px-10 md:py-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Logiciels COMPTAMATCH
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 md:text-4xl">
            Logiciels téléchargeables COMPTAMATCH
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
            Découvrez nos logiciels à installer en quelques minutes pour simplifier votre comptabilité. Comparez les offres, visualisez les fonctionnalités et choisissez celle qui correspond le mieux à votre activité.
          </p>
        </section>

        <DownloadableProductsSection />
      </div>
    </main>
  );
}
