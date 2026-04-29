import { useState } from "react";
import { Task } from "../types";
import {
  format,
  startOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isSameWeek,
  getWeekOfMonth,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, Clock, Calendar as CalendarIcon, StickyNote, User as UserIcon, Users } from "lucide-react";
import { NoteEditor } from "./NoteEditor";
import { useAuth } from "../contexts/AuthContext";

interface CalendarViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  defaultExpanded?: boolean;
}

export function CalendarView({ tasks, onEdit, defaultExpanded = false }: CalendarViewProps) {
  const { user, taskTypeColors } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNote, setShowNote] = useState(defaultExpanded);
  const [noteTab, setNoteTab] = useState<"personal" | "shared">("shared");

  const next = () => {
    setCurrentDate(isExpanded ? addMonths(currentDate, 1) : addDays(currentDate, 7));
  };
  const prev = () => {
    setCurrentDate(isExpanded ? subMonths(currentDate, 1) : addDays(currentDate, -7));
  };

  const selectedDayTasks = selectedDate 
    ? tasks.filter(t => isSameDay(parseISO(t.dueDate), selectedDate) && (t.showOnCalendar !== false))
    : [];

  const renderHeader = () => {
    const monthStr = format(currentDate, "yyyy'년' MM'월'");
    const weekNum = getWeekOfMonth(currentDate);

    return (
      <div className="flex justify-between items-center mb-4 px-4 pt-4">
        <h2 className="text-lg font-bold text-white">
          {isExpanded ? monthStr : `${monthStr} ${weekNum}주`}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNote(!showNote)}
            className={`p-2 rounded-lg bg-gray-800 transition-colors ${showNote ? "text-emerald-500" : "text-gray-400 hover:text-white"}`}
            title="노트 보기/숨기기"
          >
            <StickyNote className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={prev} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });

    for (let i = 0; i < 7; i++) {
      const isWeekend = i === 0 || i === 6;
      days.push(
        <div
          key={i}
          className={`text-center font-bold text-[10px] text-gray-500 py-2 border-b border-white/5 ${
            isWeekend ? "col-span-1" : "col-span-2"
          }`}
        >
          {format(addDays(startDate, i), "EEE")}
        </div>
      );
    }
    return <div className="grid grid-cols-12 bg-[#1e1e1e]">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = isExpanded 
      ? startOfWeek(monthStart, { weekStartsOn: 0 })
      : startOfWeek(currentDate, { weekStartsOn: 0 });
    const endDate = isExpanded
      ? endOfWeek(monthEnd, { weekStartsOn: 0 })
      : addDays(startDate, 6);

    const rows = [];
    let day = startDate;

    while (day <= endDate) {
      const weekStart = day;
      const weekEnd = addDays(day, 6);
      
      const parsedTasks = tasks
        .filter(t => t.showOnCalendar !== false)
        .map(t => {
          const due = startOfDay(parseISO(t.dueDate));
          let start = t.createdAt ? startOfDay(parseISO(t.createdAt)) : due;
          if (start > due) start = due;
          return { task: t, start, due };
        })
        .filter(t => t.start <= weekEnd && t.due >= weekStart);

      parsedTasks.sort((a, b) => {
        const aStart = a.start.getTime();
        const bStart = b.start.getTime();
        if (aStart !== bStart) return aStart - bStart;
        const aDuration = a.due.getTime() - aStart;
        const bDuration = b.due.getTime() - bStart;
        return bDuration - aDuration;
      });

      const assignedSlots: Record<string, number> = {};
      const slotOccupied: Record<number, boolean[]> = {};
      let maxSlot = -1;

      parsedTasks.forEach(({ task, start, due }) => {
        const startDiff = Math.round((start.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
        const dueDiff = Math.round((due.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
        
        const startIdx = Math.max(0, startDiff);
        const endIdx = Math.min(6, dueDiff);
        
        let slotIndex = 0;
        while (true) {
          if (!slotOccupied[slotIndex]) {
            slotOccupied[slotIndex] = Array(7).fill(false);
          }
          let canFit = true;
          for (let k = startIdx; k <= endIdx; k++) {
            if (slotOccupied[slotIndex][k]) {
              canFit = false;
              break;
            }
          }
          if (canFit) {
            for (let k = startIdx; k <= endIdx; k++) {
              slotOccupied[slotIndex][k] = true;
            }
            assignedSlots[task.id] = slotIndex;
            if (slotIndex > maxSlot) maxSlot = slotIndex;
            break;
          }
          slotIndex++;
        }
      });

      let days = [];
      for (let i = 0; i < 7; i++) {
        const cloneDay = addDays(weekStart, i);
        const isWeekend = i === 0 || i === 6;
        const isToday = isSameDay(cloneDay, new Date());
        const isCurrentMonth = isSameMonth(cloneDay, monthStart);

        const slotElements = [];
        for (let s = 0; s <= maxSlot; s++) {
          const taskIdForSlot = parsedTasks.find(pt => assignedSlots[pt.task.id] === s && pt.start <= cloneDay && pt.due >= cloneDay);
          
          if (!taskIdForSlot) {
            slotElements.push(
              <div key={`empty-${s}`} className="h-[22px] mb-1"></div>
            );
            continue;
          }
          
          const t = taskIdForSlot;
          const isSpan = t.start < t.due;
          const isStartNode = isSameDay(cloneDay, t.start);
          const isEndNode = isSameDay(cloneDay, t.due);

          if (isSpan) {
            slotElements.push(
              <div
                key={t.task.id}
                className={`h-[22px] mb-1 text-[11px] md:text-xs font-medium py-1 px-1.5 truncate text-white flex items-center ${
                  isStartNode ? "rounded-l" : ""
                } ${isEndNode ? "rounded-r" : ""} ${
                  (!isStartNode && !isEndNode) ? "text-transparent" : "z-10 relative"
                } mx-0`}
                style={{ 
                  backgroundColor: taskTypeColors?.[t.task.taskType] || "#10b981",
                  marginLeft: isStartNode ? '2px' : '-5px', 
                  marginRight: isEndNode ? '2px' : '-5px',
                }}
              >
                {isStartNode || cloneDay.getDay() === 0 ? t.task.title : "\u00A0"}
              </div>
            );
          } else {
            const color = taskTypeColors?.[t.task.taskType] || "#6b7280";
            slotElements.push(
              <div
                key={t.task.id}
                className={`h-[22px] mb-1 text-[11px] md:text-xs font-medium py-1 px-1.5 rounded truncate border mx-0.5 flex items-center`}
                style={{
                  color: color,
                  borderColor: `${color}40`,
                  backgroundColor: `${color}1a`
                }}
              >
                {t.task.title}
              </div>
            );
          }
        }

        days.push(
          <div
            key={cloneDay.toString()}
            onClick={() => setSelectedDate(cloneDay)}
            className={`min-h-[100px] h-auto pb-1 pt-1 border-b border-r border-white/5 transition-colors relative flex flex-col cursor-pointer active:bg-white/5 overflow-hidden ${
              isWeekend ? "col-span-1" : "col-span-2"
            } ${
              !isCurrentMonth && isExpanded
                ? "bg-[#161616] text-gray-700"
                : "bg-[#1e1e1e] text-gray-300"
            }`}
          >
            <div className="flex justify-center mb-1 shrink-0">
              <span
                className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday ? "bg-emerald-500 text-white" : ""
                }`}
              >
                {format(cloneDay, "d")}
              </span>
            </div>
            <div className="flex flex-col flex-1 relative">
              {slotElements}
            </div>
          </div>
        );
      }
      
      rows.push(
        <div className="grid grid-cols-12" key={day.toString()}>
          {days}
        </div>
      );
      
      day = addDays(day, 7);
      if (!isExpanded) break; // Only one week if not expanded
    }
    return <div className="bg-[#1e1e1e] border-l border-t border-white/5">{rows}</div>;
  };

  return (
    <div className="w-full flex flex-col h-full">
      {renderHeader()}
      <div className="flex flex-1 overflow-hidden border-y border-white/5">
        <div className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${showNote ? "w-2/3" : "w-full"}`}>
          {renderDays()}
          {renderCells()}
        </div>
        {showNote && (
          <div className="w-1/3 min-w-[320px] hidden md:flex flex-col border-l border-white/5 bg-[#1e1e1e]">
            <div className="flex border-b border-white/5 bg-[#252525]">
              <button
                onClick={() => setNoteTab("shared")}
                className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  noteTab === "shared" ? "text-emerald-500 border-b-2 border-emerald-500 bg-white/5" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                공유 노트
              </button>
              <button
                onClick={() => setNoteTab("personal")}
                className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  noteTab === "personal" ? "text-emerald-500 border-b-2 border-emerald-500 bg-white/5" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                개인 노트
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {noteTab === "shared" ? (
                <NoteEditor key="shared" docPath="notes/shared_note" title="공유 노트" isShared={true} />
              ) : (
                user && <NoteEditor key="personal" docPath={`personal_notes/${user.sub}`} title="개인 노트" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Note (Overlay) */}
      {showNote && (
        <div className="md:hidden fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end">
          <div className="bg-[#1e1e1e] w-full h-[80vh] rounded-t-3xl overflow-hidden flex flex-col shadow-2xl border-t border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#252525]">
              <div className="flex gap-4">
                <button
                  onClick={() => setNoteTab("shared")}
                  className={`text-sm font-bold flex items-center gap-2 ${noteTab === "shared" ? "text-emerald-500" : "text-gray-500"}`}
                >
                  <Users className="w-4 h-4" />
                  공유
                </button>
                <button
                  onClick={() => setNoteTab("personal")}
                  className={`text-sm font-bold flex items-center gap-2 ${noteTab === "personal" ? "text-emerald-500" : "text-gray-500"}`}
                >
                  <UserIcon className="w-4 h-4" />
                  개인
                </button>
              </div>
              <button 
                onClick={() => setShowNote(false)}
                className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {noteTab === "shared" ? (
                <NoteEditor key="shared-mobile" docPath="notes/shared_note" title="공유 노트" isShared={true} />
              ) : (
                user && <NoteEditor key="personal-mobile" docPath={`personal_notes/${user.sub}`} title="개인 노트" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Day Detail Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1e1e1e] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#252525]">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {format(selectedDate, "yyyy년 MM월 dd일")}
                </h3>
                <p className="text-xs text-emerald-500 font-bold mt-1">
                  총 {selectedDayTasks.length}건의 작업
                </p>
              </div>
              <button 
                onClick={() => setSelectedDate(null)}
                className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {selectedDayTasks.length > 0 ? (
                selectedDayTasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => {
                      onEdit(task);
                      setSelectedDate(null);
                    }}
                    className="bg-[#2d2d2d] p-4 rounded-2xl border border-white/5 active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.priority === "긴급" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                      }`}>
                        {task.priority}
                      </span>
                      <h4 className="font-bold text-white">{task.title}</h4>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-medium border"
                          style={{ color: taskTypeColors?.[task.taskType] || "#6b7280", borderColor: `${taskTypeColors?.[task.taskType] || "#6b7280"}40`, backgroundColor: `${taskTypeColors?.[task.taskType] || "#6b7280"}1a` }}
                        >
                          {task.taskType}
                        </span>
                        <span className="self-center">•</span>
                        <span className="self-center">{task.status}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{task.visitTime || "시간 미지정"}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>해당 날짜에 등록된 작업이 없습니다.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-[#1a1a1a] border-t border-white/10">
              <button 
                onClick={() => setSelectedDate(null)}
                className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl active:scale-95 transition-transform"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
