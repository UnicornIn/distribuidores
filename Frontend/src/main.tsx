import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { TenantProvider } from "./context/tenant-context";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./type/auth-context";  // Importa el AuthProvider

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="rizos-theme">
        <TenantProvider>
          <AuthProvider> {/* Envolver la app con el contexto de autenticación */}
            <App />
          </AuthProvider>
        </TenantProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
