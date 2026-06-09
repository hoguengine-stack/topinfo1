import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { useTasks } from "./hooks/useTasks";
import { Task } from "./types";
import { useAuth } from "./contexts/AuthContext";
import { TodayTasksNotification } from "./components/TodayTasksNotification";
import { NotificationManager } from "./components/NotificationManager";
import { TopWebsite } from "./components/TopWebsite";

const TaskTable = React.lazy(() => import("./components/TaskTable").then(m => ({ default: m.TaskTable })));
const CalendarView = React.lazy(() => import("./components/CalendarView").then(m => ({ default: m.CalendarView })));
const TaskModal = React.lazy(() => import("./components/TaskModal").then(m => ({ default: m.TaskModal })));
const AuthScreens = React.lazy(() => import("./components/AuthScreens").then(m => ({ default: m.AuthScreens })));
const Sidebar = React.lazy(() => import("./components/Sidebar").then(m => ({ default: m.Sidebar })));
const NoteEditor = React.lazy(() => import("./components/NoteEditor").then(m => ({ default: m.NoteEditor })));
const BackConsultations = React.lazy(() => import("./components/BackConsultations").then(m => ({ default: m.BackConsultations })));

export default function App() {
  const { user, profile, isAccessCodeVerified, isLoading } = useAuth();
  const [viewMode, setViewMode] = useState<"website" | "internal">("website");
  const [view, setView] = useState<"list" | "calendar" | "personalNote" | "sharedNote" | "consultations">("list");
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Derive active assignees from tasks (only those who actually have tasks)
  const activeAssignees = Array.from(new Set(tasks.map(t => t.assignee))) as string[];

  // Master list of assignees including the current user and active assignees
  const allAssignees = Array.from(new Set([
    profile?.nickname || "나",
    ...activeAssignees
  ].filter(Boolean)));

  const prevNicknameRef = useRef<string | null>(profile?.nickname || null);

  // Automatically sync tasks when nickname changes
  useEffect(() => {
    const currentNickname = profile?.nickname;
    const prevNickname = prevNicknameRef.current;

    if (currentNickname && prevNickname && currentNickname !== prevNickname) {
      tasks.forEach(task => {
        if (task.assignee === prevNickname) {
          updateTask(task.id, { assignee: currentNickname });
        }
      });
    }
    
    // Also sync from Google name if tasks exist with it
    if (user && currentNickname && user.name !== currentNickname) {
      tasks.forEach(task => {
        if (task.assignee === user.name) {
          updateTask(task.id, { assignee: currentNickname });
        }
      });
    }

    prevNicknameRef.current = currentNickname || null;
  }, [profile?.nickname, user?.name, tasks, updateTask]);

  // Handle document level theme switches based on active view mode
  useEffect(() => {
    if (viewMode === "website") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, [viewMode]);

  // Redirect to website view mode upon logout
  useEffect(() => {
    if (!user) {
      setViewMode("website");
    }
  }, [user]);

  const filteredTasks = filterAssignee
    ? tasks.filter((t) => t.assignee === filterAssignee)
    : tasks;

  const handleSave = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData as Omit<Task, "id" | "updatedAt" | "createdAt">);
    } else {
      addTask(taskData as Omit<Task, "id" | "updatedAt" | "createdAt">);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleToggleComplete = (task: Task) => {
    updateTask(task.id, { status: task.status === "완료" ? "예정" : "완료" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Frontend consumer portal layer and internal workspace persistent rendering
  return (
    <div className="min-h-screen bg-app-bg text-text-primary font-sans selection:bg-emerald-500/30">
      {/* 1. TopWebsite (Front View) - Always rendered to keep state in memory, hidden when mode is internal */}
      <div className={viewMode === "website" ? "block" : "hidden"}>
        <TopWebsite onEnterInternalDashboard={() => setViewMode("internal")} />
      </div>

      {/* 2. Internal Dashboard / Back Screen */}
      <React.Suspense fallback={
        <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-emerald-400 font-mono text-sm gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          관제 시스템 로딩 중...
        </div>
      }>
        {viewMode === "internal" && (!user || !isAccessCodeVerified || !profile) ? (
          <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-center items-center py-10 px-4">
            <AuthScreens onComplete={() => {}} />
            <button
              onClick={() => setViewMode("website")}
              className="mt-6 text-sm font-bold text-emerald-400 hover:text-emerald-300 underline"
            >
              ← 회사 홈페이지로 돌아가기
            </button>
          </div>
        ) : (
          <div className={viewMode === "internal" ? "block" : "hidden"}>
            {user && profile && isAccessCodeVerified && (
              <>
                <Header
                  view={view}
                  setView={setView}
                  filterAssignee={filterAssignee}
                  setFilterAssignee={setFilterAssignee}
                  assignees={allAssignees}
                  onMenuClick={() => setIsSidebarOpen(true)}
                  onBackToWebsite={() => setViewMode("website")}
                />

                <main className="w-full">
                  {view === "list" ? (
                    <div key="list-view-container">
                      <CalendarView tasks={tasks} onEdit={handleEdit} />
                      <div className="h-4 bg-app-bg" />
                      <TaskTable
                        tasks={filteredTasks}
                        onEdit={handleEdit}
                        onAdd={handleAdd}
                        onToggleComplete={handleToggleComplete}
                      />
                    </div>
                  ) : view === "calendar" ? (
                    <div key="calendar-view-container">
                      <CalendarView tasks={filteredTasks} onEdit={handleEdit} defaultExpanded={true} />
                    </div>
                  ) : view === "personalNote" ? (
                    <div key="personal-note-container" className="h-[calc(100vh-120px)]">
                      {user && <NoteEditor docPath={`personal_notes/${user.sub}`} title="개인 노트" />}
                    </div>
                  ) : view === "sharedNote" ? (
                    <div key="shared-note-container" className="h-[calc(100vh-120px)]">
                      <NoteEditor
                        docPath="notes/shared_note"
                        title="공유 노트"
                        isShared={true}
                        completedTasks={tasks.filter(t => t.status === "완료").sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())}
                        onToggleComplete={handleToggleComplete}
                      />
                    </div>
                  ) : (
                    <BackConsultations assignees={allAssignees} currentUserId={user?.sub || ""} />
                  )}
                </main>

                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                <TodayTasksNotification tasks={tasks} />
                <NotificationManager tasks={tasks} />

                {isModalOpen && (
                  <TaskModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    onDelete={deleteTask}
                    task={editingTask}
                    assignees={allAssignees}
                  />
                )}
              </>
            )}
          </div>
        )}
      </React.Suspense>
    </div>
  );
}
