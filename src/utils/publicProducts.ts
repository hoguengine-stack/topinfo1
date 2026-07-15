import { Product } from "../types";

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

export function createVerifiedPublicProducts(createdAt = new Date().toISOString()): Product[] {
  return [
    {
      id: "pos-t8",
      name: "포스뱅크 APEXA X + 토스포스",
      category: "포스",
      description: "포스뱅크 APEXA X-1500 본체에 토스포스를 설치해 주문·결제와 매장 운영 기능을 연결하는 구성입니다.",
      features: ["주문·결제와 배달 주문 관리", "재고·매출 비교", "포인트·쿠폰 고객관리"],
      specs: { "POS 본체": "POSBANK APEXA X-1500", "화면": "15인치 · 1024 × 768 · PCAP 터치", "운영 프로그램": "토스포스 (Windows)" },
      imageUrl: "/assets/product/posbank-apexa-x-white-toss.png",
      price: "설치·구성 상담",
      createdAt,
    },
    {
      id: "term-k3",
      name: "토스프론트",
      category: "단말기",
      description: "카드와 NFC, 간편결제를 지원하고 고객용 화면과 토스포스를 연결하는 결제단말기입니다.",
      features: ["카드·삼성페이·애플페이", "QR·바코드 간편결제", "토스포스 연동"],
      specs: { "화면": "7인치 컬러 터치", "결제 방식": "IC · MSR · NFC", "연결": "LAN · USB-C · Serial" },
      imageUrl: "/assets/product/toss-front.webp",
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
      price: "설치·구성 상담",
      createdAt,
    },
  ];
}

export function normalizeKnownSeedProducts(products: Product[]) {
  const verifiedById = new Map(createVerifiedPublicProducts().map((product) => [product.id, product]));
  const migratedIds: string[] = [];

  const normalized = products.map((product) => {
    const replacement = verifiedById.get(product.id);
    const isRetiredSeed = Boolean(replacement) && (
      retiredSeedNames.has(product.name)
      || /images\.unsplash\.com/i.test(product.imageUrl || "")
      || isPreviousVerifiedPosSeed(product)
      || isPreviousVerifiedFrontSeed(product)
    );

    if (!replacement || !isRetiredSeed) return product;
    migratedIds.push(product.id);
    return { ...replacement, createdAt: product.createdAt || replacement.createdAt };
  });

  return { products: normalized, migratedIds };
}
