import { CMSBlock, CMSSectorFeature, CMSSectorFeatureGroup } from "../types";

export type SectorKind = "cafe" | "restaurant" | "bar" | "retail" | "beauty";

type SectorItem = NonNullable<CMSBlock["items"]>[number];

export interface SectorContent {
  groups: CMSSectorFeatureGroup[];
}

export const SECTOR_ORDER: SectorKind[] = ["cafe", "restaurant", "bar", "retail", "beauty"];

const customerFeatures = (prefix: string): CMSSectorFeature[] => [
  {
    id: `${prefix}-screen`,
    eyebrow: "매장 커스텀",
    title: "첫 화면 꾸미기",
    description: "가격 안내와 매장 소식, 리뷰 참여 메시지를 결제 화면에 보여줍니다.",
    icon: "monitor",
    imageUrl: "/assets/sector/feature-front-wallpaper.webp",
    staticImageUrl: "/assets/sector/feature-front-wallpaper-static.webp",
    tone: "neutral",
    size: "standard",
  },
  {
    id: `${prefix}-coupon`,
    eyebrow: "고객 재방문",
    title: "고객별 쿠폰 발행",
    description: "첫 방문과 재방문 주기 등 조건에 맞춰 고객별 쿠폰을 운영합니다.",
    icon: "coupon",
    imageUrl: "/assets/sector/feature-coupon.webp",
    staticImageUrl: "/assets/sector/feature-coupon-static.webp",
    tone: "blue",
    size: "standard",
  },
  {
    id: `${prefix}-regular`,
    eyebrow: "결제 순간 확인",
    title: "단골 고객 알아보기",
    description: "방문 횟수와 자주 찾는 메뉴를 결제 시점에 확인해 응대에 활용합니다.",
    icon: "customer",
    imageUrl: "/assets/sector/feature-customer-profile.png",
    tone: "coral",
    size: "standard",
  },
  {
    id: `${prefix}-analytics`,
    eyebrow: "고객 데이터",
    title: "고객군 분석",
    description: "단골, 예비 단골, 첫 적립 고객을 구분해 매장 운영에 활용합니다.",
    icon: "chart",
    imageUrl: "/assets/sector/feature-customer-analysis.png",
    staticImageUrl: "/assets/sector/feature-customer-analysis-static.webp",
    tone: "mint",
    size: "standard",
  },
];

export const SECTOR_CONTENT_DEFAULTS: Record<SectorKind, SectorContent> = {
  cafe: {
    groups: [
      {
        id: "cafe-operations",
        title: "주문·배달·재고관리, 카페에 필요한 모든 기능",
        subtitle: "주문이 들어오는 순간부터 픽업과 재고 반영까지 한 흐름으로 연결합니다.",
        features: [
          {
            id: "cafe-delivery",
            eyebrow: "배달 통합 연동",
            title: "모든 배달 매출을 한곳에서",
            description: "배달의민족·요기요·쿠팡이츠 주문과 매출을 포스에서 함께 확인합니다.",
            icon: "delivery",
            imageUrl: "/assets/product/toss-delivery.webp",
            tone: "mint",
            size: "wide",
          },
          {
            id: "cafe-pickup",
            eyebrow: "모바일 주문",
            title: "기다림을 줄이는 픽업주문",
            description: "고객이 휴대폰으로 미리 주문하고 준비된 메뉴를 매장에서 받아갑니다.",
            icon: "smartphone",
            imageUrl: "/assets/sector/feature-cafe-pickup.png",
            tone: "amber",
            size: "standard",
          },
          {
            id: "cafe-front",
            eyebrow: "카운터 동선",
            title: "프론트 미니 키오스크",
            description: "고객이 메뉴를 직접 고르고 결제해 혼잡한 시간의 주문을 분산합니다.",
            icon: "monitor",
            imageUrl: "/assets/sector/feature-cafe-kiosk.webp",
            staticImageUrl: "/assets/sector/feature-cafe-kiosk-static.webp",
            tone: "blue",
            size: "standard",
          },
          {
            id: "cafe-coupon",
            eyebrow: "매출 관리",
            title: "조건에 맞춘 쿠폰 발행",
            description: "첫 적립 고객과 뜸한 고객을 나눠 필요한 쿠폰을 발송합니다.",
            icon: "coupon",
            imageUrl: "/assets/sector/feature-coupon.webp",
            staticImageUrl: "/assets/sector/feature-coupon-static.webp",
            tone: "violet",
            size: "standard",
          },
          {
            id: "cafe-stock",
            eyebrow: "입고 +5 · 출고 -2",
            title: "입출고를 한눈에 재고관리",
            description: "원두와 음료 상품의 입고·판매 흐름을 상품 단위로 확인합니다.",
            icon: "package",
            imageUrl: "/assets/operations/inventory.webp",
            tone: "neutral",
            size: "standard",
          },
        ],
      },
      {
        id: "cafe-customers",
        title: "내 매장을 위한 커스텀과 단골 고객 관리",
        subtitle: "첫 화면과 영수증을 매장답게 꾸미고 결제 데이터를 고객 관리로 이어갑니다.",
        features: [
          customerFeatures("cafe")[0],
          {
            id: "cafe-receipt",
            eyebrow: "매장 브랜딩",
            title: "영수증 커스텀",
            description: "매장 메시지와 안내 문구를 영수증에 담아 결제 이후 경험까지 연결합니다.",
            icon: "receipt",
            imageUrl: "/assets/sector/feature-cafe-receipt.png",
            tone: "amber",
            size: "standard",
          },
          customerFeatures("cafe")[2],
          customerFeatures("cafe")[3],
        ],
      },
    ],
  },
  restaurant: {
    groups: [
      {
        id: "restaurant-operations",
        title: "주문·배달·테이블 운영을 토스포스 하나로",
        subtitle: "홀과 배달 주문을 모으고 주방 전달과 테이블 관리까지 이어갑니다.",
        features: [
          {
            id: "restaurant-delivery",
            eyebrow: "배달 통합 연동",
            title: "홀 매출과 배달 매출을 한곳에서",
            description: "배달 3사 주문과 매장 주문을 한 포스에서 확인하고 품절도 함께 처리합니다.",
            icon: "delivery",
            imageUrl: "/assets/product/toss-delivery.webp",
            tone: "mint",
            size: "wide",
          },
          {
            id: "restaurant-table-order",
            eyebrow: "고객 직접 주문",
            title: "QR 테이블주문",
            description: "테이블에서 주문한 내용이 포스로 바로 전달되어 주문 누락을 줄입니다.",
            icon: "smartphone",
            imageUrl: "/assets/sector/feature-table-order.webp",
            tone: "blue",
            size: "standard",
          },
          {
            id: "restaurant-table-layout",
            eyebrow: "매장 맞춤 설정",
            title: "테이블 배치 편집",
            description: "매장 구조에 맞춰 테이블 위치와 상태를 보기 쉽게 구성합니다.",
            icon: "layout",
            imageUrl: "/assets/sector/feature-table-edit.png",
            tone: "coral",
            size: "standard",
          },
          {
            id: "restaurant-tablet",
            eyebrow: "주문 전용 화면",
            title: "태블릿 포스 운영",
            description: "카운터와 홀 동선에 맞춰 태블릿을 주문용 포스로 활용합니다.",
            icon: "tablet",
            imageUrl: "/assets/sector/feature-order-pos.webp",
            tone: "neutral",
            size: "standard",
          },
          {
            id: "restaurant-stock",
            eyebrow: "입출고 관리",
            title: "재고 흐름 확인",
            description: "식자재와 판매 상품의 입고·출고를 포스에서 한눈에 확인합니다.",
            icon: "package",
            imageUrl: "/assets/operations/inventory.webp",
            tone: "amber",
            size: "standard",
          },
        ],
      },
      {
        id: "restaurant-customers",
        title: "추가 운영과 재방문 고객 관리",
        subtitle: "첫 화면·쿠폰·영수증·고객 데이터까지 재방문 관리에 필요한 기능을 더 확인합니다.",
        features: [
          customerFeatures("restaurant")[0],
          customerFeatures("restaurant")[1],
          {
            id: "restaurant-receipt",
            eyebrow: "매장 안내",
            title: "영수증 커스텀",
            description: "리뷰 안내와 매장 메시지를 영수증에 함께 담아 전달합니다.",
            icon: "receipt",
            imageUrl: "/assets/sector/feature-restaurant-receipt.png",
            tone: "amber",
            size: "standard",
          },
          customerFeatures("restaurant")[2],
          customerFeatures("restaurant")[3],
        ],
      },
    ],
  },
  bar: {
    groups: [
      {
        id: "bar-operations",
        title: "QR 주문·재고·신분증 확인까지 한 흐름으로",
        subtitle: "주문이 몰리는 시간에도 확인 절차와 재고 변화를 포스에서 이어서 처리합니다.",
        features: [
          {
            id: "bar-qr",
            eyebrow: "테이블 주문",
            title: "QR 주문을 포스로 바로 전달",
            description: "고객이 테이블에서 주문하면 주문 내역이 포스로 연결됩니다.",
            icon: "smartphone",
            imageUrl: "/assets/product/toss-mobile-order.webp",
            tone: "blue",
            size: "wide",
          },
          {
            id: "bar-stock",
            eyebrow: "입고 +5 · 출고 -2",
            title: "입출고 재고관리",
            description: "주류와 판매 상품의 입출고를 등록해 재고 변화를 확인합니다.",
            icon: "package",
            imageUrl: "/assets/operations/inventory.webp",
            tone: "amber",
            size: "standard",
          },
          {
            id: "bar-id",
            eyebrow: "프론트 연동",
            title: "신분증 검사",
            description: "결제단말기에서 신분증 확인을 진행하고 결과를 바로 확인합니다.",
            icon: "scan",
            imageUrl: "/assets/sector/sector-bar.webp",
            staticImageUrl: "/assets/sector/sector-bar-static.webp",
            tone: "neutral",
            size: "standard",
          },
          customerFeatures("bar")[1],
        ],
      },
      {
        id: "bar-customers",
        title: "매장 커스텀과 단골 고객 관리",
        subtitle: "첫 화면을 매장 분위기에 맞추고 방문 데이터를 재방문 관리로 연결합니다.",
        features: [
          customerFeatures("bar")[0],
          customerFeatures("bar")[2],
          customerFeatures("bar")[3],
        ],
      },
    ],
  },
  retail: {
    groups: [
      {
        id: "retail-operations",
        title: "상품 등록과 재고관리를 한 번에",
        subtitle: "상품이 많아도 대량 등록과 바코드, 빠른 검색으로 판매 준비 시간을 줄입니다.",
        features: [
          {
            id: "retail-stock",
            eyebrow: "입고 +5 · 출고 -2",
            title: "입출고 재고관리",
            description: "상품별 입고와 판매 흐름을 확인하고 현재 재고를 관리합니다.",
            icon: "package",
            imageUrl: "/assets/operations/inventory.webp",
            tone: "mint",
            size: "wide",
          },
          {
            id: "retail-bulk",
            eyebrow: "상품 데이터",
            title: "대량 상품 한 번에 등록",
            description: "상품 수가 많을 때도 한 번에 등록해 초기 입력 시간을 줄입니다.",
            icon: "upload",
            imageUrl: "/assets/sector/sector-retail.webp",
            tone: "violet",
            size: "standard",
          },
          {
            id: "retail-barcode",
            eyebrow: "빠른 결제",
            title: "상품 바코드 스캔",
            description: "바코드를 읽어 상품을 찾고 결제 화면에 바로 담습니다.",
            icon: "barcode",
            imageUrl: "/assets/sector/feature-retail-barcode.webp",
            tone: "blue",
            size: "standard",
          },
          {
            id: "retail-search",
            eyebrow: "초성 검색",
            title: "상품명 빠른 검색",
            description: "상품명 전체를 입력하지 않아도 초성으로 원하는 상품을 찾습니다.",
            icon: "search",
            imageUrl: "/assets/sector/feature-retail-search.png",
            tone: "neutral",
            size: "wide",
          },
          {
            id: "retail-market-price",
            eyebrow: "유동 가격 상품",
            title: "가격이 달라도 바로 입력",
            description: "꽃과 제철 상품처럼 가격이 자주 달라지는 상품은 결제 시점에 금액을 입력합니다.",
            icon: "credit-card",
            imageUrl: "/assets/sector/feature-market-price.webp",
            staticImageUrl: "/assets/sector/feature-market-price-static.webp",
            tone: "violet",
            size: "wide",
          },
        ],
      },
      {
        id: "retail-customers",
        title: "구매 데이터를 재방문 고객 관리로",
        subtitle: "쿠폰과 단골 확인, 고객군 분석으로 상품 판매 이후의 관계를 이어갑니다.",
        features: [
          customerFeatures("retail")[1],
          customerFeatures("retail")[2],
          customerFeatures("retail")[3],
        ],
      },
    ],
  },
  beauty: {
    groups: [
      {
        id: "beauty-operations",
        title: "예약·고객관리·결제를 한 흐름으로",
        subtitle: "예약 접수부터 담당자 일정, 고객 메모와 결제까지 샵 운영에 맞춰 연결합니다.",
        features: [
          {
            id: "beauty-mobile",
            eyebrow: "예약 접수",
            title: "예약 조회·등록을 한 화면에서",
            description: "예약 홈에서 일정을 확인하고 새 고객 예약을 등록하는 실제 화면입니다.",
            icon: "smartphone",
            imageUrl: "/assets/sector/beauty-reservation-register.webp",
            staticImageUrl: "/assets/sector/beauty-reservation-register-static.webp",
            tone: "blue",
            size: "wide",
          },
          {
            id: "beauty-schedule",
            eyebrow: "담당자 운영",
            title: "담당자 스케줄을 한눈에",
            description: "담당자별 예약과 빈 시간을 구분해 보는 실제 예약 관리 화면입니다.",
            icon: "calendar",
            imageUrl: "/assets/sector/beauty-schedule-ui.png",
            tone: "violet",
            size: "wide",
          },
          {
            id: "beauty-reminder",
            eyebrow: "방문 전 안내",
            title: "예약 알림톡 자동 안내",
            description: "예약 하루 전과 당일에 일정을 안내해 노쇼와 일정 착오를 줄입니다.",
            icon: "bell",
            imageUrl: "/assets/sector/beauty-booking-talk.png",
            staticImageUrl: "/assets/sector/beauty-booking-talk-static.webp",
            tone: "mint",
            size: "standard",
          },
          {
            id: "beauty-notes",
            eyebrow: "고객 응대",
            title: "예약마다 남기는 고객 메모",
            description: "시술 이력과 요청 사항을 예약별로 기록해 다음 방문에 이어서 활용합니다.",
            icon: "customer",
            imageUrl: "/assets/sector/beauty-customer-note.png",
            tone: "coral",
            size: "standard",
          },
          {
            id: "beauty-front",
            eyebrow: "결제와 공간",
            title: "샵에 자연스럽게 놓이는 토스프론트",
            description: "실제 네일샵 카운터에 설치된 토스프론트로 공간과 제품이 어우러지는 모습을 확인합니다.",
            icon: "credit-card",
            imageUrl: "/assets/sector/beauty-front-store-wide.webp",
            tone: "neutral",
            size: "wide",
          },
        ],
      },
      {
        id: "beauty-customers",
        title: "샵 커스텀과 회원 관리",
        subtitle: "첫 화면과 쿠폰, 회원 정보, 선불권을 결제 흐름 안에서 함께 관리합니다.",
        features: [
          {
            ...customerFeatures("beauty")[0],
            title: "가격·리뷰 안내 첫 화면",
            imageUrl: "/assets/sector/beauty-front-screen.webp",
            staticImageUrl: "/assets/sector/beauty-front-screen-static.webp",
          },
          customerFeatures("beauty")[1],
          {
            id: "beauty-member",
            eyebrow: "결제 순간 확인",
            title: "회원 정보 보기",
            description: "방문 횟수와 이용 내역을 결제 시점에 확인해 고객 응대에 활용합니다.",
            icon: "customer",
            imageUrl: "/assets/sector/beauty-member-info.png",
            tone: "coral",
            size: "standard",
          },
          {
            id: "beauty-pass",
            eyebrow: "선불 회원권",
            title: "금액권·횟수권 관리",
            description: "회원별 금액권과 횟수권 잔여량을 결제와 함께 관리합니다.",
            icon: "coupon",
            imageUrl: "/assets/sector/beauty-prepaid-pass.png",
            staticImageUrl: "/assets/sector/beauty-prepaid-pass-static.webp",
            tone: "amber",
            size: "standard",
          },
        ],
      },
    ],
  },
};

const LEGACY_FEATURE_MEDIA: Record<string, string[]> = {
  "cafe-pickup": ["/assets/product/toss-mobile-order.webp"],
  "cafe-front": ["/assets/product/toss-front.webp"],
  "cafe-coupon": ["/assets/product/toss-coupon.webp"],
  "cafe-receipt": ["/assets/product/toss-pos-receipt.webp"],
  "restaurant-table-order": ["/assets/product/toss-mobile-order.webp"],
  "restaurant-tablet": ["/assets/sector/sector-restaurant.webp"],
  "restaurant-receipt": ["/assets/product/toss-pos-receipt.webp"],
  "bar-id": ["/assets/sector/sector-bar-static.webp"],
  "beauty-front": [
    "/assets/product/toss-front.webp",
    "/assets/sector/beauty-front-store-wide.png",
  ],
  "beauty-mobile": [
    "/assets/sector/sector-beauty-mobile.webp",
    "/assets/sector/beauty-reservation-register.gif",
  ],
  "beauty-schedule": ["/assets/sector/sector-beauty-schedule.webp"],
  "beauty-screen": ["/assets/product/toss-front.webp", "/assets/sector/feature-front-wallpaper.webp"],
};

const COMMON_LEGACY_MEDIA = [
  { suffix: "-screen", paths: ["/assets/product/toss-front.webp"] },
  { suffix: "-coupon", paths: ["/assets/product/toss-coupon.webp"] },
  { suffix: "-analytics", paths: ["/assets/product/toss-sales.webp"] },
];

const SECTOR_FEATURE_MEDIA = Object.values(SECTOR_CONTENT_DEFAULTS)
  .flatMap((content) => content.groups)
  .flatMap((group) => group.features)
  .reduce<Record<string, { current: string; staticImageUrl?: string; legacy: string[] }>>((media, feature) => {
    if (feature.imageUrl) {
      media[feature.id] = {
        current: feature.imageUrl,
        staticImageUrl: feature.staticImageUrl,
        legacy: [
          ...(LEGACY_FEATURE_MEDIA[feature.id] || []),
          ...COMMON_LEGACY_MEDIA.filter(({ suffix }) => feature.id.endsWith(suffix)).flatMap(({ paths }) => paths),
        ],
      };
    }
    return media;
  }, {});

function normalizeSectorFeatureMedia(groups: CMSSectorFeatureGroup[]) {
  return groups.map((group) => ({
    ...group,
    features: group.features.map((feature) => {
      const media = SECTOR_FEATURE_MEDIA[feature.id];
      if (!media) return feature;
      const usesLegacyMedia = Boolean(feature.imageUrl && media.legacy.includes(feature.imageUrl));
      const usesCurrentMedia = feature.imageUrl === media.current;
      if (feature.imageUrl && !usesLegacyMedia && !usesCurrentMedia) return feature;
      return {
        ...feature,
        imageUrl: media.current,
        staticImageUrl: feature.staticImageUrl || media.staticImageUrl,
      };
    }),
  }));
}

export function getSectorKind(item: SectorItem | undefined, index: number): SectorKind {
  const icon = item?.icon;
  if (icon === "coffee") return "cafe";
  if (icon === "utensils") return "restaurant";
  if (icon === "bar") return "bar";
  if (icon === "shop") return "retail";
  if (icon === "beauty") return "beauty";

  const title = item?.title || "";
  if (title.includes("카페") || title.includes("베이커리")) return "cafe";
  if (title.includes("음식") || title.includes("식당")) return "restaurant";
  if (title.includes("술집") || title.includes("바")) return "bar";
  if (title.includes("도매") || title.includes("소매")) return "retail";
  if (title.includes("뷰티") || title.includes("미용")) return "beauty";
  return SECTOR_ORDER[index % SECTOR_ORDER.length] || "cafe";
}

export function getSectorDetailGroups(item: SectorItem | undefined, index: number): CMSSectorFeatureGroup[] {
  const kind = getSectorKind(item, index);
  const groups = item?.detailGroups?.length ? item.detailGroups : SECTOR_CONTENT_DEFAULTS[kind].groups;
  return normalizeSectorFeatureMedia(groups);
}

export function cloneSectorDetailGroups(groups: CMSSectorFeatureGroup[]): CMSSectorFeatureGroup[] {
  return groups.map((group) => ({
    ...group,
    features: group.features.map((feature) => ({ ...feature })),
  }));
}
