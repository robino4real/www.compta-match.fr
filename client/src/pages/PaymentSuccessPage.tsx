import React from "react";
import { Link } from "react-router-dom";

const ONE_HOUR_SECONDS = 3600;

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}min ${remainingSeconds.toString().padStart(2, "0")}s`;
};

const PaymentSuccessPage: React.FC = () => {
  const [downloadStartedAt, setDownloadStartedAt] = React.useState<number | null>(
    null
  );
  const [remainingSeconds, setRemainingSeconds] = React.useState(ONE_HOUR_SECONDS);

  React.useEffect(() => {
    if (!downloadStartedAt) return;

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - downloadStartedAt) / 1000);
      setRemainingSeconds(Math.max(ONE_HOUR_SECONDS - elapsed, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [downloadStartedAt]);

  const handleStartDownload = () => {
    if (!downloadStartedAt) {
      setDownloadStartedAt(Date.now());
    }
  };

  const timerLabel = downloadStartedAt
    ? `Lien valable encore ${formatDuration(remainingSeconds)}`
    : "Lien valable pendant 1h après clic";

  return (
    <main className="bg-white min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:px-10 md:py-12">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
            <span className="inline-flex w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              Paiement confirmé
            </span>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Merci pour votre commande !
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-700 md:text-base">
              Votre paiement a bien été validé. Votre facture et vos liens de téléchargement sont disponibles dans votre espace client. Un email récapitulatif vous a également été envoyé.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Accès aux téléchargements</p>
                <p className="mt-1 text-sm text-slate-700">
                  Rendez-vous dans votre espace client pour télécharger vos logiciels autant de fois que nécessaire pendant la période de validité.
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Validité du lien</p>
                <p className="mt-1 text-sm text-slate-700">
                  Chaque lien de téléchargement reste actif pendant une heure après avoir été cliqué. Un compte à rebours démarre dès que vous lancez un téléchargement.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-green-600" aria-hidden />
                  <span>Retrouvez vos factures et licences dans l’onglet « Commandes » de votre compte.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-green-600" aria-hidden />
                  <span>Contactez le support si vous avez besoin de réinitialiser un lien expiré.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-900 px-5 py-6 text-white shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-200">
                Téléchargement sécurisé
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Lancer le téléchargement</h2>
              <p className="mt-2 text-sm text-slate-200">
                Le lien reste actif pendant 1h après le premier clic. Vous pouvez également retrouver tous vos liens depuis votre espace client.
              </p>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={handleStartDownload}
                  className="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Télécharger mon logiciel
                </button>
                <Link
                  to="/compte/commandes"
                  className="flex w-full items-center justify-center rounded-full border border-slate-500 px-4 py-3 text-sm font-semibold text-white transition hover:border-white"
                >
                  Accéder à mon espace client
                </Link>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold">
                <div className="flex items-center justify-between">
                  <span>Disponibilité du lien</span>
                  <span className="text-slate-200">{timerLabel}</span>
                </div>
                {downloadStartedAt && remainingSeconds === 0 && (
                  <p className="mt-2 text-xs text-amber-200">
                    Le délai d’une heure est écoulé. Demandez un nouveau lien depuis votre espace client.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">Besoin d’aide ?</p>
              <p className="text-sm text-slate-700">
                Notre équipe reste disponible pour vous assister lors de l’installation ou de l’activation de vos licences.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to="/logiciels"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-black hover:text-black"
              >
                Découvrir d’autres logiciels
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Retour à l’accueil
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PaymentSuccessPage;
