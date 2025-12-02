import React from "react";
import DownloadableProductsSection from "../components/downloadable-products/DownloadableProductsSection";

export default function DownloadableProductsPage() {
  return (
    <main className="min-h-screen bg-white py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 lg:px-8">
        <section className="text-center">
          <h1 className="mt-3 text-4xl font-semibold text-slate-900 md:text-5xl">
            Logiciels de comptabilité
          </h1>
        </section>

        <DownloadableProductsSection />
      </div>
    </main>
  );
}
