import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { ClientAuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { CartProvider } from "./context/CartContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <ClientAuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </ClientAuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
