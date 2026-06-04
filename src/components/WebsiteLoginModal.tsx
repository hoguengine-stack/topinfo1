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
}) => {
  if (!showLoginModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-[1000]">
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
            탑정보통신 통합 로그인
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed text-left">
            용지 요청 및 건의글 작성을 위한 일반 회원 로그인 화면입니다.
          </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4 relative z-10 text-left">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">이메일 아이디 *</label>
            <input
              type="email"
              required
              placeholder="example@email.com"
              value={authFormData.email}
              onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-[#0f62fe] focus:bg-white transition"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-[#0f62fe] focus:bg-white transition"
            />
          </div>

          {authError && <p className="text-xs text-red-500 font-semibold">{authError}</p>}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-blue-600 disabled:opacity-50 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs transition"
          >
            {authLoading ? "로그인 중..." : "로그인"}
          </button>

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
