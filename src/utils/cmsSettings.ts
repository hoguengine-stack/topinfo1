import { CMSBlock, CMSPage, NavigationSettings } from "../types";
import { DEPRECATED_PUBLIC_MEDIA, PUBLIC_MEDIA, isDeprecatedPublicMedia } from "./publicMedia";

export const PUBLIC_DESIGN_VERSION = 22;

export const STANDARD_NAV_SLUGS = [
  "home",
  "toss_pos",
  "uplus_ai_phone",
  "products",
  "board_resources",
  "board_suggestions",
  "request_consult",
  "request_paper",
];

export const DEFAULT_NAVIGATION_SETTINGS: NavigationSettings = {
  home: { label: "홈", visible: true, order: 0 },
  toss_pos: { label: "토스포스", visible: true, order: 1 },
  uplus_ai_phone: { label: "U+ AI전화", visible: false, order: 2 },
  products: { label: "제품·서비스", visible: true, order: 3 },
  board_resources: { label: "자료실", visible: true, order: 4 },
  board_suggestions: { label: "건의제안", visible: true, order: 5 },
  request_paper: { label: "용지 배송", visible: true, order: 6 },
  request_consult: { label: "무료 상담", visible: true, order: 7 },
};

export const HOME_HERO_ITEMS: NonNullable<CMSBlock["items"]> = [
  { title: "LG U+ 인터넷 500M", desc: "소상공인 인터넷과 Wi-Fi 개통", icon: "wifi" },
  { title: "U+ AI전화", desc: "24시간 AI 응대와 문의 리포트", icon: "phone" },
  { title: "U+ 지능형 CCTV", desc: "FHD 모니터링·이상 감지·긴급출동", icon: "shield" },
  { title: "토스포스", desc: "APEXA X · 주문·결제·매장 운영", icon: "monitor", imageUrl: PUBLIC_MEDIA.homeHero.tossPos },
  { title: "토스프론트", desc: "결제단말기·고객 화면·미니 키오스크", icon: "credit-card", imageUrl: PUBLIC_MEDIA.homeHero.tossFront },
  { title: "카드사 가맹", desc: "필요 서류와 결제 개통 지원", icon: "file" },
  { title: "설치·AS", desc: "현장 설치부터 운영 이후까지", icon: "wrench" },
];

export const HOME_OPENING_ITEMS: NonNullable<CMSBlock["items"]> = [
  { title: "새 매장을 준비해요", desc: "오픈 일정에 맞춰 인터넷·결제·장비 설치 순서를 함께 정합니다.", icon: "shop", buttonLink: "#home-sector-picker" },
  { title: "기존 장비를 바꾸고 싶어요", desc: "약정과 사용 장비를 확인해 전환 가능한 구성을 안내합니다.", icon: "monitor", buttonLink: "#services:pos" },
  { title: "통신과 보안을 정리하고 싶어요", desc: "인터넷·AI전화·CCTV를 매장 환경에 맞춰 확인합니다.", icon: "wifi", buttonLink: "#services:internet" },
  { title: "설치 후 지원이 필요해요", desc: "AS·용지 배송·사용 자료와 추가 요청을 같은 창구에서 접수합니다.", icon: "wrench", buttonLink: "#support" },
];

export const HOME_PACKAGE_ITEMS: NonNullable<CMSBlock["items"]> = [
  { title: "LG U+ 500M 인터넷", desc: "소상공인 인터넷·Wi-Fi", icon: "wifi" },
  { title: "U+ AI전화", desc: "24시간 AI 응대·문의 리포트", icon: "phone" },
  { title: "U+ 지능형 CCTV", desc: "FHD 모니터링·이상 감지·출동", icon: "shield" },
  { title: "토스포스 + 토스프론트", desc: "APEXA X 본체·결제단말기", icon: "monitor" },
  { title: "영수증 프린터·금전함", desc: "키보드·마우스 포함", icon: "receipt" },
  { title: "배달앱 연동", desc: "주요 배달 주문 연결", icon: "delivery" },
  { title: "카드사 가맹 지원", desc: "필요 서류와 개통 절차", icon: "file" },
  { title: "현장 설치·교육", desc: "매장 운영 기본 안내", icon: "wrench" },
  { title: "AS·고객지원", desc: "설치 이후 요청 접수", icon: "phone" },
];

export const HOME_SYSTEM_GRAPHICS = {
  pos: "/assets/product/toss-front-customer-payment.png",
  internet: "/assets/generated/system-internet-apexa-x.webp",
  ai: "/assets/uplus/uplus-ip520ga-hero.png",
  cctv: "/assets/generated/system-cctv.webp",
  phone: "/assets/uplus/uplus-ip520ga-white.png",
} as const;

export const HOME_TELECOM_ITEMS: NonNullable<CMSBlock["items"]> = [
  { title: "토스포스 주문·결제", desc: "직원은 토스포스에서 주문을 확인하고, 손님은 카운터의 토스프론트에서 직접 결제합니다.", badge: "손님 결제 · 토스프론트", icon: "monitor", mediaKind: "pos", imageUrl: HOME_SYSTEM_GRAPHICS.pos, imageAlt: "손님이 카운터의 토스프론트에서 직접 결제하는 실제 사용 장면" },
  { title: "소상공인 인터넷 500M", desc: "매장 인터넷을 중심으로 포스·결제단말기·태블릿·프린터를 안정적으로 연결합니다.", badge: "500M · 매장 기기 연결", icon: "wifi", mediaKind: "internet", imageUrl: HOME_SYSTEM_GRAPHICS.internet, imageAlt: "매장 인터넷이 포스와 결제단말기, 태블릿, 프린터를 연결하는 장면" },
  { title: "U+ AI전화", desc: "LG U+의 IP-520GA 전화기로 AI가 영업시간·위치·주차 같은 반복 문의에 응대하고, 사장님은 앱에서 통화 내역과 메모를 확인합니다.", badge: "LG U+ AI 응대 · IP-520GA", icon: "phone", mediaKind: "ai", imageUrl: HOME_SYSTEM_GRAPHICS.ai, imageAlt: "화이트 LG U+ IP-520GA 전화기와 AI 문의 응대 기능", buttonText: "U+ AI전화 자세히", buttonLink: "uplus_ai_phone" },
  { title: "U+ 지능형 CCTV", desc: "매장 카메라를 휴대폰으로 확인하고 이상 감지 알림과 긴급출동 지원을 연결합니다.", badge: "모바일 확인 · 감지 · 출동", icon: "shield", mediaKind: "cctv", imageUrl: HOME_SYSTEM_GRAPHICS.cctv, imageAlt: "매장 CCTV를 휴대폰으로 확인하고 이상 감지와 현장 지원을 연결하는 장면" },
];

export const HOME_SECTOR_ITEMS: NonNullable<CMSBlock["items"]> = [
  {
    title: "카페·베이커리", badge: "빠른 결제와 단골 고객 관리", desc: "토스포스|토스프론트|영수증 프린터|LG U+ Wi-Fi|리뷰·포인트", icon: "coffee", imageUrl: "/assets/sector/sector-cafe.webp", staticImageUrl: "/assets/sector/sector-cafe-static.webp",
    mediaPlaylist: [
      { imageUrl: "/assets/sector/sector-cafe.webp", staticImageUrl: "/assets/sector/sector-cafe-static.webp", caption: "결제단말기가 미니 키오스크로", imageAlt: "카페 카운터에서 토스프론트를 미니 키오스크로 사용하는 장면", durationMs: 6200 },
      { imageUrl: "/assets/sector/feature-coupon.webp", staticImageUrl: "/assets/sector/feature-coupon-static.webp", caption: "단골 쿠폰 자동 발행", imageAlt: "카페 단골 고객 조건에 맞춰 쿠폰을 자동 발행하는 장면", durationMs: 6200 },
      { imageUrl: "/assets/sector/feature-cafe-pickup.png", caption: "휴대폰 픽업 주문", imageAlt: "카페 고객이 휴대폰으로 미리 주문하고 매장에서 메뉴를 찾아가는 장면" },
      { imageUrl: "/assets/sector/feature-cafe-receipt.png", caption: "카페 로고를 담은 영수증", imageAlt: "카페의 로고와 안내 문구를 넣어 출력한 맞춤 영수증" },
    ],
  },
  {
    title: "음식점", badge: "홀 주문부터 배달 매출까지 한 화면에", desc: "배달 3사 연동|QR 테이블오더|주문 자동 접수|주방 프린터|토스포스", icon: "utensils", imageUrl: "/assets/sector/feature-table-order.webp", imageAlt: "음식점 테이블에서 QR을 스캔해 휴대폰으로 메뉴를 주문하는 장면",
    mediaPlaylist: [
      { imageUrl: "/assets/product/toss-delivery-sales.webp", caption: "배달 3사 주문·매출 한 곳에서", imageAlt: "배달의민족·요기요·쿠팡이츠 주문과 매출을 토스포스에서 통합 확인하는 장면", durationMs: 6800 },
      { imageUrl: "/assets/sector/feature-table-order.webp", caption: "테이블 QR 주문", imageAlt: "음식점 테이블에서 QR을 스캔해 휴대폰으로 메뉴를 주문하는 장면" },
      { imageUrl: "/assets/sector/feature-order-pos.webp", caption: "주문 접수와 주방 전달", imageAlt: "음식점 주문이 토스포스에 접수되어 주방으로 전달되는 화면" },
      { imageUrl: "/assets/sector/feature-restaurant-review.webp", caption: "사용 후기가 자동으로 이어져요", imageAlt: "음식점 사장님들의 토스포스 사용 후기가 좌우로 이어지는 장면", durationMs: 8500 },
    ],
  },
  {
    title: "술집·바", badge: "신분 확인부터 변동 메뉴와 단골 관리까지", desc: "토스포스|신분증 확인|시가 메뉴|단골 쿠폰|CCTV", icon: "bar", imageUrl: "/assets/sector/sector-bar.webp", staticImageUrl: "/assets/sector/sector-bar-static.webp",
    mediaPlaylist: [
      { imageUrl: "/assets/sector/sector-bar.webp", staticImageUrl: "/assets/sector/sector-bar-static.webp", caption: "토스프론트 신분증 확인", imageAlt: "술집 카운터에서 토스프론트로 신분증을 확인하는 장면", durationMs: 6200 },
      { imageUrl: "/assets/sector/feature-front-wallpaper.webp", staticImageUrl: "/assets/sector/feature-front-wallpaper-static.webp", caption: "바 분위기에 맞춘 첫 화면", imageAlt: "술집 분위기에 맞춰 토스프론트 첫 화면을 꾸미는 장면", durationMs: 10000 },
      { imageUrl: "/assets/sector/feature-bar-store.png", caption: "와인바 공간과 어울리는 구성", imageAlt: "조명이 켜진 와인 진열장과 술집 매장 공간" },
      { imageUrl: "/assets/sector/feature-customer-profile.png", caption: "단골 방문 흐름 확인", imageAlt: "단골 고객의 최근 방문과 주문 시간대를 확인하는 화면" },
    ],
  },
  {
    title: "도·소매업", badge: "바코드로 상품을 찍고 재고까지 반영", desc: "바코드 스캔|상품 자동 불러오기|재고 입출고|대량 상품 등록|매출 분석", icon: "shop", imageUrl: "/assets/sector/sector-retail-scan.webp", imageAlt: "마트 계산대에서 바코드를 스캔하고 화이트 POSBANK APEXA X의 토스포스에 상품을 반영하는 장면",
    mediaPlaylist: [
      { imageUrl: "/assets/sector/sector-retail-scan.webp", caption: "바코드 스캔과 재고 반영", imageAlt: "마트 계산대에서 바코드를 스캔하고 토스포스에 상품을 반영하는 장면" },
      { imageUrl: "/assets/sector/feature-retail-barcode.webp", caption: "상품 종류가 많아도 바코드로", imageAlt: "도소매 매장에서 상품 바코드를 등록하고 판매하는 화면" },
      { imageUrl: "/assets/sector/feature-retail-search.png", caption: "초성으로 상품 빠르게 검색", imageAlt: "토스포스에서 상품명을 초성으로 빠르게 검색하는 화면" },
      { imageUrl: "/assets/sector/feature-market-price.webp", staticImageUrl: "/assets/sector/feature-market-price-static.webp", caption: "가격이 달라지는 상품도 즉시 입력", imageAlt: "꽃과 제철 상품처럼 가격이 달라지는 상품을 토스포스에서 바로 입력하는 장면", durationMs: 6200 },
      { imageUrl: "/assets/sector/feature-customer-analysis.png", staticImageUrl: "/assets/sector/feature-customer-analysis-static.webp", caption: "결제 데이터로 고객 분석", imageAlt: "결제 데이터를 바탕으로 고객 방문과 매출을 분석하는 화면", durationMs: 6200 },
    ],
  },
  {
    title: "뷰티·서비스", badge: "예약·담당자·고객 메모를 한 화면에", desc: "예약 조회·등록|담당자 스케줄|고객 메모|예약 알림톡|선불권", icon: "beauty", imageUrl: "/assets/sector/beauty-reservation-register.webp", staticImageUrl: "/assets/sector/beauty-reservation-register-static.webp", imageAlt: "뷰티 매장에서 휴대폰과 PC로 예약을 조회하고 등록하는 장면",
    mediaPlaylist: [
      { imageUrl: "/assets/sector/beauty-reservation-register.webp", staticImageUrl: "/assets/sector/beauty-reservation-register-static.webp", caption: "휴대폰 예약 조회·등록", imageAlt: "뷰티 매장에서 휴대폰과 PC로 예약을 조회하고 등록하는 장면", durationMs: 12000 },
      { imageUrl: "/assets/sector/beauty-booking-talk.png", staticImageUrl: "/assets/sector/beauty-booking-talk-static.webp", caption: "예약 전 알림톡", imageAlt: "예약한 고객에게 방문 전 카카오 알림톡을 보내는 장면", durationMs: 6200 },
      { imageUrl: "/assets/sector/beauty-schedule-ui.png", caption: "담당자 스케줄을 한눈에", imageAlt: "뷰티 매장 담당자별 예약 일정을 한 화면에서 확인하는 장면" },
      { imageUrl: "/assets/sector/beauty-customer-note.png", caption: "예약별 고객 메모", imageAlt: "뷰티 고객의 최근 방문과 예약 메모를 확인하는 장면" },
      { imageUrl: "/assets/sector/beauty-front-screen.webp", staticImageUrl: "/assets/sector/beauty-front-screen-static.webp", caption: "샵에 맞는 단말 첫 화면", imageAlt: "뷰티 매장 분위기에 맞춰 토스프론트 첫 화면을 꾸미는 장면", durationMs: 6500 },
      { imageUrl: "/assets/sector/beauty-prepaid-pass.png", staticImageUrl: "/assets/sector/beauty-prepaid-pass-static.webp", caption: "금액권·횟수권 자동 차감", imageAlt: "뷰티 고객의 금액권과 횟수권을 결제 시 자동 차감하는 장면", durationMs: 6200 },
    ],
  },
];

export const HOME_SECTOR_MEDIA_SOURCE_IDS: Record<string, string> = {
  "/assets/sector/sector-cafe.webp": "toss:place-front-kiosk-cafe",
  "/assets/sector/feature-cafe-kiosk.webp": "toss:place-front-kiosk-cafe",
  "/assets/sector/feature-coupon.webp": "toss:place-coupon-list-popup",
  "/assets/sector/feature-cafe-pickup.png": "toss:mockup-toss-order-cafe-pickup",
  "/assets/sector/feature-cafe-receipt.png": "topinfo:custom-receipt-cafe",
  "/assets/sector/feature-restaurant-receipt.png": "topinfo:custom-receipt-restaurant",
  "/assets/product/toss-delivery-sales.webp": "toss:delivery-sales-dashboard",
  "/assets/sector/feature-table-order.webp": "toss:table-order-homepage",
  "/assets/sector/feature-order-pos.webp": "toss:table-pos-picture",
  "/assets/sector/feature-restaurant-review.webp": "toss:customer-review-rolling",
  "/assets/sector/sector-bar.webp": "toss:place-idcard-scan",
  "/assets/sector/feature-front-wallpaper.webp": "toss:place-front-wallpaper-slide",
  "/assets/sector/feature-bar-store.png": "toss:winebar-store-photo",
  "/assets/sector/feature-customer-profile.png": "toss:customer-profile-card",
  "/assets/sector/sector-retail-scan.webp": "topinfo:retail-apexa-barcode-scene",
  "/assets/sector/feature-retail-barcode.webp": "toss:retail-barcode",
  "/assets/sector/feature-retail-search.png": "toss:retail-product-search",
  "/assets/sector/feature-market-price.webp": "toss:variable-price-entry",
  "/assets/sector/feature-customer-analysis.png": "toss:customer-analysis-graph",
  "/assets/sector/beauty-reservation-register.webp": "toss:beauty-reservation-register",
  "/assets/sector/beauty-booking-talk.png": "toss:beauty-booking-talk",
  "/assets/sector/beauty-schedule-ui.png": "toss:beauty-staff-schedule",
  "/assets/sector/beauty-customer-note.png": "toss:beauty-customer-note",
  "/assets/sector/beauty-front-screen.webp": "toss:beauty-front-screen",
  "/assets/sector/beauty-prepaid-pass.png": "toss:beauty-prepaid-pass",
};

export const HOME_SERVICE_ITEMS: NonNullable<CMSBlock["items"]> = [
  { title: "토스포스·토스프론트", desc: "포스뱅크 APEXA X 본체와 토스프론트의 주문·결제 구성을 안내합니다.", icon: "monitor" },
  { title: "카드단말기·키오스크", desc: "결제 동선과 메뉴 수를 고려해 필요한 장비를 구성합니다.", icon: "credit-card", imageUrl: PUBLIC_MEDIA.homeServices.kiosk },
  { title: "U+ AI전화", desc: "AI가 반복 문의에 24시간 응대하고 앱에서 문의 리포트를 확인할 수 있습니다.", icon: "phone" },
  { title: "U+ 지능형 CCTV", desc: "실내·실외 카메라와 모바일 모니터링, 이상 감지·출동을 연결합니다.", icon: "shield" },
  { title: "U+ 인터넷전화", desc: "매장 동선에 맞는 유선·무선 전화기와 인터넷 전화 장비를 안내합니다.", icon: "phone" },
  { title: "카드사 가맹 지원", desc: "신규 사업자의 제출 서류와 카드사 가맹 절차를 안내합니다.", icon: "file" },
  { title: "설치·교육·AS", desc: "현장 설치 후 기본 사용법과 장애 접수 창구를 제공합니다.", icon: "wrench" },
  { title: "배달·매출 운영", desc: "배달 주문, 재고, 매출 확인에 필요한 토스포스 기능을 안내합니다.", icon: "chart", imageUrl: PUBLIC_MEDIA.homeServices.delivery },
];

export const HOME_PROCESS_ITEMS: NonNullable<CMSBlock["items"]> = [
  { title: "무료 상담", desc: "업종, 위치, 오픈 일정과 필요한 장비를 확인합니다.", icon: "phone" },
  { title: "통신 설치", desc: "인터넷·AI전화·CCTV 설치 조건과 일정을 안내합니다.", icon: "wifi" },
  { title: "카드사 가맹", desc: "필요 서류와 결제 개통 절차를 지원합니다.", icon: "credit-card" },
  { title: "기기 설치", desc: "토스포스와 결제단말기, 주변 장비를 연결합니다.", icon: "monitor" },
  { title: "사용 교육", desc: "메뉴 등록과 주문·결제 기본 운영 방법을 안내합니다.", icon: "check" },
  { title: "운영·AS", desc: "장애, 소모품, 추가 요청을 계속 접수합니다.", icon: "wrench" },
];

export const HOME_FAQ_ITEMS: NonNullable<CMSBlock["items"]> = [
  { title: "기존 매장도 인터넷과 포스를 바꿀 수 있나요?", desc: "가능합니다. 현재 약정과 장비를 확인한 뒤 전환 가능 일정과 구성을 안내합니다." },
  { title: "장비 무료 제공은 어떤 조건인가요?", desc: "LG U+ 인터넷 결합과 매장 설치 조건에 따라 제공 범위가 달라집니다. 월 이용료, 약정, 부가세와 제공 장비를 상담 시 함께 안내합니다." },
  { title: "U+ AI전화는 어떤 문의를 응대하나요?", desc: "등록한 영업시간, 위치, 주차와 같은 기본 문의를 AI가 안내하고 응대 내역과 손님 메모를 우리가게패키지 앱에서 확인할 수 있습니다." },
  { title: "U+ 지능형 CCTV는 휴대폰에서도 볼 수 있나요?", desc: "전용 앱과 PC 뷰어에서 실시간·녹화 영상을 확인할 수 있으며 이상 감지 알림과 긴급출동 기능을 지원합니다." },
  { title: "탑정보통신의 기본 토스포스 장비는 무엇인가요?", desc: "포스뱅크 APEXA X-1500 본체의 Windows 환경에 토스포스를 구성합니다. 다른 지원 기기는 매장 환경과 운영 목적을 확인한 뒤 별도로 안내합니다." },
  { title: "설치 후 AS와 용지 요청은 어디에서 하나요?", desc: "대표·AS 전화 031-487-4401 또는 홈페이지 고객지원 메뉴에서 접수할 수 있습니다." },
];

export function createDefaultCMSPages(createdAt = new Date().toISOString()): CMSPage[] {
  return [
    {
      id: "home",
      title: "홈",
      slug: "home",
      isCustom: false,
      createdAt,
      designVersion: PUBLIC_DESIGN_VERSION,
      blocks: [
        {
          id: "home-hero",
          type: "hero",
          badge: "탑정보통신 · 토스플레이스 직계약 대리점",
          title: "매장 오픈의 연결을\n끝까지 맡습니다",
          subtitle: "인터넷·AI전화·CCTV부터 토스포스·결제·설치 이후 AS까지 한 창구로 연결합니다.",
          buttonText: "무료 상담 신청",
          buttonLink: "request_consult",
          button2Text: "대표·AS 031-487-4401",
          button2Link: "tel:0314874401",
          align: "left",
          note: "안산·경기권 매장 상담부터 설치·운영 요청까지 이어서 안내합니다.",
          items: HOME_HERO_ITEMS,
        },
        {
          id: "home-signals",
          type: "features",
          badge: "사장님 선택 가이드",
          title: "지금 어떤 준비를 하고 계세요?",
          subtitle: "매장 상황부터 고르면 필요한 서비스와 업종별 구성을 더 빠르게 확인할 수 있습니다.",
          itemLayout: "opening-console",
          items: HOME_OPENING_ITEMS,
        },
        {
          id: "home-sector",
          type: "features",
          badge: "업종별 추천",
          title: "우리 매장에 맞는 기능을\n직접 골라보세요",
          subtitle: "업종에 따라 자주 쓰는 장비와 운영 기능을 비교할 수 있습니다.",
          itemLayout: "store-configurator",
          buttonText: "업종별 구성 자세히 보기",
          buttonLink: "toss_pos",
          items: HOME_SECTOR_ITEMS,
        },
        {
          id: "home-internet",
          type: "features",
          itemLayout: "telecom-showcase",
          badge: "제품·서비스 사용 장면",
          title: "매장 안에서\n이렇게 연결됩니다",
          subtitle: "주문·결제와 통신 서비스가 매장 운영에서 어떻게 이어지는지 장면으로 확인하세요.",
          buttonText: "제품 구성 상담",
          buttonLink: "request_consult",
          items: HOME_TELECOM_ITEMS,
        },
        {
          id: "home-package",
          type: "banner",
          bannerLayout: "offer",
          badge: "LG U+ 결합 프로모션",
          title: "LG U+ 인터넷 신청하고\n매장 장비까지 한 번에",
          subtitle: "신규 설치와 기존 매장 전환을 함께 확인합니다.",
          buttonText: "내 매장 조건 확인",
          buttonLink: "request_consult",
          imageUrl: PUBLIC_MEDIA.homePackage.overview,
          priceLabel: "LG U+ 모바일 결합 시",
          priceValue: "34,000",
          priceUnit: "원 / 월",
          priceDetails: "LG U+ 모바일 결합 시 월 34,000원부터 · 일반 월 43,000원 · 부가세 별도\n결합·약정·설치 환경에 따라 실제 제공 조건이 달라질 수 있습니다.",
          note: "2026년 7월 홈페이지 안내 기준 · 상담 시 최신 조건을 다시 확인합니다.",
          imageCaption: "탑정보통신 매장 장비 결합 구성 이미지",
          listLabel: "패키지 구성 예시",
          items: HOME_PACKAGE_ITEMS,
        },
        {
          id: "home-process",
          type: "features",
          badge: "진행 절차",
          title: "설치보다 중요한 건\n설치 이후의 관리입니다",
          subtitle: "안산·경기권 매장의 상담부터 현장 설치, 사용 안내와 운영 요청까지 이어서 지원합니다.",
          note: "경기도 안산시 상록구 천문로17 일영빌딩 2층",
          itemLayout: "process",
          items: HOME_PROCESS_ITEMS,
        },
        {
          id: "home-support",
          type: "features",
          badge: "가맹점 지원",
          title: "이미 이용 중인 가맹점도 빠르게",
          itemLayout: "action-grid",
          items: [
            { title: "영수증 용지 배송", desc: "배송지와 단말기 정보를 입력해 용지를 요청합니다.", icon: "scrolltext", buttonText: "배송 요청", buttonLink: "request_paper" },
            { title: "자료실", desc: "설치·사용·장애 조치 안내 자료를 확인합니다.", icon: "layers", buttonText: "자료 보기", buttonLink: "board_resources" },
            { title: "건의제안", desc: "운영 중 불편한 점과 개선 의견을 남길 수 있습니다.", icon: "heart", buttonText: "의견 남기기", buttonLink: "board_suggestions" },
          ],
        },
        {
          id: "home-faq",
          type: "features",
          badge: "자주 묻는 질문",
          title: "상담 전에 많이 묻는 내용",
          itemLayout: "faq",
          items: HOME_FAQ_ITEMS,
        },
        {
          id: "home-cta",
          type: "banner",
          badge: "매장 오픈 상담",
          title: "오픈 일정이 정해졌다면\n인터넷부터 먼저 확인하세요",
          subtitle: "위치와 오픈일을 남기면 설치 순서를 안내합니다.",
          buttonText: "무료 상담 시작",
          buttonLink: "request_consult",
          button2Text: "031-487-4401",
          button2Link: "tel:0314874401",
          align: "center",
        },
      ],
    },
    {
      id: "toss_pos",
      title: "토스포스",
      slug: "toss_pos",
      isCustom: false,
      createdAt,
      designVersion: PUBLIC_DESIGN_VERSION,
      blocks: [
        {
          id: "toss-hero",
          type: "hero",
          badge: "토스플레이스 직계약 대리점 · 탑정보통신",
          title: "토스포스,\n매장 운영을 더 쉽게",
          subtitle: "주문·결제·배달·재고·매출을 한 화면에서 관리합니다.",
          buttonText: "토스포스 설치 상담",
          buttonLink: "request_consult",
          button2Text: "공식 제품 페이지",
          button2Link: "https://tossplace.com/product/pos",
          imageUrl: PUBLIC_MEDIA.homeHero.tossPos,
          note: "제품 설치 상담과 운영 이후 지원은 탑정보통신이 담당합니다.",
          items: [
            { title: "주문·결제", desc: "매장 주문과 다양한 결제를 한 화면에서", icon: "credit-card" },
            { title: "배달 연동", desc: "배달 주문과 품절 메뉴를 함께 관리", icon: "smartphone", imageUrl: "/assets/product/toss-delivery-sales.webp" },
            { title: "재고·매출", desc: "상품 흐름과 매출 비교를 더 빠르게", icon: "chart", imageUrl: "/assets/product/toss-sales.webp" },
            { title: "고객관리", desc: "리뷰·포인트·쿠폰으로 재방문 연결", icon: "heart", imageUrl: "/assets/product/toss-coupon.webp" },
          ],
        },
        {
          id: "toss-sector-configurator",
          type: "features",
          badge: "업종별 토스포스",
          title: "우리 업종에 맞는\n토스포스 구성을 확인하세요",
          subtitle: "업종별로 필요한 기능과 장비를 비교하세요.",
          content: "업종과 매장 규모에 따라 권장 장비가 달라집니다. 상담 시 설치 환경을 확인해 최종 구성을 안내합니다.",
          itemLayout: "store-configurator",
          buttonText: "업종별 구성 상담",
          buttonLink: "request_consult",
          items: HOME_SECTOR_ITEMS,
        },
        {
          id: "toss-platforms",
          type: "features",
          badge: "무료 포스 앱",
          title: "쓰던 기기에서 무료로 시작",
          subtitle: "쓰던 기기에 설치해 시작합니다.",
          itemLayout: "platform-stage",
          imageUrl: "/assets/product/toss-mobile-order.webp",
          note: "토스포스 설치 지원",
          content: "매장에 있는 기기에서 시작",
          imageCaption: "운영체제별 최신 지원 범위는 설치 상담 시 다시 확인합니다.",
          items: [
            { title: "Windows", desc: "포스 본체와 매장 PC", icon: "monitor" },
            { title: "Android", desc: "태블릿과 안드로이드 기기", icon: "smartphone" },
            { title: "iOS", desc: "아이폰과 아이패드", icon: "smartphone" },
            { title: "Mac", desc: "Mac 기반 매장 환경", icon: "cpu" },
          ],
        },
        {
          id: "toss-order",
          type: "banner",
          bannerLayout: "side-image",
          bannerImagePosition: "right",
          badge: "주문·결제",
          title: "필요할 때 바로\n키오스크와 테이블오더",
          subtitle: "키오스크와 QR 주문으로 피크 시간 동선을 줄입니다.",
          imageUrl: "/assets/product/toss-kiosk.webp",
          items: [
            { title: "키오스크 모드 전환", desc: "" },
            { title: "QR 테이블오더", desc: "" },
            { title: "주문·결제 동선 간소화", desc: "" },
          ],
        },
        {
          id: "toss-delivery",
          type: "banner",
          bannerLayout: "side-image",
          bannerImagePosition: "left",
          badge: "배달 연동",
          title: "배달 주문과 매출도\n포스 한 화면에서",
          subtitle: "배달 3사 주문과 품절·매출을 한 화면에서 관리합니다.",
          imageUrl: "/assets/product/toss-delivery.webp",
          items: [
            { title: "주요 배달앱 연결", desc: "" },
            { title: "품절 상품 일괄 관리", desc: "" },
            { title: "배달 매출 실시간 확인", desc: "" },
          ],
        },
        {
          id: "toss-customer",
          type: "features",
          badge: "고객관리",
          title: "결제 뒤에도 이어지는 고객관리",
          subtitle: "리뷰·포인트·쿠폰으로 재방문을 연결합니다.",
          itemLayout: "customer-loop",
          imageUrl: "/assets/product/toss-customer-coupon.webp",
          note: "고객관리",
          content: "결제가 끝난 뒤에도 고객 경험은 이어집니다.",
          items: [
            { title: "네이버 리뷰 연결", desc: "결제 경험을 매장 리뷰 참여로 자연스럽게 연결합니다.", icon: "heart" },
            { title: "포인트 적립", desc: "고객 전화번호를 기반으로 포인트를 간편하게 관리합니다.", icon: "credit-card" },
            { title: "자동·직접 쿠폰", desc: "조건에 맞춘 쿠폰과 매장 직접 발송 쿠폰을 운영할 수 있습니다.", icon: "scrolltext" },
          ],
        },
        {
          id: "toss-operation",
          type: "features",
          badge: "매장 운영",
          title: "재고부터 매출까지 꼼꼼한 운영 도구",
          subtitle: "재고·상품·매출을 포스에서 관리합니다.",
          itemLayout: "operations-console",
          items: [
            { title: "상품별 재고관리", desc: "입고와 판매 흐름을 상품 단위로 확인합니다.", icon: "layers", imageUrl: "/assets/operations/inventory.webp" },
            { title: "바코드·대량 등록", desc: "바코드와 대량 등록으로 상품 입력 시간을 줄입니다.", icon: "barcode", imageUrl: "/assets/operations/bulk-register.webp" },
            { title: "매출 비교·달력", desc: "이전 기간과 날짜별 매출을 비교합니다.", icon: "chart", imageUrl: "/assets/operations/sales-calendar.webp" },
            { title: "주문·조리·호출 현황", desc: "주문 진행 상태를 한 화면에서 확인합니다.", icon: "monitor", imageUrl: "/assets/operations/order-status.webp" },
            { title: "조건별 자동 할인", desc: "포장이나 시간대 등 조건에 맞춰 할인을 적용합니다.", icon: "check", imageUrl: "/assets/operations/auto-discount.webp" },
            { title: "영수증 구성 설정", desc: "글자 크기와 레이아웃을 매장에 맞게 조정합니다.", icon: "scrolltext", imageUrl: "/assets/operations/receipt-settings.webp" },
          ],
        },
        {
          id: "toss-front",
          type: "banner",
          bannerLayout: "side-image",
          bannerImagePosition: "right",
          badge: "TOSS FRONT",
          title: "토스프론트와 함께\n더 완성된 카운터",
          subtitle: "결제·고객 화면·미니 키오스크를 하나로 연결합니다.",
          buttonText: "구성 상담받기",
          buttonLink: "request_consult",
          imageUrl: PUBLIC_MEDIA.homeHero.tossFront,
        },
        {
          id: "toss-resources",
          type: "features",
          badge: "추가 안내",
          title: "공식 정보와 설치 상담",
          subtitle: "제품 정보와 설치 지원을 확인하세요.",
          itemLayout: "action-grid",
          items: [
            { title: "토스포스 공식 안내", desc: "최신 기능과 정책을 공식 제품 페이지에서 확인합니다.", icon: "monitor", buttonText: "공식 페이지", buttonLink: "https://tossplace.com/product/pos" },
            { title: "사용 자료실", desc: "설치와 사용에 필요한 안내 자료를 확인합니다.", icon: "layers", buttonText: "자료 보기", buttonLink: "board_resources" },
            { title: "탑정보통신 설치 상담", desc: "인터넷과 장비를 포함한 맞춤 구성을 상담합니다.", icon: "phone", buttonText: "무료 상담", buttonLink: "request_consult" },
          ],
        },
        {
          id: "toss-cta",
          type: "banner",
          badge: "직계약 대리점",
          title: "우리 매장에 맞는 토스포스 구성,\n탑정보통신이 함께 찾겠습니다",
          subtitle: "매장 환경을 확인해 필요한 구성만 안내합니다.",
          buttonText: "무료 상담 신청",
          buttonLink: "request_consult",
          align: "center",
        },
      ],
    },
    {
      id: "uplus_ai_phone",
      title: "U+ AI전화",
      slug: "uplus_ai_phone",
      isCustom: false,
      createdAt,
      designVersion: PUBLIC_DESIGN_VERSION,
      blocks: [
        {
          id: "uplus-ai-hero",
          type: "hero",
          badge: "LG U+ 소상공인 매장전화",
          title: "손님 전화는 놓치지 않고\n사장님 일은 끊기지 않게",
          subtitle: "반복 문의는 AI가 24시간 응대하고, 응대 내역과 손님 메모는 우리가게패키지 앱에서 확인합니다.",
          buttonText: "U+ AI전화 상담",
          buttonLink: "request_consult",
          button2Text: "LG U+ 공식 상품 보기",
          button2Link: "https://www.lguplus.com/internet-iptv/soho/internet-phone-plan/1000003061/",
          imageUrl: PUBLIC_MEDIA.homeTelecom.aiPhoneHero,
          note: "요금·약정·설치비와 실제 응대 범위는 상담 시 최신 조건을 확인합니다.",
          items: [
            { title: "24시간 반복 문의 응대", desc: "영업시간·위치·주차 등 매장 기본 문의", icon: "phone" },
            { title: "동시 전화 응대", desc: "통화 중 들어오는 문의도 AI가 안내", icon: "layers" },
            { title: "앱 리포트", desc: "응대 내역과 손님 메모를 한곳에서 확인", icon: "chart" },
          ],
        },
        {
          id: "uplus-ai-flow",
          type: "features",
          badge: "이용 흐름",
          title: "등록한 매장 정보로\nAI가 정확하게 안내합니다",
          subtitle: "사장님이 안내할 내용을 설정하면 전화 응대와 확인이 한 흐름으로 이어집니다.",
          itemLayout: "process",
          items: [
            { title: "안내 내용 설정", desc: "영업시간·위치·주차와 자주 묻는 내용을 등록합니다.", icon: "check" },
            { title: "AI 전화 응대", desc: "손님 문의를 AI가 24시간 안내합니다.", icon: "phone" },
            { title: "앱에서 확인", desc: "응대 내역과 손님 메모를 우리가게패키지 앱에서 확인합니다.", icon: "smartphone" },
          ],
        },
        {
          id: "uplus-ai-app",
          type: "features",
          itemLayout: "uplus-ai-app",
          badge: "우리가게패키지 앱",
          title: "손님 문의는 AI가\n확인은 사장님이 한눈에",
          subtitle: "매장 밖에서도 응대 내역을 확인하고 필요한 손님 메모를 남길 수 있습니다.",
          items: [
            { title: "문의 내용 확인", desc: "" },
            { title: "손님 메모 관리", desc: "" },
            { title: "매장 안내 정보 수정", desc: "" },
          ],
        },
        {
          id: "uplus-ai-benefits",
          type: "features",
          badge: "추천 매장",
          title: "전화 응대가 매출과 운영을\n방해하는 매장에 적합합니다",
          subtitle: "바쁜 시간의 반복 문의와 부재중 전화를 줄이는 데 초점을 둡니다.",
          items: [
            { title: "카페·음식점", desc: "영업 여부, 위치, 주차와 예약 가능 여부 문의가 잦은 매장", icon: "coffee" },
            { title: "뷰티·예약업", desc: "시술 중 전화를 받기 어렵고 예약 전 문의가 많은 매장", icon: "beauty" },
            { title: "도·소매·서비스", desc: "방문 전 재고·영업시간·오시는 길 문의가 반복되는 매장", icon: "shop" },
          ],
        },
        {
          id: "uplus-ai-faq",
          type: "features",
          badge: "자주 묻는 질문",
          title: "가입 전에 확인하세요",
          itemLayout: "faq",
          items: [
            { title: "어떤 문의를 AI가 안내할 수 있나요?", desc: "등록한 영업시간, 위치, 주차와 자주 묻는 기본 문의를 안내합니다. 실제 설정 가능 범위는 가입 시 확인합니다." },
            { title: "응대 내역은 어디에서 확인하나요?", desc: "우리가게패키지 앱에서 문의 내역과 손님 메모를 확인할 수 있습니다." },
            { title: "기존 매장 전화번호를 유지할 수 있나요?", desc: "번호 유지 가능 여부는 현재 통신사와 번호 유형을 확인한 뒤 안내합니다." },
            { title: "전화기와 설치비가 모두 포함되나요?", desc: "단말기, 약정, 설치비와 결합 조건에 따라 달라질 수 있어 상담 시 항목별로 안내합니다." },
          ],
        },
        {
          id: "uplus-ai-cta",
          type: "banner",
          badge: "탑정보통신 설치 상담",
          title: "우리 매장에 필요한 AI전화 설정부터\n인터넷·포스 연결까지 한 번에",
          subtitle: "현재 전화번호와 매장 문의 유형을 확인해 필요한 구성을 안내합니다.",
          buttonText: "무료 상담 신청",
          buttonLink: "request_consult",
          button2Text: "031-487-4401",
          button2Link: "tel:0314874401",
          align: "center",
        },
      ],
    },
    {
      id: "products",
      title: "제품·서비스",
      slug: "products",
      isCustom: false,
      createdAt,
      designVersion: PUBLIC_DESIGN_VERSION,
      customBoardInitialized: true,
      blocks: [
        { id: "products-intro", type: "banner", badge: "제품·서비스", title: "매장 동선에 맞는\n결제 장비 구성", subtitle: "포스·단말기·키오스크를 매장에 맞게 구성합니다.", align: "left" },
        { id: "products-board", type: "custom_board" },
      ],
    },
    {
      id: "board_resources",
      title: "자료실",
      slug: "board_resources",
      isCustom: false,
      createdAt,
      designVersion: PUBLIC_DESIGN_VERSION,
      customBoardInitialized: true,
      blocks: [
        { id: "resources-intro", type: "banner", badge: "고객지원 자료실", title: "설치와 운영에 필요한\n자료를 빠르게", subtitle: "매뉴얼과 드라이버를 검색해 내려받습니다.", align: "left" },
        { id: "resources-board", type: "custom_board" },
      ],
    },
    {
      id: "board_suggestions",
      title: "건의제안",
      slug: "board_suggestions",
      isCustom: false,
      createdAt,
      designVersion: PUBLIC_DESIGN_VERSION,
      customBoardInitialized: true,
      blocks: [
        { id: "suggestions-intro", type: "banner", badge: "가맹점 의견", title: "운영 중 불편한 점을\n직접 알려주세요", subtitle: "남긴 의견은 담당자가 확인합니다.", align: "left" },
        { id: "suggestions-board", type: "custom_board" },
      ],
    },
    {
      id: "request_consult",
      title: "무료 상담",
      slug: "request_consult",
      isCustom: false,
      createdAt,
      designVersion: PUBLIC_DESIGN_VERSION,
      customBoardInitialized: true,
      blocks: [
        { id: "consult-intro", type: "banner", badge: "무료 상담", title: "매장 오픈 계획을\n한 번에 정리해드립니다", subtitle: "인터넷부터 결제 장비까지 한 번에 상담하세요.", align: "left" },
        { id: "consult-form", type: "custom_board" },
      ],
    },
    {
      id: "request_paper",
      title: "용지 배송",
      slug: "request_paper",
      isCustom: false,
      createdAt,
      designVersion: PUBLIC_DESIGN_VERSION,
      customBoardInitialized: true,
      blocks: [
        { id: "paper-intro", type: "banner", badge: "가맹점 용지 배송", title: "영수증 용지가 필요할 때\n온라인으로 바로 요청", subtitle: "배송 정보를 확인한 뒤 출고합니다.", align: "left" },
        { id: "paper-form", type: "custom_board" },
      ],
    },
  ];
}

const LEGACY_HOME_ITEM_TITLES: Record<string, string[]> = {
  "home-hero": ["LG U+ 인터넷", "토스포스", "카드사 가맹", "설치·AS"],
  "home-signals": ["토스플레이스 직계약", "LG U+ 인터넷 개통", "설치와 카드가맹", "운영 이후 AS"],
  "home-package": ["LG U+ 500M 인터넷", "CCTV 1대", "POS 본체 + 토스프론트", "영수증 프린터·금전함", "배달앱 연동", "카드사 가맹 지원", "현장 설치·교육", "AS·고객지원"],
  "home-internet": ["신규·기존 매장 전환 상담", "500M 인터넷과 Wi-Fi 구성", "모바일 결합 조건 확인"],
  "home-services": ["토스포스·토스프론트", "카드단말기·키오스크", "카드사 가맹 지원", "CCTV·매장 통신", "설치·교육·AS", "배달·매출 운영"],
  "home-process": ["무료 상담", "인터넷 개통", "카드사 가맹", "기기 설치·교육", "운영·AS"],
  "home-faq": ["기존 매장도 인터넷과 포스를 바꿀 수 있나요?", "0원 패키지는 어떤 조건인가요?", "토스포스는 어떤 기기에서 사용할 수 있나요?", "설치 후 AS와 용지 요청은 어디에서 하나요?"],
};

const STANDARD_SUBTITLE_MIGRATIONS: Record<string, { legacy: string; current?: string }> = {
  "home-hero": {
    legacy: "LG U+ 인터넷·AI전화·지능형 CCTV부터 토스포스, 결제단말기, 카드사 가맹과 설치 이후 AS까지 한 담당 흐름으로 연결합니다.",
    current: "인터넷·통신·결제 장비를 한 번에 설치하고 관리합니다.",
  },
  "home-signals": {
    legacy: "서로 다른 업체에 반복 설명하지 않도록 상담 내용과 설치 과정을 이어서 관리합니다.",
  },
  "home-package": {
    legacy: "신규 매장뿐 아니라 기존 인터넷·포스 이용 매장도 결합·전환 가능 여부를 확인해드립니다.",
    current: "신규 설치와 기존 매장 전환을 함께 확인합니다.",
  },
  "home-internet": {
    legacy: "실제 제공 기기와 기능을 확인하고 매장 위치, 동선, 오픈 일정에 맞춰 설치 순서를 안내받으세요.",
    current: "매장 환경에 맞는 장비와 설치 순서를 안내합니다.",
  },
  "home-services": {
    legacy: "통신과 결제 장비를 같은 일정 안에서 준비하면 현장 혼선을 줄일 수 있습니다.",
  },
  "home-process": {
    legacy: "접수한 내용은 작업관리로 이어져 담당자가 단계별 상태를 확인합니다.",
  },
  "home-support": {
    legacy: "운영 중 자주 필요한 요청을 홈페이지에서 바로 접수할 수 있습니다.",
  },
  "home-faq": {
    legacy: "조건과 일정은 매장마다 달라 최종 내용은 담당자가 확인해 안내합니다.",
  },
  "home-cta": {
    legacy: "매장 위치와 오픈 예정일을 남겨주시면 가능한 설치 순서와 필요한 장비를 안내합니다.",
    current: "위치와 오픈일을 남기면 설치 순서를 안내합니다.",
  },
  "toss-hero": {
    legacy: "주문과 결제부터 배달, 재고, 고객관리, 매출 분석까지 매장에 필요한 운영 기능을 하나로 연결하세요.",
    current: "주문·결제·배달·재고·매출을 한 화면에서 관리합니다.",
  },
  "toss-sector-configurator": {
    legacy: "카운터 동선과 주문 방식에 따라 필요한 토스포스 기능과 연결 장비를 비교할 수 있습니다.",
    current: "업종별로 필요한 기능과 장비를 비교하세요.",
  },
  "toss-platforms": {
    legacy: "매장 환경에 맞는 운영체제를 선택해 토스포스를 설치할 수 있습니다.",
    current: "쓰던 기기에 설치해 시작합니다.",
  },
  "toss-order": {
    legacy: "피크 시간에는 키오스크 모드를 활용하고 QR 테이블오더를 연결해 주문 동선을 줄일 수 있습니다.",
    current: "키오스크와 QR 주문으로 피크 시간 동선을 줄입니다.",
  },
  "toss-delivery": {
    legacy: "배달의민족, 쿠팡이츠, 요기요를 연결하고 품절 상품과 배달 매출을 함께 관리할 수 있습니다.",
    current: "배달 3사 주문과 품절·매출을 한 화면에서 관리합니다.",
  },
  "toss-customer": {
    legacy: "리뷰와 포인트, 쿠폰을 활용해 한 번 방문한 고객의 재방문을 돕습니다.",
    current: "리뷰·포인트·쿠폰으로 재방문을 연결합니다.",
  },
  "toss-operation": {
    legacy: "매일 반복되는 등록과 확인 업무를 포스 안에서 정리합니다.",
    current: "재고·상품·매출을 포스에서 관리합니다.",
  },
  "toss-front": {
    legacy: "고객용 화면, 다양한 결제 수단, 포인트 적립과 미니 키오스크 기능을 토스포스와 연결해 사용할 수 있습니다.",
    current: "결제·고객 화면·미니 키오스크를 하나로 연결합니다.",
  },
  "toss-resources": {
    legacy: "제품 기능은 토스플레이스 공식 안내에서 확인하고, 설치와 가입 구성은 탑정보통신에 문의하세요.",
    current: "제품 정보와 설치 지원을 확인하세요.",
  },
  "toss-cta": {
    legacy: "업종과 매장 규모, 인터넷 환경을 남겨주시면 필요한 장비와 설치 일정을 안내합니다.",
    current: "매장 환경을 확인해 필요한 구성만 안내합니다.",
  },
  "products-intro": {
    legacy: "포스, 단말기, 키오스크와 주변 장비를 업종과 카운터 환경에 맞춰 안내합니다.",
    current: "포스·단말기·키오스크를 매장에 맞게 구성합니다.",
  },
  "resources-intro": {
    legacy: "매뉴얼, 드라이버, 자가 조치 안내 자료를 검색하고 내려받을 수 있습니다.",
    current: "매뉴얼과 드라이버를 검색해 내려받습니다.",
  },
  "suggestions-intro": {
    legacy: "건의와 개선 의견을 남기면 담당자가 확인하고 필요한 경우 답변을 등록합니다.",
    current: "남긴 의견은 담당자가 확인합니다.",
  },
  "consult-intro": {
    legacy: "인터넷부터 토스포스, 카드가맹, 장비 설치까지 필요한 구성을 무료로 상담하세요.",
    current: "인터넷부터 결제 장비까지 한 번에 상담하세요.",
  },
  "paper-intro": {
    legacy: "탑정보통신 거래 가맹점의 배송 정보를 확인한 뒤 담당자가 출고를 진행합니다.",
    current: "배송 정보를 확인한 뒤 출고합니다.",
  },
};

export function getPublicBlockSubtitle(block: CMSBlock): string | undefined {
  const migration = STANDARD_SUBTITLE_MIGRATIONS[block.id];
  return migration && block.subtitle === migration.legacy ? migration.current : block.subtitle;
}

function migrateStandardPresentation(block: CMSBlock): CMSBlock {
  const subtitle = getPublicBlockSubtitle(block);
  if (subtitle === block.subtitle) return block;
  const nextBlock = { ...block };
  if (subtitle) nextBlock.subtitle = subtitle;
  else delete nextBlock.subtitle;
  return nextBlock;
}

function isRedundantDefaultHomeServicesBlock(block: CMSBlock) {
  const itemTitles = (block.items || []).map((item) => item.title);
  return block.id === "home-services"
    && block.title === "오픈에 필요한 일을 따로 맡기지 마세요"
    && itemTitles.length === HOME_SERVICE_ITEMS.length
    && itemTitles.every((title, index) => title === HOME_SERVICE_ITEMS[index].title);
}

const STANDARD_MEDIA_ASSET_MIGRATIONS: Record<string, string> = {
  "/assets/product/toss-front-white-cutout.jpg": PUBLIC_MEDIA.homeHero.tossFront,
  "/assets/product/posbank-apexa-x-white-official.png": PUBLIC_MEDIA.homeHero.tossPos,
  "/assets/uplus/uplus-package-overview.png": PUBLIC_MEDIA.homePackage.overview,
  "/assets/product/posbank-apexa-x-toss-pos.webp": PUBLIC_MEDIA.homeHero.tossPos,
  "/assets/product/toss-front.webp": PUBLIC_MEDIA.homeHero.tossFront,
  "/assets/generated/system-pos-apexa-x-toss.webp": HOME_SYSTEM_GRAPHICS.pos,
  "/assets/generated/system-ai-phone.webp": HOME_SYSTEM_GRAPHICS.ai,
  "/assets/generated/system-internet-phone.webp": HOME_SYSTEM_GRAPHICS.phone,
  "/assets/uplus/uplus-internet-devices.jpg": PUBLIC_MEDIA.homeTelecom.internetDevice,
  "/assets/uplus/uplus-cctv-devices.jpg": PUBLIC_MEDIA.homeTelecom.cctvIndoor,
  "/assets/uplus/uplus-phone-devices.jpg": PUBLIC_MEDIA.homeTelecom.phoneWireless,
  "/assets/uplus/uplus-cctv-monitoring.png": PUBLIC_MEDIA.homeTelecom.cctvArchitecture,
};

const STANDARD_BLOCK_MEDIA: Record<string, { current?: string; legacy: string[] }> = {
  "home-hero": {
    legacy: ["/assets/product/toss-lineup.webp"],
  },
  "home-package": {
    current: PUBLIC_MEDIA.homePackage.overview,
    legacy: [DEPRECATED_PUBLIC_MEDIA.tossLineupBakedBackground, "/assets/uplus/uplus-package-overview.png"],
  },
  "home-internet": {
    legacy: ["/assets/uplus/uplus-internet-router.png", "/assets/uplus/uplus-internet-devices.jpg"],
  },
  "home-services": {
    legacy: [DEPRECATED_PUBLIC_MEDIA.tossLineupCompactBakedBackground],
  },
  "toss-sector-configurator": {
    legacy: [DEPRECATED_PUBLIC_MEDIA.tossLineupCompactBakedBackground],
  },
  "toss-operation": {
    legacy: ["/assets/product/toss-sales.webp"],
  },
  "toss-hero": {
    current: PUBLIC_MEDIA.homeHero.tossPos,
    legacy: ["/assets/product/toss-pos-receipt.webp", "/assets/product/posbank-apexa-x-toss-pos.webp"],
  },
};

const STANDARD_ITEM_MEDIA_HISTORY: Record<string, Record<string, string[]>> = {
  "home-hero": {
    "LG U+ 인터넷 500M": ["/assets/product/toss-lineup.webp", "/assets/uplus/uplus-internet-pos-network.png", "/assets/uplus/uplus-internet-router.png"],
    "U+ AI전화": [DEPRECATED_PUBLIC_MEDIA.aiPhonePortrait, DEPRECATED_PUBLIC_MEDIA.aiPhoneLegacy],
    "U+ 지능형 CCTV": ["/assets/uplus/uplus-cctv-architecture.png", "/assets/uplus/uplus-cctv-indoor.png"],
    "토스포스": ["/assets/product/toss-pos-receipt.webp", "/assets/product/posbank-apexa-x-toss-pos.webp"],
    "토스프론트": ["/assets/product/toss-front.webp"],
  },
  "home-package": {
    "LG U+ 500M 인터넷": ["/assets/uplus/uplus-internet-router.png", "/assets/uplus/uplus-internet-devices.jpg"],
    "U+ AI전화": [DEPRECATED_PUBLIC_MEDIA.aiPhonePortrait, DEPRECATED_PUBLIC_MEDIA.aiPhoneLegacy],
    "U+ 지능형 CCTV": ["/assets/uplus/uplus-cctv-indoor.png", "/assets/uplus/uplus-cctv-devices.jpg"],
    "토스포스 + 토스프론트": [DEPRECATED_PUBLIC_MEDIA.tossLineupBakedBackground],
  },
  "home-internet": {
    "토스포스 주문·결제": [HOME_SYSTEM_GRAPHICS.pos, "/assets/generated/system-pos-apexa-x-toss.webp", "/assets/generated/system-pos-order-payment.webp", "/assets/product/toss-delivery-sales.webp", "/assets/operations/inventory.webp"],
    "소상공인 인터넷 500M": [HOME_SYSTEM_GRAPHICS.internet, "/assets/generated/system-internet-connect.webp", PUBLIC_MEDIA.homeTelecom.internet, PUBLIC_MEDIA.homeTelecom.internetDevice, "/assets/uplus/uplus-internet-router.png", "/assets/uplus/uplus-internet-devices.jpg"],
    "U+ AI전화": [HOME_SYSTEM_GRAPHICS.ai, "/assets/generated/system-ai-phone.webp", DEPRECATED_PUBLIC_MEDIA.aiPhonePortrait, DEPRECATED_PUBLIC_MEDIA.aiPhoneLegacy],
    "U+ 지능형 CCTV": [HOME_SYSTEM_GRAPHICS.cctv, PUBLIC_MEDIA.homeTelecom.cctvIndoor, PUBLIC_MEDIA.homeTelecom.cctvArchitecture],
    "U+ 인터넷전화": [HOME_SYSTEM_GRAPHICS.phone, "/assets/generated/system-internet-phone.webp", PUBLIC_MEDIA.homeTelecom.phoneWireless, PUBLIC_MEDIA.homeTelecom.phoneDesk],
  },
  "home-services": {
    "토스포스·토스프론트": ["/assets/product/toss-pos-receipt.webp", DEPRECATED_PUBLIC_MEDIA.tossLineupCompactBakedBackground, DEPRECATED_PUBLIC_MEDIA.tossLineupBakedBackground],
    "U+ AI전화": [DEPRECATED_PUBLIC_MEDIA.aiPhonePortrait, DEPRECATED_PUBLIC_MEDIA.aiPhoneLegacy],
    "U+ 지능형 CCTV": ["/assets/product/toss-lineup.webp", "/assets/uplus/uplus-cctv-indoor.png", "/assets/uplus/uplus-cctv-outdoor.png", "/assets/uplus/uplus-cctv-devices.jpg"],
    "U+ 인터넷전화": ["/assets/uplus/uplus-phone-wireless.png", "/assets/uplus/uplus-phone-desk.png", "/assets/uplus/uplus-phone-devices.jpg"],
  },
  "home-sector": {
    "카페·베이커리": ["/assets/sector/sector-cafe.webp"],
    "음식점": ["/assets/sector/sector-restaurant.webp", "/assets/sector/feature-table-order.webp"],
    "술집·바": ["/assets/sector/sector-bar.webp"],
    "도·소매업": ["/assets/sector/sector-retail.webp", "/assets/sector/sector-retail-apexa-x.webp", "/assets/sector/sector-retail-scan.webp"],
    "뷰티·서비스": ["/assets/sector/sector-beauty.webp", "/assets/sector/beauty-reservation-register-static.webp"],
  },
  "toss-sector-configurator": {
    "음식점": ["/assets/sector/sector-restaurant.webp"],
    "도·소매업": ["/assets/sector/sector-retail.webp", "/assets/sector/sector-retail-apexa-x.webp"],
    "뷰티·서비스": ["/assets/sector/sector-beauty.webp"],
  },
  "toss-hero": {
    "주문·결제": ["/assets/product/toss-pos-receipt.webp"],
  },
};

const STANDARD_MEDIA_ITEMS: Record<string, NonNullable<CMSBlock["items"]>> = {
  "home-hero": HOME_HERO_ITEMS,
  "home-package": HOME_PACKAGE_ITEMS,
  "home-internet": HOME_TELECOM_ITEMS,
  "home-services": HOME_SERVICE_ITEMS,
  "home-sector": HOME_SECTOR_ITEMS,
  "toss-sector-configurator": HOME_SECTOR_ITEMS,
  "toss-hero": [
    { title: "주문·결제", desc: "매장 주문과 다양한 결제를 한 화면에서", icon: "credit-card" },
  ],
};

const LEGACY_HOME_SECTOR_PLAYLISTS_V19: Record<string, string[][]> = {
  "카페·베이커리": [[
    "/assets/sector/sector-cafe.webp",
    "/assets/sector/feature-cafe-kiosk.webp",
    "/assets/sector/feature-cafe-pickup.png",
    "/assets/sector/feature-cafe-receipt.png",
  ]],
  "음식점": [[
    "/assets/product/toss-delivery-sales.webp",
    "/assets/sector/feature-table-order.webp",
    "/assets/sector/feature-order-pos.webp",
    "/assets/sector/feature-market-price.webp",
  ]],
  "술집·바": [[
    "/assets/sector/sector-bar.webp",
    "/assets/sector/feature-front-wallpaper.webp",
    "/assets/sector/feature-coupon.webp",
    "/assets/sector/feature-restaurant-receipt.png",
  ]],
  "도·소매업": [[
    "/assets/sector/sector-retail-scan.webp",
    "/assets/sector/feature-retail-barcode.webp",
    "/assets/sector/feature-retail-search.png",
    "/assets/sector/feature-customer-analysis.png",
  ]],
  "뷰티·서비스": [
    [
      "/assets/sector/beauty-reservation-register.webp",
      "/assets/sector/beauty-booking-talk.png",
      "/assets/sector/beauty-schedule-ui.png",
      "/assets/sector/beauty-customer-note.png",
    ],
    [
      "/assets/sector/beauty-reservation-register.webp",
      "/assets/sector/beauty-booking-talk.png",
      "/assets/sector/beauty-schedule-ui.png",
      "/assets/sector/beauty-customer-note.png",
      "/assets/sector/beauty-front-screen.webp",
      "/assets/sector/beauty-prepaid-pass.png",
    ],
  ],
};

function migrateDefaultSectorPlaylistsV20(block: CMSBlock): CMSBlock {
  if (block.id !== "home-sector" && block.id !== "toss-sector-configurator") return block;
  let changed = false;
  const items = block.items?.map((item) => {
    const currentPaths = (item.mediaPlaylist || []).map((media) => media.imageUrl);
    const legacyPlaylists = LEGACY_HOME_SECTOR_PLAYLISTS_V19[item.title] || [];
    const isLegacyDefault = legacyPlaylists.some((legacyPaths) => (
      legacyPaths.length === currentPaths.length
      && legacyPaths.every((path, index) => path === currentPaths[index])
    ));
    if (!isLegacyDefault) return item;
    const standardItem = HOME_SECTOR_ITEMS.find((candidate) => candidate.title === item.title);
    if (!standardItem?.mediaPlaylist) return item;
    changed = true;
    return { ...item, mediaPlaylist: standardItem.mediaPlaylist };
  });
  return changed && items ? { ...block, items } : block;
}

const STANDARD_ITEM_DESCRIPTION_MIGRATIONS: Record<string, Record<string, { legacy: string; current: string }>> = {
  "home-hero": {
    "토스포스": { legacy: "주문·결제·매장 운영 연결", current: "APEXA X · 주문·결제·매장 운영" },
  },
  "home-package": {
    "토스포스 + 토스프론트": { legacy: "POS 본체·결제단말기", current: "APEXA X 본체·결제단말기" },
  },
  "home-services": {
    "토스포스·토스프론트": { legacy: "업종과 카운터 환경에 맞춰 주문·결제 구성을 안내합니다.", current: "포스뱅크 APEXA X 본체와 토스프론트의 주문·결제 구성을 안내합니다." },
  },
  "home-internet": {
    "토스포스 주문·결제": { legacy: "포스뱅크 APEXA X에서 메뉴 선택부터 카드 결제까지 카운터의 주문 흐름을 한 화면으로 이어갑니다.", current: "직원은 토스포스에서 주문을 확인하고, 손님은 카운터의 토스프론트에서 직접 결제합니다." },
  },
};

function migrateStandardProductDetails(block: CMSBlock): CMSBlock {
  let changed = false;
  const items = block.items?.map((item) => {
    const descriptionMigration = STANDARD_ITEM_DESCRIPTION_MIGRATIONS[block.id]?.[item.title];
    if (descriptionMigration && item.desc === descriptionMigration.legacy) {
      changed = true;
      return { ...item, desc: descriptionMigration.current };
    }
    if (
      block.id === "home-faq"
      && item.title === "토스포스는 어떤 기기에서 사용할 수 있나요?"
      && item.desc === "Windows, Android, iOS, Mac 환경을 지원하며 매장 장비 구성에 맞춰 설치를 안내합니다."
    ) {
      changed = true;
      return {
        ...item,
        title: "탑정보통신의 기본 토스포스 장비는 무엇인가요?",
        desc: "포스뱅크 APEXA X-1500 본체의 Windows 환경에 토스포스를 구성합니다. 다른 지원 기기는 매장 환경과 운영 목적을 확인한 뒤 별도로 안내합니다.",
      };
    }
    return item;
  });
  return changed && items ? { ...block, items } : block;
}

function migrateStandardMediaAssets(block: CMSBlock): CMSBlock {
  const blockMedia = STANDARD_BLOCK_MEDIA[block.id];
  const imageUrl = block.imageUrl && blockMedia?.legacy.includes(block.imageUrl)
    ? blockMedia.current
    : block.imageUrl ? (STANDARD_MEDIA_ASSET_MIGRATIONS[block.imageUrl] || block.imageUrl) : block.imageUrl;
  const migratedItems = block.items?.map((item) => {
    const standardItem = STANDARD_MEDIA_ITEMS[block.id]?.find((candidate) => candidate.title === item.title);
    const itemHistory = STANDARD_ITEM_MEDIA_HISTORY[block.id]?.[item.title] || [];
    const wasStandardAsset = Boolean(standardItem && (
      !item.imageUrl
      || item.imageUrl === standardItem.imageUrl
      || itemHistory.includes(item.imageUrl)
      || STANDARD_MEDIA_ASSET_MIGRATIONS[item.imageUrl]
      || isDeprecatedPublicMedia(item.imageUrl)
    ));
    const nextImageUrl = wasStandardAsset && standardItem
      ? standardItem.imageUrl
      : item.imageUrl ? (STANDARD_MEDIA_ASSET_MIGRATIONS[item.imageUrl] || item.imageUrl) : item.imageUrl;
    const nextStaticImageUrl = wasStandardAsset && standardItem
      ? standardItem.staticImageUrl
      : item.staticImageUrl ? (STANDARD_MEDIA_ASSET_MIGRATIONS[item.staticImageUrl] || item.staticImageUrl) : item.staticImageUrl;
    const nextMediaPlaylist = item.mediaPlaylist?.length
      ? item.mediaPlaylist
      : wasStandardAsset ? standardItem?.mediaPlaylist : undefined;
    const nextItem = {
      ...item,
      imageUrl: nextImageUrl,
      staticImageUrl: nextStaticImageUrl,
      mediaPlaylist: nextMediaPlaylist,
      mediaKind: item.mediaKind || standardItem?.mediaKind,
      imageAlt: item.imageAlt || standardItem?.imageAlt,
      buttonText: item.buttonText || standardItem?.buttonText,
      buttonLink: item.buttonLink || standardItem?.buttonLink,
    };
    if (!nextImageUrl) delete nextItem.imageUrl;
    if (!nextStaticImageUrl) delete nextItem.staticImageUrl;
    if (!nextMediaPlaylist?.length) delete nextItem.mediaPlaylist;
    return nextItem;
  });
  const itemsChanged = Boolean(migratedItems && !migratedItems.every((item, index) => (
    item.imageUrl === block.items?.[index]?.imageUrl
    && item.staticImageUrl === block.items?.[index]?.staticImageUrl
    && item.mediaPlaylist === block.items?.[index]?.mediaPlaylist
    && item.mediaKind === block.items?.[index]?.mediaKind
    && item.imageAlt === block.items?.[index]?.imageAlt
    && item.buttonText === block.items?.[index]?.buttonText
    && item.buttonLink === block.items?.[index]?.buttonLink
  )));

  if (imageUrl === block.imageUrl && !itemsChanged) return block;

  const nextBlock = { ...block };
  if (imageUrl) nextBlock.imageUrl = imageUrl;
  else delete nextBlock.imageUrl;
  if (migratedItems) nextBlock.items = migratedItems;
  return nextBlock;
}

function isLegacyHomeBlock(block: CMSBlock) {
  const legacyTitles = LEGACY_HOME_ITEM_TITLES[block.id];
  const currentItems = block.items || [];
  return Boolean(legacyTitles)
    && currentItems.length === legacyTitles.length
    && currentItems.every((item, index) => item.title === legacyTitles[index]);
}

export function migrateStandardHomeBlock(block: CMSBlock): CMSBlock {
  if (!isLegacyHomeBlock(block)) return block;

  if (block.id === "home-hero") {
    const nextBlock = { ...block };
    delete nextBlock.imageUrl;
    return {
      ...nextBlock,
      badge: "탑정보통신 · 토스플레이스 직계약 대리점",
      title: "매장 오픈의 연결을\n끝까지 맡습니다",
      subtitle: "인터넷·AI전화·CCTV부터 토스포스·결제·설치 이후 AS까지 한 창구로 연결합니다.",
      note: "안산·경기권 매장 상담부터 설치·운영 요청까지 이어서 안내합니다.",
      button2Text: "대표·AS 031-487-4401",
      button2Link: "tel:0314874401",
      items: HOME_HERO_ITEMS,
    };
  }
  if (block.id === "home-signals") {
    return {
      ...block,
      badge: "사장님 선택 가이드",
      title: "지금 어떤 준비를 하고 계세요?",
      subtitle: "매장 상황부터 고르면 필요한 서비스와 업종별 구성을 더 빠르게 확인할 수 있습니다.",
      items: HOME_OPENING_ITEMS,
    };
  }
  if (block.id === "home-package") {
    return {
      ...block,
      imageUrl: PUBLIC_MEDIA.homePackage.overview,
      title: "LG U+ 인터넷 신청하고\n매장 장비까지 한 번에",
      subtitle: "신규 설치와 기존 매장 전환을 함께 확인합니다.",
      priceLabel: "LG U+ 모바일 결합 시",
      priceValue: "34,000",
      priceUnit: "원 / 월",
      priceDetails: "LG U+ 모바일 결합 시 월 34,000원부터 · 일반 월 43,000원 · 부가세 별도\n결합·약정·설치 환경에 따라 실제 제공 조건이 달라질 수 있습니다.",
      note: "2026년 7월 홈페이지 안내 기준 · 상담 시 최신 조건을 다시 확인합니다.",
      listLabel: "패키지 구성 예시",
      imageCaption: "탑정보통신 매장 장비 결합 구성 이미지",
      items: HOME_PACKAGE_ITEMS,
    };
  }
  if (block.id === "home-internet") {
    const nextBlock = { ...block };
    delete nextBlock.imageUrl;
    delete nextBlock.bannerLayout;
    delete nextBlock.bannerImagePosition;
    return {
      ...nextBlock,
      type: "features",
      itemLayout: "telecom-showcase",
      badge: "제품·서비스 사용 장면",
      title: "매장 안에서\n이렇게 연결됩니다",
      subtitle: "주문·결제와 통신 서비스가 매장 운영에서 어떻게 이어지는지 장면으로 확인하세요.",
      buttonText: "제품 구성 상담",
      items: HOME_TELECOM_ITEMS,
    };
  }
  if (block.id === "home-services") {
    const nextBlock = { ...block };
    delete nextBlock.imageUrl;
    return { ...nextBlock, items: HOME_SERVICE_ITEMS };
  }
  if (block.id === "home-process") {
    return {
      ...block,
      title: "설치보다 중요한 건\n설치 이후의 관리입니다",
      subtitle: "안산·경기권 매장의 상담부터 현장 설치, 사용 안내와 운영 요청까지 이어서 지원합니다.",
      note: "경기도 안산시 상록구 천문로17 일영빌딩 2층",
      items: HOME_PROCESS_ITEMS,
    };
  }
  if (block.id === "home-faq") return { ...block, items: HOME_FAQ_ITEMS };
  return block;
}

export function restoreStandardCMSPages(pages: CMSPage[], defaultPages = createDefaultCMSPages()): CMSPage[] {
  const defaultsById = new Map(defaultPages.map((page) => [page.id, page]));
  const restored = pages.map((page) => {
    const fallback = defaultsById.get(page.id);
    if (!fallback || page.isCustom) return page;

    const currentBlocks = Array.isArray(page.blocks) ? page.blocks : [];
    const migrateBlocks = (blocks: CMSBlock[]) => page.id === "home"
      ? blocks
          .map(migrateStandardHomeBlock)
          .map(migrateStandardMediaAssets)
          .map(migrateDefaultSectorPlaylistsV20)
          .map(migrateStandardProductDetails)
          .map(migrateStandardPresentation)
          .filter((block) => !isRedundantDefaultHomeServicesBlock(block))
      : page.id === "toss_pos"
        ? blocks.map(migrateStandardMediaAssets).map(migrateDefaultSectorPlaylistsV20).map(migrateStandardPresentation)
        : blocks.map(migrateStandardPresentation);

    if ((page.designVersion || 0) < PUBLIC_DESIGN_VERSION) {
      if ((page.designVersion || 0) >= 15 && currentBlocks.length > 0) {
        let upgradedBlocks = migrateBlocks(currentBlocks);
        if (page.id === "home") {
          const matchesTitles = (block: CMSBlock, titles: string[]) => (block.items || []).length === titles.length
            && (block.items || []).every((item, index) => item.title === titles[index]);
          upgradedBlocks = upgradedBlocks.map((block) => {
            if (block.id === "home-hero" && block.button2Link === "toss_pos") {
              return { ...block, button2Text: "대표·AS 031-487-4401", button2Link: "tel:0314874401" };
            }
            if (block.id === "home-signals" && matchesTitles(block, ["매장 조건 상담", "LG U+ 인터넷·AI전화", "U+ 지능형 CCTV", "토스포스·결제단말기", "카드사 가맹", "설치·교육·AS"])) {
              return {
                ...block,
                badge: "사장님 선택 가이드",
                title: "지금 어떤 준비를 하고 계세요?",
                subtitle: "매장 상황부터 고르면 필요한 서비스와 업종별 구성을 더 빠르게 확인할 수 있습니다.",
                items: HOME_OPENING_ITEMS,
              };
            }
            if (block.id === "home-internet" && (
              matchesTitles(block, ["토스포스 주문·결제", "소상공인 인터넷 500M", "U+ AI전화", "U+ 지능형 CCTV", "U+ 인터넷전화"])
              || matchesTitles(block, ["소상공인 인터넷 500M", "U+ AI전화", "U+ 지능형 CCTV", "U+ 인터넷전화"])
            )) {
              return {
                ...block,
                badge: "제품·서비스 사용 장면",
                title: "매장 안에서\n이렇게 연결됩니다",
                subtitle: "주문·결제와 통신 서비스가 매장 운영에서 어떻게 이어지는지 장면으로 확인하세요.",
                buttonText: "제품 구성 상담",
                items: HOME_TELECOM_ITEMS,
              };
            }
            if (block.id === "home-process" && block.title === "상담부터 운영까지\n한 담당 흐름으로") {
              return {
                ...block,
                title: "설치보다 중요한 건\n설치 이후의 관리입니다",
                subtitle: "안산·경기권 매장의 상담부터 현장 설치, 사용 안내와 운영 요청까지 이어서 지원합니다.",
                note: "경기도 안산시 상록구 천문로17 일영빌딩 2층",
              };
            }
            if (block.id === "home-package" && block.imageCaption === "인터넷부터 결제 장비까지 한 번에") {
              return { ...block, imageCaption: "탑정보통신 매장 장비 결합 구성 이미지" };
            }
            return block;
          });

          const defaultSector = fallback.blocks.find((block) => block.id === "home-sector");
          if (defaultSector && !upgradedBlocks.some((block) => block.id === "home-sector")) {
            const signalIndex = upgradedBlocks.findIndex((block) => block.id === "home-signals");
            const insertAt = signalIndex >= 0 ? signalIndex + 1 : Math.min(1, upgradedBlocks.length);
            upgradedBlocks = [...upgradedBlocks.slice(0, insertAt), defaultSector, ...upgradedBlocks.slice(insertAt)];
          }

          const standardOrder = ["home-hero", "home-signals", "home-sector", "home-internet", "home-package", "home-process", "home-support", "home-faq", "home-cta"];
          const rank = new Map(standardOrder.map((id, index) => [id, index]));
          if (upgradedBlocks.every((block) => rank.has(block.id))) {
            upgradedBlocks = [...upgradedBlocks].sort((a, b) => (rank.get(a.id) || 0) - (rank.get(b.id) || 0));
          }
        }
        return { ...page, designVersion: PUBLIC_DESIGN_VERSION, blocks: upgradedBlocks };
      }
      return { ...page, designVersion: PUBLIC_DESIGN_VERSION, blocks: fallback.blocks };
    }
    if (currentBlocks.length === 0) {
      return { ...fallback, ...page, blocks: fallback.blocks, designVersion: PUBLIC_DESIGN_VERSION };
    }
    const migratedBlocks = migrateBlocks(currentBlocks);
    return { ...page, blocks: migratedBlocks, designVersion: PUBLIC_DESIGN_VERSION };
  });

  const seen = new Set(restored.map((page) => page.id));
  defaultPages.forEach((page) => { if (!seen.has(page.id)) restored.push(page); });
  return restored;
}

export function mergeNavigationSettings(settings?: NavigationSettings | null): NavigationSettings {
  return { ...DEFAULT_NAVIGATION_SETTINGS, ...(settings || {}) };
}

export function getNavigationLabel(page: CMSPage, settings?: NavigationSettings | null): string {
  return settings?.[page.slug]?.label || page.title;
}

export function isNavigationVisible(page: CMSPage, settings?: NavigationSettings | null): boolean {
  return settings?.[page.slug]?.visible !== false;
}

export function getOrderedVisiblePages(pages: CMSPage[], settings?: NavigationSettings | null, slugs?: string[]): CMSPage[] {
  const merged = mergeNavigationSettings(settings);
  const allowed = slugs ? new Set(slugs) : null;
  return pages
    .filter((page) => (!allowed || allowed.has(page.slug)) && isNavigationVisible(page, merged))
    .sort((a, b) => (merged[a.slug]?.order ?? Number.MAX_SAFE_INTEGER) - (merged[b.slug]?.order ?? Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title, "ko"));
}

export function mergeBlockFields(blocks: CMSBlock[], blockId: string, fields: Partial<CMSBlock>): CMSBlock[] {
  return blocks.map((block) => block.id === blockId ? { ...block, ...fields } : block);
}
