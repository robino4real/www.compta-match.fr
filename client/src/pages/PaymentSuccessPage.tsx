import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  fetchDownloadConfirmation,
  fetchOrderStatusBySession,
  OrderStatusResponse,
} from "../services/paymentsApi";

const ONE_HOUR_SECONDS = 3600;

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}min ${remainingSeconds.toString().padStart(2, "0")}s`;
};

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [downloadStartedAt, setDownloadStartedAt] = React.useState<number | null>(
    null
  );
  const [remainingSeconds, setRemainingSeconds] = React.useState(ONE_HOUR_SECONDS);
  const [checkAnimated, setCheckAnimated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [pendingMessage, setPendingMessage] = React.useState<string | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [confirmation, setConfirmation] = React.useState<{
    order: {
      id: string;
      orderNumber?: string;
      paidAt: string;
      currency: string;
      totalPaid: number;
      firstProductName?: string;
    };
    orderDownloadToken?: string;
    download: { token: string; productName?: string } | null;
  } | null>(null);

  React.useEffect(() => {
    if (!downloadStartedAt) return;

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - downloadStartedAt) / 1000);
      setRemainingSeconds(Math.max(ONE_HOUR_SECONDS - elapsed, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [downloadStartedAt]);

  React.useEffect(() => {
    const sessionId = searchParams.get("session_id") || undefined;
    const orderId = searchParams.get("order_id") || undefined;

    if (!sessionId && !orderId) {
      setError("Lien de confirmation invalide : identifiant de paiement manquant.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const applyStatus = (status: OrderStatusResponse) => {
      if (status.status === "PAID" && status.order) {
        setConfirmation({
          status: status.status,
          order: {
            id: status.order.id,
            orderNumber: status.order.orderNumber,
            paidAt: status.order.paidAt || new Date().toISOString(),
            currency: status.order.currency || "EUR",
            totalPaid: status.order.totalPaid || 0,
            firstProductName: status.order.firstProductName,
          },
          orderDownloadToken: status.orderDownloadToken || undefined,
          download: status.download || null,
          message: status.message,
        });
        setPendingMessage(null);
        setError(null);
        return true;
      }

      setPendingMessage(
        status.message || "Paiement en cours de validation, merci de patienter..."
      );
      return false;
    };

    const pollStatus = async (attempt = 0) => {
      if (controller.signal.aborted) return;

      try {
        if (orderId) {
          const data = await fetchDownloadConfirmation({
            sessionId,
            orderId,
          });
          if (applyStatus({ ...data, status: data.status || "PAID" })) {
            setLoading(false);
            return;
          }
        } else if (sessionId) {
          const status = await fetchOrderStatusBySession(sessionId);
          if (applyStatus(status)) {
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Erreur lors du polling de la commande", err);
        }
      }

      if (attempt >= 10) {
        setLoading(false);
        setError(
          "La validation prend plus de temps que prévu. Vous pouvez actualiser ou contacter le support."
        );
        return;
      }

      setTimeout(() => pollStatus(attempt + 1), 2000);
    };

    pollStatus();

    return () => controller.abort();
  }, [searchParams]);

  React.useEffect(() => {
    if (confirmation) {
      const timer = window.setTimeout(() => setCheckAnimated(true), 80);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [confirmation]);

  const handleStartDownload = () => {
    if (!downloadStartedAt) {
      setDownloadStartedAt(Date.now());
    }
  };

  const timerLabel = downloadStartedAt
    ? `Lien valable encore ${formatDuration(remainingSeconds)}`
    : "Lien valable pendant 1h après clic";

  const downloadUrl = confirmation?.download?.token
    ? `${API_BASE_URL}/downloads/${confirmation.download.token}`
    : confirmation?.orderDownloadToken
      ? `${API_BASE_URL}/download/${confirmation.orderDownloadToken}`
    : null;

  const progressPercent = downloadStartedAt
    ? Math.max(
        0,
        Math.min(100, (remainingSeconds / ONE_HOUR_SECONDS) * 100)
      )
    : 100;

  const availabilityState = downloadUrl
    ? "ready"
    : confirmation
      ? "pending"
      : "disabled";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-12">
      <div className="mx-auto max-w-5xl px-4 lg:px-8">
        <section className="rounded-3xl border border-slate-200/70 bg-white/70 px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur md:px-10 md:py-12">
          {loading && (
            <div className="mb-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              Vérification de votre paiement en cours...
            </div>
          )}

          {pendingMessage && !confirmation && (
            <div className="mb-6 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
              {pendingMessage}
            </div>
          )}

          {error && !loading && (
            <div className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {error}
            </div>
          )}

          {!loading && !error && !confirmation && (
            <div className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Aucune confirmation trouvée pour cette session.
            </div>
          )}

          {confirmation && (
            <>
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-8 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white transition-transform duration-300 ease-out ${checkAnimated ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
                    >
                      <svg
                        aria-hidden
                        className="h-3.5 w-3.5"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.333 4.667 6.5 11.5 3 8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    Paiement confirmé
                  </span>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
                      Merci pour votre commande !
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-slate-700 md:text-lg">
                      Votre paiement a bien été validé pour {confirmation.order.firstProductName || "votre commande"}. Votre facture et vos liens de téléchargement sont disponibles dans votre espace client. Un email récapitulatif vous a également été envoyé.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-inner">
                  <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">Montant réglé</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">
                    {(confirmation.order.totalPaid / 100).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: confirmation.order.currency || "EUR",
                    })}
                  </p>
                  <p className="text-sm text-emerald-700">
                    Commande #{confirmation.order.orderNumber || confirmation.order.id}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <svg
                          aria-hidden
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 3v12m0 0 4-4m-4 4-4-4m11 6H5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-slate-900">Accès aux téléchargements</p>
                        <p className="text-sm text-slate-700">
                          Rendez-vous dans votre espace client pour télécharger vos logiciels autant de fois que nécessaire pendant la période de validité.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-600" aria-hidden>
                          <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            className="h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16 6 8.5 13.5 5 10"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span>Retrouvez vos factures et licences dans l’onglet « Commandes » de votre compte.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-600" aria-hidden>
                          <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            className="h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16 6 8.5 13.5 5 10"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span>Contactez le support si vous avez besoin de réinitialiser un lien expiré.</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <svg
                          aria-hidden
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 7v5l3 2m4-2a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-slate-900">Validité du lien</p>
                        <p className="text-sm text-slate-700">
                          Chaque lien de téléchargement reste actif pendant une heure après avoir été cliqué. Un compte à rebours démarre dès que vous lancez un téléchargement.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>Disponibilité</span>
                        <span className="font-mono tabular-nums text-slate-900">{timerLabel}</span>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white shadow-inner">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      {downloadStartedAt && remainingSeconds === 0 && (
                        <p className="mt-2 text-[13px] text-amber-700">
                          Le délai d’une heure est écoulé. Demandez un nouveau lien depuis votre espace client.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-6 py-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200/80">
                        Téléchargement sécurisé
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">Lancer le téléchargement</h2>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-100 ring-1 ring-white/10">
                      Premium
                    </span>
                  </div>
                  <p className="text-sm text-slate-100/80">
                    Le lien reste actif pendant 1h après le premier clic. Vous pouvez également retrouver tous vos liens depuis votre espace client.
                  </p>

                  <div className="mt-5 space-y-3">
                    {downloadUrl ? (
                      <a
                        href={downloadUrl}
                        onClick={handleStartDownload}
                        className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:translate-y-[-1px] hover:bg-slate-50 hover:shadow-lg"
                      >
                        <svg
                          aria-hidden
                          className="h-4 w-4 text-emerald-600 transition group-hover:scale-110"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 3v12m0 0 4-4m-4 4-4-4m11 6H5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Récupérer mon logiciel
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200/70"
                      >
                        <svg
                          aria-hidden
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 3v12m0 0 4-4m-4 4-4-4m11 6H5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Lien de téléchargement en cours de préparation...
                      </button>
                    )}
                    <Link
                      to="/compte/commandes"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white"
                    >
                      <span aria-hidden className="text-lg">↗</span>
                      Voir mes commandes
                    </Link>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>Disponibilité du lien</span>
                      <span className="font-mono tabular-nums text-emerald-100">{timerLabel}</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-200 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {availabilityState === "pending" && (
                      <p className="mt-2 text-xs text-amber-100/80">
                        Le lien est en cours de préparation. Vous serez notifié dès qu’il est disponible.
                      </p>
                    )}
                    {availabilityState === "disabled" && (
                      <p className="mt-2 text-xs text-amber-100/70">
                        Aucun lien disponible pour le moment. Merci de patienter ou de vérifier votre espace client.
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 text-xs text-slate-100">
                    <p className="font-semibold text-white">Disponibilité du lien</p>
                    <p className="mt-1 text-slate-200/80">
                      Le téléchargement reste accessible pendant 1h après le premier clic.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">Besoin d’aide ?</p>
                  <p className="text-sm text-slate-700">
                    Notre équipe reste disponible pour vous assister lors de l’installation ou de l’activation de vos licences.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    to="/compte/commandes"
                    className="inline-flex items-center justify-center rounded-full border border-slate-800/10 bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Parcourir mes commandes
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
                  >
                    Retour à l’accueil
                  </Link>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default PaymentSuccessPage;
