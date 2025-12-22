import React from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

import HomePage from "./pages/HomePage";
import { useAdminAuth } from "./context/AdminAuthContext";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminDownloadsPage from "./pages/admin/AdminDownloadsPage";
import AdminDownloadEditPage from "./pages/admin/AdminDownloadEditPage";
import AdminStripeSettingsPage from "./pages/admin/AdminStripeSettingsPage";
import AdminPromoCodesPage from "./pages/admin/AdminPromoCodesPage";
import AdminCompanySettingsPage from "./pages/admin/AdminCompanySettingsPage";
import AdminInvoicesPage from "./pages/admin/AdminInvoicesPage";
import AdminInvoiceDetailPage from "./pages/admin/AdminInvoiceDetailPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminEmailsPage from "./pages/admin/AdminEmailsPage";
import AdminLegalPagesPage from "./pages/admin/AdminLegalPagesPage";
import AdminLegalPageEditPage from "./pages/admin/AdminLegalPageEditPage";
import AdminArticlesPage from "./pages/admin/AdminArticlesPage";
import AdminArticleEditPage from "./pages/admin/AdminArticleEditPage";
import AdminHomepagePage from "./pages/admin/AdminHomepagePage";
import AdminSeoPage from "./pages/admin/AdminSeoPage";
import AdminPagesPage from "./pages/admin/AdminPagesPage";
import AdminPageDetailPage from "./pages/admin/AdminPageDetailPage";
import AnalyticsTracker from "./components/AnalyticsTracker";
import DownloadableProductsPage from "./pages/DownloadableProductsPage";
import ComptaProSubscriptionPage from "./pages/ComptaProSubscriptionPage";
import ComptaProPlanDetailPage from "./pages/ComptaProPlanDetailPage";
import ComptAssoSubscriptionPage from "./pages/ComptAssoSubscriptionPage";
import ComptAssoLanding from "./pages/ComptAssoPlanDetailPage";
import CompareOffersPage from "./pages/CompareOffersPage";
import DiscoveryPage from "./pages/DiscoveryPage";
import AdminPaidServicesPage from "./pages/admin/AdminPaidServicesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MonProfilPage from "./pages/account/MonProfilPage";
import AccountSubscriptionsPage from "./pages/account/AccountSubscriptionsPage";
import AccountOrdersPage from "./pages/account/AccountOrdersPage";
import AccountSettingsPage from "./pages/account/AccountSettingsPage";
import AccountProfilePage from "./pages/account/AccountProfilePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import LegalPage from "./pages/LegalPage";
import AuthLoginPage from "./pages/AuthLoginPage";
import AuthRegisterPage from "./pages/AuthRegisterPage";
import ProSpacePage from "./pages/ProSpacePage";
import AssoSpacePage from "./pages/AssoSpacePage";
import PageBuilderPage from "./pages/PageBuilderPage";

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
      <Routes>
        <Route element={<MainLayoutWrapper />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/comparatif-des-offres"
            element={<PageBuilderPage route="/comparatif-des-offres" fallback={<CompareOffersPage />} />}
          />
          <Route path="/offres" element={<Navigate to="/comparatif-des-offres" replace />} />
          <Route
            path="/logiciels"
            element={<PageBuilderPage route="/logiciels" fallback={<DownloadableProductsPage />} />}
          />
          <Route
            path="/comptapro"
            element={<PageBuilderPage route="/comptapro" fallback={<ComptaProSubscriptionPage />} />}
          />
          <Route path="/comptapro/:planSlug" element={<ComptaProPlanDetailPage />} />
          <Route
            path="/comptasso"
            element={<PageBuilderPage route="/comptasso" fallback={<ComptAssoSubscriptionPage />} />}
          />
          <Route path="/comptasso/:planSlug" element={<ComptAssoLanding />} />
          {["/faq", "/cgv", "/mentions-legales", "/confidentialite", "/cookies"].map((path) => (
            <Route
              key={path}
              path={path}
              element={<PageBuilderPage route={path} fallback={<LegalPage slugOverride={path.replace("/", "")} />} />}
            />
          ))}
          <Route path="/découverte" element={<DiscoveryPage />} />
          <Route path="/decouverte" element={<Navigate to="/découverte" replace />} />
          <Route path="/panier" element={<CartPage />} />
          <Route path="/commande" element={<CheckoutPage />} />
          <Route path="/paiement/success" element={<PaymentSuccessPage />} />
          <Route path="/paiement/cancel" element={<PaymentCancelPage />} />
          <Route path="/auth/login" element={<AuthLoginPage />} />
          <Route path="/auth/register" element={<AuthRegisterPage />} />
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
        <Route path="/mon-espace-asso" element={<AssoSpacePage />} />

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
    </>
  );
};

export default App;
