import React from "react";
import { X } from "lucide-react";

export interface WebsiteLoginModalProps {
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showGoogleLogin: boolean;
  setShowGoogleLogin: (show: boolean) => void;
  authFormData: any;
  setAuthFormData: (data: any) => void;
  authError: string | null;
  authLoading: boolean;
  handleAuthSubmit: (e: React.FormEvent) => void;
  handleGoogleLogin: () => void;
  setGoogleClickTimes: React.Dispatch<React.SetStateAction<number[]>>;
  isSignUpMode: boolean;
  setIsSignUpMode: (mode: boolean) => void;
}

export const WebsiteLoginModal: React.FC<WebsiteLoginModalProps> = ({
  showLoginModal,
  setShowLoginModal,
  showGoogleLogin,
  setShowGoogleLogin,
  authFormData,
  setAuthFormData,
  authError,
  authLoading,
  handleAuthSubmit,
  handleGoogleLogin,
  setGoogleClickTimes,
  isSignUpMode,
  setIsSignUpMode,
}) => {
  if (!showLoginModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[1000] animate-in fade-in duration-200">
      <div className="bg-white border rounded-3xl w-full max-w-md p-8 relative shadow-2xl overflow-hidden">
        <button
          onClick={() => {
            setShowLoginModal(false);
            setShowGoogleLogin(false);
          }}
          className="absolute right-6 top-6 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight text-left">
            {isSignUpMode ? "탑정보통신 통합 회원가입" : "탑정보통신 통합 로그인"}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed text-left">
            {isSignUpMode
              ? "용지 요청 및 건의글 작성을 위한 일반 회원 가입 화면입니다."
              : "용지 요청 및 건의글 작성을 위한 일반 회원 로그인 화면입니다."}
          </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4 relative z-10 text-left">
          {isSignUpMode && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">닉네임 / 상호명 *</label>
              <input
                type="text"
                required
                placeholder="홍길동 대표님 또는 탑에스프레소"
                value={authFormData.nickname || ""}
                onChange={(e) => setAuthFormData({ ...authFormData, nickname: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">이메일 아이디 *</label>
            <input
              type="email"
              required
              placeholder="example@email.com"
              value={authFormData.email}
              onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">비밀번호 *</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={authFormData.password}
              onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
            />
          </div>


          {authError && <p className="text-xs text-red-500 font-semibold">{authError}</p>}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-blue-600 disabled:opacity-50 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md shadow-blue-600/10 active:scale-98 transition-all"
          >
            {authLoading ? (isSignUpMode ? "가입 중..." : "로그인 중...") : (isSignUpMode ? "회원가입" : "로그인")}
          </button>

          <div className="text-center mt-2.5">
            <button
              type="button"
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold"
            >
              {isSignUpMode
                ? "이미 계정이 있으신가요? 로그인"
                : "계정이 없으신가요? 회원가입"}
            </button>
          </div>

          {showGoogleLogin && (
            <div className="border-t border-slate-100 pt-4 mt-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                Google Workspace 계정 연동인증
              </button>
            </div>
          )}
        </form>

        {/* Easter Egg Google Login trigger box */}
        <div
          className="absolute bottom-0 right-0 w-16 h-16 rounded-br-3xl cursor-default select-none z-0"
          onClick={() => {
            const now = Date.now();
            setGoogleClickTimes(prev => {
              const filtered = prev.filter(time => now - time < 5000);
              const current = [...filtered, now];
              if (current.length >= 4) {
                setShowGoogleLogin(true);
                return [];
              }
              return current;
            });
          }}
        />
      </div>
    </div>
  );
};
