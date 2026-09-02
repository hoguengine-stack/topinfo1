import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createDefaultPublicProducts, normalizeKnownSeedProducts } from "./publicProducts";
import { Product } from "../types";

test("default products use sourced facts while partner media remains pending", () => {
  const products = createDefaultPublicProducts("fixed");
  assert.deepEqual(products.map((product) => product.name), [
    "포스뱅크 APEXA X + 토스포스",
    "토스프론트",
    "토스 키오스크 구성",
    "AHAPOS 화이트 영수증 프린터",
    "화이트 금전함",
    "LG U+ 소상공인 인터넷 500M",
    "U+ AI전화 상담 · IP-520GA",
    "U+ 지능형 CCTV",
  ]);
  assert.equal(products[0].specs["POS 본체"], "POSBANK APEXA X-1500");
  assert.equal(products[0].imageUrl, "/assets/product/posbank-apexa-x-white-official.png");
  assert.equal(products[1].imageUrl, "/assets/product/toss-front.webp");
  assert.equal(products.every((product) => /^\/assets\/(product|uplus)\//.test(product.imageUrl)), true);
  assert.equal(products.every((product) => !product.imageUrl.includes("unsplash")), true);
  assert.equal(products.every((product) => fs.existsSync(path.join(process.cwd(), "public", product.imageUrl))), true);
  assert.equal(products.every((product) => product.price?.includes("상담")), true);
  assert.equal(products.every((product) => Boolean(product.imageSourceUrl)), true);
  assert.equal(products.every((product) => product.imageRightsStatus === "pending"), true);
  assert.equal(products[1].specs["크기"], "L120 × W145.5 × H192.5 mm");
});

test("known seeded placeholders are normalized without touching custom products", () => {
  const input: Product[] = [
    {
      id: "pos-t8",
      name: "Premium Touch POS T-8000",
      category: "포스",
      description: "placeholder",
      features: [],
      specs: {},
      imageUrl: "https://images.unsplash.com/example",
      createdAt: "old",
    },
    {
      id: "term-k3",
      name: "High Speed Terminal K-3000",
      category: "단말기",
      description: "placeholder",
      features: [],
      specs: {},
      imageUrl: "https://images.unsplash.com/terminal",
      createdAt: "old",
    },
    {
      id: "kiosk-s5",
      name: "삼성 키오스크",
      category: "키오스크",
      description: "placeholder",
      features: [],
      specs: {},
      imageUrl: "https://images.unsplash.com/kiosk",
      createdAt: "old",
    },
    {
      id: "custom-product",
      name: "운영자 등록 제품",
      category: "기타",
      description: "keep",
      features: [],
      specs: {},
      imageUrl: "/custom.png",
      createdAt: "old",
    },
  ];

  const result = normalizeKnownSeedProducts(input);
  assert.deepEqual(result.migratedIds, ["pos-t8", "term-k3", "kiosk-s5"]);
  assert.equal(result.products[0].name, "포스뱅크 APEXA X + 토스포스");
  assert.equal(result.products[0].createdAt, "old");
  assert.equal(result.products[1].name, "토스프론트");
  assert.equal(result.products[2].name, "토스 키오스크 구성");
  assert.equal(result.products[3], input[3]);
});

test("the previous verified POS seed is upgraded without replacing an operator-customized product", () => {
  const previousSeed: Product = {
    id: "pos-t8",
    name: "토스포스",
    category: "포스",
    description: "윈도우·안드로이드·iOS·Mac에서 주문, 결제와 매장 운영 기능을 연결하는 토스플레이스 POS입니다.",
    features: ["주문·결제와 배달 주문 관리"],
    specs: { "지원 기기": "Windows · Android · iOS · Mac" },
    imageUrl: "/assets/product/toss-pos-receipt.webp",
    createdAt: "old",
  };
  const customized = { ...previousSeed, description: "운영자가 직접 수정한 설명" };

  const migrated = normalizeKnownSeedProducts([previousSeed]);
  assert.deepEqual(migrated.migratedIds, [
    "pos-t8",
    "term-k3",
    "kiosk-s5",
    "peripheral-ahapos-printer",
    "peripheral-white-cash-drawer",
    "uplus-internet-500m",
    "uplus-ai-phone-ip520ga",
    "uplus-intelligent-cctv",
  ]);
  assert.equal(migrated.products[0].name, "포스뱅크 APEXA X + 토스포스");
  assert.equal(migrated.products[0].imageUrl, "/assets/product/posbank-apexa-x-white-official.png");

  const preserved = normalizeKnownSeedProducts([customized]);
  assert.deepEqual(preserved.migratedIds, [
    "term-k3",
    "kiosk-s5",
    "peripheral-ahapos-printer",
    "peripheral-white-cash-drawer",
    "uplus-internet-500m",
    "uplus-ai-phone-ip520ga",
    "uplus-intelligent-cctv",
  ]);
  assert.equal(preserved.products[0], customized);
});

test("the previous APEXA X and Toss Front default photos migrate to exact hardware assets", () => {
  const previousProducts = createDefaultPublicProducts("old").map((product) => {
    if (product.id === "pos-t8") return { ...product, imageUrl: "/assets/product/posbank-apexa-x-toss-pos.webp" };
    if (product.id === "term-k3") return { ...product, imageUrl: "/assets/product/toss-front.webp" };
    return product;
  });

  const migrated = normalizeKnownSeedProducts(previousProducts);
  assert.deepEqual(migrated.migratedIds, ["pos-t8", "term-k3"]);
  assert.equal(migrated.products[0].imageUrl, "/assets/product/posbank-apexa-x-white-official.png");
  assert.equal(migrated.products[1].imageUrl, "/assets/product/toss-front.webp");
});

test("operator products cannot restore a blocked public asset", () => {
  const blockedProduct: Product = {
    id: "custom-blocked",
    name: "차단 이미지 제품",
    category: "기타",
    description: "설명",
    features: [],
    specs: {},
    imageUrl: "/assets/sector/feature-customer-profile.png",
    imageSourceUrl: "legacy",
    imageRightsStatus: "verified",
    createdAt: "old",
  };

  const normalized = normalizeKnownSeedProducts([blockedProduct]);
  assert.deepEqual(normalized.migratedIds, ["custom-blocked"]);
  assert.equal(normalized.products[0].imageUrl, "");
  assert.equal(normalized.products[0].imageSourceUrl, undefined);
  assert.equal(normalized.products[0].imageRightsStatus, undefined);
});
