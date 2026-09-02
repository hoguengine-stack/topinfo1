import React, { ErrorInfo, ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("TOPINFO application render failed", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-error-screen">
        <section className="app-error-screen__panel" role="alert" aria-live="assertive">
          <div className="app-error-screen__brand" aria-label="탑정보통신">
            <span aria-hidden="true">T</span>
            <strong>탑정보통신</strong>
          </div>
          <p className="app-error-screen__label">화면 오류</p>
          <h1>페이지를 불러오지 못했습니다</h1>
          <p>
            입력한 내용은 그대로 두고 페이지를 다시 불러와 주세요. 같은 문제가 반복되면 전화로 바로 문의할 수 있습니다.
          </p>
          <div className="app-error-screen__actions">
            <button type="button" onClick={() => window.location.reload()}>
              다시 불러오기
            </button>
            <a href="/">홈으로 이동</a>
            <a href="tel:0314874401">031-487-4401</a>
          </div>
        </section>
      </main>
    );
  }
}
