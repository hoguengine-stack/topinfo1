import type { PublicMediaRightsStatus } from "../types";

export const PUBLIC_MEDIA = {
  homeHero: {
    tossPos: "/assets/product/posbank-apexa-x-white-official.png",
    tossFront: "/assets/product/toss-front.webp",
    receiptPrinter: "/assets/product/ahapos-white-printer.png",
    cashDrawer: "/assets/product/white-cash-drawer.png",
  },
  homePackage: {
    overview: "/assets/generated/topinfo-package-owner-v2.webp",
  },
  homeTelecom: {
    internet: "/assets/uplus/uplus-internet-pos-network.png",
    internetDevice: "/assets/uplus/uplus-internet-router.png",
    cctvIndoor: "/assets/uplus/uplus-cctv-indoor.png",
    cctvOutdoor: "/assets/uplus/uplus-cctv-outdoor.png",
    cctvPtz: "/assets/uplus/uplus-cctv-ptz.png",
    cctvArchitecture: "/assets/uplus/uplus-cctv-architecture.png",
    phoneWireless: "/assets/uplus/uplus-phone-wireless.png",
    phoneDesk: "/assets/uplus/uplus-phone-desk.png",
    aiPhoneDevice: "/assets/uplus/uplus-ip520ga-white.png",
    aiPhoneHero: "/assets/uplus/uplus-ip520ga-white.png",
  },
  homeServices: {
    kiosk: "/assets/product/toss-kiosk.webp",
    delivery: "/assets/product/toss-delivery.webp",
  },
} as const;

export interface ProjectMediaPublicationRecord {
  rightsStatus: PublicMediaRightsStatus;
  reason: string;
}

const PROJECT_OWNED_MEDIA_PREFIXES = [
  "/assets/generated/",
  "/assets/brand/topinfo-",
] as const;

const PARTNER_MEDIA_PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ["/assets/product/", "POSBANK·Toss Place·AHAPOS 및 주변기기 원본의 로컬 재배포 권리 확인이 필요합니다."],
  ["/assets/uplus/", "LG U+ 원본의 대리점 홈페이지 로컬 재배포 권리 확인이 필요합니다."],
  ["/assets/sector/", "업종별 제품 화면·영상의 출처와 로컬 재배포 권리 확인이 필요합니다."],
  ["/assets/operations/", "운영 기능 화면의 출처와 로컬 재배포 권리 확인이 필요합니다."],
];

export function getProjectMediaPublicationRecord(path?: string): ProjectMediaPublicationRecord | undefined {
  const normalized = normalizePublicMediaPath(path);
  if (!normalized.startsWith("/assets/")) return undefined;

  if (PROJECT_OWNED_MEDIA_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return {
      rightsStatus: "verified",
      reason: "TOPINFO 프로젝트가 제작한 비제품 시각 자산입니다.",
    };
  }

  const partnerPolicy = PARTNER_MEDIA_PREFIXES.find(([prefix]) => normalized.startsWith(prefix));
  if (partnerPolicy) {
    return {
      rightsStatus: "pending",
      reason: partnerPolicy[1],
    };
  }

  return undefined;
}

export const DEPRECATED_PUBLIC_MEDIA = {
  aiPhonePortrait: "/assets/uplus/uplus-ai-phone-store.jpg",
  aiPhoneLegacy: "/assets/uplus/uplus-ai-phone.jpg",
  tossLineupBakedBackground: "/assets/product/toss-lineup.webp",
  tossLineupCompactBakedBackground: "/assets/product/toss-lineup-compact.webp",
  apexaGeneratedComposite: "/assets/product/posbank-apexa-x-toss-pos.webp",
} as const;

export const BLOCKED_PUBLIC_EVIDENCE_MEDIA: Readonly<Record<string, string>> = {
  "/assets/sector/feature-cafe-receipt.png": "비공식 프로젝트 영수증 예시",
  "/assets/sector/feature-restaurant-receipt.png": "비공식 프로젝트 영수증 예시",
  "/assets/sector/feature-restaurant-review.webp": "검증되지 않은 후기 문구",
  "/assets/sector/sector-retail-scan.webp": "실제 스캔 인과관계를 보여주지 않는 생성 장면",
  "/assets/sector/sector-retail-apexa-x.webp": "제품·UI 출처가 결합된 생성 장면",
  "/assets/sector/feature-retail-barcode.webp": "원본 출처와 현재 합성 결과가 일치하지 않는 바코드 장면",
};

export const BLOCKED_PUBLIC_MEDIA: Readonly<Record<string, string>> = {
  ...BLOCKED_PUBLIC_EVIDENCE_MEDIA,
  ...Object.fromEntries(
    Object.values(DEPRECATED_PUBLIC_MEDIA).map((path) => [path, "퇴역 또는 공개 검증 미완료 자산"]),
  ),
  "/assets/product/toss-front-customer-payment.png": "제품 합성 품질 검수 반려",
  "/assets/product/apexa-x-package-spec-corrected.png": "제품 합성 품질 검수 반려",
  "/assets/product/posbank-apexa-x-white-toss.png": "검증되지 않은 재구성 POS 화면 합성",
  "/assets/product/toss-pos-screen-exact.png": "저해상도·출처 미확정 화면 참고본",
  "/assets/product/toss-pos-screen-verified.png": "공식 원본이 아닌 재구성 화면",
  "/assets/generated/cctv-store-grid-person-free.png": "배포용이 아닌 생성 원본 마스터",
  "/assets/generated/uplus-ai-robot-white.png": "배포용이 아닌 생성 원본 마스터",
  "/assets/generated/system-pos-order-payment.webp": "제품 합성 품질 검수 반려",
  "/assets/product/toss-coupon.webp": "특정 쿠폰 조건이 현재 혜택으로 오인될 수 있음",
  "/assets/product/toss-customer-coupon.webp": "특정 쿠폰 조건이 현재 혜택으로 오인될 수 있음",
  "/assets/sector/feature-coupon.webp": "쿠폰 조건·문구의 현행 정책 확인 필요",
  "/assets/sector/feature-coupon-static.webp": "쿠폰 조건·문구의 현행 정책 확인 필요",
  "/assets/sector/feature-customer-profile.png": "임의 고객 데이터와 개인정보 오인 가능성",
  "/assets/sector/feature-bar-store.png": "업종 증거로 사용할 수 없는 생성 매장 인물 장면",
  "/assets/sector/feature-retail-search.png": "비전문적인 검색어가 포함된 제품 화면",
  "/assets/uplus/uplus-package-overview.png": "이전 패키지 합성 이미지",
  "/assets/uplus/uplus-ai-phone-ip520g.jpg": "이전 모델·구성 확인용 이미지",
  "/assets/uplus/uplus-ip520ga-hero.png": "퇴역한 제품 홍보 합성 이미지",
};

export const BLOCKED_PUBLIC_MEDIA_PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ["/assets/generated/system-", "실물·UI 합성 검수 미완료 시스템 장면"],
];

export function normalizePublicMediaPath(path?: string) {
  const value = path?.trim().replaceAll("\\", "/");
  if (!value) return "";

  try {
    const parsed = new URL(value, "https://topinfo.local");
    if (parsed.pathname.startsWith("/assets/")) return parsed.pathname;
  } catch {
    // Keep the original value for malformed CMS input so the publication audit can report it.
  }

  return value.split(/[?#]/, 1)[0];
}

export function getBlockedPublicMediaReason(path?: string) {
  const normalized = normalizePublicMediaPath(path);
  if (!normalized) return undefined;
  const exactReason = BLOCKED_PUBLIC_MEDIA[normalized];
  if (exactReason) return exactReason;
  return BLOCKED_PUBLIC_MEDIA_PREFIXES.find(([prefix]) => normalized.startsWith(prefix))?.[1];
}

export function isBlockedPublicMedia(path?: string) {
  return Boolean(getBlockedPublicMediaReason(path));
}

export interface PublicImageDimensions {
  width: number;
  height: number;
}

const PUBLIC_IMAGE_DIMENSIONS: Record<string, PublicImageDimensions> = {
  "/assets/generated/topinfo-package-owner-v2.webp": { width: 1536, height: 1024 },
  "/assets/operations/auto-discount.webp": { width: 1600, height: 1048 },
  "/assets/operations/bulk-register.webp": { width: 1600, height: 1100 },
  "/assets/operations/inventory.webp": { width: 1557, height: 848 },
  "/assets/operations/order-status.webp": { width: 1324, height: 976 },
  "/assets/operations/receipt-settings.webp": { width: 1536, height: 1132 },
  "/assets/operations/sales-calendar.webp": { width: 1600, height: 1312 },
  "/assets/product/ahapos-white-printer.png": { width: 381, height: 378 },
  "/assets/product/posbank-apexa-x-white-official.png": { width: 1200, height: 800 },
  "/assets/product/toss-delivery-sales.webp": { width: 1600, height: 1286 },
  "/assets/product/toss-delivery.webp": { width: 1400, height: 1124 },
  "/assets/product/toss-front.webp": { width: 1400, height: 1400 },
  "/assets/product/toss-kiosk.webp": { width: 1400, height: 788 },
  "/assets/product/toss-mobile-order.webp": { width: 1400, height: 596 },
  "/assets/product/toss-pos-receipt.webp": { width: 1400, height: 700 },
  "/assets/product/toss-pos-screen.webp": { width: 768, height: 552 },
  "/assets/product/toss-sales.webp": { width: 1400, height: 1106 },
  "/assets/product/white-cash-drawer.png": { width: 1302, height: 506 },
  "/assets/sector/beauty-booking-talk-static.webp": { width: 1000, height: 700 },
  "/assets/sector/beauty-booking-talk.png": { width: 1000, height: 700 },
  "/assets/sector/beauty-customer-note.png": { width: 1173, height: 951 },
  "/assets/sector/beauty-front-screen-static.webp": { width: 600, height: 1000 },
  "/assets/sector/beauty-front-screen.webp": { width: 600, height: 1000 },
  "/assets/sector/beauty-front-store-wide.webp": { width: 1400, height: 730 },
  "/assets/sector/beauty-member-info.png": { width: 1536, height: 1024 },
  "/assets/sector/beauty-prepaid-pass-static.webp": { width: 725, height: 1208 },
  "/assets/sector/beauty-prepaid-pass.png": { width: 725, height: 1208 },
  "/assets/sector/beauty-reservation-register-static.webp": { width: 900, height: 658 },
  "/assets/sector/beauty-reservation-register.webp": { width: 900, height: 658 },
  "/assets/sector/beauty-schedule-ui.png": { width: 928, height: 634 },
  "/assets/sector/feature-cafe-kiosk-static.webp": { width: 725, height: 1048 },
  "/assets/sector/feature-cafe-kiosk.webp": { width: 725, height: 1048 },
  "/assets/sector/feature-cafe-pickup.png": { width: 1856, height: 1770 },
  "/assets/sector/feature-customer-analysis-static.webp": { width: 1073, height: 1251 },
  "/assets/sector/feature-customer-analysis.png": { width: 1073, height: 1251 },
  "/assets/sector/feature-front-wallpaper-static.webp": { width: 960, height: 1384 },
  "/assets/sector/feature-front-wallpaper.webp": { width: 960, height: 1384 },
  "/assets/sector/feature-market-price-static.webp": { width: 900, height: 658 },
  "/assets/sector/feature-market-price.webp": { width: 900, height: 658 },
  "/assets/sector/feature-order-pos.webp": { width: 1536, height: 1024 },
  "/assets/sector/feature-table-edit.png": { width: 1024, height: 712 },
  "/assets/sector/feature-table-order.webp": { width: 1200, height: 656 },
  "/assets/sector/sector-bar-static.webp": { width: 560, height: 560 },
  "/assets/sector/sector-bar.webp": { width: 600, height: 600 },
  "/assets/sector/sector-beauty-mobile.webp": { width: 1500, height: 1000 },
  "/assets/sector/sector-beauty-schedule.webp": { width: 1500, height: 1000 },
  "/assets/sector/sector-beauty.webp": { width: 1536, height: 1024 },
  "/assets/sector/sector-cafe-static.webp": { width: 860, height: 1240 },
  "/assets/sector/sector-cafe.webp": { width: 860, height: 1240 },
  "/assets/sector/sector-restaurant.webp": { width: 1600, height: 900 },
  "/assets/sector/sector-retail.webp": { width: 1600, height: 1067 },
  "/assets/uplus/uplus-cctv-indoor.png": { width: 816, height: 672 },
  "/assets/uplus/uplus-internet-router.png": { width: 744, height: 744 },
  "/assets/uplus/uplus-ip520ga-white.png": { width: 214, height: 150 },
};

export function getPublicImageDimensions(path?: string): PublicImageDimensions | undefined {
  if (!path) return undefined;
  return PUBLIC_IMAGE_DIMENSIONS[path.split(/[?#]/, 1)[0]];
}

const deprecatedMediaPaths = new Set<string>(Object.values(DEPRECATED_PUBLIC_MEDIA));

export function isDeprecatedPublicMedia(path?: string) {
  return Boolean(path && deprecatedMediaPaths.has(path));
}
