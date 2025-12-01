import React from "react";
import { MainNavbar } from "../components/layout/MainNavbar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <MainNavbar />
      <main>{children}</main>
    </div>
  );
};

export default MainLayout;
