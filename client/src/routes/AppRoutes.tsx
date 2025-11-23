import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import HomePage from '../pages/HomePage';
import OffersPage from '../pages/OffersPage';
import PricingPage from '../pages/PricingPage';
import DownloadsPage from '../pages/DownloadsPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import ContactPage from '../pages/ContactPage';
import LegalPage from '../pages/LegalPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import CartPage from '../pages/CartPage';
import DashboardLayout from '../pages/app/DashboardLayout';
import DashboardHome from '../pages/app/DashboardHome';
import FreemiumApp from '../pages/app/FreemiumApp';
import ProApp from '../pages/app/ProApp';
import DownloadsUser from '../pages/app/DownloadsUser';
import SubscriptionPage from '../pages/app/SubscriptionPage';
import PaymentsPage from '../pages/app/PaymentsPage';
import SettingsPage from '../pages/app/SettingsPage';
import AdminPage from '../pages/admin/AdminPage';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactElement; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/app" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route
      path="/"
      element={
        <PublicLayout>
          <HomePage />
        </PublicLayout>
      }
    />
    <Route
      path="/offres"
      element={
        <PublicLayout>
          <OffersPage />
        </PublicLayout>
      }
    />
    <Route
      path="/tarifs"
      element={
        <PublicLayout>
          <PricingPage />
        </PublicLayout>
      }
    />
    <Route
      path="/telechargements"
      element={
        <PublicLayout>
          <DownloadsPage />
        </PublicLayout>
      }
    />
    <Route
      path="/produit/:id"
      element={
        <PublicLayout>
          <ProductDetailPage />
        </PublicLayout>
      }
    />
    <Route
      path="/contact"
      element={
        <PublicLayout>
          <ContactPage />
        </PublicLayout>
      }
    />
    <Route
      path="/cgv"
      element={
        <PublicLayout>
          <LegalPage title="Conditions générales de vente" slug="cgv" />
        </PublicLayout>
      }
    />
    <Route
      path="/mentions-legales"
      element={
        <PublicLayout>
          <LegalPage title="Mentions légales" slug="mentions" />
        </PublicLayout>
      }
    />
    <Route
      path="/confidentialite"
      element={
        <PublicLayout>
          <LegalPage title="Politique de confidentialité" slug="confidentialite" />
        </PublicLayout>
      }
    />
    <Route
      path="/auth/login"
      element={
        <PublicLayout>
          <LoginPage />
        </PublicLayout>
      }
    />
    <Route
      path="/auth/register"
      element={
        <PublicLayout>
          <RegisterPage />
        </PublicLayout>
      }
    />
    <Route
      path="/panier"
      element={
        <PublicLayout>
          <CartPage />
        </PublicLayout>
      }
    />
    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<DashboardHome />} />
      <Route path="freemium" element={<FreemiumApp />} />
      <Route path="pro" element={<ProApp />} />
      <Route path="telechargements" element={<DownloadsUser />} />
      <Route path="abonnement" element={<SubscriptionPage />} />
      <Route path="paiements" element={<PaymentsPage />} />
      <Route path="parametres" element={<SettingsPage />} />
    </Route>
    <Route
      path="/admin"
      element={
        <ProtectedRoute adminOnly>
          <AdminPage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

export default AppRoutes;
