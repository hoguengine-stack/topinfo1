import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTasks } from "../hooks/useTasks";
import { Task } from "../types";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Header } from "./Header";
import { NotificationManager } from "./NotificationManager";
import { TodayTasksNotification } from "./TodayTasksNotification";

const TaskTable = React.lazy(() => import("./TaskTable").then((module) => ({ default: module.TaskTable })));
const CalendarView = React.lazy(() => import("./CalendarView").then((module) => ({ default: module.CalendarView })));
const TaskModal = React.lazy(() => import("./TaskModal").then((module) => ({ default: module.TaskModal })));
const AuthScreens = React.lazy(() => import("./AuthScreens").then((module) => ({ default: module.AuthScreens })));
const Sidebar = React.lazy(() => import("./Sidebar").then((module) => ({ default: module.Sidebar })));
const NoteEditor = React.lazy(() => import("./NoteEditor").then((module) => ({ default: module.NoteEditor })));
const BackConsultations = React.lazy(() =>
  import("./BackConsultations").then((module) => ({ default: module.BackConsultations })),
);

interface InternalWorkspaceProps {
  onBackToWebsite: () => void;
}

export function InternalWorkspace({ onBackToWebsite }: InternalWorkspaceProps) {
  const { user, profile, hasStaffAccess } = useAuth();
  const [view, setView] = useState<"list" | "calendar" | "personalNote" | "sharedNote" | "consultations">("list");
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [staffDirectory, setStaffDirectory] = useState<Array<{ id: string; name: string; jobTitle?: string }>>([]);

  useEffect(() => {
    if (!hasStaffAccess) {
      setStaffDirectory([]);
      return;
    }
    return onSnapshot(collection(db, "staff_profiles"), (snapshot) => {
      setStaffDirectory(snapshot.docs
        .map((entry) => ({
          id: entry.id,
          name: String(entry.data().nickname || "").trim(),
          jobTitle: typeof entry.data().jobTitle === "string" ? entry.data().jobTitle : undefined,
        }))
        .filter((entry) => entry.name));
    }, (error) => {
      console.warn("Staff directory listener failed", error);
      setStaffDirectory([]);
    });
  }, [hasStaffAccess]);

  const activeAssignees = Array.from(new Set(tasks.map((task) => task.assignee))) as string[];
  const allAssignees = Array.from(new Set([
    profile?.nickname || "나",
    ...staffDirectory.map((entry) => entry.name),
    ...activeAssignees,
  ].filter(Boolean)));
  const assigneeIds = React.useMemo(() => Object.fromEntries([
    ...staffDirectory.map((entry) => [entry.name, entry.id] as const),
    ...(profile?.nickname && user?.sub ? [[profile.nickname, user.sub] as const] : []),
  ]), [profile?.nickname, staffDirectory, user?.sub]);
  const prevNicknameRef = useRef<string | null>(profile?.nickname || null);

  useEffect(() => {
    const currentNickname = profile?.nickname;
    const previousNickname = prevNicknameRef.current;

    if (currentNickname && previousNickname && currentNickname !== previousNickname) {
      tasks.forEach((task) => {
        if (task.assigneeId === user?.sub || (!task.assigneeId && task.assignee === previousNickname)) {
          updateTask(task.id, { assignee: currentNickname, assigneeId: user?.sub });
        }
      });
    }

    if (user && currentNickname && user.name !== currentNickname) {
      tasks.forEach((task) => {
        if (task.assigneeId === user.sub || (!task.assigneeId && task.assignee === user.name)) {
          updateTask(task.id, { assignee: currentNickname, assigneeId: user.sub });
        }
      });
    }

    prevNicknameRef.current = currentNickname || null;
  }, [profile?.nickname, tasks, updateTask, user]);

  const filteredTasks = filterAssignee
    ? tasks.filter((task) => task.assignee === filterAssignee)
    : tasks;

  const handleSave = async (taskData: Partial<Task>) => {
    if (editingTask) {
      return updateTask(editingTask.id, taskData as Omit<Task, "id" | "updatedAt" | "createdAt">);
    }
    return addTask(taskData as Omit<Task, "id" | "updatedAt" | "createdAt">);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleToggleComplete = (task: Task) => {
    updateTask(task.id, { status: task.status === "완료" ? "예정" : "완료" });
  };

  if (!user || !hasStaffAccess || !profile) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-center items-center py-10 px-4">
        <AuthScreens onComplete={() => {}} />
        <button
          type="button"
          onClick={onBackToWebsite}
          className="mt-6 text-sm font-bold text-emerald-400 hover:text-emerald-300 underline"
        >
          ← 회사 홈페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <>
      <Header
        view={view}
        setView={setView}
        filterAssignee={filterAssignee}
        setFilterAssignee={setFilterAssignee}
        assignees={allAssignees}
        onMenuClick={() => setIsSidebarOpen(true)}
        onBackToWebsite={onBackToWebsite}
      />

      <main className="w-full">
        {view === "list" ? (
          <div key="list-view-container">
            <CalendarView tasks={tasks} onEdit={handleEdit} />
            <div className="h-4 bg-app-bg" />
            <TaskTable
              tasks={filteredTasks}
              onEdit={handleEdit}
              onAdd={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              onToggleComplete={handleToggleComplete}
            />
          </div>
        ) : view === "calendar" ? (
          <CalendarView tasks={filteredTasks} onEdit={handleEdit} defaultExpanded />
        ) : view === "personalNote" ? (
          <div className="h-[calc(100vh-120px)]">
            <NoteEditor docPath={`personal_notes/${user.sub}`} title="개인 노트" />
          </div>
        ) : view === "sharedNote" ? (
          <div className="h-[calc(100vh-120px)]">
            <NoteEditor
              docPath="notes/shared_note"
              title="공유 노트"
              isShared
              completedTasks={tasks
                .filter((task) => task.status === "완료")
                .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())}
              onToggleComplete={handleToggleComplete}
            />
          </div>
        ) : (
          <BackConsultations assignees={allAssignees} assigneeIds={assigneeIds} currentUserId={user.sub || ""} />
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
          assigneeIds={assigneeIds}
        />
      )}
    </>
  );
}
