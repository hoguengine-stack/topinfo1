import { Product } from "../types";
import { isBlockedPublicMedia } from "./publicMedia";

const retiredSeedNames = new Set([
  "Premium Touch POS T-8000",
  "High Speed Terminal K-3000",
  "Contactless Self Kiosk S-500",
  "삼성 키오스크",
]);

function isPreviousVerifiedPosSeed(product: Product) {
  const isLegacyTossSeed = product.id === "pos-t8"
    && product.name === "토스포스"
    && product.imageUrl === "/assets/product/toss-pos-receipt.webp"
    && product.description === "윈도우·안드로이드·iOS·Mac에서 주문, 결제와 매장 운영 기능을 연결하는 토스플레이스 POS입니다.";
  const isPreviousApexaSeed = product.id === "pos-t8"
    && product.name === "포스뱅크 APEXA X + 토스포스"
    && [
      "/assets/product/posbank-apexa-x-toss-pos.webp",
      "/assets/product/posbank-apexa-x-white-official.png",
    ].includes(product.imageUrl)
    && product.description === "포스뱅크 APEXA X-1500 본체에 토스포스를 설치해 주문·결제와 매장 운영 기능을 연결하는 구성입니다.";
  return isLegacyTossSeed || isPreviousApexaSeed;
}

function isPreviousVerifiedFrontSeed(product: Product) {
  return product.id === "term-k3"
    && product.name === "토스프론트"
    && product.imageUrl === "/assets/product/toss-front.webp"
    && product.description === "카드와 NFC, 간편결제를 지원하고 고객용 화면과 토스포스를 연결하는 결제단말기입니다.";
}

export function createDefaultPublicProducts(createdAt = new Date().toISOString()): Product[] {
  return [
    {
      id: "pos-t8",
      name: "포스뱅크 APEXA X + 토스포스",
      category: "포스",
      description: "포스뱅크 APEXA X-1500 본체에 토스포스를 설치해 주문·결제와 매장 운영 기능을 연결하는 구성입니다.",
      features: ["주문·결제와 배달 주문 관리", "재고·매출 비교", "포인트·쿠폰 고객관리"],
      specs: { "POS 본체": "POSBANK APEXA X-1500", "크기": "364 × 210 × 333 mm", "화면": "15인치 · 1024 × 768 · PCAP 터치", "운영 프로그램": "토스포스 (Windows)" },
      imageUrl: "/assets/product/posbank-apexa-x-white-official.png",
      imageSourceUrl: "https://www.posbank.com/trans_hardware/apexa-x-1500.php?trans=usa",
      imageRightsStatus: "pending",
      price: "설치·구성 상담",
      createdAt,
    },
    {
      id: "term-k3",
      name: "토스프론트",
      category: "단말기",
      description: "카드와 NFC, 간편결제를 지원하고 고객용 화면과 토스포스를 연결하는 결제단말기입니다.",
      features: ["카드·삼성페이·애플페이", "QR·바코드 간편결제", "토스포스 연동"],
      specs: { "크기": "L120 × W145.5 × H192.5 mm", "화면": "7인치 · 1280 × 800 · 정전식 터치", "결제 방식": "IC · MSR · NFC", "연결": "LAN · USB-C · Serial" },
      imageUrl: "/assets/product/toss-front.webp",
      imageSourceUrl: "https://tossplace.com/product/front",
      imageRightsStatus: "pending",
      price: "설치·구성 상담",
      createdAt,
    },
    {
      id: "kiosk-s5",
      name: "토스 키오스크 구성",
      category: "키오스크",
      description: "매장 동선과 메뉴 수에 맞춰 토스포스 키오스크 모드와 주문 장비 구성을 안내합니다.",
      features: ["메뉴·옵션 구성 지원", "토스포스 주문 연결", "현장 설치와 운영 교육"],
      specs: { "제품 구성": "매장 환경에 따라 상담", "설치 조건": "현장 확인 후 안내" },
      imageUrl: "/assets/product/toss-kiosk.webp",
      imageSourceUrl: "https://tossplace.com/product/kiosk",
      imageRightsStatus: "pending",
      price: "설치·구성 상담",
      createdAt,
    },
    {
      id: "peripheral-ahapos-printer",
      name: "AHAPOS 화이트 영수증 프린터",
      category: "주변기기",
      description: "화이트 카운터 구성에 맞춰 POS 주문·결제 영수증을 출력하는 감열식 프린터입니다.",
      features: ["주문·결제 영수증 출력", "화이트 카운터 장비 구성", "POS 연결 환경 상담"],
      specs: { "제품 구분": "AHAPOS CPP-3000 감열식 영수증 프린터", "크기": "130 × 178 × 140 mm", "연결 조건": "사용 POS와 포트 확인 후 안내" },
      imageUrl: "/assets/product/ahapos-white-printer.png",
      imageSourceUrl: "http://nicecard.kr/ahapos",
      imageRightsStatus: "pending",
      price: "설치·구성 상담",
      createdAt,
    },
    {
      id: "peripheral-white-cash-drawer",
      name: "화이트 금전함",
      category: "주변기기",
      description: "APEXA X 하단에 배치해 현금과 결제 보관 동선을 정리하는 카운터용 금전함입니다.",
      features: ["POS 하단 배치", "현금 수납 동선 정리", "프린터·POS 연결 조건 확인"],
      specs: { "제품 구분": "카운터용 금전함", "설치 조건": "카운터 폭과 장비 배치 확인 후 안내" },
      imageUrl: "/assets/product/white-cash-drawer.png",
      imageSourceUrl: "research-master:white-cash-drawer-source.png",
      imageRightsStatus: "pending",
      price: "설치·구성 상담",
      createdAt,
    },
    {
      id: "uplus-internet-500m",
      name: "LG U+ 소상공인 인터넷 500M",
      category: "통신",
      description: "POS·결제단말기·프린터와 매장 Wi-Fi를 연결하기 위한 소상공인 인터넷 구성입니다.",
      features: ["500M 인터넷 상품 상담", "POS·결제 장비 네트워크 연결", "약정·결합·설치 일정 확인"],
      specs: { "상품 구분": "소상공인 인터넷 500M", "제공 조건": "약정·결합·설치 환경에 따라 상담" },
      imageUrl: "/assets/uplus/uplus-internet-router.png",
      imageSourceUrl: "https://image.lguplus.com/static/pc-contents/images/fcmm/cnts/imge/20250520-042559-053-M8CG0mXa.png",
      imageRightsStatus: "pending",
      price: "가입 조건 상담",
      createdAt,
    },
    {
      id: "uplus-ai-phone-ip520ga",
      name: "U+ AI전화 상담 · IP-520GA",
      category: "통신",
      description: "AI전화 가입 조건과 화이트 IP-520GA 인터넷전화기 구성을 각각 확인해 매장 환경에 맞게 안내합니다.",
      features: ["영업시간·위치·주차 문의 안내", "앱에서 응대 이력 확인", "단말·기존 번호 유지 조건 상담"],
      specs: { "전화기": "LG U+ IP-520GA (지원·제공 조건 확인)", "연결": "유선 LAN", "AI 기능": "가입 상품과 설정 내용에 따라 제공" },
      imageUrl: "/assets/uplus/uplus-ip520ga-white.png",
      imageSourceUrl: "https://image.lguplus.com/static/pc-contents/images/fcmm/cnts/imge/20260506-105557-069-oryEi7bt.png",
      imageRightsStatus: "pending",
      price: "가입·설치 상담",
      createdAt,
    },
    {
      id: "uplus-intelligent-cctv",
      name: "U+ 지능형 CCTV",
      category: "보안",
      description: "매장 환경에 맞는 실내·실외 카메라와 휴대폰·PC 모니터링 구성을 안내합니다.",
      features: ["휴대폰·PC 영상 확인", "이상 감지 알림", "카메라 종류·수량 현장 상담"],
      specs: { "카메라 구성": "실내형·실외형·PTZ 중 상담", "설치 조건": "매장 구조와 촬영 범위 확인 후 안내" },
      imageUrl: "/assets/uplus/uplus-cctv-indoor.png",
      imageSourceUrl: "https://image.lguplus.com/static/pc-contents/cv2022/images/biz/camera-inside2.png",
      imageRightsStatus: "pending",
      price: "현장 구성 상담",
      createdAt,
    },
  ];
}

export function normalizeKnownSeedProducts(products: Product[]) {
  const defaultsById = new Map(createDefaultPublicProducts().map((product) => [product.id, product]));
  const migratedIds: string[] = [];

  const normalized = products.map((product) => {
    const replacement = defaultsById.get(product.id);
    const isRetiredSeed = Boolean(replacement) && (
      retiredSeedNames.has(product.name)
      || /images\.unsplash\.com/i.test(product.imageUrl || "")
      || isPreviousVerifiedPosSeed(product)
      || isPreviousVerifiedFrontSeed(product)
    );

    let normalizedProduct = product;
    if (replacement && isRetiredSeed) {
      migratedIds.push(product.id);
      normalizedProduct = { ...replacement, createdAt: product.createdAt || replacement.createdAt };
    }

    if (!isBlockedPublicMedia(normalizedProduct.imageUrl)) return normalizedProduct;
    if (!migratedIds.includes(product.id)) migratedIds.push(product.id);
    const sanitized = { ...normalizedProduct, imageUrl: "" };
    delete sanitized.imageSourceUrl;
    delete sanitized.imageRightsStatus;
    return sanitized;
  });

  const isStandardCatalog = products.length === 0 || products.every((product) => defaultsById.has(product.id));
  if (isStandardCatalog) {
    const existingIds = new Set(normalized.map((product) => product.id));
    for (const product of defaultsById.values()) {
      if (existingIds.has(product.id)) continue;
      normalized.push(product);
      migratedIds.push(product.id);
    }
  }

  return { products: normalized, migratedIds };
}
