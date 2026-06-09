import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, runTransaction } from "firebase/firestore";
import { Consultation, PaperRequest, Task, Priority, TaskType } from "../types";
import { buildConsultationTask, buildPaperRequestTask } from "../utils/requestTasks";
import { 
  Phone, User, Landmark, HelpCircle, Check, Trash2, 
  Sparkles, ClipboardList, Send, Calendar, CheckSquare, Plus, ArrowRight, CornerDownRight, Tag, AlertTriangle
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";

interface BackConsultationsProps {
  assignees: string[];
  currentUserId: string;
}

export function BackConsultations({ assignees, currentUserId }: BackConsultationsProps) {
  const [activeTab, setActiveTab] = useState<"consult" | "paper">("consult");
  const [consults, setConsults] = useState<Consultation[]>([]);
  const [papers, setPapers] = useState<PaperRequest[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "complete">("pending");

  const { showToast } = useToast();

  // Task integration form states
  const [taskFormOpenForId, setTaskFormOpenForId] = useState<string | null>(null);
  const [taskAssignee, setTaskAssignee] = useState<string>(assignees[0] || "나");
  const [taskPriority, setTaskPriority] = useState<Priority>("보통");
  const [taskType, setTaskType] = useState<TaskType>("설치");
  const [taskDueDate, setTaskDueDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [taskMemo, setTaskMemo] = useState<string>("");
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ type: "consult" | "paper"; id: string } | null>(null);

  useEffect(() => {
    // Subscribe to Consultations
    const unsubConsults = onSnapshot(collection(db, "consultations"), (snap) => {
      const items: Consultation[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as Consultation));
      // Sort by newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setConsults(items);
    }, (err) => console.error(err));

    // Subscribe to Paper Requests
    const unsubPapers = onSnapshot(collection(db, "paper_requests"), (snap) => {
      const items: PaperRequest[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as PaperRequest));
      // Sort by newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPapers(items);
    }, (err) => console.error(err));

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
  const handleToggleConsultStatus = async (id: string, current: "대기" | "완료") => {
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

  const handleTogglePaperStatus = async (id: string, current: "대기" | "완료") => {
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

    setProcessingRequestId(c.id);
    try {
      const now = new Date().toISOString();
      const taskRef = doc(collection(db, "tasks"));
      const requestRef = doc(db, "consultations", c.id);
      const taskData = buildConsultationTask(c, {
        assignee: taskAssignee,
        dueDate: taskDueDate,
        priority: taskPriority,
        taskType,
        memo: taskMemo,
        authorId: currentUserId,
        now,
      });

      await runTransaction(db, async (transaction) => {
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists()) {
          throw new Error("request-not-found");
        }

        const latestRequest = requestSnap.data() as Consultation;
        if (latestRequest.linkedTaskId) {
          throw new Error("already-linked");
        }

        transaction.set(taskRef, taskData);
        transaction.update(requestRef, {
          status: "완료",
          linkedTaskId: taskRef.id,
          taskLinkedAt: now,
          taskLinkedBy: currentUserId,
        });
      });
      
      setTaskFormOpenForId(null);
      setTaskMemo("");
      showToast(`'${taskAssignee}'님에게 '${taskData.title}' 작업이 등록되었습니다.`, "success");
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error && err.message === "already-linked" ? "이미 작업관리 일감으로 등록된 신청입니다." : "일정 전산 등록 전송 오류", "error");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const convertPaperToTask = async (p: PaperRequest) => {
    if (p.linkedTaskId) {
      showToast("이미 작업관리 배송업무로 등록된 용지 요청입니다.", "error");
      return;
    }

    setProcessingRequestId(p.id);
    try {
      const now = new Date().toISOString();
      const taskRef = doc(collection(db, "tasks"));
      const requestRef = doc(db, "paper_requests", p.id);
      const taskData = buildPaperRequestTask(p, {
        assignee: taskAssignee,
        dueDate: taskDueDate,
        priority: taskPriority,
        memo: taskMemo,
        authorId: currentUserId,
        now,
      });

      await runTransaction(db, async (transaction) => {
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists()) {
          throw new Error("request-not-found");
        }

        const latestRequest = requestSnap.data() as PaperRequest;
        if (latestRequest.linkedTaskId) {
          throw new Error("already-linked");
        }

        transaction.set(taskRef, taskData);
        transaction.update(requestRef, {
          status: "완료",
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
      showToast(err instanceof Error && err.message === "already-linked" ? "이미 작업관리 배송업무로 등록된 요청입니다." : "배송 등록 전송 오류", "error");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const filteredConsults = consults.filter(c => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return c.status === "대기";
    return c.status === "완료";
  });

  const filteredPapers = papers.filter(p => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return p.status === "대기";
    return p.status === "완료";
  });

  const pendingConsultCount = consults.filter(c => c.status === "대기").length;
  const pendingPaperCount = papers.filter(p => p.status === "대기").length;

  return (
    <div className="bg-[#121212] min-h-screen text-slate-100 p-4 md:p-6 pb-24">
      {/* 1. Header Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div 
          onClick={() => setActiveTab("consult")}
          className={`cursor-pointer rounded-2xl p-5 border transition-all flex items-center justify-between shadow-lg ${
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
        </div>

        <div 
          onClick={() => setActiveTab("paper")}
          className={`cursor-pointer rounded-2xl p-5 border transition-all flex items-center justify-between shadow-lg ${
            activeTab === "paper" 
              ? "bg-[#1f2937]/50 border-blue-500/50 shadow-blue-950/20" 
              : "bg-[#181818] border-white/5 opacity-70 hover:opacity-100"
          }`}
        >
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              무상 영수증 용지 신청
            </div>
            <h2 className="text-2xl font-black text-white">{papers.length}건 <span className="text-xs text-slate-400 font-normal">(누적)</span></h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="bg-blue-500/10 text-blue-400 text-xs font-black px-3 py-1 rounded-full border border-blue-500/20">
              출고승인 대기 {pendingPaperCount}건
            </span>
            <span className="text-[10px] text-slate-500 font-bold">가맹점 특별 무료 보급</span>
          </div>
        </div>
      </div>

      {/* 2. Control Filtering Bar */}
      <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-xs font-black text-slate-400 mr-2 uppercase tracking-wide">단계 필터:</span>
          <button 
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
            onClick={() => setStatusFilter("all")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
              statusFilter === "all"
                ? "bg-slate-750 text-white border-white/10"
                : "bg-white/5 text-slate-400 border-transparent hover:text-white"
            }`}
          >
            전체 전체 ({activeTab === "consult" ? consults.length : papers.length})
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
              해당하는 가맹 상담 요청 내역이 없습니다.
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
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {c.status === "완료" ? "처리완료" : "상담대기"}
                      </span>
                      <h4 className="text-base font-extrabold text-white">{c.businessName || "상호 미등록"}</h4>
                      <span className="text-xs text-slate-400 font-bold border-l border-white/10 pl-2 leading-none">
                        분류: {c.businessType || "미지정"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 self-end md:self-auto uppercase tracking-wider font-bold">
                      <span className="text-[10px] text-slate-450 font-mono mr-2">{new Date(c.createdAt).toLocaleString()}</span>
                      
                      <button
                        onClick={() => handleToggleConsultStatus(c.id, c.status)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-md transition border ${
                          c.status === "완료" 
                            ? "bg-slate-800 border-white/10 text-slate-400 hover:text-white" 
                            : "bg-emerald-500 text-slate-950 border-emerald-500 hover:scale-103"
                        }`}
                      >
                        {c.status === "완료" ? "대기로 변경" : "완료 처리"}
                      </button>

                      {c.linkedTaskId ? (
                        <span
                          className="bg-blue-500/10 text-blue-300 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-500/20"
                          title={`작업 ID: ${c.linkedTaskId}`}
                        >
                          작업등록 완료
                        </span>
                      ) : c.status === "대기" && (
                        <button
                          onClick={() => setTaskFormOpenForId(isOpen ? null : c.id)}
                          disabled={processingRequestId === c.id}
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
                        <div className="text-slate-200 font-semibold text-xs leading-relaxed whitespace-pre-wrap">
                          {c.message ? c.message : <span className="text-slate-500 italic">"상세 상담 문의 메시지가 없습니다."</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Automatic internal task form */}
                  {isOpen && (
                    <div className="mt-4 border-t border-dashed border-white/10 pt-4 animate-fade-in">
                      <div className="bg-[#161a22] border border-blue-500/20 rounded-2xl p-4 text-xs">
                        <h5 className="font-extrabold text-[#3b82f6] text-sm mb-3 flex items-center gap-1.5">
                          <CornerDownRight className="w-4 h-4" /> 탑정보통신 사내 전산 업무망으로 다이렉트 등록
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold block">담당 팀원 위임</label>
                            <select
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
                            <label className="text-[10px] text-slate-400 font-bold block">작업 성격 (카테고리)</label>
                            <select
                              value={taskType}
                              onChange={(e) => setTaskType(e.target.value as TaskType)}
                              className="w-full bg-[#202020] border border-white/10 rounded-lg p-2 font-bold text-white focus:outline-none"
                            >
                              <option value="설치">단말기/포스 설치대여</option>
                              <option value="점검">현장 정산 시스템 점검</option>
                              <option value="수리">AS 긴급 무상수리</option>
                              <option value="휴대용단말기">무선 카드단말기 보급</option>
                              <option value="기타">기타 지원업무</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold block">우선 처리순위</label>
                            <select
                              value={taskPriority}
                              onChange={(e) => setTaskPriority(e.target.value as Priority)}
                              className="w-full bg-[#202020] border border-white/10 rounded-lg p-2 font-bold text-white focus:outline-none"
                            >
                              <option value="긴급">🚨 긴급 (실시간 피드백)</option>
                              <option value="높음">높음</option>
                              <option value="보통">보통 (24시간 내)</option>
                              <option value="낮음">낮음 (일반 스케줄)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold block">처리기한 선택 (DueDate)</label>
                            <input
                              type="date"
                              value={taskDueDate}
                              onChange={(e) => setTaskDueDate(e.target.value)}
                              className="w-full bg-[#202020] border border-white/10 rounded-lg p-1.5 text-white font-bold text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 mb-3">
                          <label className="text-[10px] text-slate-400 font-bold block">담당 엔지니어 전산 전달 메모(비공개)</label>
                          <input
                            type="text"
                            placeholder="예시: 현장에서 사은품 영수증 롤 1박스 무상 기프트 전달 요망."
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
              보급 영수증 용지 배송 신청 내역이 존재하지 않습니다.
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
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {p.status === "완료" ? "출고완료" : "출고대기"}
                      </span>
                      <h4 className="text-base font-extrabold text-white">{p.customerName}</h4>
                      <span className="text-xs text-blue-400 font-mono font-extrabold bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40 leading-none">
                        요청: {p.quantity}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 self-end md:self-auto uppercase tracking-wider font-bold">
                      <span className="text-[10px] text-slate-405 font-mono mr-2">{new Date(p.createdAt).toLocaleString()}</span>
                      
                      <button
                        onClick={() => handleTogglePaperStatus(p.id, p.status)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-md transition border ${
                          p.status === "완료" 
                            ? "bg-slate-800 border-white/10 text-slate-400 hover:text-white" 
                            : "bg-blue-600 text-white border-blue-550 hover:scale-103"
                        }`}
                      >
                        {p.status === "완료" ? "대기로 변경" : "택배 출고등록"}
                      </button>

                      {p.linkedTaskId ? (
                        <span
                          className="bg-emerald-500/10 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-500/20"
                          title={`작업 ID: ${p.linkedTaskId}`}
                        >
                          배송업무 등록완료
                        </span>
                      ) : p.status === "대기" && (
                        <button
                          onClick={() => {
                            setTaskFormOpenForId(isOpen ? null : p.id);
                            // Pre-set some paper delivery values
                            setTaskType("용지");
                            setTaskPriority("보통");
                          }}
                          disabled={processingRequestId === p.id}
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
                    <div className="mt-4 border-t border-dashed border-white/10 pt-4 animate-fade-in">
                      <div className="bg-[#11171a] border border-[#10b981]/25 rounded-2xl p-4 text-xs">
                        <h5 className="font-extrabold text-[#10b981] text-sm mb-3 flex items-center gap-1.5">
                          <CornerDownRight className="w-4 h-4" /> 감열 용지 택배 배송 스케줄 및 위임자 지정
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold block">출고 및 택배배송 주무 위임</label>
                            <select
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
                            <label className="text-[10px] text-slate-400 font-bold block">우선 기동 순위</label>
                            <select
                              value={taskPriority}
                              onChange={(e) => setTaskPriority(e.target.value as Priority)}
                              className="w-full bg-[#1b2225] border border-white/10 rounded-lg p-2 font-bold text-white focus:outline-none"
                            >
                              <option value="긴급">🚨 당일 특송발송</option>
                              <option value="높음">높음</option>
                              <option value="보통">보통 (일반 로젠택배)</option>
                              <option value="낮음">낮음 (정기 발송 합배송)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold block">배송 출고 예정일 (DueDate)</label>
                            <input
                              type="date"
                              value={taskDueDate}
                              onChange={(e) => setTaskDueDate(e.target.value)}
                              className="w-full bg-[#1b2225] border border-white/10 rounded-lg p-1.5 text-white font-bold text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 mb-3">
                          <label className="text-[10px] text-slate-400 font-bold block">배송 비고 및 기사님 위임 특이사항 기록</label>
                          <input
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
