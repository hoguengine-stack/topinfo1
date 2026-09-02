# TOPINFO Public Asset Register

This directory contains media shipped with the public site. Read `MEDIA_POLICY.md` before adding or replacing media, and read each subdirectory README for source-specific notes.

## Publication Rule

An asset may be referenced by CMS defaults or product data only when its register entry contains:

- File name and intended role
- Manufacturer/product/model or `non-product illustration`
- Original source URL or partner master identifier
- Source/collection date
- Actual photo, official render/UI, project composite, or generated background
- Original width, height, format, and SHA-256
- Product dimensions where scale matters
- Allowed crop/edit/logo/redistribution scope
- Optimized derivative and responsive sizes
- Consuming route/component
- Alt text and `contain`/`cover` rule
- Review status and next review date

Missing rights or product facts are a publication blocker, not a small documentation issue.

## Asset Classes

| Class | Allowed use | Required treatment |
| --- | --- | --- |
| TOPINFO brand | Header, footer, metadata | Preserve the approved logo and proportions |
| Official product packshot | Product, composition, specification | Keep silhouette and scale; use `contain`; record official source |
| Official product UI | Feature evidence | Do not generate or rewrite text; keep controls readable |
| Actual installation photo | Case/evidence | Record customer, location granularity, photographer, and publication consent |
| Project composite | Package overview | List every source layer and measured product dimensions |
| Generated non-product background | Hero/concept only | No fake hardware, UI, logos, Korean text, customer, or installation claim |
| Partner campaign media | Promotion only | Confirm current partner redistribution/edit rights and all conditions |

## Directory Map

| Directory | Purpose | Source notes |
| --- | --- | --- |
| `brand/` | TOPINFO mark and approved third-party sign-in mark | `brand/README.md` |
| `fonts/` | Licensed local Korean font | `fonts/README.md`, `fonts/OFL.txt` |
| `product/` | POSBANK, Toss, AHAPOS, and peripheral product/UI references | `product/README.md` |
| `sector/` | Industry-specific official UI, animation, and project scenes | `sector/README.md` |
| `operations/` | Operating-feature visuals | `operations/README.md` |
| `uplus/` | LG U+ product and service references | `uplus/README.md` |
| `generated/` | Project-created non-product scenes and composites | `generated/README.md` |

## Current Hard Gates

The following remain blocked or limited until verification is complete:

- Local redistribution and editing rights for Toss Place and LG U+ public web media
- Exact current installation model for representative LG U+ router imagery
- High-resolution partner masters for CCTV and telephone cutouts
- Exact physical scanner model and a real barcode contact scene
- Official evidence for cafe and restaurant receipt-setting/output examples
- Customer/store/portrait consent for any real installation case
- Current partner and promotion language, price, VAT, term, combination, and inventory

Blocked media must not be replaced with generated lookalike hardware or generated Korean UI.

On 2026-07-18, all known blocked product composites, fabricated receipt/review scenes, unverified coupon/customer examples, rejected retail scenes, outdated U+ media, and former `generated/system-*` scenes were removed from `public/`. Research copies are retained under `.asset-research/rights-pending/`, mainly in `public-blocked/`, for provenance review only. `src/utils/publicMedia.ts` blocks their paths and `src/utils/cmsMediaAudit.test.ts` fails if any of them reappears in the publish directory.

## Known Retire/Replace Candidates

| File | Status | Reason | Replacement requirement |
| --- | --- | --- | --- |
| `sector/feature-cafe-receipt.png` | Removed from public | Project receipt example is not official Toss receipt evidence | Official receipt setting UI plus official output example |
| `sector/feature-restaurant-receipt.png` | Removed from public | Same issue and excessive file weight | Verified restaurant-relevant official evidence |
| `sector/feature-retail-barcode.webp` | Removed from public | Does not show a physical scan causing a POS result | Confirmed scanner, real barcode contact, verified Toss POS result |
| `sector/sector-retail-scan.webp` | Removed from public | Scanner/contact causality is absent | Same as above, with retail context |
| `.asset-research/generated-source/cctv-store-grid-person-free.png` | Research source only | Heavy generated visual moved out of public assets; it must not imply an actual case | Public page uses only the registered 480px derivative |
| `uplus/uplus-ai-phone-ip520g.jpg` | Removed from public | Older model/reference image | Keep in research only |
| `.asset-research/rights-pending/public-blocked/product/toss-pos-screen-exact.png` | Archive only | User-reviewed low-resolution reference; removed from public assets | Current partner-provided full-resolution master |
| `product/toss-pos-screen.webp` | Review preview | Official public-page derivative used by the local component; redistribution approval remains pending | Current partner-provided full-resolution master and written approval |
| `.asset-research/rights-pending/public-blocked/product/toss-pos-screen-verified.png` | Do not publish | Reconstructed status differs from the user-reviewed POS state; removed from public assets | Current partner-provided full-resolution master |
| `product/toss-lineup.webp` | Removed from public | Baked stage/portrait limits reuse | Partner-approved transparent masters or a documented layout |
| `product/toss-lineup-compact.webp` | Removed from public | Same issue | Same as above |

## Responsive Media Budget

- Hero LCP target: preferably under `300KB` per delivered viewport.
- Standard feature visual: preferably under `200KB` per delivered viewport.
- Small card image: preferably under `100KB` per delivered viewport.
- Animated media requires a meaningful static fallback and should not ship multi-megabyte payloads to every mobile visitor.
- Provide derivatives near `480`, `768`, `1200`, and `1800` pixels when the rendered role warrants them.
- Every rendered image sets intrinsic `width` and `height`, an accurate `sizes`, and loading priority based on position.

## Composite Scale Reference

Current documented dimensions from `product/README.md`:

| Product | Dimensions |
| --- | --- |
| POSBANK APEXA X-1500 | `364 x 210 x 333 mm` |
| Toss Front | `L120 x W145.5 x H192.5 mm` |
| AHAPOS CPP-3000 printer | `130 x 178 x 140 mm` |

Use real dimensions when products share a ground plane. Do not eyeball scale.

Current intrinsic canvas measurements used by `ApexaXVisual` (measured from the local files on 2026-07-18):

| Asset | Pixel canvas | Non-transparent bounds |
| --- | --- | --- |
| `product/posbank-apexa-x-white-official.png` | `1200 x 800` | `62,86-1200,800`; includes catalogue artwork, so the reviewed CSS mask remains required |
| `product/toss-pos-screen.webp` | `768 x 552` | Fully opaque official-page derivative |
| `product/white-cash-drawer.png` | `1302 x 506` | `12,12-1290,494` |
| `product/ahapos-white-printer.png` | `381 x 378` | `14,14-367,364` |
| `product/toss-front.webp` | `1400 x 1400` | `334,287-1051,1187` |

Pixel canvas size is only intrinsic layout metadata. Relative product scale must continue to use the physical dimensions above because Toss Front has substantial transparent padding and the APEXA source retains catalogue artwork outside the product silhouette.

## Adding Or Replacing An Asset

1. Store the unmodified research original outside the public publish directory.
2. Record source, rights, model, dimensions, capture date, and hash.
3. Create transparent/optimized derivatives without changing product geometry.
4. Review extraction at high zoom for matte boxes, halos, color spill, and lost edges.
5. Test the final asset inside its real component at mobile, desktop, and ultrawide sizes.
6. Apply `.agents/skills/topinfo-design-review/SKILL.md`.
7. Add or update the appropriate subdirectory README/register entry.
8. Do not delete the prior public asset until CMS URLs and the rendered site confirm no remaining use.
