# Sector graphics

These optimized WebP assets are used by the Toss POS sector configurator.

| Local asset | Official source |
| --- | --- |
| `sector-cafe.webp` | `https://static.toss.im/lotties/place-front-kiosk-cafe-crop-apng.png` |
| `sector-restaurant.webp` | `https://static.toss.im/illusts/place-pos-device-mobile-order-mockup.png` |
| `sector-bar.webp` | `https://static.toss.im/lotties/place-idcard-scan-apng.png` |
| `sector-retail.webp` | `https://static.toss.im/3d/product-upload.png` |
| `sector-beauty.webp` | `https://static.toss.im/illusts/place-pos-device-mobile-mockup.png` |
| `beauty-front-store-wide.webp` | `https://static.toss.im/photos/place-resource-nail.png` |
| `beauty-booking-talk.png` | `https://static.toss.im/lotties/talk-place-booking-apng.png` |
| `beauty-schedule-ui.png` | `https://static.toss.im/illusts/place-resource-customer-4.png` |
| `beauty-customer-note.png` | `https://static.toss.im/illusts/image202410033.png` |
| `beauty-reservation-register.webp` | `https://static.toss.im/ipd-tcs/toss_core/live/46180f50-6f5f-4953-a1e9-98da6dc7b7d9/홈페이지-inner-1.gif` |
| `beauty-front-screen.webp` | `https://static.toss.im/lotties/place-front-rolling-05.gif` |
| `beauty-member-info.png` | `https://static.toss.im/illusts/place-resource-customer-1.png` |
| `beauty-prepaid-pass.png` | `https://static.toss.im/lotties/place-front-resource-2-apng.png` |
| `feature-cafe-pickup.png` | `https://static.toss.im/illusts/mockup-toss-order-cafe-2-crop.png` |
| `feature-coupon.webp` | **Removed from `public/`.** Current coupon conditions and redistribution rights are not verified |
| `feature-front-wallpaper.webp` | `https://static.toss.im/lotties/place-front-wallpaper-slide-crop-apng.png` |
| `feature-customer-profile.png` | **Removed from `public/`.** The sample customer data may be mistaken for a real customer record |
| `feature-customer-analysis.png` | `https://static.toss.im/lotties/place-customer-graph-crop-apng.png` |
| `feature-cafe-receipt.png` | **Blocked from public defaults.** Project receipt example; not official Toss receipt evidence |
| `feature-restaurant-receipt.png` | **Blocked from public defaults.** Project receipt example; not official Toss receipt evidence |
| `feature-table-order.webp` | `https://static.toss.im/photos/tossorder_table_homepage_top.png` |
| `feature-order-pos.webp` | `https://static.toss.im/photos/table-pos-picture.png` |
| `feature-restaurant-review.webp` | **Blocked from public defaults.** Source: `https://static.toss.im/lotties/place-customer-review-rolling-apng.png`; review claims and publication basis are not verified for TOPINFO |
| `feature-bar-store.png` | **Removed from `public/`.** The generated person/store scene cannot serve as product evidence |
| `feature-market-price.webp` | `https://static.toss.im/ipd-tcs/toss_core/live/e52b6c21-5120-453d-8fce-31e54936e9f3/1시가입력_팝업_gif.gif` |
| `feature-retail-barcode.webp` | **Blocked from public defaults.** The recorded source is only `https://static.toss.im/3d/icon-barcode.png`; it does not account for the complete local composite |
| `feature-retail-search.png` | **Removed from `public/`.** The visible search content is not suitable for publication |
| `sector-retail-scan.webp` | **Blocked from public defaults.** Generated illustration without a real scan-to-result evidence chain; source archived at `C:/Users/qpalz/.codex/generated_images/019ea22c-898b-7c33-825b-1ee1818da539/exec-00f8716e-5544-4ea8-80a9-6e3eaa46979d.png` |
| `sector-retail-apexa-x.webp` | **Blocked from public defaults.** Project composite; product/UI source layers and publication rights are not complete enough for evidence use |

## Active homepage playlists

The code-level allowlist is `src/utils/sectorMediaPolicy.ts`. Every active source is locally available and visually reviewed, but Toss Place redistribution/editing rights remain pending partner confirmation. This is a production-release blocker, not an approval statement.

| Sector | Active media | Playback and fallback | Evidence role |
| --- | --- | --- | --- |
| Cafe/bakery | `sector-cafe.webp`, `feature-cafe-pickup.png`, `../operations/receipt-settings.webp` | Cafe is animated with `sector-cafe-static.webp` fallback; other scenes are static | Front self-order, pickup, official receipt settings |
| Restaurant | `../product/toss-delivery-sales.webp`, `feature-table-order.webp`, `feature-order-pos.webp`, `feature-table-edit.png` | Static official product/UI media | Delivery sales, table order, POS receipt flow, table layout |
| Pub/bar | `sector-bar.webp`, `feature-front-wallpaper-static.webp`, `../operations/auto-discount.webp` | ID scan is animated with `sector-bar-static.webp`; the wallpaper uses the static derivative to avoid the 2.9 MB animation | ID check, Front screen customization, conditional discount |
| Retail | `../operations/inventory.webp`, `../operations/bulk-register.webp`, `feature-market-price.webp`, `../operations/sales-calendar.webp` | Variable-price entry is animated with `feature-market-price-static.webp`; other scenes are static UI | Inventory, bulk registration, variable price, sales |
| Beauty/service | `beauty-reservation-register.webp`, `beauty-booking-talk.png`, `beauty-schedule-ui.png`, `beauty-customer-note.png` | Reservation and booking message are animated with their corresponding `*-static.webp` fallbacks | Reservation, reminder, staff schedule, customer note |

### 2026-07-18 active-default integrity record

All entries below have the rights status `partner-public-media-redistribution-pending`. Source URLs are recorded in this file, `../operations/README.md`, or `../product/README.md`; production publication still requires partner confirmation.

| Public path | Bytes | SHA-256 |
| --- | ---: | --- |
| `/assets/sector/sector-cafe.webp` | 763718 | `6d83a7d67e1aa910dc0bd0d214c2677f10c18bd222441f80b6d8646d1c4bdb9f` |
| `/assets/sector/feature-cafe-pickup.png` | 173032 | `d6e8382706806466476c65855903418516e224e192f22bede3ce19183a43f680` |
| `/assets/operations/receipt-settings.webp` | 60474 | `60d1b5898a665d3d20c204ebb2e013f36d13f636b1fc98156ff40fe0c9d4c118` |
| `/assets/product/toss-delivery-sales.webp` | 48072 | `4d8ba0f47cb62dd5e3aa8209ab3cabc3aa814a084d2fad02c4a8a7522875fa47` |
| `/assets/sector/feature-table-order.webp` | 51828 | `c5eabb88a5d5f2d1905131e488fde6d11a127c0661f42a73c537ecae26f5903a` |
| `/assets/sector/feature-order-pos.webp` | 60794 | `5ab29e6f7090299e9c131e699efca0356c3edcf7d4f4952b14224ea6214711f1` |
| `/assets/sector/feature-table-edit.png` | 89147 | `e8d7a22c5ee8437bc240476a48892a11f82d449ecbb08c0f03c375441596f194` |
| `/assets/sector/sector-bar.webp` | 824216 | `6f0da0492024820a5b497380ee5afb55fef1618820a670b1710e2733f90f23cc` |
| `/assets/sector/feature-front-wallpaper-static.webp` | 233420 | `fe679b0db8c70742d79fc5f86de41e37141ea453d729f33111d7cfe5fa5167e9` |
| `/assets/operations/auto-discount.webp` | 27248 | `8efd94cbe79d2afb8cab02d5c774dd3a9b3a87ed47e8f42e0575baf5eaaf4074` |
| `/assets/operations/inventory.webp` | 48728 | `14c2e6702a08164264e631941d05d1069f19358f704437a639a313650631a112` |
| `/assets/operations/bulk-register.webp` | 55988 | `ff8ff6b01468105311513bacaf76dde440bd0daef7ae2f3361e0ffef0d4d70c9` |
| `/assets/sector/feature-market-price.webp` | 186258 | `a78e6b70ca82ad2943443fdda23cf62c763613ce7c123ea41c5d3df4064ea3a5` |
| `/assets/operations/sales-calendar.webp` | 76772 | `85983d64381522aef0d5e43f754c036fccf84fe000dd52812e290c06c1620137` |
| `/assets/sector/beauty-reservation-register.webp` | 1547044 | `f756d8510c5e382364e6b973589a551ba3153d3985a38467c8b95cb744a18661` |
| `/assets/sector/beauty-booking-talk.png` | 216312 | `960e5b0032db72161b97a90bdb9e658864c57d615c02738c3a6fdb19b6e94f09` |
| `/assets/sector/beauty-schedule-ui.png` | 20405 | `663e36be232ea2081222c117016ed59c75bfb2670a156c3c20e47f88de445dc5` |
| `/assets/sector/beauty-customer-note.png` | 10480 | `3e90119fa64b46fe872cb3ac58e965c2b6c46ddd8f8a1b8362b5b859b32de0cd` |

Fallback SHA-256 values: `sector-cafe-static.webp` `fa1a73ecc12911259401a4bfedf43f11bc3d9f97f67bd8a55bb24970daea4aba`; `sector-bar-static.webp` `2107b5c1b8362bd4a2ddd1778bcb17f05e25d49d7fd681f22c227cbe7e8fe731`; `feature-market-price-static.webp` `e2c6dccb81cee26453e6b098f6bae12bda4ec8523b15286adbb99f98c844f37c`; `beauty-reservation-register-static.webp` `f48bb9d36f8c1080fcf1aa3615001b58355bf092ac7ffa151984e932fb216f22`; `beauty-booking-talk-static.webp` `01d61d1ef6d9b087a760b7d26b1f96b7946dc5c5cc323bccf6925eb29841df43`.

The home renderer currently accepts image resources. Animated WebP/APNG files autoplay as image formats and do not use HTML video attributes. MP4/WebM/MOV URLs are therefore blocked by the media-policy test until the renderer explicitly supports `autoplay`, `muted`, `loop`, `playsInline`, load failure, and reduced-motion behavior.

The following `*-static.webp` files are local first-frame fallbacks for animated feature media:

- `sector-cafe-static.webp`
- `sector-bar-static.webp`
- `feature-cafe-kiosk-static.webp`
- `feature-front-wallpaper-static.webp`
- `feature-customer-analysis-static.webp`
- `feature-market-price-static.webp`
- `beauty-booking-talk-static.webp`
- `beauty-reservation-register-static.webp`
- `beauty-front-screen-static.webp`
- `beauty-prepaid-pass-static.webp`

The public sector data records a meaningful static fallback for every animated default. The current image renderer still needs a component-level `onError` fallback before this can be described as a complete load-failure fallback; that component is outside this media-data task.

Animated sources are stored as optimized animated WebP or APNG files. Static screenshots stay at a readable resolution and are loaded lazily below the fold.

The project receipt, coupon, customer-profile, generated store, and rejected retail scenes were moved to `.asset-research/rights-pending/public-blocked/sector/`. Cafe receipt content now uses the official `operations/receipt-settings.webp` function screen. Restaurant content uses order-status and table-operation evidence instead of a fabricated receipt or unverified review.

`sector-beauty-mobile.webp` and `sector-beauty-schedule.webp` are retired focused crops. The public beauty section now uses the official feature-specific media above so the reservation, schedule, notification, and customer-note screens remain readable.

`feature-cafe-kiosk.webp` and its static frame are retired duplicate derivatives of the same official source used by `sector-cafe.webp`. Keep their source ID registered in the media audit so they cannot be added to the active carousel beside `sector-cafe.webp` again.

Retail public defaults no longer use generated scan scenes, the incomplete barcode composite, or the rejected search screenshot. Until a confirmed scanner model, real barcode contact, and verified Toss POS result are available, the public evidence is limited to official inventory, bulk registration, variable-price, and sales screens.

Before production publication, confirm that the direct-agency asset terms permit local redistribution. Replace these files with the partner-provided originals when available.
