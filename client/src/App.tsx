import React from "react";
import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

import HomePage from "./pages/HomePage";
import OffersPage from "./pages/OffersPage";
import PricingPage from "./pages/PricingPage";
import DownloadsPage from "./pages/DownloadsPage";
import DownloadDetailPage from "./pages/DownloadDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ContactPage from "./pages/ContactPage";
import FaqPage from "./pages/FaqPage";
import ArticlesPage from "./pages/ArticlesPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";

import CgvPage from "./pages/CgvPage";
import MentionsLegalesPage from "./pages/MentionsLegalesPage";
import ConfidentialitePage from "./pages/ConfidentialitePage";
import CookiesPage from "./pages/CookiesPage";

import NotFoundPage from "./pages/NotFoundPage";
import AuthLoginPage from "./pages/AuthLoginPage";
import AuthRegisterPage from "./pages/AuthRegisterPage";
import AccountPage from "./pages/AccountPage";
import { useClientAuth } from "./context/AuthContext";
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
import AdminLoginPage from "./pages/admin/AdminLoginPage";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useClientAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-xs text-slate-600">
        Vérification de votre session en cours...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

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
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
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
          <Route path="/offres" element={<OffersPage />} />
          <Route path="/tarifs" element={<PricingPage />} />
          <Route path="/telechargements" element={<DownloadsPage />} />
          <Route path="/telechargements/:slug" element={<DownloadDetailPage />} />
          <Route path="/panier" element={<CartPage />} />
          <Route path="/paiement" element={<CheckoutPage />} />
          <Route path="/paiement/success" element={<PaymentSuccessPage />} />
          <Route path="/paiement/cancel" element={<PaymentCancelPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:slug" element={<ArticleDetailPage />} />

          <Route path="/cgv" element={<CgvPage />} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route path="/confidentialite" element={<ConfidentialitePage />} />
          <Route path="/cookies" element={<CookiesPage />} />

          <Route path="/auth/login" element={<AuthLoginPage />} />
          <Route path="/auth/register" element={<AuthRegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/mon-compte"
            element={
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayoutWrapper />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="telechargements" element={<AdminDownloadsPage />} />
          <Route path="telechargements/:id" element={<AdminDownloadEditPage />} />
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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
