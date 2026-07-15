# Product graphics

Optimized WebP assets used by the public website. The product images were converted from the following official public Toss Place assets:

| Local asset | Official source |
| --- | --- |
| `posbank-apexa-x-white-official.png` | Source master from the POSBANK APEXA X-1500 catalogue/product material (`https://www.posbank.com/trans_hardware/apexa-x-1500.php?trans=usa`). It retains catalogue artwork and is not the active publishable cutout. |
| `posbank-apexa-x-white-toss.png` | Deterministic transparent composite rebuilt by `scripts/rebuild-core-pos-assets.py`: official APEXA X-1500 hardware plus `toss-pos-screen-verified.png`. |
| `posbank-apexa-x-toss-pos.webp` | Composite reference: POSBANK APEXA X-1500 hardware (`https://www.posbank.com/trans_hardware/apexa-x-1500.php?trans=usa`) with Toss POS software UI (`https://tossplace.com/product/pos`) |
| `toss-pos-screen.webp` | Lossless crop of the official Toss POS order screen from `https://static.toss.im/ipd-tcs/toss_core/live/23b97fe0-cd0e-462f-b986-a67d2b61948e/내부이미지-클릭.gif` (`https://tossplace.com/story/favorite_menu`) |
| `toss-pos-screen-verified.png` | Deterministic full-screen reconstruction built by `scripts/build-verified-pos-screen.cjs` from the official Toss asset `https://static.toss.im/illusts/place-pos-device-mobile-order-mockup.png`. It combines the unobstructed regions of the same official order state, preserves the full bottom controls, and sets the approved payment quantity to `6`. |
| `toss-lineup.webp` | `https://static.toss.im/illusts/lineup-pos-front-terminal-down-place.png` |
| `toss-pos-receipt.webp` | `https://static.toss.im/illusts/place-pos-device-receipt-mockup.png` |
| `toss-front.webp` | `https://static.toss.im/photos/place-original-front2-white-no-bg-18-edit-1.png` |
| `toss-lineup-compact.webp` | `https://static.toss.im/illusts/lineup2-place.png` |
| `toss-mobile-order.webp` | `https://static.toss.im/illusts/place-pos-device-mobile-order-mockup.png` |
| `toss-kiosk.webp` | `https://static.toss.im/illusts/kiosk_image.png` |
| `toss-delivery.webp` | `https://static.toss.im/illusts/pos-yogiyo-baemin-coupangeats.png` |
| `toss-delivery-sales.webp` | `https://static.toss.im/illusts/place-delivery-sales-ipad-mockup-3.png` |
| `toss-coupon.webp` | `https://static.toss.im/illusts/place-pos-phone-coupon-guide.png` |
| `toss-customer-coupon.webp` | `https://static.toss.im/illusts/place-coupon3.png` |
| `toss-sales.webp` | `https://static.toss.im/illusts/place-pos-phone-sales-status.png` |
| `ahapos-white-printer.png` | Transparent extraction of the white AHAPOS CPP-3000 product shown by the distributor page `http://nicecard.kr/ahapos`; measured specification 130 × 178 × 140 mm. |
| `white-cash-drawer.png` | Transparent extraction of the reviewed white cash-drawer source archived at `.asset-research/core-pos/white-cash-drawer-source.png`. No model claim is made. |

APEXA X composites keep the verified hardware silhouette only. Their display area is covered edge-to-edge with `toss-pos-screen-verified.png`; generated UI text, logos, status labels, and quantities are not accepted as Toss POS UI. `posbank-apexa-x-white-toss.png` is the active reusable transparent product asset. The source hardware measures 364 × 210 × 333 mm, Toss Front measures 147.5 × 128 × 193.5 mm, and CPP-3000 measures 130 × 178 × 140 mm; same-plane compositions use these heights instead of eyeballed scale.

The website must not reference `toss-pos-screen-exact.png` directly. It is a cropped legacy intermediate and is not a publishable screen asset.

Before production publication, confirm that the direct-agency asset terms permit local redistribution. Replace the Toss images with partner-provided originals when available.

`toss-lineup.webp` and `toss-lineup-compact.webp` are retained only as source references. Their baked dark stages and the portrait shown on the compact product screen make them unsuitable for reusable light-background CMS cards, so default pages use code-rendered Toss service graphics instead.
