import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";

// Globally catch and mute benign WebSocket HMR / development connection errors
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.log("ServiceWorker registration failed: ", err);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
);

