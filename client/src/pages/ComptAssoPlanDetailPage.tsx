import React from "react";

const navigationLinks = [
  "Home",
  "Fonctionnalités",
  "Tarifs",
  "Pour qui ?",
  "Contact",
];

const ComptAssoLanding: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0718] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(139,92,246,0.45),rgba(11,7,24,0)_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_14%,rgba(236,72,153,0.38),rgba(11,7,24,0)_42%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_70%,rgba(147,51,234,0.24),rgba(11,7,24,0)_48%)]" />
        <div className="absolute right-10 top-16 h-[520px] w-[520px] rounded-full border border-white/5" />
        <div className="absolute right-24 top-24 h-[640px] w-[640px] rounded-full border border-white/5" />
        <div className="absolute right-40 top-32 h-[780px] w-[780px] rounded-full border border-white/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0,rgba(255,255,255,0)_55%)] opacity-40 mix-blend-screen" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-10 sm:px-8 lg:max-w-7xl lg:px-12 page-safe-container">
        <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 overflow-x-auto rounded-full bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#EC4899] px-4 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] via-[#A855F7] to-[#EC4899] text-lg font-semibold text-white shadow-lg shadow-fuchsia-500/35">
              ★
            </span>
            <span className="text-lg font-medium text-white">ComptAsso</span>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {navigationLinks.map((link, index) => (
              <button
                key={link}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition duration-200 hover:bg-white/25 hover:text-white ${
                  index === 0 ? "bg-white/20 text-white" : "text-white"
                }`}
              >
                {link}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden rounded-full border border-white/50 px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-white/10 sm:inline-flex"
            >
              Connexion
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#7C3AED] shadow-[0_15px_35px_rgba(168,85,247,0.4)] transition duration-200 hover:-translate-y-[1px] hover:bg-slate-50"
            >
              S’inscrire
            </button>
          </div>
        </nav>

        <section className="relative mt-12 overflow-hidden rounded-[36px] bg-gradient-to-br from-[#2D0C4F] via-[#7C3AED] to-[#0B0718] px-6 py-10 shadow-[0_40px_80px_rgba(0,0,0,0.75)] sm:px-10 lg:px-14">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/20 blur-[70px]" />
          <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-white/15 blur-[60px]" />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-[13px] font-medium text-white backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-white" />
                Nouveauté ComptAsso v2
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-light leading-[1.06] text-white sm:text-5xl lg:text-[62px] lg:leading-[1.05]">
                  La Comptabilité Moderne
                  <span className="block">Pour Votre Association</span>
                </h1>
                <p className="max-w-xl text-[16px] text-white lg:text-[17px]">
                  Centralisez les cotisations, subventions, notes de frais et obligations légales de votre association dans un seul
                  outil pensé pour les trésoriers.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#7C3AED] shadow-[0_16px_40px_rgba(168,85,247,0.45)] transition duration-200 hover:-translate-y-[2px] hover:brightness-105"
                >
                  Essayer ComptAsso
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-white/10 hover:shadow-lg hover:shadow-black/30"
                >
                  Voir la démo
                </button>
              </div>
            </div>

            <div className="relative flex flex-col items-center gap-6 lg:items-end">
              <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-[#5B21B6] via-[#9333EA] to-[#0B0718] p-6 shadow-[0_24px_40px_rgba(0,0,0,0.85)] transition duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">Budget de l’association</p>
                    <p className="mt-2 text-3xl font-semibold text-white">6 650,00 €</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg text-white">
                    💳
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-white">
                  <p>
                    Cotisations ce mois-ci : <span className="font-semibold text-white">1 650,00 €</span>{" "}
                    <span className="text-fuchsia-100">(+10 % vs mois dernier)</span>
                  </p>
                  <p>
                    Subventions reçues : <span className="font-semibold text-white">2 400,00 €</span>{" "}
                    <span className="text-purple-100">(75 % de l’objectif)</span>
                  </p>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white">
                    <span>Avancement budget</span>
                    <span className="font-semibold">75 %</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[rgba(15,23,42,0.6)]">
                    <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-[#C026D3] via-[#A855F7] to-[#7C3AED]" />
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white">
                  <span className="h-2 w-2 rounded-full bg-fuchsia-300" />
                  Automatisé
                </div>
              </div>

              <div className="relative w-full max-w-sm rounded-[22px] border border-white/15 bg-[rgba(7,17,33,0.9)] p-5 shadow-[0_24px_40px_rgba(0,0,0,0.85)] backdrop-blur transition duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Cotisations & adhérents</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                    Sans erreur
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white/5 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-white">Adhérents actifs</p>
                    <p className="mt-1 text-2xl font-semibold text-white">245</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-white">Cotisations à jour</p>
                    <p className="mt-1 text-2xl font-semibold text-white">92 %</p>
                  </div>
                </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-white">
                      <span>Événementiel</span>
                      <span className="font-semibold text-fuchsia-200">42 %</span>
                    </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="w-[42%] rounded-full bg-fuchsia-400" />
                    <div className="w-[26%] bg-purple-400" />
                    <div className="w-[32%] bg-pink-300" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-white">
                    <span>Sport</span>
                    <span className="font-semibold text-purple-100">26 %</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white">
                    <span>Culturel</span>
                    <span className="font-semibold text-pink-100">32 %</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <p className="mt-10 text-center text-[13px] text-white">
          ComptAsso sécurise les flux financiers, réduit les erreurs et rend les trésoriers sereins.
        </p>
      </div>
    </div>
  );
};

export default ComptAssoLanding;
