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
    <div className="relative min-h-screen overflow-hidden bg-[#051224] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(16,185,129,0.4),rgba(5,18,36,0)_42%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_16%,rgba(59,130,246,0.35),rgba(5,18,36,0)_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,rgba(251,191,36,0.18),rgba(5,18,36,0)_45%)]" />
        <div className="absolute right-10 top-16 h-[520px] w-[520px] rounded-full border border-white/5" />
        <div className="absolute right-24 top-24 h-[640px] w-[640px] rounded-full border border-white/5" />
        <div className="absolute right-40 top-32 h-[780px] w-[780px] rounded-full border border-white/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0,rgba(255,255,255,0)_55%)] opacity-40 mix-blend-screen" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-10 sm:px-8 lg:px-12">
        <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 rounded-full bg-gradient-to-r from-[#0EA5E9] via-[#22C55E] to-[#F59E0B] px-4 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#22C55E] via-[#0EA5E9] to-[#2563EB] text-lg font-semibold text-white shadow-lg shadow-cyan-500/40">
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
                  index === 0 ? "bg-white/20 text-white" : "text-white/85"
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
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0EA5E9] shadow-[0_15px_35px_rgba(14,165,233,0.45)] transition duration-200 hover:-translate-y-[1px] hover:bg-slate-50"
            >
              S’inscrire
            </button>
          </div>
        </nav>

        <section className="relative mt-12 overflow-hidden rounded-[36px] bg-gradient-to-br from-[#0EA5E9] via-[#22C55E] to-[#0B1224] px-6 py-10 shadow-[0_40px_80px_rgba(0,0,0,0.75)] sm:px-10 lg:px-14">
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
                <p className="max-w-xl text-[16px] text-white/90 lg:text-[17px]">
                  Centralisez les cotisations, subventions, notes de frais et obligations légales de votre association dans un seul
                  outil pensé pour les trésoriers.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0EA5E9] shadow-[0_16px_40px_rgba(14,165,233,0.55)] transition duration-200 hover:-translate-y-[2px] hover:brightness-105"
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
              <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-[#0EA5E9] via-[#22C55E] to-[#0B1224] p-6 shadow-[0_24px_40px_rgba(0,0,0,0.85)] transition duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/80">Budget de l’association</p>
                    <p className="mt-2 text-3xl font-semibold text-white">6 650,00 €</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg text-white">
                    💳
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-white/90">
                  <p>
                    Cotisations ce mois-ci : <span className="font-semibold text-white">1 650,00 €</span>{" "}
                    <span className="text-emerald-100">(+10 % vs mois dernier)</span>
                  </p>
                  <p>
                    Subventions reçues : <span className="font-semibold text-white">2 400,00 €</span>{" "}
                    <span className="text-cyan-100">(75 % de l’objectif)</span>
                  </p>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span>Avancement budget</span>
                    <span className="font-semibold">75 %</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[rgba(15,23,42,0.6)]">
                    <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-[#22C55E] via-[#0EA5E9] to-[#2563EB]" />
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/90">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Automatisé
                </div>
              </div>

              <div className="relative w-full max-w-sm rounded-[22px] border border-white/15 bg-[rgba(7,17,33,0.9)] p-5 shadow-[0_24px_40px_rgba(0,0,0,0.85)] backdrop-blur transition duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Cotisations & adhérents</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/75">
                    Sans erreur
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white/5 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-white/60">Adhérents actifs</p>
                    <p className="mt-1 text-2xl font-semibold text-white">245</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-white/60">Cotisations à jour</p>
                    <p className="mt-1 text-2xl font-semibold text-white">92 %</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Événementiel</span>
                    <span className="font-semibold text-emerald-200">42 %</span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="w-[42%] rounded-full bg-emerald-400" />
                    <div className="w-[26%] bg-sky-400" />
                    <div className="w-[32%] bg-amber-300" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Sport</span>
                    <span className="font-semibold text-sky-100">26 %</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Culturel</span>
                    <span className="font-semibold text-amber-100">32 %</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <p className="mt-10 text-center text-[13px] text-white/60">
          ComptAsso sécurise les flux financiers, réduit les erreurs et rend les trésoriers sereins.
        </p>
      </div>
    </div>
  );
};

export default ComptAssoLanding;
