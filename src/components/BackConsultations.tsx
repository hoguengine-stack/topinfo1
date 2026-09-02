import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, runTransaction } from "firebase/firestore";
import { Consultation, PaperRequest, Priority, TaskType } from "../types";
import { buildConsultationTask, buildPaperRequestTask, getRequestTaskValidationError } from "../utils/requestTasks";
import { 
  Phone, User, Landmark, HelpCircle, Check, Trash2, 
  Sparkles, ClipboardList, Send, Calendar, CheckSquare, Plus, ArrowRight, CornerDownRight, Tag, AlertTriangle
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";

interface BackConsultationsProps {
  assignees: string[];
  assigneeIds: Record<string, string>;
  currentUserId: string;
}

function getLocalDateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTaskLinkErrorMessage(error: unknown, duplicateMessage: string, fallbackMessage: string) {
  if (!(error instanceof Error)) return fallbackMessage;
  if (error.message === "already-linked") return duplicateMessage;
  if (error.message === "request-not-found") return "원본 요청이 삭제되어 작업으로 등록할 수 없습니다.";
  return fallbackMessage;
}

export function BackConsultations({ assignees, assigneeIds, currentUserId }: BackConsultationsProps) {
  const [activeTab, setActiveTab] = useState<"consult" | "paper">("consult");
  const [consults, setConsults] = useState<Consultation[]>([]);
  const [papers, setPapers] = useState<PaperRequest[]>([]);
  const [consultLoadError, setConsultLoadError] = useState("");
  const [paperLoadError, setPaperLoadError] = useState("");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "complete">("pending");

  const { showToast } = useToast();

  // Task integration form states
  const [taskFormOpenForId, setTaskFormOpenForId] = useState<string | null>(null);
  const [taskAssignee, setTaskAssignee] = useState<string>(assignees[0] || "");
  const [taskPriority, setTaskPriority] = useState<Priority>("보통");
  const [taskType, setTaskType] = useState<TaskType>("설치");
  const [taskDueDate, setTaskDueDate] = useState<string>(() => getLocalDateAfter(1));
  const [taskMemo, setTaskMemo] = useState<string>("");
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ type: "consult" | "paper"; id: string } | null>(null);
  const processingRequestIdsRef = useRef(new Set<string>());

  useEffect(() => {
    // Subscribe to Consultations
    const unsubConsults = onSnapshot(collection(db, "consultations"), (snap) => {
      const items: Consultation[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as Consultation));
      // Sort by newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setConsults(items);
      setConsultLoadError("");
    }, (err) => {
      console.error("Consultations listener failed:", err);
      setConsultLoadError("상담 신청 내역을 불러오지 못했습니다.");
    });

    // Subscribe to Paper Requests
    const unsubPapers = onSnapshot(collection(db, "paper_requests"), (snap) => {
      const items: PaperRequest[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as PaperRequest));
      // Sort by newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPapers(items);
      setPaperLoadError("");
    }, (err) => {
      console.error("Paper requests listener failed:", err);
      setPaperLoadError("용지 배송요청 내역을 불러오지 못했습니다.");
    });

    return () => {
      unsubConsults();
      unsubPapers();
    };
  }, []);

  useEffect(() => {
    if (assignees.length > 0 && !assignees.includes(taskAssignee)) {
      setTaskAssignee(assignees[0]);
    }
  }, [assignees, taskAssignee]);

  // Actions
  const handleToggleConsultStatus = async (id: string, current: Consultation["status"]) => {
    try {
      await updateDoc(doc(db, "consultations", id), {
        status: current === "완료" ? "대기" : "완료"
      });
      showToast(current === "완료" ? "대기 상태로 변경되었습니다." : "상담 완료 처리되었습니다.", "success");
    } catch (err) {
      console.error(err);
      showToast("상태 수정 실패", "error");
    }
  };

  const handleTogglePaperStatus = async (id: string, current: PaperRequest["status"]) => {
    try {
      await updateDoc(doc(db, "paper_requests", id), {
        status: current === "완료" ? "대기" : "완료"
      });
      showToast(current === "완료" ? "대기 상태로 변경되었습니다." : "용지 신청 처리완료되었습니다.", "success");
    } catch (err) {
      console.error(err);
      showToast("상태 수정 실패", "error");
    }
  };

  const handleDeleteConsult = async (id: string) => {
    const consultation = consults.find((item) => item.id === id);
    if (consultation?.linkedTaskId) {
      showToast("작업관리와 연결된 상담 원본은 삭제할 수 없습니다.", "error");
      return;
    }
    if (processingRequestIdsRef.current.has(id)) return;

    if (deleteConfirmTarget?.type !== "consult" || deleteConfirmTarget.id !== id) {
      setDeleteConfirmTarget({ type: "consult", id });
      return;
    }

    try {
      await deleteDoc(doc(db, "consultations", id));
      setDeleteConfirmTarget(null);
      showToast("상담 신청 내역이 삭제되었습니다.", "success");
    } catch (err) {
      console.error(err);
      showToast("삭제 실패", "error");
    }
  };

  const handleDeletePaper = async (id: string) => {
    const paperRequest = papers.find((item) => item.id === id);
    if (paperRequest?.linkedTaskId) {
      showToast("작업관리와 연결된 배송 요청 원본은 삭제할 수 없습니다.", "error");
      return;
    }
    if (processingRequestIdsRef.current.has(id)) return;

    if (deleteConfirmTarget?.type !== "paper" || deleteConfirmTarget.id !== id) {
      setDeleteConfirmTarget({ type: "paper", id });
      return;
    }

    try {
      await deleteDoc(doc(db, "paper_requests", id));
      setDeleteConfirmTarget(null);
      showToast("용지 신청 내역이 삭제되었습니다.", "success");
    } catch (err) {
      console.error(err);
      showToast("삭제 실패", "error");
    }
  };

  // Convert to internal task
  const convertConsultToTask = async (c: Consultation) => {
    if (c.linkedTaskId) {
      showToast("이미 작업관리 일감으로 등록된 상담 신청입니다.", "error");
      return;
    }
    const taskOptions = {
      assignee: taskAssignee,
      assigneeId: assigneeIds[taskAssignee],
      dueDate: taskDueDate,
      priority: taskPriority,
      taskType,
      memo: taskMemo,
      authorId: currentUserId,
      now: new Date().toISOString(),
    };
    const validationError = getRequestTaskValidationError(taskOptions);
    if (validationError) {
      showToast(validationError, "error");
      return;
    }
    if (processingRequestIdsRef.current.size > 0) {
      showToast("다른 요청을 작업관리로 등록 중입니다.", "error");
      return;
    }

    processingRequestIdsRef.current.add(c.id);
    setProcessingRequestId(c.id);
    try {
      const now = taskOptions.now;
      const taskRef = doc(collection(db, "tasks"));
      const requestRef = doc(db, "consultations", c.id);
      let taskTitle = "상담 작업";

      await runTransaction(db, async (transaction) => {
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists()) {
          throw new Error("request-not-found");
        }

        const latestRequest = { id: c.id, ...requestSnap.data() } as Consultation;
        if (latestRequest.linkedTaskId) {
          throw new Error("already-linked");
        }

        const taskData = buildConsultationTask(latestRequest, taskOptions);
        taskTitle = taskData.title;
        transaction.set(taskRef, taskData);
        transaction.update(requestRef, {
          status: "작업등록",
          linkedTaskId: taskRef.id,
          taskLinkedAt: now,
          taskLinkedBy: currentUserId,
        });
      });
      
      setTaskFormOpenForId(null);
      setTaskMemo("");
      showToast(`'${taskAssignee}'님에게 '${taskTitle}' 작업이 등록되었습니다.`, "success");
    } catch (err) {
      console.error(err);
      showToast(getTaskLinkErrorMessage(err, "이미 작업관리 일감으로 등록된 신청입니다.", "일정 전산 등록 전송 오류"), "error");
    } finally {
      processingRequestIdsRef.current.delete(c.id);
      setProcessingRequestId(null);
    }
  };

  const convertPaperToTask = async (p: PaperRequest) => {
    if (p.linkedTaskId) {
      showToast("이미 작업관리 배송업무로 등록된 용지 요청입니다.", "error");
      return;
    }
    const taskOptions = {
      assignee: taskAssignee,
      assigneeId: assigneeIds[taskAssignee],
      dueDate: taskDueDate,
      priority: taskPriority,
      memo: taskMemo,
      authorId: currentUserId,
      now: new Date().toISOString(),
    };
    const validationError = getRequestTaskValidationError(taskOptions);
    if (validationError) {
      showToast(validationError, "error");
      return;
    }
    if (processingRequestIdsRef.current.size > 0) {
      showToast("다른 요청을 작업관리로 등록 중입니다.", "error");
      return;
    }

    processingRequestIdsRef.current.add(p.id);
    setProcessingRequestId(p.id);
    try {
      const now = taskOptions.now;
      const taskRef = doc(collection(db, "tasks"));
      const requestRef = doc(db, "paper_requests", p.id);

      await runTransaction(db, async (transaction) => {
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists()) {
          throw new Error("request-not-found");
        }

        const latestRequest = { id: p.id, ...requestSnap.data() } as PaperRequest;
        if (latestRequest.linkedTaskId) {
          throw new Error("already-linked");
        }

        const taskData = buildPaperRequestTask(latestRequest, taskOptions);
        transaction.set(taskRef, taskData);
        transaction.update(requestRef, {
          status: "작업등록",
          linkedTaskId: taskRef.id,
          taskLinkedAt: now,
          taskLinkedBy: currentUserId,
        });
      });

      setTaskFormOpenForId(null);
      setTaskMemo("");
      showToast(`'${taskAssignee}'님에게 용지 출고 배송 태스크가 등록되었습니다.`, "success");
    } catch (err) {
      console.error(err);
      showToast(getTaskLinkErrorMessage(err, "이미 작업관리 배송업무로 등록된 요청입니다.", "배송 등록 전송 오류"), "error");
    } finally {
      processingRequestIdsRef.current.delete(p.id);
      setProcessingRequestId(null);
    }
  };

  const filteredConsults = consults.filter(c => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return c.status !== "완료";
    return c.status === "완료";
  });

  const filteredPapers = papers.filter(p => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return p.status !== "완료";
    return p.status === "완료";
  });

  const pendingConsultCount = consults.filter(c => c.status !== "완료").length;
  const pendingPaperCount = papers.filter(p => p.status !== "완료").length;

  return (
    <div className="bg-[#121212] min-h-screen text-slate-100 p-4 md:p-6 pb-24">
      {(activeTab === "consult" ? consultLoadError : paperLoadError) ? (
        <div role="alert" className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {activeTab === "consult" ? consultLoadError : paperLoadError} Firebase 연결과 로그인 권한을 확인해 주세요.
        </div>
      ) : null}
      {/* 1. Header Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          aria-pressed={activeTab === "consult"}
          onClick={() => {
            setActiveTab("consult");
            setTaskFormOpenForId(null);
            setDeleteConfirmTarget(null);
          }}
          className={`w-full text-left cursor-pointer rounded-2xl p-5 border transition-all flex items-center justify-between shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
            activeTab === "consult" 
              ? "bg-[#1f2937]/50 border-emerald-500/50 shadow-emerald-950/20" 
              : "bg-[#181818] border-white/5 opacity-70 hover:opacity-100"
          }`}
        >
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              실시간 가맹 상담 접수
            </div>
            <h2 className="text-2xl font-black text-white">{consults.length}건 <span className="text-xs text-slate-400 font-normal">(누적)</span></h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/20">
              미처리 {pendingConsultCount}건 대기
            </span>
            <span className="text-[10px] text-slate-500 font-bold">포스 / 단말기 / 키오스크</span>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === "paper"}
          onClick={() => {
            setActiveTab("paper");
            setTaskFormOpenForId(null);
            setDeleteConfirmTarget(null);
          }}
          className={`w-full text-left cursor-pointer rounded-2xl p-5 border transition-all flex items-center justify-between shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
            activeTab === "paper" 
              ? "bg-[#1f2937]/50 border-blue-500/50 shadow-blue-950/20" 
              : "bg-[#181818] border-white/5 opacity-70 hover:opacity-100"
          }`}
        >
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              영수증 용지 신청
            </div>
            <h2 className="text-2xl font-black text-white">{papers.length}건 <span className="text-xs text-slate-400 font-normal">(누적)</span></h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="bg-blue-500/10 text-blue-400 text-xs font-black px-3 py-1 rounded-full border border-blue-500/20">
              출고승인 대기 {pendingPaperCount}건
            </span>
            <span className="text-[10px] text-slate-500 font-bold">거래 가맹점 배송 접수</span>
          </div>
        </button>
      </div>

      {/* 2. Control Filtering Bar */}
      <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-xs font-black text-slate-400 mr-2 uppercase tracking-wide">단계 필터:</span>
          <button 
            type="button"
            aria-pressed={statusFilter === "pending"}
            onClick={() => setStatusFilter("pending")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
              statusFilter === "pending"
                ? "bg-emerald-500 text-slate-950 border-emerald-500"
                : "bg-white/5 text-slate-400 border-transparent hover:text-white"
            }`}
          >
            대기 / 미처리 목록 ({activeTab === "consult" ? pendingConsultCount : pendingPaperCount})
          </button>
          <button 
            type="button"
            aria-pressed={statusFilter === "complete"}
            onClick={() => setStatusFilter("complete")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
              statusFilter === "complete"
                ? "bg-slate-750 text-white border-white/10"
                : "bg-white/5 text-slate-400 border-transparent hover:text-white"
            }`}
          >
            처리완료 목록
          </button>
          <button 
            type="button"
            aria-pressed={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
              statusFilter === "all"
                ? "bg-slate-750 text-white border-white/10"
                : "bg-white/5 text-slate-400 border-transparent hover:text-white"
            }`}
          >
            전체 ({activeTab === "consult" ? consults.length : papers.length})
          </button>
        </div>

        <div className="text-xs text-slate-450 font-semibold flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500/80 shrink-0" />
          가맹점주가 프론트에서 제출하면 실시간으로 여기에 연동되어 나타납니다.
        </div>
      </div>

      {/* 3. Detail Lists Section */}
      <div className="space-y-4">
        {activeTab === "consult" ? (
          filteredConsults.length === 0 ? (
            <div className="bg-[#181818] border border-dashed border-white/5 rounded-2xl py-12 text-center text-slate-450 text-sm">
              해당하는 매장 상담 요청 내역이 없습니다.
            </div>
          ) : (
            filteredConsults.map((c) => {
              const isOpen = taskFormOpenForId === c.id;
              const isDeleteArmed = deleteConfirmTarget?.type === "consult" && deleteConfirmTarget.id === c.id;
              return (
                <div key={c.id} className={`bg-[#181818] border rounded-2xl p-5 transition hover:border-white/10 ${c.status === "완료" ? "border-white/5 opacity-55" : "border-emerald-500/20"}`}>
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-white/5 pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        c.status === "완료"
                          ? "bg-white/5 text-slate-500"
                          : c.status === "작업등록"
                            ? "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {c.status === "완료" ? "처리완료" : c.status === "작업등록" ? "작업진행" : "상담대기"}
                      </span>
                      <h4 className="text-base font-extrabold text-white">{c.businessName || "상호 미등록"}</h4>
                      <span className="text-xs text-slate-400 font-bold border-l border-white/10 pl-2 leading-none">
                        분류: {c.businessType || "미지정"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 self-end md:self-auto uppercase tracking-wider font-bold">
                      <span className="text-[10px] text-slate-450 font-mono mr-2">{new Date(c.createdAt).toLocaleString()}</span>
                      
                      {!c.linkedTaskId && (
                        <button
                          type="button"
                          onClick={() => handleToggleConsultStatus(c.id, c.status)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-md transition border ${
                            c.status === "완료"
                              ? "bg-slate-800 border-white/10 text-slate-400 hover:text-white"
                              : "bg-emerald-500 text-slate-950 border-emerald-500 hover:scale-103"
                          }`}
                        >
                          {c.status === "완료" ? "대기로 변경" : "완료 처리"}
                        </button>
                      )}

                      {c.linkedTaskId ? (
                        <span
                          className="bg-blue-500/10 text-blue-300 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-500/20"
                          title={`작업 ID: ${c.linkedTaskId}`}
                        >
                          {c.status === "완료" ? "연결 작업 완료" : "작업 진행 중"}
                        </span>
                      ) : c.status === "대기" && (
                        <button
                          type="button"
                          onClick={() => {
                            setTaskFormOpenForId(isOpen ? null : c.id);
                            if (!isOpen) {
                              setTaskType("설치");
                              setTaskMemo("");
                            }
                          }}
                          disabled={processingRequestId === c.id}
                          aria-expanded={isOpen}
                          aria-controls={`consult-task-form-${c.id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-2.5 py-1 rounded-md transition flex items-center gap-1 border border-blue-500"
                        >
                          <CheckSquare className="w-3 h-3" />
                          {processingRequestId === c.id ? "등록 중" : isOpen ? "닫기" : "전산 일감 등록"}
                        </button>
                      )}

                      {isDeleteArmed && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmTarget(null)}
                          className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 rounded-md border border-white/10 hover:bg-white/5 transition"
                        >
                          취소
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteConsult(c.id)}
                        disabled={Boolean(c.linkedTaskId) || processingRequestId === c.id}
                        aria-label={isDeleteArmed ? "상담 요청 삭제 확정" : c.linkedTaskId ? "작업과 연결되어 삭제할 수 없음" : "상담 요청 삭제"}
                        className={`text-xs font-bold px-2.5 py-1 rounded-md transition border flex items-center gap-1 ${
                          isDeleteArmed
                            ? "bg-red-600 text-white border-red-500 hover:bg-red-700"
                            : "text-slate-400 border-transparent hover:text-red-400 hover:bg-white/5"
                        }`}
                        title={isDeleteArmed ? "한 번 더 눌러 삭제 확정" : "내역 파기"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isDeleteArmed && "삭제 확정"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-medium text-slate-300">
                    <div className="md:col-span-4 space-y-2">
                      <div className="bg-[#1f1f1f] p-3 rounded-xl border border-white/5 space-y-1">
                        <div className="text-[10px] text-slate-450 font-bold">담당 가맹 점주명</div>
                        <div className="text-white font-extrabold flex items-center gap-1.5 text-sm">
                          <User className="w-3.5 h-3.5 text-emerald-500" /> {c.customerName || "미입력"}
                        </div>
                      </div>
                      <div className="bg-[#1f1f1f] p-3 rounded-xl border border-white/5 space-y-1">
                        <div className="text-[10px] text-slate-450 font-bold">점주 연락처</div>
                        <div className="text-white font-mono font-extrabold flex items-center gap-1.5 text-sm select-all" title="클릭하여 복사">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" /> {c.contact}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-8 flex flex-col justify-between">
                      <div className="bg-[#1f1f1f] p-3 rounded-xl border border-white/5 space-y-1.5 flex-1 min-h-[72px]">
                        <div className="text-[10px] text-[#3b82f6] font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 animate-pulse" /> 희망 제품 및 솔루션: <span className="text-white uppercase font-extrabold bg-blue-600/20 px-1.5 py-0.5 rounded select-none">{c.productOfInterest}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-semibold">
                          {[c.projectType, c.installRegion, c.preferredTiming].filter(Boolean).join(" · ") || "준비 유형·설치 지역·희망 시기 미입력"}
                        </div>
                        <div className="text-slate-200 font-semibold text-xs leading-relaxed whitespace-pre-wrap">
                          {c.message ? c.message : <span className="text-slate-500 italic">"상세 상담 문의 메시지가 없습니다."</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Automatic internal task form */}
                  {isOpen && (
                    <div id={`consult-task-form-${c.id}`} className="mt-4 border-t border-dashed border-white/10 pt-4 animate-fade-in">
                      <div className="bg-[#161a22] border border-blue-500/20 rounded-2xl p-4 text-xs">
                        <h5 className="font-extrabold text-[#3b82f6] text-sm mb-3 flex items-center gap-1.5">
                          <CornerDownRight className="w-4 h-4" /> 탑정보통신 사내 전산 업무망으로 다이렉트 등록
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                          <div className="space-y-1">
                            <label htmlFor={`consult-task-assignee-${c.id}`} className="text-xs text-slate-400 font-bold block">담당 팀원 위임</label>
                            <select
                              id={`consult-task-assignee-${c.id}`}
                              value={taskAssignee}
                              onChange={(e) => setTaskAssignee(e.target.value)}
                              className="w-full bg-[#202020] border border-white/10 rounded-lg p-2 font-bold text-white focus:outline-none"
                            >
                              {assignees.map(a => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label htmlFor={`consult-task-type-${c.id}`} className="text-xs text-slate-400 font-bold block">작업 성격 (카테고리)</label>
                            <select
                              id={`consult-task-type-${c.id}`}
                              value={taskType}
                              onChange={(e) => setTaskType(e.target.value as TaskType)}
                              className="w-full bg-[#202020] border border-white/10 rounded-lg p-2 font-bold text-white focus:outline-none"
                            >
                              <option value="설치">단말기/포스 설치대여</option>
                              <option value="점검">현장 정산 시스템 점검</option>
                              <option value="수리">AS 긴급수리</option>
                              <option value="휴대용단말기">무선 카드단말기 보급</option>
                              <option value="기타">기타 지원업무</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label htmlFor={`consult-task-priority-${c.id}`} className="text-xs text-slate-400 font-bold block">우선 처리순위</label>
                            <select
                              id={`consult-task-priority-${c.id}`}
                              value={taskPriority}
                              onChange={(e) => setTaskPriority(e.target.value as Priority)}
                              className="w-full bg-[#202020] border border-white/10 rounded-lg p-2 font-bold text-white focus:outline-none"
                            >
                              <option value="긴급">긴급 (즉시 확인)</option>
                              <option value="높음">높음</option>
                              <option value="보통">보통 (일반 일정)</option>
                              <option value="낮음">낮음 (일반 스케줄)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label htmlFor={`consult-task-date-${c.id}`} className="text-xs text-slate-400 font-bold block">처리기한 선택</label>
                            <input
                              id={`consult-task-date-${c.id}`}
                              type="date"
                              value={taskDueDate}
                              onChange={(e) => setTaskDueDate(e.target.value)}
                              className="w-full bg-[#202020] border border-white/10 rounded-lg p-1.5 text-white font-bold text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 mb-3">
                          <label htmlFor={`consult-task-memo-${c.id}`} className="text-xs text-slate-400 font-bold block">담당 엔지니어 전산 전달 메모(비공개)</label>
                          <input
                            id={`consult-task-memo-${c.id}`}
                            type="text"
                            placeholder="예시: 현장에서 사용할 영수증 롤 1박스 규격 확인 필요."
                            value={taskMemo}
                            onChange={(e) => setTaskMemo(e.target.value)}
                            className="w-full bg-[#202020] border border-white/10 rounded-lg p-2 text-white text-xs focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setTaskFormOpenForId(null)}
                            className="bg-transparent border border-white/10 hover:bg-white/5 px-4 py-2 rounded-lg text-slate-400 font-semibold"
                          >
                            설정 취소
                          </button>
                          <button
                            type="button"
                            onClick={() => convertConsultToTask(c)}
                            disabled={processingRequestId === c.id}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1 hover:scale-[1.01]"
                          >
                            <Send className="w-3.5 h-3.5" /> {processingRequestId === c.id ? "등록 중..." : "현장 스케줄 일지로 전산 등록 확정"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          filteredPapers.length === 0 ? (
            <div className="bg-[#181818] border border-dashed border-white/5 rounded-2xl py-12 text-center text-slate-450 text-sm">
              영수증 용지 배송 요청 내역이 없습니다.
            </div>
          ) : (
            filteredPapers.map((p) => {
              const isOpen = taskFormOpenForId === p.id;
              const isDeleteArmed = deleteConfirmTarget?.type === "paper" && deleteConfirmTarget.id === p.id;
              return (
                <div key={p.id} className={`bg-[#181818] border rounded-2xl p-5 transition hover:border-white/10 ${p.status === "완료" ? "border-white/5 opacity-55" : "border-blue-500/20"}`}>
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-white/5 pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        p.status === "완료"
                          ? "bg-white/5 text-slate-500"
                          : p.status === "작업등록"
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {p.status === "완료" ? "출고완료" : p.status === "작업등록" ? "배송진행" : "출고대기"}
                      </span>
                      <h4 className="text-base font-extrabold text-white">{p.customerName}</h4>
                      <span className="text-xs text-blue-400 font-mono font-extrabold bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40 leading-none">
                        요청: {p.quantity}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 self-end md:self-auto uppercase tracking-wider font-bold">
                      <span className="text-[10px] text-slate-405 font-mono mr-2">{new Date(p.createdAt).toLocaleString()}</span>
                      
                      {!p.linkedTaskId && (
                        <button
                          type="button"
                          onClick={() => handleTogglePaperStatus(p.id, p.status)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-md transition border ${
                            p.status === "완료"
                              ? "bg-slate-800 border-white/10 text-slate-400 hover:text-white"
                              : "bg-blue-600 text-white border-blue-550 hover:scale-103"
                          }`}
                        >
                          {p.status === "완료" ? "대기로 변경" : "처리 완료"}
                        </button>
                      )}

                      {p.linkedTaskId ? (
                        <span
                          className="bg-emerald-500/10 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-500/20"
                          title={`작업 ID: ${p.linkedTaskId}`}
                        >
                          {p.status === "완료" ? "연결 작업 완료" : "배송 작업 진행 중"}
                        </span>
                      ) : p.status === "대기" && (
                        <button
                          type="button"
                          onClick={() => {
                            setTaskFormOpenForId(isOpen ? null : p.id);
                            if (!isOpen) {
                              setTaskType("용지");
                              setTaskPriority("보통");
                              setTaskMemo("");
                            }
                          }}
                          disabled={processingRequestId === p.id}
                          aria-expanded={isOpen}
                          aria-controls={`paper-task-form-${p.id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 text-xs font-black px-2.5 py-1 rounded-md transition flex items-center gap-1 border border-emerald-500"
                        >
                          <Plus className="w-3 h-3" />
                          {processingRequestId === p.id ? "등록 중" : isOpen ? "닫기" : "배송업무 위임"}
                        </button>
                      )}

                      {isDeleteArmed && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmTarget(null)}
                          className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 rounded-md border border-white/10 hover:bg-white/5 transition"
                        >
                          취소
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletePaper(p.id)}
                        disabled={Boolean(p.linkedTaskId) || processingRequestId === p.id}
                        aria-label={isDeleteArmed ? "배송 요청 삭제 확정" : p.linkedTaskId ? "작업과 연결되어 삭제할 수 없음" : "배송 요청 삭제"}
                        className={`text-xs font-bold px-2.5 py-1 rounded-md transition border flex items-center gap-1 ${
                          isDeleteArmed
                            ? "bg-red-600 text-white border-red-500 hover:bg-red-700"
                            : "text-slate-400 border-transparent hover:text-red-400 hover:bg-white/5"
                        }`}
                        title={isDeleteArmed ? "한 번 더 눌러 삭제 확정" : "내역 파기"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isDeleteArmed && "삭제 확정"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-medium text-slate-300">
                    <div className="md:col-span-4 space-y-2">
                      <div className="bg-[#1f1f1f] p-3 rounded-xl border border-white/5 space-y-1">
                        <div className="text-[10px] text-slate-450 font-bold">가맹점포 연락처</div>
                        <div className="text-white font-mono font-semibold flex items-center gap-1.5 text-sm select-all">
                          <Phone className="w-3.5 h-3.5 text-blue-500" /> {p.contact}
                        </div>
                      </div>
                      <div className="bg-[#1f1f1f] p-3 rounded-xl border border-white/5 space-y-1">
                        <div className="text-[10px] text-slate-455 font-bold">사용 중 단말기 모델명</div>
                        <div className="text-white font-mono font-semibold flex items-center gap-1.5 text-xs">
                          <Tag className="w-3.5 h-3.5 text-blue-500" /> {p.deviceModel || <span className="italic text-slate-500">기종 모름</span>}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-8 flex flex-col justify-between">
                      <div className="bg-[#1f1f1f] p-3 rounded-xl border border-white/5 space-y-1 flex-1 min-h-[72px]">
                        <div className="text-[10px] text-[#10b981] font-bold">영수증 수령 및 발송 주소지</div>
                        <div className="text-white font-bold text-xs select-all pb-1 leading-snug">
                          {p.address}
                        </div>
                        <div className="text-[10px] text-slate-450 italic">위 기재 주소를 택배 라벨 인쇄용으로 연계 복사하여 사용할 수 있습니다.</div>
                      </div>
                    </div>
                  </div>

                  {/* Automatic internal task form for Paper requests */}
                  {isOpen && (
                    <div id={`paper-task-form-${p.id}`} className="mt-4 border-t border-dashed border-white/10 pt-4 animate-fade-in">
                      <div className="bg-[#11171a] border border-[#10b981]/25 rounded-2xl p-4 text-xs">
                        <h5 className="font-extrabold text-[#10b981] text-sm mb-3 flex items-center gap-1.5">
                          <CornerDownRight className="w-4 h-4" /> 감열 용지 택배 배송 스케줄 및 위임자 지정
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div className="space-y-1">
                            <label htmlFor={`paper-task-assignee-${p.id}`} className="text-xs text-slate-400 font-bold block">출고 및 택배배송 주무 위임</label>
                            <select
                              id={`paper-task-assignee-${p.id}`}
                              value={taskAssignee}
                              onChange={(e) => setTaskAssignee(e.target.value)}
                              className="w-full bg-[#1b2225] border border-white/10 rounded-lg p-2 font-bold text-white focus:outline-none"
                            >
                              {assignees.map(a => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label htmlFor={`paper-task-priority-${p.id}`} className="text-xs text-slate-400 font-bold block">우선 처리순위</label>
                            <select
                              id={`paper-task-priority-${p.id}`}
                              value={taskPriority}
                              onChange={(e) => setTaskPriority(e.target.value as Priority)}
                              className="w-full bg-[#1b2225] border border-white/10 rounded-lg p-2 font-bold text-white focus:outline-none"
                            >
                              <option value="긴급">긴급 (당일 출고 확인)</option>
                              <option value="높음">높음</option>
                              <option value="보통">보통 (일반 로젠택배)</option>
                              <option value="낮음">낮음 (정기 발송 합배송)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label htmlFor={`paper-task-date-${p.id}`} className="text-xs text-slate-400 font-bold block">배송 출고 예정일</label>
                            <input
                              id={`paper-task-date-${p.id}`}
                              type="date"
                              value={taskDueDate}
                              onChange={(e) => setTaskDueDate(e.target.value)}
                              className="w-full bg-[#1b2225] border border-white/10 rounded-lg p-1.5 text-white font-bold text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 mb-3">
                          <label htmlFor={`paper-task-memo-${p.id}`} className="text-xs text-slate-400 font-bold block">배송 비고 및 담당자 전달사항</label>
                          <input
                            id={`paper-task-memo-${p.id}`}
                            type="text"
                            placeholder="예시: 감열 영수증용 3인치 일반 롤 용지 규격 발송."
                            value={taskMemo}
                            onChange={(e) => setTaskMemo(e.target.value)}
                            className="w-full bg-[#1b2225] border border-white/10 rounded-lg p-2 text-white text-xs focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setTaskFormOpenForId(null)}
                            className="bg-transparent border border-white/10 hover:bg-white/5 px-4 py-2 rounded-lg text-slate-450 font-semibold"
                          >
                            설정 취소
                          </button>
                          <button
                            type="button"
                            onClick={() => convertPaperToTask(p)}
                            disabled={processingRequestId === p.id}
                            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:text-slate-300 disabled:cursor-not-allowed text-slate-950 px-4 py-2 rounded-lg font-black flex items-center gap-1 hover:scale-[1.01]"
                          >
                            <Send className="w-3.5 h-3.5" /> {processingRequestId === p.id ? "등록 중..." : "용지 출고 배송업무로 일정 등록 확정"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
