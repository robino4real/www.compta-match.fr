import React from "react";
import { Navigate, useParams } from "react-router-dom";

const AdminCustomerDetailPage: React.FC = () => {
  const { customerId } = useParams();
  return <Navigate to={`/admin/clients/${customerId ?? ""}`} replace />;
};

export default AdminCustomerDetailPage;
