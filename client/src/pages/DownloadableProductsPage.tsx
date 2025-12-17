import React, { useEffect } from "react";
import DownloadableProductsSection from "../components/downloadable-products/DownloadableProductsSection";

const DownloadableProductsPage: React.FC = () => {
  useEffect(() => {
    document.title = "ComptaMatch | Nos logiciels";
  }, []);

  return (
    <main className="bg-white text-slate-900">
      <section className="page-safe-container mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">
            Logiciels téléchargeables
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Accédez à vos outils comptables
          </h1>
          <p className="text-base text-slate-600">
            Retrouvez l'ensemble des logiciels disponibles, leurs fonctionnalités et les ressources associées pour
            simplifier votre comptabilité.
          </p>
        </div>

        <DownloadableProductsSection />
      </section>
    </main>
  );
};

export default DownloadableProductsPage;
