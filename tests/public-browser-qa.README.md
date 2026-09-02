# TOPINFO Public Browser QA

`tests/public-browser-qa.mjs`는 사용자의 브라우저를 건드리지 않고 headless Chromium에서 공개 사이트를 검사하는 재사용 실행기입니다. 앱 소스, Firebase 데이터, `package.json`을 수정하지 않으며 상담 폼은 빈 값 검증까지만 실행하고 실제 접수 요청은 보내지 않습니다.

## 기본 실행

먼저 실제 저장소 경로에서 개발 서버를 실행합니다.

```powershell
cd C:\탑정보통신-작업-관리
npm run dev
```

다른 터미널에서 전체 QA를 실행합니다.

```powershell
node tests/public-browser-qa.mjs
```

기본 대상은 다음과 같습니다.

- 라우트: 홈, 토스POS, U+ AI전화, 제품, 상담
- 뷰포트: `320x800`, `360x800`, `390x844`, `430x932`, `768x1024`, `820x1180`, `1024x768`, `1280x800`, `1440x900`, `1920x1080`, `2560x1440`
- 모션: `prefers-reduced-motion: reduce`
- 실패 기준: P1 이상

## 빠른 범위 실행

반복 작업 중에는 관련 라우트와 대표 뷰포트만 실행합니다.

```powershell
node tests/public-browser-qa.mjs --routes=home,toss-pos --viewports=390,1440,2560
```

스크린숏 없이 DOM 검사만 실행할 수 있습니다.

```powershell
node tests/public-browser-qa.mjs --screenshots=false --viewports=390
```

결함을 기록하되 종료 코드를 실패로 만들지 않으려면 다음을 사용합니다.

```powershell
node tests/public-browser-qa.mjs --fail-on=none
```

지원 옵션:

```text
--base-url=http://localhost:3000
--routes=home,toss-pos,uplus-ai-phone,products,consultation
--viewports=390,1440,2560
--output=output/qa
--screenshots=true|false
--fail-on=P0|P1|P2|none
```

같은 값은 `TOPINFO_QA_BASE_URL`, `TOPINFO_QA_ROUTES`, `TOPINFO_QA_VIEWPORTS`, `TOPINFO_QA_OUTPUT`, `TOPINFO_QA_SCREENSHOTS`, `TOPINFO_QA_FAIL_ON` 환경 변수로도 지정할 수 있습니다.

## Playwright 준비

실행기는 `package.json`을 변경하지 않기 위해 다음 순서로 Playwright를 찾습니다.

1. 기존 로컬 `node_modules/playwright`
2. 기존 `npx` 캐시의 Playwright
3. 설치된 Chrome 또는 Edge 실행 파일

Playwright 또는 Chromium이 없다면 한 번만 다음 명령으로 격리된 `npx` 캐시를 준비합니다.

```powershell
npx --yes playwright install chromium
```

특정 Playwright 패키지나 브라우저를 사용해야 할 때는 다음 환경 변수를 사용할 수 있습니다.

```powershell
$env:TOPINFO_PLAYWRIGHT_PATH = 'C:\path\to\node_modules\playwright'
$env:TOPINFO_CHROMIUM_EXECUTABLE = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
```

## 검사 범위

- 문서 및 공개 사이트 루트의 가로 오버플로
- `1560px` 사이트 프레임과 `1320px` 콘텐츠 계약
- 한국어 `writing-mode`, 조상 회전/뒤집힘, 한 글자 줄바꿈 위험
- 중요 본문 `14px` 및 모바일 폼 `16px` 기준
- 이미지 로딩, 고유 크기, 명시적 `width`/`height`, 왜곡, 과도한 확대, 컨테이너/뷰포트 이탈
- 제품 이미지의 `object-fit: cover` 크롭 위험
- 이미지 `alt`와 비디오 소스 오류
- CTA와 일반 인터랙션의 접근 가능한 이름과 링크 대상
- 폼 라벨, 필수 상태, 제출 버튼, 빈 값 검증, 오류 포커스, 가짜 성공 상태
- 탭의 `aria-selected`, `aria-controls`, `tabpanel` 관계와 키보드 이동
- 데스크톱/모바일 메뉴 열기, Escape 닫기, 포커스 반환
- 모바일 고정 CTA와 본문 충돌
- 터치 영역, 중복 ID, 잘못된 ARIA 참조
- 브라우저 `pageerror`, 콘솔 오류, 요청 실패, HTTP 4xx/5xx 리소스

Firestore 실시간 리스너가 연결을 교체하면서 발생시키는 `Listen/channel`의 정상적인 `net::ERR_ABORTED`는 네트워크 결함에서 제외합니다. 그 밖의 Firestore 오류, HTTP 오류, 스크립트·스타일·이미지 실패는 그대로 기록합니다.

## 산출물

기본 출력 경로는 `output/qa`입니다.

```text
output/qa/public-browser-qa-report.json
output/qa/screenshots/home-390x844-default.png
output/qa/screenshots/home-390x844-menu-open.png
output/qa/screenshots/products-1440x900-tab-2.png
output/qa/screenshots/consultation-390x844-validation-error.png
```

스크린숏 이름은 `route-widthxheight-state.png` 규칙을 따릅니다. `output/qa`의 대량 PNG와 JSON 보고서는 실행 증거이며 기본적으로 커밋 대상으로 간주하지 않습니다.

## 판정 해석

- `P0`: 허위 성공, 심각한 기능·사실·보안 문제
- `P1`: 배포 차단. 오버플로, 잘림, 깨진 미디어, 접근성·폼·메뉴·탭 실패
- `P2`: 수정 필요. 이미지 확대, 고유 크기 누락, 콘솔 오류 등 품질 저하

스크립트가 통과해도 제품 사실·이미지 권리·실물 비율과 시각적 구성은 별도 `탑정보통신 시각 세부 품질 감사`를 통과해야 합니다. 자동 검사는 육안 품질 승인이나 전체 배포 승인을 대신하지 않습니다.
