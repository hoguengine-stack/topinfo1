---
name: topinfo-design-review
description: Review and gate every TOPINFO public-site visual or interaction change for product truth, exact model proportions, media rights, composition craft, Korean typography, responsive layout, accessibility, conversion clarity, and rendered-browser quality. Use this skill when changing the homepage, navigation, sections, cards, buttons, tabs, forms, product/industry/promotion/support pages, CSS, responsive behavior, generated media, official product media, composites, animations, or CMS default content; also use it before declaring any design task complete.
---

# TOPINFO Design Review

## Overview

This is the mandatory `탑정보통신 시각 세부 품질 감사`. It prevents technically valid but visually false, generic, cropped, unreadable, unlicensed, or incomplete public-site work from being approved.

Passing TypeScript, tests, or a production build is not visual approval. The review requires the rendered route and explicit evidence.

## Load Project Context

Before review, read:

1. `AGENTS.md`
2. `DESIGN.md`
3. `CONTENT.md`
4. `REFERENCE.md`
5. `public/assets/README.md`
6. `public/assets/MEDIA_POLICY.md`
7. The README in every affected asset directory
8. `references/review-rubric.md`

Inspect Git status and preserve user changes. Review the real Vite + React + Firebase repository; do not assume a Next.js structure.

## Severity

- **P0 Blocker:** false product/model/UI, invented claim, missing rights, identifiable person without permission, broken submission, security/privacy problem, missing critical content.
- **P1 Blocker:** clipped or unreadable media/text, wrong physical scale, visible compositing failure, inaccessible navigation/form, horizontal overflow, one-character Korean wrapping, major mobile/ultrawide failure.
- **P2 Revision:** inconsistent spacing, repeated composition, weak hierarchy, excessive text, generic styling, performance waste, low-value motion.
- **PASS:** explicitly checked and evidenced. No issue report is not an implicit pass.

P0 and P1 findings block release. A P2 may remain only when documented with owner, impact, and planned correction.

## Workflow

### 1. Establish The Claim

Write one sentence for what the section or image must prove. Identify the intended user, action, route, viewport, and evidence. If the claim is unclear, revise the content before polishing visuals.

### 2. Verify Facts And Rights

For every product, UI, logo, price, promotion, customer, or installation image, record:

- Manufacturer, exact model/variant, and current status
- Official or partner source and collection date
- Real dimensions and supported functions
- Local file/hash and allowed edits/redistribution
- Which party provides the product/service and what TOPINFO handles

Reject generated lookalike hardware, generated Korean UI, fake numbers, fake cases, and unverified benefit claims.

### 3. Review The Source Asset

Run:

```powershell
python .agents/skills/topinfo-design-review/scripts/audit_assets.py public/assets
```

Then inspect high-risk assets at original size. Reject:

- White matte rectangles, extraction halos, color spill, watermarks
- Blurred logos, controls, or text caused by enlargement
- Duplicate/near-duplicate media without separate roles
- Unreadable first frames or animation without static fallback
- Product crops that hide the silhouette without an intentional detail purpose

### 4. Review Product Composition

When multiple products appear together:

1. Compute relative size from physical dimensions.
2. Use a shared ground plane and coherent perspective.
3. Match light direction, color temperature, sharpness, and contact shadows.
4. Prevent intersections and floating objects.
5. Keep the POS on the cash drawer when that is the real configuration.
6. Keep printer controls, paper slot, and product identity visible.
7. Keep Front/peripherals at plausible scale.
8. Use verified UI edge-to-edge inside the real display aperture.

Review the final composite in the actual page slot, not only as an isolated image.

### 5. Review Visual Design

Check that:

- Real content leads decoration.
- The page does not use generic AI SaaS motifs.
- Sections do not repeat the same card grid or product composition.
- TOPINFO remains the responsible brand; partner blue/logos do not take over.
- Black/graphite/warm white/lime tokens follow `DESIGN.md`.
- Each section has one dominant idea, media treatment, and primary CTA.
- Typography uses the semantic roles and fixed breakpoint sizes in `DESIGN.md`; the same role may not receive a page-specific arbitrary size.
- Korean prose wraps by words. Telephone numbers, email addresses, business registration numbers, model identifiers, and short CTA labels never break internally.
- Images and text have intentional balance at mobile, desktop, and ultrawide sizes.
- The page looks designed for POS installation and store operations, not for an unrelated app.

### 6. Review Interaction And Accessibility

Exercise, with keyboard where applicable:

- Desktop mega menu and mobile accordion/dialog navigation
- Industry/product selectors and tabs
- FAQ
- Telephone links
- Consultation and paper forms, including validation/failure
- Resource and suggestion boards

Confirm focus visibility/return, correct semantics and ARIA state, labels and errors, 44px touch targets, reduced motion, and meaningful media fallbacks.

### 7. Render Required Viewports

Use terminal Playwright/headless browser evidence. Do not control the user's interactive browser.

Minimum for a scoped component change: `390x844`, `1440x900`, `2560x1440`.

Release set: `320x800`, `360x800`, `390x844`, `430x932`, `768x1024`, `820x1180`, `1024x768`, `1280x800`, `1440x900`, `1920x1080`, `2560x1440`.

For each affected route check:

- Horizontal overflow and off-screen interactive controls
- 1560px frame and 1320px content measurements
- Header/body guide alignment
- Text clipping, overlap, vertical writing, rotation, and one-character Korean wrapping
- Mid-token wrapping of telephone, email, business registration, model, price, or short action text
- Hero, section, subsection, card, body, label, and metadata sizes against the shared typography tokens
- Media loading, crop, full silhouette, and responsive source selection
- Fixed CTA/content collision
- Menu Escape/focus behavior
- Form label/error/submission behavior
- 125% and 150% zoom for shared navigation/layout changes

Save screenshots as `route-widthxheight-state.png` and compare after fixes.

### 8. Score And Report

Score 0-5 for:

1. Fact and product fidelity
2. Visual hierarchy
3. Composition and balance
4. Typography and readability
5. Image craft and consistency
6. Brand specificity
7. Interaction usefulness
8. Responsive integrity
9. Accessibility
10. Conversion clarity

Any score below 4 requires revision. Fact/product fidelity, responsive integrity, and accessibility must score 5 to pass.

Report findings before summary, ordered P0 -> P1 -> P2, with route, viewport, screenshot, selector/component, cause, and corrective action. State exactly what was not verified.

## Approval Language

Use precise status:

- `구현됨`: code exists; not yet visually approved.
- `기술 검증됨`: relevant automated checks passed.
- `시각 검수 통과`: all required rendered checks and hard gates passed.
- `배포 후보`: full tests, release viewports, accessibility, performance, facts, and rights passed.

Never say `완성`, `해결`, or `검수 완료` when only a build or partial screenshot exists.

## Release Command Gate

Run the smallest relevant tests while iterating. At the final release candidate, run:

```powershell
npm test
npm run lint
npm run build
```

These checks are necessary at the gate but never replace browser and visual review. Do not push or deploy without explicit user approval.

## Resources

- `references/review-rubric.md`: detailed hard-gate checklist and evidence template.
- `scripts/audit_assets.py`: read-only asset inventory for dimensions, format, size, alpha, animation, and hashes.
