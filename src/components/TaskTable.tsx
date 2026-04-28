import { Task } from "../types";
import { Plus, Clock, Calendar, Filter, ArrowUpDown, User, Tag, CheckCircle2 } from "lucide-react";
import { isPast, parseISO } from "date-fns";
import React, { useState, useMemo } from "react";

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onAdd: () => void;
  onToggleComplete?: (task: Task) => void;
}

export function TaskTable({ tasks, onEdit, onAdd, onToggleComplete }: TaskTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [typeFilter, setTypeFilter] = useState<string>("전체");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("전체");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const uniqueAssignees = useMemo(() => {
    const assignees = tasks.map(t => t.assignee);
    return ["전체", ...Array.from(new Set(assignees))];
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Filtering
    if (statusFilter !== "전체") {
      result = result.filter(t => t.status === statusFilter);
    }
    if (typeFilter !== "전체") {
      result = result.filter(t => t.taskType === typeFilter);
    }
    if (assigneeFilter !== "전체") {
      result = result.filter(t => t.assignee === assigneeFilter);
    }

    // Sorting
    result.sort((a, b) => {
      // 1. Completed tasks always at the bottom
      if (a.status === "완료" && b.status !== "완료") return 1;
      if (a.status !== "완료" && b.status === "완료") return -1;

      // 2. Sort by date
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      
      if (sortOrder === "asc") {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

    return result;
  }, [tasks, statusFilter, typeFilter, assigneeFilter, sortOrder]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "긴급":
        return "bg-red-500 text-white";
      case "높음":
        return "bg-orange-500 text-white";
      case "보통":
        return "bg-emerald-500 text-white";
      case "낮음":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "설치":
        return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "점검":
        return "text-blue-400 border-blue-500/30 bg-blue-500/10";
      case "수리":
        return "text-orange-400 border-orange-500/30 bg-orange-500/10";
      case "휴대용단말기":
        return "text-purple-400 border-purple-500/30 bg-purple-500/10";
      default:
        return "text-gray-400 border-gray-500/30 bg-gray-500/10";
    }
  };

  return (
    <div className="bg-[#121212] min-h-screen pb-24">
      {/* Filter & Sort Bar */}
      <div className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-md border-b border-white/5 p-3 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-white/5 rounded-xl px-2 py-2 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-white focus:outline-none appearance-none pr-1 w-[60px]"
            >
              <option value="전체">상태</option>
              <option value="예정">예정</option>
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
              <option value="보류">보류</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#1e1e1e] border border-white/5 rounded-xl px-3 py-2 shrink-0">
            <Tag className="w-3.5 h-3.5 text-blue-500" />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none appearance-none pr-1"
            >
              <option value="전체">유형: 전체</option>
              <option value="설치">설치</option>
              <option value="점검">점검</option>
              <option value="수리">수리</option>
              <option value="휴대용단말기">휴대용단말기</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#1e1e1e] border border-white/5 rounded-xl px-3 py-2 shrink-0">
            <User className="w-3.5 h-3.5 text-purple-500" />
            <select 
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none appearance-none pr-1"
            >
              {uniqueAssignees.map(name => (
                <option key={name} value={name}>{name === "전체" ? "담당자: 전체" : name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center gap-2 bg-[#1e1e1e] border border-white/5 rounded-xl px-3 py-2 shrink-0 active:scale-95 transition-transform"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-bold text-white">
              날짜: {sortOrder === "asc" ? "가까운순" : "먼순"}
            </span>
          </button>
        </div>
      </div>

      <div className="p-2 space-y-3">
        {filteredAndSortedTasks.map((task) => {
          const isCompleted = task.status === "완료";
          const isOverdue =
            isPast(parseISO(task.dueDate)) && !isCompleted;
          return (
            <div
              key={task.id}
              onClick={() => onEdit(task)}
              className={`bg-[#1e1e1e] rounded-2xl p-4 border border-white/5 active:scale-[0.98] transition-all shadow-xl w-full ${
                isCompleted ? "opacity-40 grayscale-[0.5]" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    isCompleted ? "bg-gray-700 text-gray-400" : getPriorityColor(task.priority)
                  }`}>
                    {task.priority}
                  </span>
                  <h3 className={`text-base font-bold truncate max-w-[220px] ${
                    isCompleted ? "text-gray-500 line-through decoration-red-500/50" : "text-white"
                  }`}>
                    {task.title}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleComplete) onToggleComplete(task);
                  }}
                  className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors ${
                    isCompleted 
                      ? "border-emerald-500 bg-emerald-500 text-[#1e1e1e]" 
                      : "border-gray-500 hover:border-emerald-500 text-transparent hover:text-emerald-500/50"
                  }`}
                >
                  {isCompleted && <CheckCircle2 className="w-6 h-6" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    isCompleted ? "text-gray-600 border-gray-700 bg-gray-800/50" : getTypeColor(task.taskType)
                  }`}>
                    {task.taskType}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    isCompleted ? "bg-emerald-900/20 text-emerald-500/50 border-emerald-500/10" : "bg-gray-800 text-gray-400 border border-white/10"
                  }`}>
                    {task.status}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium text-gray-500">
                    {task.assignee}
                  </span>
                </div>
                {isOverdue && (
                  <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold">
                    <Clock className="w-3 h-3" />
                    DUE
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onAdd}
        className="fixed bottom-4 right-4 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 active:scale-90 transition-transform z-40"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
