import { BLOCKED_PUBLIC_EVIDENCE_MEDIA } from "./publicMedia";

export { BLOCKED_PUBLIC_EVIDENCE_MEDIA } from "./publicMedia";

export type PublicSectorKind = "cafe" | "restaurant" | "bar" | "retail" | "beauty";

export type PublicSectorMediaKind = "static-image" | "animated-image";

export interface PublicSectorMediaPolicy {
  sourceId: string;
  kind: PublicSectorMediaKind;
  sectors: readonly PublicSectorKind[];
  staticImageUrl?: string;
  maxBytes: number;
  firstFrameReviewed: boolean;
  rightsStatus: "partner-public-media-redistribution-pending";
}

const partnerMedia = (
  sourceId: string,
  kind: PublicSectorMediaKind,
  sectors: readonly PublicSectorKind[],
  options: Pick<PublicSectorMediaPolicy, "staticImageUrl" | "maxBytes">,
): PublicSectorMediaPolicy => ({
  sourceId,
  kind,
  sectors,
  staticImageUrl: options.staticImageUrl,
  maxBytes: options.maxBytes,
  firstFrameReviewed: true,
  rightsStatus: "partner-public-media-redistribution-pending",
});

// The current sector renderer accepts image resources. Animated WebP/APNG files
// play as images; video URLs stay blocked until the renderer can set autoplay,
// muted, loop and playsInline explicitly.
export const DEFAULT_SECTOR_MEDIA_POLICY: Record<string, PublicSectorMediaPolicy> = {
  "/assets/sector/sector-cafe.webp": partnerMedia("toss:place-front-kiosk-cafe", "animated-image", ["cafe"], {
    staticImageUrl: "/assets/sector/sector-cafe-static.webp",
    maxBytes: 900_000,
  }),
  "/assets/sector/feature-cafe-pickup.png": partnerMedia("toss:mockup-toss-order-cafe-pickup", "static-image", ["cafe"], {
    maxBytes: 250_000,
  }),
  "/assets/operations/receipt-settings.webp": partnerMedia("toss:receipt-settings", "static-image", ["cafe"], {
    maxBytes: 100_000,
  }),

  "/assets/product/toss-delivery-sales.webp": partnerMedia("toss:delivery-sales-dashboard", "static-image", ["restaurant"], {
    maxBytes: 100_000,
  }),
  "/assets/sector/feature-table-order.webp": partnerMedia("toss:table-order-homepage", "static-image", ["restaurant"], {
    maxBytes: 100_000,
  }),
  "/assets/sector/feature-order-pos.webp": partnerMedia("toss:table-pos-picture", "static-image", ["restaurant"], {
    maxBytes: 100_000,
  }),
  "/assets/sector/feature-table-edit.png": partnerMedia("toss:restaurant-table-edit", "static-image", ["restaurant"], {
    maxBytes: 150_000,
  }),

  "/assets/sector/sector-bar.webp": partnerMedia("toss:place-idcard-scan", "animated-image", ["bar"], {
    staticImageUrl: "/assets/sector/sector-bar-static.webp",
    maxBytes: 900_000,
  }),
  "/assets/sector/feature-front-wallpaper-static.webp": partnerMedia("toss:place-front-wallpaper-slide", "static-image", ["bar"], {
    maxBytes: 300_000,
  }),
  "/assets/operations/auto-discount.webp": partnerMedia("toss:auto-discount-settings", "static-image", ["bar"], {
    maxBytes: 100_000,
  }),

  "/assets/operations/inventory.webp": partnerMedia("toss:inventory-adjustment", "static-image", ["retail"], {
    maxBytes: 100_000,
  }),
  "/assets/operations/bulk-register.webp": partnerMedia("toss:bulk-product-register", "static-image", ["retail"], {
    maxBytes: 100_000,
  }),
  "/assets/sector/feature-market-price.webp": partnerMedia("toss:variable-price-entry", "animated-image", ["retail"], {
    staticImageUrl: "/assets/sector/feature-market-price-static.webp",
    maxBytes: 250_000,
  }),
  "/assets/operations/sales-calendar.webp": partnerMedia("toss:sales-calendar", "static-image", ["retail"], {
    maxBytes: 100_000,
  }),

  "/assets/sector/beauty-reservation-register.webp": partnerMedia("toss:beauty-reservation-register", "animated-image", ["beauty"], {
    staticImageUrl: "/assets/sector/beauty-reservation-register-static.webp",
    maxBytes: 1_600_000,
  }),
  "/assets/sector/beauty-booking-talk.png": partnerMedia("toss:beauty-booking-talk", "animated-image", ["beauty"], {
    staticImageUrl: "/assets/sector/beauty-booking-talk-static.webp",
    maxBytes: 300_000,
  }),
  "/assets/sector/beauty-schedule-ui.png": partnerMedia("toss:beauty-staff-schedule", "static-image", ["beauty"], {
    maxBytes: 100_000,
  }),
  "/assets/sector/beauty-customer-note.png": partnerMedia("toss:beauty-customer-note", "static-image", ["beauty"], {
    maxBytes: 100_000,
  }),
};

export const HOME_SECTOR_MEDIA_SOURCE_IDS: Record<string, string> = Object.fromEntries(
  Object.entries(DEFAULT_SECTOR_MEDIA_POLICY).map(([url, policy]) => [url, policy.sourceId]),
);

export const BLOCKED_DEFAULT_SECTOR_MEDIA: Record<string, string> = {
  ...BLOCKED_PUBLIC_EVIDENCE_MEDIA,
  "/assets/sector/feature-cafe-kiosk.webp": "카페 대표 장면과 같은 원본의 중복 파생본",
  "/assets/sector/feature-front-wallpaper.webp": "홈 기본 플레이리스트 예산을 넘는 애니메이션",
};

export const MAX_DEFAULT_SECTOR_PLAYLIST_BYTES = 2_000_000;
