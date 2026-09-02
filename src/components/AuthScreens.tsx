import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, ShieldCheck, UserCircle, Camera, Check, Copy, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AuthScreens({ onComplete }: { onComplete: () => void }) {
  const { user, profile, hasStaffAccess, login, refreshStaffAccess, saveProfile, jobTitles } = useAuth();
  const [nickname, setNickname] = useState("");
  const [jobTitle, setJobTitle] = useState(jobTitles[0] || "현장 관리자");
  const [profilePic, setProfilePic] = useState("");
  const [error, setError] = useState("");
  const [isRefreshingAccess, setIsRefreshingAccess] = useState(false);
  const [uidCopied, setUidCopied] = useState(false);

  if (!user) {
    return (
      <div className="fixed inset-0 bg-[#121212] flex items-center justify-center p-6 z-[100]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">탑정보통신</h1>
          <p className="text-gray-400 mb-10">작업 관리를 위해 로그인해주세요.</p>
          <button
            onClick={login}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <img src="/assets/brand/google.svg" className="w-5 h-5" alt="Google" />
            Google 계정으로 로그인
          </button>
        </motion.div>
      </div>
    );
  }

  if (!hasStaffAccess) {
    return (
      <div className="fixed inset-0 bg-[#121212] flex items-center justify-center p-6 z-[100]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">임직원 권한 확인</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">관리자가 아래 Firebase UID를 직원 허용 목록에 등록해야 작업관리에 들어갈 수 있습니다.</p>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#1e1e1e] p-4">
              <p className="mb-2 text-xs font-bold text-gray-500">Firebase UID</p>
              <code className="block break-all text-sm leading-6 text-gray-200">{user.sub}</code>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(user.sub);
                    setUidCopied(true);
                  } catch {
                    setError("UID를 복사하지 못했습니다. 화면의 값을 직접 전달해 주세요.");
                  }
                }}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold text-gray-200 hover:bg-white/5"
              >
                <Copy className="h-4 w-4" /> {uidCopied ? "복사됨" : "UID 복사"}
              </button>
            </div>
            {error && <p className="text-red-400 text-center text-sm leading-6">{error}</p>}
            <button
              onClick={async () => {
                if (isRefreshingAccess) return;
                setIsRefreshingAccess(true);
                setError("");

                try {
                  const result = await refreshStaffAccess();
                  if (!result.success) {
                    setError(result.errorMessage || "임직원 권한을 확인하지 못했습니다.");
                  }
                } catch {
                  setError("임직원 권한을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
                } finally {
                  setIsRefreshingAccess(false);
                }
              }}
              disabled={isRefreshingAccess}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-bold text-white transition-transform active:scale-95 disabled:bg-gray-600"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshingAccess ? "animate-spin" : ""}`} />
              {isRefreshingAccess ? "권한 확인 중..." : "권한 다시 확인"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-[#121212] flex items-center justify-center p-6 z-[100]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">프로필 설정</h2>
            <p className="text-gray-400">사용할 닉네임과 사진을 설정하세요.</p>
          </div>

          <div className="flex flex-col items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-[#1e1e1e] border-2 border-white/10 overflow-hidden flex items-center justify-center">
                {profilePic ? (
                  <img src={profilePic} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <UserCircle className="w-16 h-16 text-gray-600" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-emerald-500 rounded-full cursor-pointer shadow-lg active:scale-90 transition-transform">
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setProfilePic(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            <div className="w-full space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder={user?.name || "닉네임을 입력하세요"}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">직책</label>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                >
                  {jobTitles.map((title) => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
              </div>
              <button
                disabled={!nickname}
                onClick={() => {
                  saveProfile(nickname, profilePic || user.picture, jobTitle);
                  onComplete();
                }}
                className="w-full bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                시작하기
                <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
