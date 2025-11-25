import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import HomePage from "./pages/HomePage";
import OffersPage from "./pages/OffersPage";
import PricingPage from "./pages/PricingPage";
import DownloadsPage from "./pages/DownloadsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ContactPage from "./pages/ContactPage";
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
import { useAuth } from "./context/AuthContext";
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

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
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
  const { user, isLoading } = useAuth();
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

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/offres" element={<OffersPage />} />
        <Route path="/tarifs" element={<PricingPage />} />
        <Route path="/telechargements" element={<DownloadsPage />} />
        <Route path="/panier" element={<CartPage />} />
        <Route path="/paiement" element={<CheckoutPage />} />
        <Route path="/paiement/success" element={<PaymentSuccessPage />} />
        <Route path="/paiement/cancel" element={<PaymentCancelPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:slug" element={<ArticleDetailPage />} />

        <Route path="/cgv" element={<CgvPage />} />
        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="/confidentialite" element={<ConfidentialitePage />} />
        <Route path="/cookies" element={<CookiesPage />} />

        <Route path="/auth/login" element={<AuthLoginPage />} />
        <Route path="/auth/register" element={<AuthRegisterPage />} />
        <Route
          path="/mon-compte"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboardPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/telechargements"
          element={
            <RequireAdmin>
              <AdminDownloadsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/telechargements/:id"
          element={
            <RequireAdmin>
              <AdminDownloadEditPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/promo-codes"
          element={
            <RequireAdmin>
              <AdminPromoCodesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/stripe-settings"
          element={
            <RequireAdmin>
              <AdminStripeSettingsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/company-settings"
          element={
            <RequireAdmin>
              <AdminCompanySettingsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/emails"
          element={
            <RequireAdmin>
              <AdminEmailsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/invoices"
          element={
            <RequireAdmin>
              <AdminInvoicesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/invoices/:id"
          element={
            <RequireAdmin>
              <AdminInvoiceDetailPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <RequireAdmin>
              <AdminOrdersPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <RequireAdmin>
              <AdminOrderDetailPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/legal-pages"
          element={
            <RequireAdmin>
              <AdminLegalPagesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/legal-pages/:id"
          element={
            <RequireAdmin>
              <AdminLegalPageEditPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/articles"
          element={
            <RequireAdmin>
              <AdminArticlesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/articles/new"
          element={
            <RequireAdmin>
              <AdminArticleEditPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/articles/:id"
          element={
            <RequireAdmin>
              <AdminArticleEditPage />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
};

export default App;
