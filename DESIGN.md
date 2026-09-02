# TOPINFO Design System

## Brand Position

TOPINFO should feel like a field-proven store systems company: accurate, organized, current, and practical without becoming a cold equipment catalogue. The public site must make hardware and real operating flows easy for a Korean store owner to understand.

Brand standard:

> 계산대가 아니라 매장의 흐름을 설계합니다.

This is a direction, not a slogan to repeat on every page. The visual story is **store situation -> verified product and UI -> installation and support responsibility**.

## Signature Direction: Field Design Desk

The site is structured as a field design desk and digital handover record for a store that is ready to operate. Its memorable device is the **Counter Flow Rail**, not a decorative hero effect.

- Begin with the owner's operating situation, not a wall of model numbers.
- Use one substantial visual claim per section.
- Pair a claim with evidence: actual product, official UI, installation condition, source, or support process.
- Use measured lines, section indexes, and status indicators only when they represent real handover information.
- Keep TOPINFO visually responsible for consultation, configuration, installation, education, and support. Partner brands describe products; they do not replace TOPINFO's identity.
- Prefer large unframed editorial media and structured comparison tables over repeated decorative cards.

### Counter Flow Rail

```text
ORDER -> PAYMENT -> OUTPUT -> MANAGEMENT
주문 유입   결제       출력·주방 전달   매출·고객 관리
```

- On home it is the operating-method selector.
- On product pages it locates where a product connects to the store flow.
- On industry pages it highlights the steps used by that industry.
- On installation pages it becomes a real network, cable, printer, and handover checklist.
- The selected step can use lime; verified Toss product/UI steps can use Toss blue inside the Toss module.
- Do not add other competing timelines, fake connection maps, or decorative numbered rails.

## Visual Character

- Industrial precision without factory severity
- Editorial clarity without luxury-magazine affectation
- Modern Korean commercial context, not generic global SaaS
- Real equipment scale and operational evidence
- Restrained motion that demonstrates a flow
- Clear hierarchy for owners scanning quickly on mobile

Avoid soft, floating AI interfaces; dark blue SaaS dashboards; excessive rounded cards; glass panels; neon; stock-photo smiles; and generic 3D device clouds.

## Color Tokens

```css
:root {
  --color-black: #080b0e;
  --color-graphite: #12171c;
  --color-panel: #181e24;
  --color-line: #2b3239;
  --color-white: #f2f1eb;
  --color-paper: #e9e8e2;
  --color-lime: #c7f45b;
  --color-lime-dark: #9ccc34;
  --color-toss-blue: #2563f4;
  --color-topinfo-blue: #1265e8;
  --color-ink: #111722;
  --color-muted: #5d6673;
  --color-danger: #c73232;
  --color-success: #477600;
}
```

Rules:

- Black, graphite, warm white, paper, and lime form the TOPINFO system.
- Warm white/paper is the primary reading surface. Dark stages are reserved for product/UI theatre, specifications, footer, and dense technical sections.
- Lime is a scarce operational signal or primary conversion accent. Do not spread it across every heading and background.
- Toss blue is limited to verified Toss product/service modules. It must not become the whole site's theme.
- The existing TOPINFO logo retains its original blue. Do not recolor or redraw it.
- Use one accent system per section. Never mix lime, TOPINFO blue, and Toss blue as equal accents.
- Every foreground/background pair must meet WCAG AA; normal text targets `4.5:1`.

## Typography

Primary font:

```css
font-family: "Pretendard Variable", Pretendard, -apple-system,
  BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif;
```

Use the existing licensed local WOFF2. Keep a Korean-safe fallback stack and `font-display: swap`.

| Role | Wide desktop | Desktop | Tablet | Mobile | Line height |
| --- | ---: | ---: | ---: | ---: | ---: |
| Display / H1 | 72px | 64px | 48px | 42px | 1.1 |
| Section / H2 | 52px | 48px | 40px | 34px | 1.16 |
| Narrative / H3 | 32px | 30px | 28px | 26px | 1.24 |
| Card title | 24px | 24px | 22px | 21px | 1.3 |
| Body large | 18px | 18px | 17px | 17px | 1.65 |
| Body | 16px | 16px | 16px | 16px | 1.65 |
| Small body / label | 14px | 14px | 14px | 14px | 1.4-1.5 |
| Metadata | 13px | 13px | 13px | 13px | 1.4 |
| Button | 15px | 15px | 15px | 15px | 1.2 |

Typography rules:

- Korean titles should use natural wrapping. Do not use negative tracking as a default.
- Never place Korean text in rotated or vertical containers.
- H1 should be no more than three lines. Prefer 12-18 Korean characters per title line.
- Paragraphs should usually be 2-4 lines with a measure of roughly 28-38 Korean characters.
- Avoid forced `<br>` unless the exact desktop and mobile breaks have been rendered.
- Monospace is limited to model numbers, versions, dates, and short system labels.
- Labels below `13px` must not carry critical meaning.
- Use fixed breakpoint steps rather than viewport-scaled font sizes. The same semantic role uses the same token on every public page.
- Korean prose uses `word-break: keep-all`; headings may balance and paragraphs may use pretty wrapping.
- Telephone numbers, email addresses, business registration numbers, model identifiers, and short CTA labels stay as indivisible tokens with `white-space: nowrap`.
- When several company facts share a row, wrap between facts rather than inside a telephone number or identifier.

## Width And Grid

```css
:root {
  --site-frame-max: 1560px;
  --content-max: 1320px;
  --gutter-desktop: 40px;
  --gutter-tablet: 28px;
  --gutter-mobile: 20px;
  --space-section-desktop: 144px;
  --space-section-tablet: 104px;
  --space-section-mobile: 72px;
}
```

- Use a 12-column desktop grid where a grid clarifies alignment.
- The frame handles full-page backgrounds and ultrawide composition; the content grid handles readable material.
- Header, hero copy, section headings, media, comparison tables, and footer must share intentional left/right guides.
- Desktop gutters are at least 40px, tablet 24-32px, and mobile 20-24px.
- Use an 8px spacing scale: `4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 120, 144, 160`.
- Cards have at most 8px radius unless a physical product shape or established component requires otherwise.
- Do not place cards inside cards or turn whole page sections into floating cards.

## Section Rhythm

Home uses at most seven primary chapters:

1. What TOPINFO hands over: hero and direct conversion
2. What the owner needs now: situation selector
3. How the store operates: industry flow
4. Which verified products connect: product system
5. Which current conditions apply: promotion module
6. How installation and support work: handover process/evidence
7. Support and consultation: existing customer versus new inquiry

Each chapter gets one dominant idea, one dominant media treatment, and one primary CTA. Alternation comes from composition, not random background colors.

## Image System

| Media role | Ratio | Fit | Typical use |
| --- | --- | --- | --- |
| Hero store scene | 16:10 or full-bleed | cover | real store context with safe text crop |
| Product packshot | 4:3 | contain | exact model and dimensions |
| Installation case | 4:3 | cover | real installation evidence |
| Feature visual | 1:1 or 3:2 | contain/cover by asset type | one verified function |
| Wide operating flow | 16:9 | contain | UI or multi-step workflow |
| Mobile campaign | 4:5 | cover | mobile editorial module |

Rules:

- Product cutouts use a consistent neutral stage, ground line, perspective, and shadow family.
- Actual dimensions determine relative scale in a multi-product composition.
- Hardware screens must show verified official UI at readable resolution; generated Korean UI is prohibited.
- Product imagery uses `contain` by default. Store photography can use `cover` only with a documented focal point.
- Never enlarge a low-resolution asset until logos, controls, or extraction edges blur.
- Do not repeat the same composition in adjacent sections. Use overview, detail, in-use, and specification roles deliberately.
- Every responsive image must set intrinsic width/height and `sizes`; provide derivatives for high-cost assets.
- Only the LCP image is eager/priority. Below-the-fold media is lazy-loaded.

## Product Composition Standard

For composite package visuals:

1. Record physical dimensions and select a shared scale.
2. Put the cash drawer under the POS when that is the real configuration.
3. Keep the printer recognizable; do not hide the paper slot, controls, or logo behind the POS.
4. Scale Toss Front and peripherals from real dimensions rather than visual convenience.
5. Align camera height, perspective, color temperature, and contact shadows.
6. Remove white matte boxes and extraction halos.
7. Prevent objects from intersecting, floating, or clipping.
8. Use a stable baseline and sufficient negative space around the full silhouette.
9. Test the final composition in its actual CSS slot, not only as a standalone file.

## Components

- Buttons: icon where familiar, text when the command needs clarity. Primary conversion uses lime on dark or graphite on lime; Toss module actions may use Toss blue.
- Tabs: use segmented controls for a small set and a sticky horizontal industry selector only when the content changes in place. Avoid nested tab systems.
- Cards: reserved for repeated products, cases, or structured choices. Prefer borders over large shadows.
- Comparison tables: visible labels, sticky first column when needed, semantic table markup, mobile alternative when horizontal reading fails.
- Forms: full labels, concise help, per-field errors, 16px mobile inputs, explicit privacy consent, actual submission state.
- Navigation: mega menu organized by owner need, industry, product/service, and after-install support. Mobile uses accessible accordion navigation.
- Fixed CTA: one compact action bar only after the primary CTA is out of view; account for safe areas and never cover content.

## Motion

- Motion must explain state, ordering, connection, or cause and effect.
- Standard duration: `160-300ms`; no bounce by default.
- Do not autoplay tabs or replace a user's selection.
- Autoplay video/animation is muted, viewport-aware, and has a meaningful first/static frame.
- Provide pause when motion continues long enough to distract; always honor `prefers-reduced-motion`.
- Avoid horizontal scroll hijacking, decorative parallax, giant floating objects, and route-level loading overlays.

## Responsive Behavior

- Mobile design is a deliberate composition, not a compressed desktop page.
- Media may reorder only when reading order and screen-reader order remain coherent.
- Keep controls stable so labels, hover, and dynamic content do not shift the layout.
- At `320px`, long Korean nouns, email, phone, business number, and CTA labels must wrap without clipping.
- At `2560px`, the main scene should use the 1560px frame and 1320px content contract rather than remaining a 1240px island.
- Browser zoom at 125% and 150% must not cause menu overlap or one-character wrapping.

## Design Review Score

Score each major section from 0-5 in these categories:

- Fact and product fidelity
- Visual hierarchy
- Composition and balance
- Typography and readability
- Image craft and consistency
- Brand specificity
- Interaction usefulness
- Responsive integrity
- Accessibility
- Conversion clarity

Any score below 4 is a revision. Product fidelity, responsive integrity, and accessibility are hard gates: a score below 5 blocks release. Artistic polish never compensates for incorrect hardware, unreadable UI, poor crop, or invented facts.
