# Product graphics

Optimized WebP assets used by the public website. The product images were converted from the following official public Toss Place assets:

| Local asset | Official source |
| --- | --- |
| `posbank-apexa-x-white-official.png` | Source master from the POSBANK APEXA X-1500 catalogue/product material (`https://www.posbank.com/trans_hardware/apexa-x-1500.php?trans=usa`). It retains catalogue artwork and is not the active publishable cutout. |
| `posbank-apexa-x-white-toss.png` | Removed from `public/`; archived under `.asset-research/rights-pending/public-blocked/product/` because it combines the hardware with a reconstructed screen. |
| `posbank-apexa-x-toss-pos.webp` | Removed from `public/`; archived under `.asset-research/rights-pending/public-blocked/product/` after the product-composition gate failed |
| `toss-pos-screen.webp` | Lossless crop of the official Toss POS order screen from `https://static.toss.im/ipd-tcs/toss_core/live/23b97fe0-cd0e-462f-b986-a67d2b61948e/내부이미지-클릭.gif` (`https://tossplace.com/story/favorite_menu`) |
| `toss-pos-screen-exact.png` | Removed from `public/`; low-resolution user-reviewed reference archived under `.asset-research/rights-pending/public-blocked/product/`. |
| `toss-pos-screen-verified.png` | Removed from `public/`; deterministic reconstruction archived under `.asset-research/rights-pending/public-blocked/product/` because it is not an official product screen. |
| `toss-lineup.webp` | Removed from `public/`; archived as a source reference because its baked stage cannot be reused as a clean product packshot |
| `toss-pos-receipt.webp` | `https://static.toss.im/illusts/place-pos-device-receipt-mockup.png` |
| `toss-front.webp` | `https://static.toss.im/photos/place-original-front2-white-no-bg-18-edit-1.png` |
| `toss-lineup-compact.webp` | Removed from `public/`; archived as a source reference because its baked stage and portrait limit reuse |
| `toss-mobile-order.webp` | `https://static.toss.im/illusts/place-pos-device-mobile-order-mockup.png` |
| `toss-kiosk.webp` | `https://static.toss.im/illusts/kiosk_image.png` |
| `toss-delivery.webp` | `https://static.toss.im/illusts/pos-yogiyo-baemin-coupangeats.png` |
| `toss-delivery-sales.webp` | `https://static.toss.im/illusts/place-delivery-sales-ipad-mockup-3.png` |
| `toss-coupon.webp` | Removed from `public/`; current coupon conditions and redistribution rights are not verified |
| `toss-customer-coupon.webp` | Removed from `public/`; current coupon conditions and redistribution rights are not verified |
| `toss-sales.webp` | `https://static.toss.im/illusts/place-pos-phone-sales-status.png` |
| `ahapos-white-printer.png` | Transparent extraction of the white AHAPOS CPP-3000 product shown by the distributor page `http://nicecard.kr/ahapos`; measured specification 130 × 178 × 140 mm. |
| `white-cash-drawer.png` | Transparent extraction of the reviewed white cash-drawer source archived at `.asset-research/core-pos/white-cash-drawer-source.png`. No model claim is made. |

The active local preview composes `posbank-apexa-x-white-official.png` in code and places the official-page derivative `toss-pos-screen.webp` inside its display aperture. This is still a review aid, not production proof: replace it with a current partner master and written redistribution approval before release. The source hardware measures 364 × 210 × 333 mm, Toss Front measures L120 × W145.5 × H192.5 mm, and CPP-3000 measures 130 × 178 × 140 mm; same-plane compositions use these heights instead of eyeballed scale.

`toss-pos-screen-exact.png`, `toss-pos-screen-verified.png`, `posbank-apexa-x-white-toss.png`, and `apexa-x-package-spec-corrected.png` are retained only under `.asset-research/rights-pending/public-blocked/product/` for audit history. They must not return to public assets or defaults.

Before production publication, confirm that the direct-agency asset terms permit local redistribution. Replace the Toss images with partner-provided originals when available.

The removed files above are retained only in `.asset-research/rights-pending/public-blocked/product/` for provenance review. They are blocked by `src/utils/publicMedia.ts` and cannot be restored to public CMS defaults without a new rights and visual review.
