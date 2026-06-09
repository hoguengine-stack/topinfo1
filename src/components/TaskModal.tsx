import React, { useState, useEffect } from "react";
import { Task, Priority, Status, TaskType } from "../types";
import { X, Trash2, Clock, Check, Calendar, Share2, Paperclip, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const ScrollUnit = ({ label, value, onScroll, onDoubleClick }: { label: string; value: number | string; onScroll: (delta: number) => void; onDoubleClick?: () => void }) => {
  const [startY, setStartY] = useState<number | null>(null);
  const [lastTap, setLastTap] = useState(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    setStartY(e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startY === null) return;
    const currentY = e.clientY;
    const diff = startY - currentY; // Moving up means negative diff from browser, but diff = startY - currentY means positive diff if moved up
    if (Math.abs(diff) > 20) {
      onScroll(diff > 0 ? 1 : -1); // diff > 0 means we moved up, so increase.
      setStartY(currentY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setStartY(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
    
    // For double click handling:
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength > 0 && tapLength < 300) {
      if (onDoubleClick) onDoubleClick();
    }
    setLastTap(currentTime);
  };

  return (
    <div 
      className="flex flex-col items-center flex-1 py-2 cursor-ns-resize active:bg-white/5 rounded-xl transition-colors touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={onDoubleClick}
    >
      <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 pointer-events-none">{label}</span>
      <div className="text-2xl font-bold text-white tabular-nums pointer-events-none">{value}</div>
    </div>
  );
};

const ScrollDatePicker = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const date = React.useMemo(() => {
    if (!value) return new Date();
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [value]);
  
  const handleScroll = (type: 'y' | 'm' | 'd', delta: number) => {
    const newDate = new Date(date);
    if (type === 'y') newDate.setFullYear(date.getFullYear() + delta);
    if (type === 'm') newDate.setMonth(date.getMonth() + delta);
    if (type === 'd') newDate.setDate(date.getDate() + delta);
    onChange(format(newDate, "yyyy-MM-dd"));
  };

  const handleDoubleClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (e) {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div className="relative flex items-center justify-between bg-[#2d2d2d] rounded-2xl p-4 border border-white/5 select-none">
      <input 
        ref={dateInputRef}
        type="date"
        value={value}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value);
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 opacity-0 pointer-events-none"
      />
      <ScrollUnit label="년" value={date.getFullYear()} onScroll={(d) => handleScroll('y', d)} onDoubleClick={handleDoubleClick} />
      <div className="w-px h-10 bg-white/5 mx-2 z-10" />
      <ScrollUnit label="월" value={date.getMonth() + 1} onScroll={(d) => handleScroll('m', d)} onDoubleClick={handleDoubleClick} />
      <div className="w-px h-10 bg-white/5 mx-2 z-10" />
      <ScrollUnit label="일" value={date.getDate()} onScroll={(d) => handleScroll('d', d)} onDoubleClick={handleDoubleClick} />
    </div>
  );
};

const ScrollTimePicker = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const time = React.useMemo(() => {
    if (!value || value === "오전" || value === "오후") {
      const now = new Date();
      return { h: now.getHours(), m: now.getMinutes() };
    }
    
    let h = 0, m = 0;
    const timeMatch = value.match(/(\d+):(\d+)/);
    if (timeMatch) {
      h = parseInt(timeMatch[1], 10);
      m = parseInt(timeMatch[2], 10);
      if (value.includes("오후") && h < 12) h += 12;
      if (value.includes("오전") && h === 12) h = 0;
    } else {
      const now = new Date();
      h = now.getHours();
      m = now.getMinutes();
    }
    return { h, m };
  }, [value]);
  
  const isPM = time.h >= 12;
  const displayH = time.h % 12 === 0 ? 12 : time.h % 12;

  const handleScroll = (type: 'ampm' | 'h' | 'm', delta: number) => {
    let newH = time.h;
    let newM = time.m;
    
    if (type === 'ampm') {
      newH = (newH + 12) % 24;
    }
    if (type === 'h') {
      let nextDisplayH = displayH + delta;
      if (nextDisplayH > 12) nextDisplayH = 1;
      if (nextDisplayH < 1) nextDisplayH = 12;
      
      if (isPM) {
        newH = nextDisplayH === 12 ? 12 : nextDisplayH + 12;
      } else {
        newH = nextDisplayH === 12 ? 0 : nextDisplayH;
      }
    }
    if (type === 'm') {
      newM = (newM + delta + 60) % 60;
    }
    
    const newIsPM = newH >= 12;
    const newDisplayH = newH % 12 === 0 ? 12 : newH % 12;
    const ampmStr = newIsPM ? "오후" : "오전";
    const formattedH = newDisplayH.toString().padStart(2, '0');
    const formattedM = newM.toString().padStart(2, '0');
    
    onChange(`${ampmStr} ${formattedH}:${formattedM}`);
  };

  const handleDoubleClick = (type: 'h' | 'm') => {
    let newH = time.h;
    let newM = time.m;
    
    if (type === 'h') {
      newH = isPM ? 12 : 0;
    }
    if (type === 'm') {
      newM = 0;
    }
    
    const newIsPM = newH >= 12;
    const newDisplayH = newH % 12 === 0 ? 12 : newH % 12;
    const ampmStr = newIsPM ? "오후" : "오전";
    const formattedH = newDisplayH.toString().padStart(2, '0');
    const formattedM = newM.toString().padStart(2, '0');
    
    onChange(`${ampmStr} ${formattedH}:${formattedM}`);
  };

  return (
    <div className="flex items-center justify-between bg-[#2d2d2d] rounded-2xl p-4 border border-white/5 select-none">
      <ScrollUnit label="오전/오후" value={isPM ? "오후" : "오전"} onScroll={(d) => handleScroll('ampm', d)} />
      <div className="w-px h-10 bg-white/5 mx-2" />
      <ScrollUnit label="시" value={displayH.toString().padStart(2, '0')} onScroll={(d) => handleScroll('h', d)} onDoubleClick={() => handleDoubleClick('h')} />
      <div className="text-2xl font-bold text-white/50 mx-2">:</div>
      <ScrollUnit label="분" value={time.m.toString().padStart(2, '0')} onScroll={(d) => handleScroll('m', d)} onDoubleClick={() => handleDoubleClick('m')} />
    </div>
  );
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete?: (id: string) => void;
  task?: Task | null;
  assignees: string[];
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
  assignees,
}: TaskModalProps) {
  const { profile, taskTypes, taskTypeColors, priorities, isAdmin } = useAuth();
  const { showToast } = useToast();
  const displayTaskTypes = React.useMemo(() => taskTypes.length > 0 ? taskTypes : ["설치"], [taskTypes]);
  const isSiljang = isAdmin;
  
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    status: "예정",
    assignee: profile?.nickname || assignees[0],
    dueDate: format(new Date(), "yyyy-MM-dd"),
    priority: (priorities[2] || "보통") as Priority,
    taskType: (displayTaskTypes[0] || "설치") as TaskType,
    visitTime: "",
    memo: "",
    showOnCalendar: isSiljang ? false : true,
    attachments: [],
  });

  const [timeMode, setTimeMode] = useState<"direct" | "preset">("direct");
  const [dateMode, setDateMode] = useState<"direct" | "preset">("direct");

  const titleRef = React.useRef<HTMLInputElement>(null);
  const statusRef = React.useRef<HTMLSelectElement>(null);
  const assigneeRef = React.useRef<HTMLSelectElement>(null);
  const dateRef = React.useRef<HTMLInputElement>(null);
  const timeRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setFormData({ 
        ...task, 
        showOnCalendar: task.showOnCalendar ?? (isSiljang ? false : true),
        attachments: task.attachments || []
      });
    } else {
      const today = format(new Date(), "yyyy-MM-dd");
      setFormData({
        title: "",
        status: "예정",
        assignee: profile?.nickname || assignees[0],
        dueDate: today,
        priority: (priorities[2] || "보통") as Priority,
        taskType: (displayTaskTypes[0] || "설치") as TaskType,
        visitTime: "",
        memo: "",
        showOnCalendar: isSiljang ? false : true,
        attachments: [],
      });
    }
  }, [task, isOpen, assignees, isSiljang, priorities, taskTypes, displayTaskTypes]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleCompleteTask = () => {
    if (!formData.title) {
      showToast("작업 이름을 입력해주세요.", "warning");
      titleRef.current?.focus();
      return;
    }
    
    // Toggle completion status if already completed
    const newStatus = formData.status === "완료" ? "예정" : "완료";
    const updatedForm = { ...formData, status: newStatus as Status };
    setFormData(updatedForm);
    onSave(updatedForm);
    onClose();
  };

  const handleSaveAndShare = () => {
    if (!formData.title) {
      showToast("작업 이름을 입력해주세요.", "warning");
      titleRef.current?.focus();
      return;
    }
    onSave(formData);
    
    // Format text for sharing
    const shareText = `${formData.title} ${formData.dueDate} ${formData.visitTime || ""}`.trim();
    
    // Prepare files for sharing if supported
    const filesToShare: File[] = [];
    if (formData.attachments && formData.attachments.length > 0) {
      formData.attachments.forEach((base64: string, index: number) => {
        try {
          const parts = base64.split(',');
          if (parts.length < 2) return;
          const byteString = atob(parts[1]);
          const mimeString = parts[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const extension = mimeString.split('/')[1] || 'png';
          filesToShare.push(new File([blob], `attachment_${index}.${extension}`, { type: mimeString }));
        } catch (e) {
          console.error("Failed to convert base64 to File", e);
        }
      });
    }

    // Try Web Share API first (works on mobile)
    if (navigator.share) {
      const shareData: ShareData = {
        text: shareText,
      };

      // Check if file sharing is supported
      if (filesToShare.length > 0 && navigator.canShare && navigator.canShare({ files: filesToShare })) {
        shareData.files = filesToShare;
      }

      navigator.share(shareData).catch((err) => {
        console.error("Share failed:", err);
        copyToClipboard(shareText);
      });
    } else {
      copyToClipboard(shareText);
    }
    
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), base64]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index)
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast("작업 내용이 복사되었습니다. 카카오톡에 붙여넣어 공유해 주세요!", "success");
    }).catch(err => {
      console.error("Clipboard failed:", err);
      showToast("복사에 실패했습니다.", "error");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
      <div className="bg-[#1e1e1e] rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl border-t sm:border border-white/10 overflow-hidden flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh]">
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 sm:hidden shrink-0" />
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            {task ? "작업 편집" : "새 작업"}
          </h2>
          <div className="flex gap-2">
            {task && onDelete && (
              <button
                onClick={() => {
                  onDelete(task.id);
                  onClose();
                }}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <form id="task-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Priority Row */}
            <div className="flex items-center justify-between group">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">우선순위</label>
                <div className="flex gap-2">
                  {priorities.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p as Priority })}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                        formData.priority === p
                          ? p === "긴급" ? "bg-red-500 text-white shadow-lg shadow-red-500/20" :
                            p === "높음" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" :
                            p === "보통" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                            "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                          : "bg-[#2d2d2d] text-gray-500 hover:bg-[#363636]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Task Name Row */}
            <div className="flex items-center justify-between group">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">작업 이름</label>
                <input
                  ref={titleRef}
                  type="text"
                  required
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="작업 내용을 입력하세요"
                  className="w-full bg-[#2d2d2d] border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-lg"
                />
              </div>
            </div>

            {/* Status Row */}
            <div className="flex items-center justify-between group">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">상태</label>
                <select
                  ref={statusRef}
                  value={formData.status || "예정"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                  className="w-full bg-[#2d2d2d] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none font-bold"
                >
                  <option value="예정">예정</option>
                  <option value="진행 중">진행 중</option>
                  <option value="완료">완료</option>
                  <option value="대기 중">대기 중</option>
                </select>
              </div>
            </div>

            {/* Task Type Row */}
            <div className="flex items-center justify-between group">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">작업 유형</label>
                <div className="flex flex-wrap gap-2">
                  {displayTaskTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, taskType: t as TaskType })}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        formData.taskType === t
                          ? "text-white shadow-lg"
                          : "bg-[#2d2d2d] text-gray-500 hover:bg-[#363636]"
                      }`}
                      style={formData.taskType === t ? { backgroundColor: taskTypeColors?.[t] || '#10b981', boxShadow: `0 10px 15px -3px ${taskTypeColors?.[t] || '#10b981'}33` } : undefined}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center justify-between group">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">담당자</label>
                  <select
                    ref={assigneeRef}
                    value={formData.assignee || assignees[0]}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full bg-[#2d2d2d] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none font-bold"
                  >
                    {assignees.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center justify-between group">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">마감일</label>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        {["오늘", "내일", "이번주"].map((label) => {
                          const d = new Date();
                          if (label === "내일") d.setDate(d.getDate() + 1);
                          if (label === "이번주") {
                            const diffToFriday = d.getDay() <= 5 ? 5 - d.getDay() : 5 - d.getDay() + 7;
                            d.setDate(d.getDate() + diffToFriday);
                          }
                          const dateStr = format(d, "yyyy-MM-dd");
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, dueDate: dateStr });
                                setDateMode("preset");
                              }}
                              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                                formData.dueDate === dateStr && dateMode === "preset"
                                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                  : "bg-[#2d2d2d] text-gray-500 hover:bg-[#363636]"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setDateMode("direct")}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                            dateMode === "direct"
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                              : "bg-[#2d2d2d] text-gray-500 hover:bg-[#363636]"
                          }`}
                        >
                          직접 선택
                        </button>
                      </div>

                      {dateMode === "direct" && (
                        <ScrollDatePicker 
                          value={formData.dueDate || format(new Date(), "yyyy-MM-dd")} 
                          onChange={(val) => setFormData({ ...formData, dueDate: val })} 
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between group">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">방문 예정 시간</label>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        {["오전", "오후"].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, visitTime: mode });
                              setTimeMode("preset");
                            }}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                              formData.visitTime === mode
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                : "bg-[#2d2d2d] text-gray-500 hover:bg-[#363636]"
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.visitTime === "오전" || formData.visitTime === "오후" || !formData.visitTime) {
                              const now = new Date();
                              const isPM = now.getHours() >= 12;
                              const displayH = now.getHours() % 12 === 0 ? 12 : now.getHours() % 12;
                              const ampmStr = isPM ? "오후" : "오전";
                              const formattedH = displayH.toString().padStart(2, '0');
                              const formattedM = now.getMinutes().toString().padStart(2, '0');
                              setFormData({ ...formData, visitTime: `${ampmStr} ${formattedH}:${formattedM}` });
                            }
                            setTimeMode("direct");
                          }}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                            timeMode === "direct"
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                              : "bg-[#2d2d2d] text-gray-500 hover:bg-[#363636]"
                          }`}
                        >
                          직접 입력
                        </button>
                      </div>
                      
                      {timeMode === "direct" && (
                        <ScrollTimePicker 
                          value={formData.visitTime || ""} 
                          onChange={(val) => setFormData({ ...formData, visitTime: val })} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Memo Row */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">메모</label>
              <textarea
                value={formData.memo || ""}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="메모를 입력하세요 (선택사항)"
                className="w-full bg-[#2d2d2d] text-white rounded-2xl p-4 border border-white/5 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all resize-none h-24 text-sm"
              />
            </div>

            {/* Attachments Row */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">사진 및 파일 첨부</label>
              <div className="flex flex-wrap gap-3">
                {formData.attachments?.map((base64, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
                    <img src={base64} className="w-full h-full object-cover" alt="Attachment" />
                    <button 
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 text-gray-500 hover:border-emerald-500/50 hover:text-emerald-500 transition-all cursor-pointer bg-white/5">
                  <Paperclip className="w-5 h-5" />
                  <span className="text-[10px] font-bold">추가</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,application/pdf" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>

            {/* Show on Calendar Toggle (Only for 실장/Admin) */}
            {isAdmin && (
              <div className="flex items-center justify-between p-5 bg-[#2d2d2d] rounded-2xl border border-white/5">
                <div>
                  <label className="block text-sm font-bold text-white mb-1">달력에 등록</label>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, showOnCalendar: !formData.showOnCalendar })}
                  className={`w-12 h-7 rounded-full relative transition-colors ${formData.showOnCalendar ? "bg-emerald-500" : "bg-gray-600"}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.showOnCalendar ? "right-1" : "left-1"}`} />
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 bg-[#1a1a1a] border-t border-white/10 flex gap-2">
          <button
            type="button"
            onClick={handleCompleteTask}
            className={`flex-1 ${formData.status === "완료" ? "bg-gray-600 hover:bg-gray-500 shadow-gray-500/20" : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"} text-white font-bold py-4 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 shadow-xl active:scale-95 transition-all text-[10px] sm:text-xs tracking-tighter`}
          >
            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span>{formData.status === "완료" ? "완료 취소" : "작업완료하기"}</span>
          </button>
          <button
            type="submit"
            form="task-form"
            className="flex-1 bg-[#2d2d2d] hover:bg-[#363636] text-white font-bold py-4 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 active:scale-95 transition-all border border-white/5 text-[10px] sm:text-xs tracking-tighter"
          >
            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>작업 저장하기</span>
          </button>
          <button
            type="button"
            onClick={handleSaveAndShare}
            className="flex-1 bg-[#2d2d2d] hover:bg-[#363636] text-white font-bold py-4 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 active:scale-95 transition-all border border-white/5 text-[10px] sm:text-xs tracking-tighter"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span>저장 및 공유하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
