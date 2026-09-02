import React, { useEffect, useRef } from "react";
import { ArrowRight, Check, LoaderCircle, LockKeyhole, X } from "lucide-react";
import { BrandLogo } from "./public-v3/BrandLogo";

export interface WebsiteLoginModalProps {
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  authFormData: any;
  setAuthFormData: (data: any) => void;
  authError: string | null;
  authLoading: boolean;
  handleAuthSubmit: (event: React.FormEvent) => void;
  handleGoogleLogin: () => void;
  isSignUpMode: boolean;
  setIsSignUpMode: (mode: boolean) => void;
}

export const WebsiteLoginModal: React.FC<WebsiteLoginModalProps> = ({
  showLoginModal,
  setShowLoginModal,
  authFormData,
  setAuthFormData,
  authError,
  authLoading,
  handleAuthSubmit,
  handleGoogleLogin,
  isSignUpMode,
  setIsSignUpMode,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const close = () => {
    setShowLoginModal(false);
  };

  useEffect(() => {
    if (!showLoginModal) return;
    const previousOverflow = document.body.style.overflow;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowLoginModal(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      ).filter((element) => !element.hasAttribute("hidden") && element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleDialogKeyDown);
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleDialogKeyDown);
      document.body.style.overflow = previousOverflow;
      if (openerRef.current?.isConnected) openerRef.current.focus();
    };
  }, [setShowLoginModal, showLoginModal]);

  if (!showLoginModal) return null;

  return (
    <div className="public-dialog-layer public-auth-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section ref={dialogRef} className="public-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="public-auth-title">
        <aside>
          <BrandLogo inverse />
          <div>
            <LockKeyhole aria-hidden="true" />
            <h2>가맹점 지원 계정</h2>
            <p>건의제안의 비공개 글과 가맹점 지원 기능에 사용할 수 있습니다.</p>
            <ul><li><Check /> 비공개 건의글 확인</li><li><Check /> 요청 이력의 안전한 처리</li></ul>
          </div>
        </aside>
        <div className="public-auth-dialog__form">
          <button ref={closeButtonRef} type="button" className="public-icon-button public-auth-dialog__close" onClick={close} aria-label="닫기"><X /></button>
          <header><p className="public-kicker">가맹점 계정</p><h2 id="public-auth-title">{isSignUpMode ? "가맹점 계정 만들기" : "가맹점 로그인"}</h2><p>{isSignUpMode ? "상호와 이메일로 계정을 만드세요." : "등록한 이메일과 비밀번호를 입력하세요."}</p></header>
          <form className="public-form public-form--dialog" onSubmit={handleAuthSubmit}>
            {isSignUpMode && <label><span>닉네임 / 상호명 <b>*</b></span><input required value={authFormData.nickname || ""} onChange={(event) => setAuthFormData({ ...authFormData, nickname: event.target.value })} placeholder="예: 탑카페 안산점" autoComplete="organization" /></label>}
            <label><span>이메일 <b>*</b></span><input required type="email" value={authFormData.email || ""} onChange={(event) => setAuthFormData({ ...authFormData, email: event.target.value })} placeholder="name@example.com" autoComplete="email" /></label>
            <label><span>비밀번호 <b>*</b></span><input required type="password" value={authFormData.password || ""} onChange={(event) => setAuthFormData({ ...authFormData, password: event.target.value })} placeholder="8자 이상 입력" autoComplete={isSignUpMode ? "new-password" : "current-password"} /></label>
            {authError && <p className="public-form__error" role="alert">{authError}</p>}
            <button type="submit" className="public-button public-button--primary public-auth-dialog__submit" disabled={authLoading}>{authLoading ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}{authLoading ? "처리 중" : isSignUpMode ? "회원가입" : "로그인"}</button>
            <button type="button" className="public-auth-dialog__switch" onClick={() => setIsSignUpMode(!isSignUpMode)}>{isSignUpMode ? "이미 계정이 있습니다. 로그인" : "계정이 없습니다. 회원가입"}</button>
            <button type="button" className="public-auth-dialog__google" onClick={handleGoogleLogin} disabled={authLoading}><img src="/assets/brand/google.svg" alt="" /> Google Workspace 임직원 로그인</button>
          </form>
        </div>
      </section>
    </div>
  );
};
