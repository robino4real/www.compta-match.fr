import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { MainNavbar } from "../components/layout/MainNavbar";
import { useCart } from "../context/CartContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { items } = useCart();
  const navigate = useNavigate();

  const handleCartClick = () => navigate("/panier");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MainNavbar cartItemCount={items.length} onCartClick={handleCartClick} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
