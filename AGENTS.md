# TOPINFO Project Rules

## Goal

- TOPINFO is the field partner that plans a store's operating flow, installs the required equipment, explains its use, and supports the store after installation.
- The primary public-site conversions are a phone call to `031-487-4401` and a consultation request that is actually stored in Firestore.
- A visitor must be able to start from their store type or operating problem even when they do not know product names.
- Preserve the existing Vite + React + Firebase application, CMS, public forms, and back-office workflows. Do not migrate frameworks unless the user explicitly approves it.

## Main Users

- Owners preparing a new store
- Operators replacing an existing POS
- Stores considering kiosks, table ordering, delivery, printers, or network integration
- Franchise and multi-store managers
- Customers considering Toss POS
- Customers considering used or replacement POS equipment
- Existing customers requesting support, paper, or operating materials

## Read Before Editing

Before changing public UI, content, navigation, media, or responsive behavior, read:

1. `AGENTS.md`
2. `DESIGN.md`
3. `REFERENCE.md`
4. `CONTENT.md`
5. `public/assets/README.md`
6. `public/assets/MEDIA_POLICY.md`
7. `.agents/skills/topinfo-design-review/SKILL.md`

For product-image work, also read the README in the affected asset subdirectory.

## Facts And Rights

- Never invent statistics, discounts, free benefits, customer reviews, government support, installation counts, response times, service areas, or nationwide branches.
- Never publish a price or promotion without the target, period, VAT, contract party, term, combination requirements, installation cost, exclusions, and reference date.
- Keep TOPINFO, Toss Place, LG U+, POSBANK, and AHAPOS responsibilities clearly separated.
- Treat `토스플레이스 직계약 대리점` as a claim that requires current documentary support.
- Product names, dimensions, screens, logos, and compatibility must come from verified official or partner material.
- Do not generate fake Toss hardware, fake Toss UI, fake LG U+ hardware, customer testimonials, installation cases, certificates, or Korean text inside generated images.
- Do not publish identifiable people or customer stores without documented advertising and portrait/property permission.
- Record every public asset's source, rights status, dimensions, optimization, and page usage in `public/assets/README.md` or its linked manifest.

## Absolute Prohibitions

- No vertical Korean writing, rotated Korean text, or parent transforms that indirectly rotate text.
- No one-character Korean wrapping caused by narrow containers.
- No important body text below `14px`; `12px` is only for codes, numbering, dates, or secondary metadata.
- No meaningless English labels, fake status chips, fake dashboards, decorative charts, or invented `LIVE`/`connected` states.
- No generic purple AI gradients, glassmorphism, floating blobs, neon glows, or decorative 3D spheres.
- Do not turn every section into the same rounded card grid.
- Do not copy competitor copy, images, illustrations, UI captures, or complete page layouts.
- Do not show a success state for a form unless the real write request succeeded.
- Do not mark work complete based only on TypeScript, tests, or a production build.
- Do not mark visual work complete without rendered browser review at the required viewports.
- Do not push, deploy, change Firebase configuration/rules, or modify external services without explicit user approval.
- Do not remove or revert user changes. Never use `git reset --hard` or destructive checkout commands.
- Do not change the TOPINFO logo without explicit approval.

## Layout Contract

- Site frame: maximum `1560px`, centered on ultrawide displays.
- Main content: maximum `1320px`, centered within the site frame.
- Desktop gutter: at least `40px`; tablet `24-32px`; mobile `20-24px`.
- Minimum supported viewport: `320px`.
- Use an 8px spacing system and named tokens. Avoid isolated magic spacing values.
- The same media role must use the same aspect ratio, radius, background, and alignment across pages.
- Product packshots default to `contain`; editorial/store photography may use `cover` only after mobile and desktop crop review.
- At `2560px`, content must remain visually substantial. Do not leave a narrow `1240px` island inside uncontrolled empty space.

## Typography Contract

- Load Pretendard Variable explicitly with Korean system-font fallbacks.
- Desktop: H1 `72-96px`, H2 `48-64px`, H3 `26-36px`, body large `18px`, body `16px`, metadata `12-13px`.
- Mobile: H1 `42-52px`, H2 `34-42px`, H3 `24-30px`, body at least `15px`, controls at least `14px`.
- Form inputs on mobile must use at least `16px` to protect readability and avoid zoom behavior.
- Do not use negative letter spacing as a default. Never scale font size directly with viewport width.
- Limit body measure so Korean paragraphs remain easy to scan.

## Product Media Gate

No product visual may ship until all of the following are true:

1. Manufacturer and exact model/variant are known.
2. Source URL or partner master is recorded.
3. Real dimensions are recorded and composition scale is derived from them.
4. The full product silhouette is visible unless a deliberate detail crop is documented.
5. Product screens use verified official UI, not generated text.
6. Matte boxes, extraction halos, watermarks, perspective conflicts, intersections, and floating shadows are absent.
7. Lighting, color temperature, ground plane, and shadow direction agree within a composite.
8. `object-fit`, `object-position`, and responsive derivatives have been tested in the consuming slot.
9. Repeated use has a distinct role: overview, close-up, usage scene, or specification.
10. The visual-detail audit gives an explicit PASS. Absence of a reported issue is not approval.

## Interaction And Accessibility

- Use real links for navigation and buttons for commands.
- Menus must work with keyboard, Escape, focus return, and visible focus.
- Mobile modal navigation must trap focus and make the background inert.
- Tabs must implement the full tab keyboard contract or use ordinary button groups instead of false ARIA tabs.
- Every meaningful image needs useful alt text; decorative media must use empty alt or `aria-hidden`.
- Form labels must be programmatically associated. Errors must identify the field and move focus appropriately.
- Touch targets must be at least `44px` where practical.
- Respect `prefers-reduced-motion`; autoplay media needs a meaningful static fallback.

## Working Method

1. Inspect the affected code, CMS default, current browser rendering, and Git status.
2. State the visual or behavioral hypothesis before a risky or ambiguous change.
3. Implement one coherent section/component at a time.
4. Run the smallest relevant test first.
5. Render the affected route at mobile, desktop, and ultrawide sizes.
6. Apply `.agents/skills/topinfo-design-review/SKILL.md` and fix all P0/P1 findings.
7. Capture updated evidence before moving to the next section.
8. Run the full test/lint/build suite only at a release gate or when shared contracts changed.

## Required Viewports

`320x800`, `360x800`, `390x844`, `430x932`, `768x1024`, `820x1180`, `1024x768`, `1280x800`, `1440x900`, `1920x1080`, `2560x1440`.

Also review keyboard-only operation, `prefers-reduced-motion`, and browser zoom at `125%` and `150%` for shared layout changes.

## Completion Gate

- `npm run build`, `npm test`, and `npm run lint` pass at the final release-candidate gate.
- All major public routes render without horizontal overflow, clipped controls, broken media, rotated text, or Korean one-character wrapping.
- Header, mobile navigation, product/industry controls, FAQ, telephone links, consultation form, paper request, resources, and suggestions are directly exercised.
- The 1560/1320 width contract is measured in rendered DOM at ultrawide size.
- Image dimensions, crop behavior, asset rights, accessibility, and performance are reviewed.
- Screenshots are stored with route, viewport, and state in their filenames.
- Remaining external dependencies, unverified business facts, and asset-rights blockers are reported explicitly.
- Deployment and Git push remain pending until the user approves them.

