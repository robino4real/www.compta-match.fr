import React, { Suspense } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

import { useAdminAuth } from "./context/AdminAuthContext";
import AnalyticsTracker from "./components/AnalyticsTracker";
import ProtectedRoute from "./components/ProtectedRoute";

const HomePage = React.lazy(() => import("./pages/HomePage"));
const DownloadableProductsPage = React.lazy(
  () => import("./pages/DownloadableProductsPage"),
);
const ComptaProSubscriptionPage = React.lazy(
  () => import("./pages/ComptaProSubscriptionPage"),
);
const ComptaProPlanDetailPage = React.lazy(
  () => import("./pages/ComptaProPlanDetailPage"),
);
const ComptAssoSubscriptionPage = React.lazy(
  () => import("./pages/ComptAssoSubscriptionPage"),
);
const ComptAssoLanding = React.lazy(
  () => import("./pages/ComptAssoPlanDetailPage"),
);
const CompareOffersPage = React.lazy(() => import("./pages/CompareOffersPage"));
const DiscoveryPage = React.lazy(() => import("./pages/DiscoveryPage"));
const CartPage = React.lazy(() => import("./pages/CartPage"));
const CheckoutPage = React.lazy(() => import("./pages/CheckoutPage"));
const PaymentSuccessPage = React.lazy(
  () => import("./pages/PaymentSuccessPage"),
);
const PaymentCancelPage = React.lazy(
  () => import("./pages/PaymentCancelPage"),
);
const LegalPage = React.lazy(() => import("./pages/LegalPage"));
const AuthLoginPage = React.lazy(() => import("./pages/AuthLoginPage"));
const ProSpacePage = React.lazy(() => import("./pages/ProSpacePage"));
const MonProfilPage = React.lazy(() => import("./pages/account/MonProfilPage"));
const AccountSubscriptionsPage = React.lazy(
  () => import("./pages/account/AccountSubscriptionsPage"),
);
const AccountOrdersPage = React.lazy(
  () => import("./pages/account/AccountOrdersPage"),
);
const AccountSettingsPage = React.lazy(
  () => import("./pages/account/AccountSettingsPage"),
);
const AccountProfilePage = React.lazy(
  () => import("./pages/account/AccountProfilePage"),
);

const AdminDashboardPage = React.lazy(
  () => import("./pages/admin/AdminDashboardPage"),
);
const AdminDownloadsPage = React.lazy(
  () => import("./pages/admin/AdminDownloadsPage"),
);
const AdminDownloadEditPage = React.lazy(
  () => import("./pages/admin/AdminDownloadEditPage"),
);
const AdminStripeSettingsPage = React.lazy(
  () => import("./pages/admin/AdminStripeSettingsPage"),
);
const AdminPromoCodesPage = React.lazy(
  () => import("./pages/admin/AdminPromoCodesPage"),
);
const AdminCompanySettingsPage = React.lazy(
  () => import("./pages/admin/AdminCompanySettingsPage"),
);
const AdminInvoicesPage = React.lazy(
  () => import("./pages/admin/AdminInvoicesPage"),
);
const AdminInvoiceDetailPage = React.lazy(
  () => import("./pages/admin/AdminInvoiceDetailPage"),
);
const AdminOrdersPage = React.lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminOrderDetailPage = React.lazy(
  () => import("./pages/admin/AdminOrderDetailPage"),
);
const AdminCustomersPage = React.lazy(
  () => import("./pages/admin/AdminCustomersPage"),
);
const AdminEmailsPage = React.lazy(
  () => import("./pages/admin/AdminEmailsPage"),
);
const AdminLegalPagesPage = React.lazy(
  () => import("./pages/admin/AdminLegalPagesPage"),
);
const AdminLegalPageEditPage = React.lazy(
  () => import("./pages/admin/AdminLegalPageEditPage"),
);
const AdminArticlesPage = React.lazy(
  () => import("./pages/admin/AdminArticlesPage"),
);
const AdminArticleEditPage = React.lazy(
  () => import("./pages/admin/AdminArticleEditPage"),
);
const AdminHomepagePage = React.lazy(
  () => import("./pages/admin/AdminHomepagePage"),
);
const AdminSeoPage = React.lazy(() => import("./pages/admin/AdminSeoPage"));
const AdminPagesPage = React.lazy(() => import("./pages/admin/AdminPagesPage"));
const AdminPageDetailPage = React.lazy(
  () => import("./pages/admin/AdminPageDetailPage"),
);
const AdminPaidServicesPage = React.lazy(
  () => import("./pages/admin/AdminPaidServicesPage"),
);

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-xs text-slate-600">
        Vérification de votre session en cours...
      </div>
    );
  }

  if (!admin) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location, adminAccess: true }}
        replace
      />
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const MainLayoutWrapper: React.FC = () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );

  const AdminLayoutWrapper: React.FC = () => (
    <RequireAdmin>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </RequireAdmin>
  );

  return (
    <>
      <AnalyticsTracker />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-600">
            Chargement de la page…
          </div>
        }
      >
        <Routes>
          <Route element={<MainLayoutWrapper />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/comparatif-des-offres" element={<CompareOffersPage />} />
            <Route path="/offres" element={<Navigate to="/comparatif-des-offres" replace />} />
            <Route path="/logiciels" element={<DownloadableProductsPage />} />
            <Route path="/comptapro" element={<ComptaProSubscriptionPage />} />
            <Route path="/comptapro/:planSlug" element={<ComptaProPlanDetailPage />} />
            <Route path="/comptasso" element={<ComptAssoSubscriptionPage />} />
            <Route path="/comptasso/:planSlug" element={<ComptAssoLanding />} />
            <Route path="/découverte" element={<DiscoveryPage />} />
            <Route path="/decouverte" element={<Navigate to="/découverte" replace />} />
            <Route path="/panier" element={<CartPage />} />
            <Route path="/commande" element={<CheckoutPage />} />
            <Route path="/paiement/success" element={<PaymentSuccessPage />} />
            <Route path="/paiement/cancel" element={<PaymentCancelPage />} />
            <Route path="/auth/login" element={<AuthLoginPage />} />
            <Route path="/:legalSlug" element={<LegalPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/compte" element={<MonProfilPage />} />
              <Route path="/compte/abonnements" element={<AccountSubscriptionsPage />} />
              <Route path="/compte/commandes" element={<AccountOrdersPage />} />
              <Route path="/compte/parametres" element={<AccountSettingsPage />} />
              <Route path="/compte/informations" element={<AccountProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          <Route path="/mon-espace-pro" element={<ProSpacePage />} />

          <Route path="/admin" element={<AdminLayoutWrapper />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="telechargements" element={<AdminDownloadsPage />} />
            <Route path="telechargements/:id" element={<AdminDownloadEditPage />} />
            <Route path="clients" element={<AdminCustomersPage />} />
            <Route path="promo-codes" element={<AdminPromoCodesPage />} />
            <Route path="stripe-settings" element={<AdminStripeSettingsPage />} />
            <Route path="company-settings" element={<AdminCompanySettingsPage />} />
            <Route path="emails" element={<AdminEmailsPage />} />
            <Route path="invoices" element={<AdminInvoicesPage />} />
            <Route path="invoices/:id" element={<AdminInvoiceDetailPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="legal-pages" element={<AdminLegalPagesPage />} />
            <Route path="legal-pages/:id" element={<AdminLegalPageEditPage />} />
            <Route path="articles" element={<AdminArticlesPage />} />
            <Route path="articles/new" element={<AdminArticleEditPage />} />
            <Route path="articles/:id" element={<AdminArticleEditPage />} />
            <Route path="pages" element={<AdminPagesPage />} />
            <Route path="pages/:id" element={<AdminPageDetailPage />} />
            <Route path="homepage" element={<AdminHomepagePage />} />
            <Route path="seo" element={<AdminSeoPage />} />
            <Route path="paid-services" element={<AdminPaidServicesPage />} />
            <Route path="paid-services-comptasso" element={<AdminPaidServicesPage serviceType="COMPTASSO" />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
