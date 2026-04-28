import {
  CheckCircle2,
  LayoutList,
  Calendar as CalendarIcon,
  User,
  Menu,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  view: "list" | "calendar" | "personalNote" | "sharedNote";
  setView: (view: "list" | "calendar" | "personalNote" | "sharedNote") => void;
  filterAssignee: string | null;
  setFilterAssignee: (assignee: string | null) => void;
  assignees: string[];
  onMenuClick: () => void;
}

export function Header({
  view,
  setView,
  filterAssignee,
  setFilterAssignee,
  assignees,
  onMenuClick,
}: HeaderProps) {
  const { profile } = useAuth();

  return (
    <div className="bg-card-bg text-text-primary p-4 border-b border-border-subtle sticky top-0 z-30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 active:scale-95 transition-transform"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <h1 className="text-lg font-bold tracking-tight">탑정보통신</h1>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Group Info */}
          <div className="flex flex-col items-end">
            <div className="flex -space-x-2">
              {assignees.slice(0, 3).map((name, i) => (
                <div 
                  key={name}
                  className="w-7 h-7 rounded-full border-2 border-card-bg bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-500 shadow-sm"
                  title={name}
                >
                  {name[0]}
                </div>
              ))}
              {assignees.length > 3 && (
                <div className="w-7 h-7 rounded-full border-2 border-card-bg bg-input-bg flex items-center justify-center text-[8px] font-bold text-text-secondary">
                  +{assignees.length - 3}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-secondary bg-input-bg px-3 py-1.5 rounded-full border border-border-subtle">
            <User className="w-3 h-3" />
            <select
              value={filterAssignee || ""}
              onChange={(e) => setFilterAssignee(e.target.value || null)}
              className="bg-transparent border-none outline-none text-text-primary cursor-pointer"
            >
              <option value="" className="bg-card-bg">
                전체
              </option>
              {assignees.map((a) => (
                <option key={a} value={a} className="bg-card-bg">
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
        <button
          onClick={() => setView("list")}
          className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
            view === "list"
              ? "border-emerald-500 text-text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <LayoutList className="w-4 h-4" />
          모든 작업
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
            view === "calendar"
              ? "border-emerald-500 text-text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          달력
        </button>
        <button
          onClick={() => setView("personalNote")}
          className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
            view === "personalNote"
              ? "border-emerald-500 text-text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <User className="w-4 h-4" />
          개인 노트
        </button>
        <button
          onClick={() => setView("sharedNote")}
          className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
            view === "sharedNote"
              ? "border-emerald-500 text-text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Menu className="w-4 h-4" />
          공유 노트
        </button>
      </div>
    </div>
  );
}
