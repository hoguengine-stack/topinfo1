# TOPINFO Stage 0 Baseline Audit

- Date: 2026-07-18
- Repository: `hoguengine-stack/topinfo1`, branch `main`
- Local source: `C:\탑정보통신-작업-관리`
- Stack: Vite 6, React 19, TypeScript, Firebase, Express development/static server
- Scope: public website, CMS defaults, forms, media, public navigation, responsive baseline
- Protected scope: existing Firebase/back-office workflows and user changes

## Architecture

The public website is a query-driven SPA (`?page=<slug>`), not Next.js. The existing public views are:

- `home`
- `toss_pos`
- `uplus_ai_phone`
- `products`
- `board_resources`
- `board_suggestions`
- `request_consult`
- `request_paper`
- protected `admin`

Internal work-management views remain state-driven inside the same application. Public redesign must not replace or break them.

## Working Baseline

- Consultation and paper-request forms perform real Firestore writes.
- Telephone links use `031-487-4401` consistently.
- The current public routes return successfully and have no baseline document-level horizontal scrollbar at `390x844`, `1440x900`, or `2560x1440`.
- Mobile menu, customer-support menu, industry selection, FAQ, and form label association exist.
- Current Node tests cover CMS migration/data, request payloads, resource mapping, products, Firebase error messages, and limited static home markup.

## P1 Findings

1. The existing layout stops at approximately `1240px`; it does not meet the requested `1560px` frame and `1320px` content contract on ultrawide displays.
2. Mobile Toss POS controls can remain geometrically outside the viewport even when document scroll width is hidden.
3. Public mobile form controls render at approximately `13px`; inputs/selects/textareas need at least `16px`.
4. Mobile navigation lacks a complete modal focus contract: initial focus, trap/background inertness, and trigger focus return.
5. Customer-support navigation uses ARIA menu roles without full menu keyboard behavior.
6. SPA page changes do not update document title/description or move focus to the new page start.
7. Public Firestore forms have validation but no App Check/CAPTCHA/rate-limit abuse defence.
8. Copy suggesting immediate work-task creation is inaccurate: consultation creates a consultation record first; staff conversion creates a task.
9. Public media has no `srcset`/`sizes`; several active images are 2.4-2.9MB.
10. Design tokens, breakpoints, and layout rules are split across multiple CSS layers with many literal colors.
11. Production error handlers can hide WebSocket-string errors and reduce observability.

## Media Baseline

- Approximately 109 files / 34.2MiB in `public/assets` at audit time.
- Multiple product and partner assets still require local-redistribution confirmation.
- Cafe and restaurant receipt examples are project composites and not sufficient official Toss receipt evidence.
- Retail barcode visuals do not clearly show a physical scanner reading a product and causing a POS result.
- Representative LG U+ router/model imagery and several low-resolution product cutouts require partner master verification.
- Generated or composited scenes must be identified as such and cannot imply real customer installations.

## Test Gaps

Current automated checks do not sufficiently cover:

- Actual DOM interaction and browser history
- Keyboard focus/menu/modal/tab behavior
- Computed font size, writing mode, ancestor rotation, overflow, and one-character Korean wrapping
- Ultrawide frame measurements
- Image crop, intrinsic size, responsive source selection, and layout shift
- Firestore emulator/rules integration, App Check, network failure, and duplicate submission
- Link integrity, service-worker behavior, performance, and visual regression

## Baseline Evidence

Stage 0 screenshots exist in the local audit artifact directory:

`C:\Users\qpalz\문서\탑정보통신작업관리\.visual-audit\redesign-2026\baseline-screenshots`

They include home, products, Toss POS, resources, suggestions, consultation, and paper-request views at mobile, desktop, and ultrawide sizes, plus menu, industry, and FAQ states.

## Implementation Contract

1. Preserve Vite/React/Firebase and the back office.
2. Apply the project documents and `.agents/skills/topinfo-design-review/SKILL.md` before public UI changes.
3. Establish 1560/1320 layout tokens and one breakpoint system.
4. Fix navigation semantics/focus and SPA title/focus behavior before expanding information architecture.
5. Replace or hold unverified media rather than generate product lookalikes.
6. Separate new consultation from existing-customer support.
7. Add responsive derivatives and a media budget.
8. Add rendered Playwright/accessibility/layout checks and visual evidence.
9. Use `구현됨`, `기술 검증됨`, `시각 검수 통과`, and `배포 후보` as separate states.
10. Do not push or deploy without explicit approval.

