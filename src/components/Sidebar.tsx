import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { X, LogOut, Settings, User, Camera, ChevronRight, Mail, Shield, Bell, Globe, Lock, Eye, ListFilter, Plus, Trash, RefreshCw, GripVertical } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { useToast } from "../contexts/ToastContext";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { DEFAULT_FOOTER_INFO, FooterInfo, mergeFooterInfo } from "../utils/footerSettings";
import { LegalDocumentModal, LegalDocumentType } from "./LegalDocumentModal";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const {
    user, profile, logout, updateProfilePicture, updateJobTitle, updateNickname,
    taskTypes, taskTypeColors, priorities, jobTitles, notificationSettings, updateTaskTypes, updateTaskTypeColors, updatePriorities, updateJobTitles, updateNotificationSettings, forceRefreshAllPCs,
    isAdmin
  } = useAuth();
  const { showToast } = useToast();
  const [activeSubModal, setActiveSubModal] = React.useState<string | null>(null);
  const [legalDocument, setLegalDocument] = React.useState<LegalDocumentType | null>(null);
  const [legalCompanyInfo, setLegalCompanyInfo] = React.useState<FooterInfo>(DEFAULT_FOOTER_INFO);
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };
  const [tempNickname, setTempNickname] = React.useState(profile?.nickname || "");

  const [editTaskTypes, setEditTaskTypes] = React.useState<{id: string, value: string, color: string}[]>([]);
  const [editPriorities, setEditPriorities] = React.useState<{id: string, value: string}[]>([]);
  const [editJobTitles, setEditJobTitles] = React.useState<{id: string, value: string}[]>([]);

  React.useEffect(() => {
    setEditTaskTypes(taskTypes.map(t => ({id: Math.random().toString(), value: t, color: taskTypeColors?.[t] || "#10b981"})));
    setEditPriorities(priorities.map(t => ({id: Math.random().toString(), value: t})));
    setEditJobTitles(jobTitles.map(t => ({id: Math.random().toString(), value: t})));
  }, [taskTypes, priorities, jobTitles]);

  React.useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted" && !notificationSettings.pushEnabled) {
      // Keep state in sync if permission is granted but settings say off?
      // Actually we just read from notificationSettings.pushEnabled
    }
  }, []);

  if (!user || !profile) return null;

  const openLegalDocument = async (type: LegalDocumentType) => {
    try {
      const footerSnapshot = await getDoc(doc(db, "settings", "footer"));
      if (footerSnapshot.exists()) {
        setLegalCompanyInfo(mergeFooterInfo(footerSnapshot.data()));
      }
    } catch (error) {
      console.warn("Legal document company info load failed:", error);
    }
    setLegalDocument(type);
  };

  const handleSave = async () => {
    if (activeSubModal === "profile") {
      updateNickname(tempNickname);
    } else if (activeSubModal === "categories") {
      updateTaskTypes(editTaskTypes.map(t => t.value));
      const newColors: Record<string, string> = {};
      editTaskTypes.forEach(t => {
        if (t.value.trim()) newColors[t.value] = t.color;
      });
      updateTaskTypeColors(newColors);
      updatePriorities(editPriorities.map(t => t.value));
      updateJobTitles(editJobTitles.map(t => t.value));
      showToast("항목 설정이 저장되었습니다.", "success");
    }
    setActiveSubModal(null);
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIOS) {
        showToast("iOS에서는 Safari 브라우저로 접속한 뒤 '홈 화면에 추가'를 해야만 알림을 지원합니다. [공유] > [홈 화면에 추가]를 진행해주세요.", "warning");
      } else {
        showToast("이 브라우저는 알림 기능을 지원하지 않습니다.", "error");
      }
      return;
    }

    if (Notification.permission === "denied") {
      showToast("알림 권한이 거부되어 있습니다. 브라우저 설정에서 알림 권한을 허용해 주세요.", "warning");
      return;
    }

    if (notificationSettings.pushEnabled) {
      updateNotificationSettings({ ...notificationSettings, pushEnabled: false });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      updateNotificationSettings({ ...notificationSettings, pushEnabled: true });
      new Notification("알림 설정 완료", {
        body: "이제 실시간 알림을 받으실 수 있습니다.",
        icon: "/assets/brand/google.svg"
      });
    } else {
      updateNotificationSettings({ ...notificationSettings, pushEnabled: false });
    }
  };

  const renderSubModal = () => {
    if (!activeSubModal) return null;

    const title = activeSubModal === "profile" ? "프로필 정보 수정" :
                  activeSubModal === "settings" ? "알림설정" :
                  activeSubModal === "categories" ? "항목 관리 설정" :
                  "보안 및 개인정보";

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-[#1e1e1e] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#252525]">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <button onClick={() => setActiveSubModal(null)} className="p-2 bg-white/5 rounded-full text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {activeSubModal === "profile" && (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-[#2d2d2d] border-2 border-white/10 overflow-hidden">
                      <img src={profile.picture} className="w-full h-full object-cover" alt="Profile" />
                    </div>
                    <label className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 rounded-full cursor-pointer shadow-lg">
                      <Camera className="w-3 h-3 text-white" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => updateProfilePicture(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">닉네임</label>
                    <input
                      type="text"
                      value={tempNickname}
                      onChange={(e) => setTempNickname(e.target.value)}
                      className="w-full bg-[#2d2d2d] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">직책</label>
                    <select
                      value={profile.jobTitle || jobTitles[0]}
                      onChange={(e) => updateJobTitle(e.target.value)}
                      className="w-full bg-[#2d2d2d] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                    >
                      {jobTitles.map((title) => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSubModal === "categories" && (
              <div className="space-y-8">
                {/* Task Types */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">작업 유형 목록</label>
                  <div className="space-y-2">
                    <Reorder.Group axis="y" values={editTaskTypes} onReorder={setEditTaskTypes} className="space-y-2">
                      {editTaskTypes.map((item, idx) => (
                        <Reorder.Item key={item.id} value={item} className="flex gap-2 relative z-10 w-full bg-[#1e1e1e]">
                          <div className="flex flex-col gap-1 cursor-grab active:cursor-grabbing justify-center px-1 text-gray-500 hover:text-white">
                            <GripVertical className="w-5 h-5 flex-shrink-0" />
                          </div>
                          <input
                            type="color"
                            value={item.color}
                            onChange={(e) => {
                              const newTypes = [...editTaskTypes];
                              newTypes[idx] = { ...newTypes[idx], color: e.target.value };
                              setEditTaskTypes(newTypes);
                            }}
                            className="w-10 h-[42px] bg-transparent border-0 self-center flex-shrink-0 cursor-pointer p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-xl outline-none"
                            title="색상 선택"
                          />
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) => {
                              const newTypes = [...editTaskTypes];
                              newTypes[idx] = { ...newTypes[idx], value: e.target.value };
                              setEditTaskTypes(newTypes);
                            }}
                            className="flex-1 bg-[#2d2d2d] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 min-w-0"
                          />
                          <button
                            onClick={() => setEditTaskTypes(editTaskTypes.filter((_, i) => i !== idx))}
                            className="p-2 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center h-full self-center flex-shrink-0"
                            style={{ height: "42px" }}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                    <button
                      onClick={() => setEditTaskTypes([...editTaskTypes, {id: Math.random().toString(), value: "", color: "#10b981"}])}
                      className="w-full py-2 border border-dashed border-white/10 rounded-xl text-xs text-gray-500 flex items-center justify-center gap-2 hover:bg-white/5"
                    >
                      <Plus className="w-3 h-3" /> 항목 추가
                    </button>
                  </div>
                </div>

                {/* Priorities */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">우선순위 목록</label>
                  <div className="space-y-2">
                    <Reorder.Group axis="y" values={editPriorities} onReorder={setEditPriorities} className="space-y-2">
                      {editPriorities.map((item, idx) => (
                        <Reorder.Item key={item.id} value={item} className="flex gap-2 relative z-10 w-full bg-[#1e1e1e]">
                          <div className="flex flex-col gap-1 cursor-grab active:cursor-grabbing justify-center px-1 text-gray-500 hover:text-white">
                            <GripVertical className="w-5 h-5 flex-shrink-0" />
                          </div>
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) => {
                              const newP = [...editPriorities];
                              newP[idx] = { ...newP[idx], value: e.target.value };
                              setEditPriorities(newP);
                            }}
                            className="flex-1 bg-[#2d2d2d] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 min-w-0"
                          />
                          <button
                            onClick={() => setEditPriorities(editPriorities.filter((_, i) => i !== idx))}
                            className="p-2 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center h-full self-center flex-shrink-0"
                            style={{ height: "42px" }}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                    <button
                      onClick={() => setEditPriorities([...editPriorities, {id: Math.random().toString(), value: ""}])}
                      className="w-full py-2 border border-dashed border-white/10 rounded-xl text-xs text-gray-500 flex items-center justify-center gap-2 hover:bg-white/5"
                    >
                      <Plus className="w-3 h-3" /> 항목 추가
                    </button>
                  </div>
                </div>

                {/* Job Titles */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">직책 목록</label>
                  <div className="space-y-2">
                    <Reorder.Group axis="y" values={editJobTitles} onReorder={setEditJobTitles} className="space-y-2">
                      {editJobTitles.map((item, idx) => (
                        <Reorder.Item key={item.id} value={item} className="flex gap-2 relative z-10 w-full bg-[#1e1e1e]">
                          <div className="flex flex-col gap-1 cursor-grab active:cursor-grabbing justify-center px-1 text-gray-500 hover:text-white">
                            <GripVertical className="w-5 h-5 flex-shrink-0" />
                          </div>
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) => {
                              const newTitles = [...editJobTitles];
                              newTitles[idx] = { ...newTitles[idx], value: e.target.value };
                              setEditJobTitles(newTitles);
                            }}
                            className="flex-1 bg-[#2d2d2d] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 min-w-0"
                          />
                          <button
                            onClick={() => setEditJobTitles(editJobTitles.filter((_, i) => i !== idx))}
                            className="p-2 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center h-full self-center flex-shrink-0"
                            style={{ height: "42px" }}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                    <button
                      onClick={() => setEditJobTitles([...editJobTitles, {id: Math.random().toString(), value: ""}])}
                      className="w-full py-2 border border-dashed border-white/10 rounded-xl text-xs text-gray-500 flex items-center justify-center gap-2 hover:bg-white/5"
                    >
                      <Plus className="w-3 h-3" /> 항목 추가
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSubModal === "settings" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 p-4 bg-[#2d2d2d] rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm text-white font-medium">푸시 알림</span>
                    </div>
                    <button
                      onClick={requestNotificationPermission}
                      className={`w-10 h-6 rounded-full relative transition-colors ${notificationSettings.pushEnabled ? "bg-emerald-500" : "bg-gray-600"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationSettings.pushEnabled ? "right-1" : "left-1"}`} />
                    </button>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <label className={`flex items-center justify-between text-sm ${notificationSettings.pushEnabled ? 'text-gray-300' : 'text-gray-500'}`}>
                      <span>마감일 임박 알림 (1시간 전)</span>
                      <input type="checkbox" disabled={!notificationSettings.pushEnabled} checked={notificationSettings.notifyBeforeDeadline} onChange={(e) => updateNotificationSettings({...notificationSettings, notifyBeforeDeadline: e.target.checked})} className="accent-emerald-500 w-4 h-4 cursor-pointer disabled:opacity-50" />
                    </label>
                    <label className={`flex items-center justify-between text-sm ${notificationSettings.pushEnabled ? 'text-gray-300' : 'text-gray-500'}`}>
                      <span>기한초과 경고 (1시간 뒤)</span>
                      <input type="checkbox" disabled={!notificationSettings.pushEnabled} checked={notificationSettings.notifyOverdue} onChange={(e) => updateNotificationSettings({...notificationSettings, notifyOverdue: e.target.checked})} className="accent-emerald-500 w-4 h-4 cursor-pointer disabled:opacity-50" />
                    </label>
                    <label className={`flex items-center justify-between text-sm ${notificationSettings.pushEnabled ? 'text-gray-300' : 'text-gray-500'}`}>
                      <span>일정 시작 전 리마인드 (30분 전)</span>
                      <input type="checkbox" disabled={!notificationSettings.pushEnabled} checked={notificationSettings.notifyBeforeStart} onChange={(e) => updateNotificationSettings({...notificationSettings, notifyBeforeStart: e.target.checked})} className="accent-emerald-500 w-4 h-4 cursor-pointer disabled:opacity-50" />
                    </label>
                    <label className={`flex items-center justify-between text-sm ${notificationSettings.pushEnabled ? 'text-gray-300' : 'text-gray-500'}`}>
                      <span>새로운 업무 생성/완료 시</span>
                      <input type="checkbox" disabled={!notificationSettings.pushEnabled} checked={notificationSettings.notifyNewTask} onChange={(e) => updateNotificationSettings({...notificationSettings, notifyNewTask: e.target.checked})} className="accent-emerald-500 w-4 h-4 cursor-pointer disabled:opacity-50" />
                    </label>
                  </div>
                </div>
                <div className="pt-4 text-center">
                  <p className="text-[10px] text-gray-600">앱 버전 1.0.4 (Build 20240303)</p>
                </div>
              </div>
            )}

            {activeSubModal === "privacy" && (
              <div className="space-y-4">
                <div className="p-4 bg-[#2d2d2d] rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-orange-500" />
                    <span className="text-sm text-white font-medium">{isAdmin ? "관리자 UID 권한" : "임직원 UID 권한"}</span>
                  </div>
                  <code className="block break-all rounded-xl bg-[#1e1e1e] px-4 py-3 text-xs leading-5 text-gray-300">{user?.sub || "로그인 UID 없음"}</code>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!user?.sub) return;
                      try {
                        await navigator.clipboard.writeText(user.sub);
                        showToast("Firebase UID를 복사했습니다.", "success");
                      } catch {
                        showToast("UID를 복사하지 못했습니다.", "error");
                      }
                    }}
                    className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-gray-200 hover:bg-white/5"
                  >
                    UID 복사
                  </button>
                  <p className="text-xs leading-5 text-gray-400">접속 코드는 사용하지 않습니다. 관리자가 Firestore 보안 설정의 {isAdmin ? "adminUids" : "employeeUids"} 허용 목록으로 권한을 관리합니다.</p>
                </div>
                <button type="button" onClick={() => openLegalDocument("privacy")} className="w-full p-4 flex items-center justify-between text-sm text-gray-300 hover:bg-white/5 transition-colors bg-[#2d2d2d] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-gray-500" />
                    개인정보 처리방침
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                <button type="button" onClick={() => openLegalDocument("terms")} className="w-full p-4 flex items-center justify-between text-sm text-gray-300 hover:bg-white/5 transition-colors bg-[#2d2d2d] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    서비스 이용약관
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#1a1a1a] border-t border-white/10">
            <button
              onClick={handleSave}
              className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
            >
              {activeSubModal === "privacy" ? "닫기" : "저장 및 확인"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-[#121212] z-[101] shadow-2xl border-r border-white/5 flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <h2 className="text-xl font-bold text-white">메뉴</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-8">
                {/* Google Account Info */}
                <div className="bg-[#1e1e1e] rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={user.picture} className="w-12 h-12 rounded-full border border-white/10" alt="Google" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{profile.nickname}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                      <img src="/assets/brand/google.svg" className="w-4 h-4" alt="Google" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md w-fit">
                    <Shield className="w-3 h-3" />
                    Verified Account
                  </div>
                </div>

                {/* Profile Section */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 px-1">내 프로필</label>
                  <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden border border-white/5">
                    <div className="p-6 flex flex-col items-center gap-4 border-b border-white/5">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-[#2d2d2d] border-2 border-white/10 overflow-hidden">
                          <img src={profile.picture} className="w-full h-full object-cover" alt="Profile" />
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-emerald-500 rounded-full cursor-pointer shadow-lg active:scale-90 transition-transform">
                          <Camera className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => updateProfilePicture(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-white">{profile.nickname}</h3>
                        <p className="text-xs text-gray-500">{profile.jobTitle || "현장 관리자"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSubModal("profile")}
                      className="w-full p-4 flex items-center justify-between text-sm text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-500" />
                        프로필 정보 수정
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Settings Section */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 px-1">설정</label>
                  <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden border border-white/5 mb-4">
                    <button
                      onClick={() => setActiveSubModal("settings")}
                      className="w-full p-4 flex items-center justify-between text-sm text-gray-300 hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="w-4 h-4 text-gray-500" />
                        알림설정
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setActiveSubModal("categories")}
                      className="w-full p-4 flex items-center justify-between text-sm text-gray-300 hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <ListFilter className="w-4 h-4 text-gray-500" />
                        항목 관리 설정
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setActiveSubModal("privacy")}
                      className="w-full p-4 flex items-center justify-between text-sm text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-gray-500" />
                        보안 및 개인정보
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-[#1a1a1a]">
              <button
                onClick={logout}
                className="w-full bg-red-500/10 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform border border-red-500/20"
              >
                <LogOut className="w-5 h-5" />
                로그아웃
              </button>
            </div>
          </motion.div>
          {renderSubModal()}
          {legalDocument && (
            <LegalDocumentModal
              type={legalDocument}
              company={legalCompanyInfo}
              onClose={() => setLegalDocument(null)}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
