import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ScrollText, ShieldCheck, X } from "lucide-react";
import { FooterInfo } from "../utils/footerSettings";

export type LegalDocumentType = "terms" | "privacy";

interface LegalDocumentModalProps {
  type: LegalDocumentType;
  company: FooterInfo;
  onClose: () => void;
}

const EFFECTIVE_DATE = "2026년 7월 11일";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
      <h3 className="mb-3 text-base font-bold text-slate-900">{title}</h3>
      <div className="space-y-3 text-sm leading-7 text-slate-600">{children}</div>
    </section>
  );
}

function TermsDocument({ company }: { company: FooterInfo }) {
  return (
    <div className="space-y-7">
      <p className="text-sm leading-7 text-slate-600">
        이 약관은 {company.companyName}(이하 "회사")가 제공하는 홈페이지와 작업지원 서비스의 이용 조건을 정합니다.
      </p>

      <Section title="제1조 목적 및 서비스 범위">
        <p>회사는 결제·통신 관련 정보, 제품 안내, 가맹 및 상담 신청, 용지 배송요청, 건의게시판, 자료실과 임직원용 작업관리 기능을 제공합니다.</p>
      </Section>

      <Section title="제2조 계정과 이용자 책임">
        <p>이용자는 정확한 정보를 제공하고 자신의 로그인 수단을 안전하게 관리해야 합니다. 타인의 계정을 사용하거나 서비스의 보안·정상 운영을 방해해서는 안 됩니다.</p>
        <p>임직원 기능은 회사가 승인한 Google 계정과 접속 코드 검증을 모두 통과한 경우에만 사용할 수 있습니다.</p>
      </Section>

      <Section title="제3조 신청과 게시물">
        <p>상담·배송 신청자는 업무 처리에 필요한 정확한 연락처와 정보를 입력해야 합니다. 불법 정보, 타인의 권리를 침해하는 내용, 반복 광고, 악성 코드 등 운영을 방해하는 내용은 게시할 수 없습니다.</p>
        <p>회사는 법령 위반이나 서비스 운영 방해가 명백한 게시물을 제한하거나 삭제할 수 있으며, 비밀글은 작성자와 승인된 담당자만 열람할 수 있습니다.</p>
      </Section>

      <Section title="제4조 서비스 변경과 중단">
        <p>회사는 보안 조치, 점검, 장애, 외부 서비스 변경 또는 운영상 필요에 따라 서비스의 일부를 변경하거나 일시 중단할 수 있습니다. 중대한 변경은 홈페이지 등 합리적인 방법으로 알립니다.</p>
      </Section>

      <Section title="제5조 자료와 지식재산권">
        <p>회사가 제공하는 문서, 이미지, 상표와 화면 구성에 관한 권리는 회사 또는 정당한 권리자에게 있습니다. 자료실 파일은 표시된 이용 목적과 범위 안에서만 사용해야 하며 무단 재배포·변조·판매할 수 없습니다.</p>
        <p>이용자가 작성한 게시물의 권리는 작성자에게 있으며, 이용자는 서비스 운영과 문의 처리에 필요한 범위에서 회사가 해당 내용을 저장·표시하는 데 동의합니다.</p>
      </Section>

      <Section title="제6조 책임과 분쟁 해결">
        <p>회사는 서비스를 안정적으로 제공하기 위해 합리적인 조치를 합니다. 다만 이용자 귀책, 불가항력 또는 회사가 통제하기 어려운 외부 서비스 장애로 발생한 손해에 대해서는 관련 법령이 허용하는 범위에서 책임이 제한될 수 있습니다.</p>
        <p>본 약관에는 대한민국 법령을 적용하며, 분쟁이 발생하면 상호 협의해 해결하고 협의되지 않을 경우 관계 법령에 따른 관할 법원에서 해결합니다.</p>
      </Section>

      <Section title="제7조 약관 변경과 문의">
        <p>약관이 변경되는 경우 시행일과 주요 변경 내용을 홈페이지에 알립니다. 문의는 {company.privacyContact || company.email} 또는 {company.phone}으로 접수할 수 있습니다.</p>
        <p className="font-semibold text-slate-700">시행일: {EFFECTIVE_DATE}</p>
      </Section>
    </div>
  );
}

function PrivacyDocument({ company }: { company: FooterInfo }) {
  const privacyContact = company.privacyContact || company.email;

  return (
    <div className="space-y-7">
      <p className="text-sm leading-7 text-slate-600">
        {company.companyName}(이하 "회사")는 서비스 제공에 필요한 범위에서 개인정보를 처리하며, 처리 목적이 달성되면 관계 법령과 내부 보유 기준에 따라 삭제합니다.
      </p>

      <Section title="1. 처리 목적, 항목 및 보유기간">
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-[720px] w-full border-collapse text-left text-xs leading-5">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">구분</th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">처리 항목</th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">목적·보유기간</th>
              </tr>
            </thead>
            <tbody className="align-top text-slate-600">
              <tr>
                <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">가맹·상담 신청</td>
                <td className="border-b border-slate-100 px-4 py-3">성명, 연락처, 선택 입력한 상호명·업종·관심 제품·문의 내용</td>
                <td className="border-b border-slate-100 px-4 py-3">상담과 후속 업무 처리. 업무 종료 후 관리자 삭제 시까지</td>
              </tr>
              <tr>
                <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">용지 배송요청</td>
                <td className="border-b border-slate-100 px-4 py-3">성명 또는 상호, 연락처, 배송지, 선택 입력한 단말기 모델·수량</td>
                <td className="border-b border-slate-100 px-4 py-3">배송과 후속 업무 처리. 업무 종료 후 관리자 삭제 시까지</td>
              </tr>
              <tr>
                <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">회원·임직원 인증</td>
                <td className="border-b border-slate-100 px-4 py-3">이메일, Firebase UID, 이름·닉네임, 프로필 이미지, 직책, 로그인 제공자와 접속 코드 검증 상태</td>
                <td className="border-b border-slate-100 px-4 py-3">로그인, 권한 확인, 계정 관리. 계정 삭제 시까지</td>
              </tr>
              <tr>
                <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">건의게시판</td>
                <td className="border-b border-slate-100 px-4 py-3">제목, 내용, 작성자명, 작성자 UID, 공개 여부, 답변, 작성일</td>
                <td className="border-b border-slate-100 px-4 py-3">게시물 운영과 답변. 작성자 또는 관리자가 삭제할 때까지</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800">내부 작업관리</td>
                <td className="px-4 py-3">업무 제목·설명·메모·일정·담당자·첨부 이미지와 작성자 UID</td>
                <td className="px-4 py-3">임직원 업무 배정과 이력 관리. 관리자가 삭제할 때까지</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>관계 법령에서 별도 보관기간을 정하거나 분쟁 처리를 위해 필요한 경우에는 해당 기간 동안 분리하여 보관할 수 있습니다.</p>
      </Section>

      <Section title="2. 개인정보의 제3자 제공">
        <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 이용자가 별도로 동의하거나 법령상 의무가 있는 경우에는 예외로 합니다.</p>
      </Section>

      <Section title="3. 외부 서비스 이용과 처리위탁">
        <p>회사는 로그인, 데이터 저장과 사이트 제공을 위해 Google LLC의 Firebase Authentication, Cloud Firestore 및 Firebase Hosting을 사용합니다.</p>
        <p>
          이전받는 자: Google LLC / 이전 국가: 미국 등 Google 서비스 제공 지역 / 이전 항목: 본 방침 제1항의 서비스별 처리 항목 / 이전 목적: 인증, 데이터 저장, 사이트 제공과 보안 / 이전 시기·방법: 서비스 이용 시 암호화된 네트워크를 통한 전송 / 보유기간: 제1항의 서비스별 보유기간 또는 서비스 계약 종료 시까지
        </p>
        <p>현재 Cloud Firestore 데이터베이스는 미국 다중 리전(nam5)에 설정되어 있습니다. 이용자는 국외 처리 동의를 거부할 수 있으나, 거부하면 신청·게시 기능을 이용할 수 없습니다.</p>
      </Section>

      <Section title="4. 파기 절차와 방법">
        <p>보유 목적이 끝나거나 삭제 요청이 정당하게 접수된 정보는 복구하기 어려운 방법으로 삭제합니다. 전자 파일은 데이터베이스와 서비스 저장소에서 삭제하고, 출력물이 있는 경우 분쇄 또는 소각합니다.</p>
      </Section>

      <Section title="5. 이용자의 권리와 행사 방법">
        <p>이용자는 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다. 본인 확인이 필요한 경우 최소한의 확인 절차를 거치며, 법령상 제한 사유가 있으면 그 사유를 안내합니다.</p>
        <p>로그인 후 작성한 게시물은 작성자 계정으로 삭제할 수 있습니다. 비로그인 게시물과 그 밖의 요청은 아래 개인정보 문의처로 접수할 수 있습니다.</p>
      </Section>

      <Section title="6. 안전성 확보조치와 자동 수집 정보">
        <p>회사는 Firebase Authentication 기반 접근 통제, Firestore 보안 규칙, 관리자 권한 분리와 전송구간 암호화를 적용합니다.</p>
        <p>로그인 유지와 보안을 위해 Firebase가 브라우저 저장소 등 인증에 필요한 정보를 사용할 수 있습니다. 현재 사이트는 맞춤형 광고나 별도 방문자 분석 도구를 운영하지 않습니다.</p>
      </Section>

      <Section title="7. 개인정보 문의처">
        <p>
          담당: {company.privacyOfficer || "개인정보 보호업무 담당자"}<br />
          연락처: {privacyContact} / {company.phone}
        </p>
        <p>개인정보 침해에 관한 상담이 필요한 경우 개인정보침해 신고센터(118) 또는 개인정보분쟁조정위원회 등 관계 기관에 도움을 요청할 수 있습니다.</p>
      </Section>

      <Section title="8. 방침 변경">
        <p>내용이 변경되면 시행 전 홈페이지를 통해 알리며, 권리 또는 의무에 중대한 변경이 있는 경우에는 알기 쉬운 방법으로 별도 안내합니다.</p>
        <p className="font-semibold text-slate-700">공고일 및 시행일: {EFFECTIVE_DATE}</p>
      </Section>
    </div>
  );
}

export function LegalDocumentModal({ type, company, onClose }: LegalDocumentModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isTerms = type === "terms";
  const title = isTerms ? "서비스 이용약관" : "개인정보처리방침";
  const Icon = isTerms ? ScrollText : ShieldCheck;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-document-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="legal-document-title" className="truncate text-lg font-black text-slate-950 sm:text-xl">{title}</h2>
              <p className="mt-0.5 truncate text-xs text-slate-500">{company.companyName}</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`${title} 닫기`}
            title="닫기"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          {isTerms ? <TermsDocument company={company} /> : <PrivacyDocument company={company} />}
        </div>
      </div>
    </div>,
    document.body,
  );
}
