import React, { createContext, useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info, CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface ToastContextType {
  showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto"
            >
              <div
                onClick={() => removeToast(t.id)}
                className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold bg-[#1e1e1e]/90 backdrop-blur-md cursor-pointer select-none transition-all hover:scale-[1.01] ${
                  t.type === "success"
                    ? "border-emerald-500/30 text-emerald-400"
                    : t.type === "error"
                    ? "border-red-500/30 text-red-450"
                    : t.type === "warning"
                    ? "border-amber-500/30 text-amber-450"
                    : "border-blue-500/30 text-blue-400"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {t.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {t.type === "error" && <XCircle className="w-4 h-4 text-red-400" />}
                  {t.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {t.type === "info" && <Info className="w-4 h-4 text-blue-400" />}
                </div>
                <div className="flex-1 whitespace-pre-wrap leading-relaxed">{t.message}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToast(t.id);
                  }}
                  className="shrink-0 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
