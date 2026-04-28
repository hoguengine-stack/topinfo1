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
  const { user } = useAuth();
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
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isWeekend = i === 0 || i === 6;
        
        const dayTasks = tasks.filter((t) => {
          if (t.showOnCalendar === false) return false;
          const due = startOfDay(parseISO(t.dueDate));
          let start = t.createdAt ? startOfDay(parseISO(t.createdAt)) : due;
          if (start > due) start = due;
          
          if (start.getTime() !== due.getTime()) {
            return cloneDay >= start && cloneDay <= due;
          }
          return isSameDay(due, cloneDay);
        });

        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            onClick={() => setSelectedDate(cloneDay)}
            className={`min-h-[100px] h-auto p-1 border-b border-r border-white/5 transition-colors relative flex flex-col cursor-pointer active:bg-white/5 ${
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
                {format(day, "d")}
              </span>
            </div>
            <div className="flex flex-col gap-1 flex-1 relative">
              {dayTasks.map((task) => {
                const due = startOfDay(parseISO(task.dueDate));
                const start = task.createdAt ? startOfDay(parseISO(task.createdAt)) : due;
                
                const isSpan = start < due;
                const isStartNode = isSameDay(cloneDay, start);
                const isEndNode = isSameDay(cloneDay, due);

                if (isSpan) {
                  return (
                    <div
                      key={task.id}
                      className={`text-[11px] md:text-xs font-medium py-1 px-1.5 truncate bg-emerald-500/80 text-white ${
                        isStartNode ? "rounded-l" : ""
                      } ${isEndNode ? "rounded-r" : ""} ${
                        (!isStartNode && !isEndNode) ? "text-transparent" : ""
                      } mx-0`}
                      style={{ 
                        marginLeft: isStartNode ? '2px' : '-4px', 
                        marginRight: isEndNode ? '2px' : '-4px',
                        zIndex: 10 
                      }}
                    >
                      {isStartNode || cloneDay.getDay() === 0 ? task.title : "\u00A0"}
                    </div>
                  );
                }

                return (
                  <div
                    key={task.id}
                    className={`text-[11px] md:text-xs font-medium py-1 px-1.5 rounded truncate border border-white/5 ${
                      task.priority === "긴급" ? "bg-red-500/20 text-red-400" : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {task.title}
                  </div>
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-12" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
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
                        <span>{task.taskType}</span>
                        <span>•</span>
                        <span>{task.status}</span>
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
