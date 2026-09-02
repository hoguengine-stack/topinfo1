import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./components/public-v3/PublicHomeExperience.css";
import "./styles/public-foundation.css";
import "./styles/public-navigation.css";
import "./styles/public-home-redesign.css";
import "./styles/public-home-system-redesign.css";
import "./styles/public-pages-redesign.css";
import "./styles/public-home-editorial.css";
import "./styles/public-typography.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

const viteEnvironment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env;

if (viteEnvironment?.DEV) {
  // Vite can reject a pending HMR socket while the local server is restarting.
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const reasonStr = String(reason || "");
    const msg = (reason && typeof reason === "object" && "message" in reason) ? String((reason as any).message) : "";

    if (
      msg.includes("WebSocket") ||
      msg.includes("websocket") ||
      msg.includes("closed without opened") ||
      reasonStr.includes("WebSocket") ||
      reasonStr.includes("closed without opened")
    ) {
      event.preventDefault();
      console.warn("Muted benign HMR error (unhandledrejection):", reason);
    }
  });

  window.addEventListener("error", (event) => {
    const msg = event.message || "";
    if (
      msg.includes("WebSocket") ||
      msg.includes("websocket") ||
      msg.includes("closed without opened")
    ) {
      event.preventDefault();
      console.warn("Muted benign HMR error (error event):", msg);
    }
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.log("ServiceWorker registration failed: ", err);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
