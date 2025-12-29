import React from "react";
import { Navigate } from "react-router-dom";

const AdminCustomersPage: React.FC = () => {
  return <Navigate to="/admin/clients" replace />;
};

export default AdminCustomersPage;
