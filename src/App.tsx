import React, { useEffect, useState } from "react";
import { TopWebsite } from "./components/TopWebsite";
import { useAuth } from "./contexts/AuthContext";

const InternalWorkspace = React.lazy(() =>
  import("./components/InternalWorkspace").then((module) => ({ default: module.InternalWorkspace })),
);

function LoadingScreen({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center gap-3 ${
        dark ? "bg-[#121212] text-emerald-400 font-mono text-sm" : "bg-slate-50"
      }`}
    >
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      {dark && <span>관제 시스템 로딩 중...</span>}
    </div>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();
  const [viewMode, setViewMode] = useState<"website" | "internal">("website");

  useEffect(() => {
    document.documentElement.classList.toggle("light", viewMode === "website");
    document.documentElement.classList.toggle("dark", viewMode === "internal");
  }, [viewMode]);

  useEffect(() => {
    if (!user) setViewMode("website");
  }, [user]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-app-bg text-text-primary font-sans selection:bg-emerald-500/30">
      <div className={viewMode === "website" ? "block" : "hidden"}>
        <TopWebsite onEnterInternalDashboard={() => setViewMode("internal")} />
      </div>

      {viewMode === "internal" && (
        <React.Suspense fallback={<LoadingScreen dark />}>
          <InternalWorkspace onBackToWebsite={() => setViewMode("website")} />
        </React.Suspense>
      )}
    </div>
  );
}
