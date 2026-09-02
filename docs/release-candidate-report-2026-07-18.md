# TOPINFO 공개 사이트 릴리스 후보 보고서

- 기준일: 2026-07-18
- 저장소: `C:\탑정보통신-작업-관리`
- 브랜치: `main`
- 상태: **로컬 코드·Rules Emulator PASS / 현행 화면 시각 재검증·운영 보안 마이그레이션·권리 확인 HOLD**
- 원격 push·Firebase 배포: 수행하지 않음

## 1. 가장 크게 개선된 점

- 기존 Firebase·백오피스·CMS 구조를 유지하면서 공개 사이트를 320px부터 2560px까지 대응하는 POS 영업·상담 사이트로 재구성했다.
- 홈, 토스POS, U+ AI전화, 제품, 자료실, 건의제안, 상담, 용지 요청을 하나의 내비게이션·레이아웃·CTA 체계로 통합했다.
- 상담과 용지 요청은 Firestore 쓰기 성공 후에만 성공 상태를 표시하며, 임직원이 원본 요청을 작업관리 항목으로 수동 전환할 수 있다.
- 상담·용지 폼은 필드별 오류, `aria-invalid`/`aria-describedby`, 최초 오류 포커스를 제공하고 저장 중 중복 제출을 막는다.
- 상담·용지 원본과 연결 작업의 상태는 Firestore 트랜잭션 안에서 함께 변경되며, 원본 단독 상태 변경·연결 후 작업 삭제·원본 내용 변조를 Rules에서 거부한다.
- 작업 담당자는 화면 표시 이름과 별도로 Google UID(`assigneeId`)를 저장하고, 직원 전용 `staff_profiles` 디렉터리로 이름 변경 이후에도 동일 담당자를 추적한다.
- CMS 공개본(`cms_pages`)과 직원 전용 초안(`cms_page_drafts`)을 분리해 저장 중 초안이 공개 읽기 경로에 노출되지 않도록 했다.
- 홈·토스POS·U+ AI전화·제품·자료실·건의제안·상담·용지 요청은 각각 경로형 정적 HTML 셸과 고유 title, description, canonical, Open Graph URL을 갖는다.
- 공개 사이트 최초 진입에서는 작업관리·달력·메모·백오피스 코드를 실행하지 않고, 내부 모드 진입 시 `InternalWorkspace`를 지연 로드한다.
- APEXA X, Toss Front, AHAPOS 프린터, 금전함, LG U+ 인터넷·전화·CCTV를 역할별 장면으로 분리하고 크롭·중복·매트·비율 문제를 교정했다.
- 모바일 메뉴, 제품 탭, 모달, 폼 오류, reduced-motion, 한글 방향·줄바꿈, 1560/1320 프레임 계약을 실제 렌더 QA로 검사했다.
- 임직원 권한 근거를 재사용 가능한 접속코드에서 Google 로그인 제공자와 `settings/security`의 `adminUids`·`employeeUids` 허용 목록으로 전환했다.
- 건의글 생성 시 클라이언트가 답글 배열이나 타인 UID를 주입할 수 없도록 Rules와 두 게시판 작성 경로를 함께 수정했다.
- 상담·용지·건의 작성에서 동의 전에 개인정보처리방침 전문을 직접 열 수 있게 하고 실제 모달 동작과 작성 상태 복원을 확인했다.
- `npm run release:check`가 파트너 미디어 권리, 운영 UID, Rules 배포, App Check, 실제 접수 왕복, 현행 시각 승인을 한 번에 점검하고 미확인 항목이 있으면 배포를 차단한다.

## 2. 새 문서와 강제 규칙

- `AGENTS.md`: 프로젝트 목표, 금지 사항, 레이아웃·완료 계약
- `DESIGN.md`: 컬러·타이포·그리드·이미지·모션 시스템
- `REFERENCE.md`: 경쟁사 원리와 복사 금지 기준
- `CONTENT.md`: 검증 가능한 공개 카피·CTA·사업 정보 원칙
- `.agents/skills/topinfo-design-review/`: 탑정보통신 시각 세부 품질 감사 스킬·루브릭·에셋 검사기
- `public/assets/README.md`: 출처·권리·모델·용도·교체 게이트
- `docs/baseline-audit-2026-07-18.md`, `docs/content-claim-audit-2026-07-18.md`, `docs/visual-detail-audit-2026-07-18.md`
- `docs/staff-access-migration-2026-07-18.md`: 관리자 잠금 방지를 위한 운영 UID 허용 목록 전환 순서와 롤백 기준

## 3. 정보 구조

- 상단 핵심 진입점: 업종별 추천, 제품·서비스, 토스포스, 프로모션, 고객 지원, 상담
- 공개 라우트 12개: 홈, 토스POS, U+ AI전화, 제품, 업종별 설계, POS 프로모션, 중고·교체, 고객지원, 자료실, 건의제안, 상담, 용지 배송
- 홈 영업 흐름: 브랜드 제안 → 매장 상황 선택 → 업종 추천 → 제품·서비스 사용 장면 → 결합 구성 → 설치·지원 → 상담 CTA
- 제품 탐색: 고정 카테고리 탭, 키보드 이동, 안정 정렬, 단일 결과 레이아웃
- 백오피스: 기존 작업관리·CMS·인증을 보존하고 상담·용지 원본과 작업 연결 추적을 강화

## 4. 주요 컴포넌트 변경

- `WebsiteHeader`, `WebsiteFooter`: 데스크톱·모바일 내비게이션, 포커스 복귀, 연락·상담 CTA
- `PublicHomeExperience`: 9단계 홈 영업 흐름, 업종별 미디어, POS·인터넷·AI전화·CCTV 장면
- `WebsiteBlockRenderer`: 토스POS·제품·프로모션 블록, 제품 탭·카탈로그, 제품 인트로 구성
- `ApexaXVisual`: 공식 하드웨어 원본과 공개 페이지 기반 화면을 분리하고 실제 제원 비율로 APEXA X·CPP-3000·Toss Front를 배치한 제품 렌더
- `PublicForms`, `BackConsultations`: 공개 접수, 실패·성공 상태, 수동 작업 전환
- `InternalWorkspace`, `TaskModal`: 작업관리·달력·메모·알림의 내부 전용 지연 로드 경계와 UID 기반 담당자 디렉터리
- `PublicBoards`: 자료실·건의제안, 접근 가능한 다이얼로그·답변 입력
- `WebAdmin`: CMS·제품·접수 관리, 연결 원본 삭제 차단
- `AuthContext`, `AuthScreens`, `Sidebar`, `firestore.rules`: Google UID 허용 목록 기반 임직원 권한과 접속코드 경로 폐기

## 5. 이미지 구분

- 실제/파트너 원본 기반: POSBANK APEXA X, Toss Front, Toss UI, AHAPOS 프린터, LG U+ 공유기·IP-520GA·CCTV. **출처는 기록했지만 로컬 재배포·편집 권리는 아직 HOLD**다.
- 프로젝트 생성/합성: 사람 없는 CCTV 4분할, AI 로봇 보조 그래픽, 제품 역할 설명용 코드 장면. 실제 설치 사례로 주장하지 않는다.
- 공개 제외: 부적합 제품 합성, 비공식 영수증·후기, 정책 미확인 쿠폰·고객 예시, 반려된 리테일 장면, 구형 U+ 이미지, `generated/system-*` 등 26개 자산을 `.asset-research/rights-pending/`으로 이동했다.
- 재유입 방지: CMS 복원·커스텀 페이지·제품 저장·공개 렌더·재생성 스크립트·`public/` 물리 파일 테스트가 동일 차단 목록을 사용한다.
- 소셜 공유: 제품 권리와 무관한 TOPINFO 전용 1200x630 카드를 사용한다.

## 6. 경쟁사에서 채택한 원리

- Toss Place: 제품 기능을 실제 사용 흐름과 함께 설명하는 방식
- POSMOS: 인터넷·POS·CCTV·전화 결합 상품의 한눈에 보는 구성
- TORDER: 업종 장면과 운영 문제 중심의 시각적 전개
- iShopCare·신신MNC·히엘페이: 제품 분류, 상담 전환, 조건·주의사항의 명시
- TOPINFO 재해석: 블랙·그래파이트·오프화이트·라임 기반에 토스 영역만 제한적으로 블루 사용

## 7. 의도적으로 사용하지 않은 요소

- 경쟁사 문구·페이지·이미지의 직접 복사
- 검증되지 않은 무료·0원·지원금·설치 수치·후기·통계
- 실제 하드웨어처럼 보이는 생성 제품과 생성 한글 UI
- 보라색 AI 그라데이션, 장식용 글래스모피즘, 반복 카드 그리드, 의미 없는 3D 블롭
- 실제 전송 없이 성공을 표시하는 폼

## 8. 변경 파일

### 규칙·문서·감사

`AGENTS.md`, `DESIGN.md`, `REFERENCE.md`, `CONTENT.md`, `.agents/skills/topinfo-design-review/**`, `docs/visual-asset-quality-gate.md`, `docs/baseline-audit-2026-07-18.md`, `docs/content-claim-audit-2026-07-18.md`, `docs/visual-detail-audit-2026-07-18.md`, `docs/visual-detail-gate-live.md`, `docs/staff-access-migration-2026-07-18.md`, `docs/release-candidate-report-2026-07-18.md`, `output/audits/**`, `output/qa/**`

### 공개 사이트·백오피스·데이터

`index.html`, `firestore.rules`, `package.json`, `scripts/rebuild-core-pos-assets.py`, `src/main.tsx`, `src/index.css`, `src/types.ts`, `src/components/TopWebsite.tsx`, `src/components/BackConsultations.tsx`, `src/components/WebAdmin.tsx`, `src/components/WebBoards.tsx`, `src/components/WebForms.tsx`, `src/components/WebsiteBlockRenderer.tsx`, `src/components/WebsiteFooter.tsx`, `src/components/WebsiteHeader.tsx`, `src/components/WebsiteHUDPanel.tsx`, `src/components/public-v3/ApexaXVisual.tsx`, `src/components/public-v3/PublicBoards.tsx`, `src/components/public-v3/PublicExperience.tsx`, `src/components/public-v3/PublicForms.tsx`, `src/components/public-v3/PublicHomeExperience.css`, `src/components/public-v3/PublicHomeExperience.tsx`, `src/components/public-v3/UplusAiPhonePage.tsx`

### 스타일·유틸·테스트

`src/styles/*.css`, `src/utils/cmsSettings.ts`, `src/utils/publicMedia.ts`, `src/utils/publicProducts.ts`, `src/utils/publicRequests.ts`, `src/utils/requestTasks.ts`, `src/utils/sectorContent.ts`, `src/utils/cmsMediaAudit.ts`, `src/utils/publicPageMeta.ts`, `src/utils/sectorMediaPolicy.ts`, 해당 `*.test.ts(x)`, `tests/firestore-rules-static.test.mjs`, `tests/public-browser-qa.mjs`, `tests/public-layout-browser.test.mjs`, `tests/public-performance-audit.mjs`, `tests/helpers/public-layout-audit.mjs`

### 에셋·SEO

`public/assets/README.md`, `public/assets/{generated,product,sector,uplus}/README.md`, `public/assets/generated/cctv-store-grid-person-free-480.webp`, `public/assets/generated/uplus-ai-robot-white-384.webp`, `public/assets/uplus/uplus-ip520ga-white.png`, `public/robots.txt`, `public/sitemap.xml`; 권리 미확인 실인물 원본 2개는 공개 경로에서 제거했다.

## 9. 테스트 결과

- `npm test`: **PASS**, 65 tests / 65 passed
- `npm run test:forms`: **PASS**, 5 tests / 5 passed
- `npm run test:rules-static`: **PASS**, 4 tests / 4 passed
- `npm run test:rules-emulator`: **PASS**, 10 tests / 10 passed
- `npm run lint`: **PASS**, `tsc --noEmit`
- `npm run build`: **PASS**, Vite 4.29s, 2,510 modules transformed, 12개 경로형 정적 HTML 셸과 404 셸 생성
- `git diff --check`: 공백 오류 0; Windows LF→CRLF 안내만 존재
- 제품·CMS·공개 요청·작업 전환·자료실·Firebase 오류·미디어 공개 게이트·홈 렌더 단위 테스트 포함
- 개발·프로덕션 서버 HTTP 확인: 페이지 경로 200, 정상 WebP 200, 제거한 정적 자산 404
- `npm run release:check`: **HOLD(의도된 차단)**, 파트너 미디어 권리 35건과 운영 확인 6건, 자료실 manifest 경고 1건. 원본은 `output/audits/release-readiness-current.json`

## 10. 이전 릴리스 후보에서 확인한 뷰포트

`320x800`, `360x800`, `390x844`, `430x932`, `768x1024`, `820x1180`, `1024x768`, `1280x800`, `1440x900`, `1920x1080`, `2560x1440`

- 12개 공개 라우트 x 11개 뷰포트 = 132개 결과
- P0 0 / P1 0 / P2 0, 가로 오버플로·세로 한글·중요 텍스트 최소 크기·이미지 컨테이너 초과 없음
- 제품·U+ 시각 수정 후 390x844, 1440x900, 2560x1440 재검증 6개 결과도 P0 0 / P1 0 / P2 0
- 상담·용지 개인정보 링크 수정 후 390x844, 1440x900 재검증 4개 결과도 P0 0 / P1 0 / P2 0이며, 상담·용지·건의의 개인정보 모달을 직접 열어 확인했다.
- UI 최종 감사: 동일 시각 세부 품질 감사 에이전트의 재판정 결과를 `output/audits/visual-detail-audit-final.md`에 기록

위 브라우저 증거는 이번 차단 이미지 제거 전 기준이다. 로컬 서버는 `http://localhost:3000/`에서 실행 중이며 페이지·정상 자산·차단 자산의 HTTP 응답만 확인했다. 사용자 지시에 따라 브라우저 자동조작과 현행 화면 시각 재감사는 수행하지 않았으므로 `시각 검수 통과`를 주장하지 않는다.

## 11. 스크린숏·감사 위치

- 전체 QA: `output/qa/release-candidate-final/`
- 스크린숏: `output/qa/release-candidate-final/screenshots/` 132개
- 제품·U+ 수정 후 QA: `output/qa/visual-fix-final/` (6개 결과, 스크린숏 9개)
- 개인정보 링크 QA: `output/qa/privacy-link-targeted/` (4개 결과와 모달 스크린숏)
- 시각 감사: `output/audits/visual-detail-audit-release-candidate.md`
- 현재 공개 에셋 파일 감사: `output/audits/public-assets-gate-2026-07-18.csv`
- 기능·접근성·SEO 감사: `output/audits/release-functional-accessibility-seo-audit.md`
- 콘텐츠·권리·운영 감사: `output/audits/release-content-rights-operations-audit.md`

## 12. 성능 측정

로컬 프로덕션 프리뷰 합성 측정이며 실제 사용자 필드 데이터가 아니다.

| 뷰포트 | FCP | LCP | CLS | 전송량 |
| --- | ---: | ---: | ---: | ---: |
| 390x844 | 196ms | 324ms | 0 | 3,324,512B |
| 1440x900 | 208ms | 316ms | 0.00072 | 3,324,512B |

- 원본: `output/qa/release-candidate-performance-final.json`
- 실제 INP는 사용자 필드 데이터가 없어 미측정이다. 합성 클릭 수치를 INP로 주장하지 않는다.
- 최신 빌드: CSS 378.93kB(60.63kB gzip), 메인 JS 342.34kB(89.48kB gzip), Firestore 264.62kB(60.02kB gzip), 편집기 343.38kB(103.64kB gzip)
- 후속 성능 우선순위: 공개/백오피스 CSS 분리, 편집기 지연 로드 강화, 업종 애니메이션 파생본 축소

## 13. 접근성 결과

- 모바일 메뉴 Escape·포커스 복귀·포커스 트랩 PASS
- 제품 탭 Arrow/Home/End·roving tabIndex·ARIA PASS
- 폼 오류·성공 패널 포커스와 실제 쓰기 후 성공 상태 PASS
- 임직원 건의 답변 입력 접근 가능한 이름 보완
- reduced-motion에서 자동 순환·프리로드 중단
- 남은 증거: 인증된 백오피스 전체 키보드 회귀와 브라우저 125%·150% 확대는 외부 로그인 세션을 포함해 별도 확인 필요

## 14. 실제 연동이 필요한 미완료 항목

- 프로덕션 Firebase에서 상담·용지 성공/실패 저장 → 접수함 노출 → 작업 전환 실제 왕복
- Firebase App Check용 reCAPTCHA Enterprise 초기화 코드는 준비됐지만 운영 site key 등록과 Console enforcement는 미적용
- CAPTCHA 또는 서버 측 rate limit과 스팸 모니터링
- `firestore.rules` 최신 변경의 실제 배포
- 운영 `settings/security`의 `adminUids`·`employeeUids` 사전 구성과 관리자·임직원·비허용 계정 권한 왕복
- 접수 자동 알림이 필요하면 이메일·SMS·알림톡·webhook 별도 구현
- 사용자 정의 CMS·관리자 화면은 기존 query route를 유지하며 공개 표준 12개 경로에 정적 HTML 셸을 제공
- 자료실 신규 등록용 `public/downloads/manifest.json` 실제 파일 항목

## 15. 확인할 사업 정보

- `토스플레이스 직계약 대리점`의 표시 가능한 정확 호칭·유효기간·로고 지침
- POSBANK·Toss Place·AHAPOS·LG U+ 미디어의 로컬 호스팅·크롭·합성·재배포 권리
- 사업자등록증 기준 회사명, 대표 김다미, 주소, 전화, 이메일, 사업자번호 최종 대조
- 개인정보 처리방침 시행일·보유기간·국외 처리 지역·운영 책임자
- 서비스 가능 지역, 설치 조건, 가격·VAT·약정·결합·재고·프로모션 기준일

## 16. 배포 전 사용자 승인 항목

1. 외부 파트너 이미지·브랜드 사용권 증빙 확보 또는 권리 확인된 대체 에셋 제공
2. 운영 Firestore의 `cms_pages`, `products`, `settings/navigation`, `settings/footer` 현재값 전수 확인
3. `docs/staff-access-migration-2026-07-18.md` 순서대로 운영 `settings/security` UID 허용 목록을 먼저 구성
4. 실제 운영 계정으로 폼 왕복·백오피스·작업 전환 확인
5. App Check/스팸 방어와 접수 담당자·확인 주기 확정
6. Git 커밋·push 범위 승인
7. Firebase rules와 Hosting 배포 승인

현재 변경은 **기술 검증됨** 상태다. 현행 화면 시각 재검증, 외부 증빙, 운영 연동 확인 전에는 `시각 검수 통과` 또는 프로덕션 배포 후보로 판정하지 않는다.

자동 릴리스 판정도 같은 이유로 **HOLD**다. 현재 차단 조건은 파트너 미디어 사용권 35건, 운영 UID·Rules 배포·실제 접수 왕복·App Check·현행 시각 승인 6건이며, 이 조건을 환경 변수로 허위 우회하지 않는다.

## Retrospective & Future Improvements (회고 및 개선 방향)

- 이번 작업은 코드 통과와 시각 통과, 외부 권리 통과를 별도 게이트로 분리해 과거의 과도한 완료 선언을 막았다.
- 브라우저 QA는 132개 화면을 매 수정마다 반복하기보다 결함 발생 구간을 먼저 좁혀 수정하고 릴리스 게이트에서만 전체 매트릭스를 실행하는 방식이 더 효율적이었다.
- Firestore 실시간 리스너가 있는 앱은 성능 측정에서 `networkidle`을 완료 조건으로 쓰면 안 된다. `domcontentloaded`와 명시적 안정화 시간을 사용해야 한다.
- 향후 최우선 작업은 새 디자인 추가가 아니라 파트너 원본·권리 증빙, 운영 CMS 스냅샷, 실제 접수 왕복 검증이다.
