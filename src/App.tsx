import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { TaskTable } from "./components/TaskTable";
import { CalendarView } from "./components/CalendarView";
import { TaskModal } from "./components/TaskModal";
import { useTasks } from "./hooks/useTasks";
import { Task } from "./types";
import { AuthScreens } from "./components/AuthScreens";
import { useAuth } from "./contexts/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { TodayTasksNotification } from "./components/TodayTasksNotification";
import { NotificationManager } from "./components/NotificationManager";
import { NoteEditor } from "./components/NoteEditor";
import { TopWebsite } from "./components/TopWebsite";
import { BackConsultations } from "./components/BackConsultations";

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
    </div>
  );
}
