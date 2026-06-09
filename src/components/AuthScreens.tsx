import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAccessCodeFailureMessage } from "../utils/firebaseErrors";
import { LogIn, ShieldCheck, UserCircle, Camera, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AuthScreens({ onComplete }: { onComplete: () => void }) {
  const { user, profile, isAccessCodeVerified, login, verifyAccessCode, saveProfile, jobTitles, lockoutState } = useAuth();
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [jobTitle, setJobTitle] = useState(jobTitles[0] || "현장 관리자");
  const [profilePic, setProfilePic] = useState("");
  const [error, setError] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  React.useEffect(() => {
    if (user && !nickname) {
      // We don't pre-fill user.name anymore to encourage setting a custom nickname
      // but we can use it as a placeholder
    }
  }, [user]);

  React.useEffect(() => {
    if (lockoutState?.lockoutUntil) {
      const updateRemaining = () => {
        const remaining = Math.max(0, lockoutState.lockoutUntil! - Date.now());
        setLockoutRemaining(remaining);
      };
      updateRemaining();
      const interval = setInterval(updateRemaining, 1000);
      return () => clearInterval(interval);
    } else {
      setLockoutRemaining(0);
    }
  }, [lockoutState?.lockoutUntil]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}시간 ${minutes}분 ${seconds}초`;
    if (minutes > 0) return `${minutes}분 ${seconds}초`;
    return `${seconds}초`;
  };

  const isLocked = lockoutRemaining > 0;

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
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Google 계정으로 로그인
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isAccessCodeVerified) {
    return (
      <div className="fixed inset-0 bg-[#121212] flex items-center justify-center p-6 z-[100]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">접속 코드 입력</h2>
            <p className="text-gray-400">관리자로부터 받은 코드를 입력하세요.</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              disabled={isLocked}
              className={`w-full bg-[#1e1e1e] border ${isLocked ? 'border-red-500/50 opacity-50' : 'border-white/10'} rounded-2xl px-6 py-4 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
              placeholder="••••••"
            />
            {isLocked ? (
              <p className="text-red-500 text-center text-sm font-bold">
                입력 횟수 초과로 제한되었습니다.<br/>
                {formatTime(lockoutRemaining)} 후 다시 시도해주세요.
              </p>
            ) : error ? (
              <p className="text-red-500 text-center text-sm">{error}</p>
            ) : null}
            <button
              onClick={async () => {
                if (isLocked || isVerifyingCode) return;
                setIsVerifyingCode(true);
                setError("");

                try {
                  const result = await verifyAccessCode(code);
                  if (!result.success) {
                    if (result.errorMessage) {
                      setError(result.errorMessage);
                    } else if (result.locked) {
                      setError(""); // Will be handled by isLocked
                    } else {
                      setError(`잘못된 코드입니다. (남은 시도: ${result.attemptsLeft ?? 0}회)`);
                    }
                  }
                } catch (err) {
                  console.error("Access code verification failed:", err);
                  setError(getAccessCodeFailureMessage(err));
                } finally {
                  setIsVerifyingCode(false);
                }
              }}
              disabled={isLocked || !code || isVerifyingCode}
              className={`w-full ${isLocked || isVerifyingCode ? 'bg-gray-600' : 'bg-emerald-500'} text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform`}
            >
              {isVerifyingCode ? "확인 중..." : "확인"}
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
