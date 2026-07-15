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
| `feature-coupon.webp` | `https://static.toss.im/lotties/place-coupon-list-popup-resize-3-apng.png` |
| `feature-front-wallpaper.webp` | `https://static.toss.im/lotties/place-front-wallpaper-slide-crop-apng.png` |
| `feature-customer-profile.png` | `https://static.toss.im/illusts/image2@4x.png` |
| `feature-customer-analysis.png` | `https://static.toss.im/lotties/place-customer-graph-crop-apng.png` |
| `feature-cafe-receipt.png` | Project-owned cafe tabletop background plus deterministic Korean receipt artwork, rebuilt by `scripts/rebuild-core-pos-assets.py` |
| `feature-restaurant-receipt.png` | Project-owned restaurant tabletop background plus a separate deterministic Korean receipt artwork, rebuilt by `scripts/rebuild-core-pos-assets.py` |
| `feature-table-order.webp` | `https://static.toss.im/photos/tossorder_table_homepage_top.png` |
| `feature-order-pos.webp` | `https://static.toss.im/photos/table-pos-picture.png` |
| `feature-restaurant-review.webp` | `https://static.toss.im/lotties/place-customer-review-rolling-apng.png` |
| `feature-bar-store.png` | `https://static.toss.im/photos/winebar_top_bg.png` |
| `feature-market-price.webp` | `https://static.toss.im/ipd-tcs/toss_core/live/e52b6c21-5120-453d-8fce-31e54936e9f3/1시가입력_팝업_gif.gif` |
| `feature-retail-barcode.webp` | `https://static.toss.im/3d/icon-barcode.png` |
| `feature-retail-search.png` | `https://static.toss.im/illusts/place-pos-search.png` |
| `sector-retail-scan.webp` | Project-specific generated retail checkout scene; source archived at `C:/Users/qpalz/.codex/generated_images/019ea22c-898b-7c33-825b-1ee1818da539/exec-00f8716e-5544-4ea8-80a9-6e3eaa46979d.png` |
| `sector-retail-apexa-x.webp` | Project-specific barcode checkout scene using the POSBANK APEXA X-1500 hardware shape and Toss POS screen |

The following `*-static.webp` files are local first-frame fallbacks for animated feature media:

- `sector-cafe-static.webp`
- `sector-bar-static.webp`
- `feature-cafe-kiosk-static.webp`
- `feature-coupon-static.webp`
- `feature-front-wallpaper-static.webp`
- `feature-customer-analysis-static.webp`
- `feature-market-price-static.webp`
- `beauty-booking-talk-static.webp`
- `beauty-reservation-register-static.webp`
- `beauty-front-screen-static.webp`
- `beauty-prepaid-pass-static.webp`

The public sector carousel and sector detail cards always render their animated source without exposing play/pause controls. Reduced-motion preferences disable only crossfade and movement applied by the site itself; they do not replace product demonstrations with static frames.

Animated sources are stored as optimized animated WebP or APNG files. Static screenshots stay at a readable resolution and are loaded lazily below the fold.

The two receipt scenes intentionally use different backgrounds, menus, totals, receipt marks, and layouts. They do not contain copied character art, card data, customer names, or generated microtext. `feature-order-pos.webp` preserves the complete official POS frame inside a 3:2 stage instead of cropping its controls.

`sector-beauty-mobile.webp` and `sector-beauty-schedule.webp` are retired focused crops. The public beauty section now uses the official feature-specific media above so the reservation, schedule, notification, and customer-note screens remain readable.

`feature-cafe-kiosk.webp` and its static frame are retired duplicate derivatives of the same official source used by `sector-cafe.webp`. Keep their source ID registered in the media audit so they cannot be added to the active carousel beside `sector-cafe.webp` again.

`sector-retail-apexa-x.webp` replaces the earlier generic checkout monitor. It shows a grocery barcode scan, POSBANK APEXA X-1500 running the Toss POS checkout screen, inventory feedback, and a separate Toss Front-shaped payment terminal without depicting a real identifiable person.

Before production publication, confirm that the direct-agency asset terms permit local redistribution. Replace these files with the partner-provided originals when available.
