import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createVerifiedPublicProducts, normalizeKnownSeedProducts } from "./publicProducts";
import { Product } from "../types";

test("verified product defaults use the supplied POS model and local media", () => {
  const products = createVerifiedPublicProducts("fixed");
  assert.deepEqual(products.map((product) => product.name), ["포스뱅크 APEXA X + 토스포스", "토스프론트", "토스 키오스크 구성"]);
  assert.equal(products[0].specs["POS 본체"], "POSBANK APEXA X-1500");
  assert.equal(products[0].imageUrl, "/assets/product/posbank-apexa-x-white-toss.png");
  assert.equal(products[1].imageUrl, "/assets/product/toss-front.webp");
  assert.equal(products.every((product) => product.imageUrl.startsWith("/assets/product/")), true);
  assert.equal(products.every((product) => !product.imageUrl.includes("unsplash")), true);
  assert.equal(products.every((product) => fs.existsSync(path.join(process.cwd(), "public", product.imageUrl))), true);
  assert.equal(products.every((product) => product.price === "설치·구성 상담"), true);
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
  assert.deepEqual(migrated.migratedIds, ["pos-t8"]);
  assert.equal(migrated.products[0].name, "포스뱅크 APEXA X + 토스포스");
  assert.equal(migrated.products[0].imageUrl, "/assets/product/posbank-apexa-x-white-toss.png");

  const preserved = normalizeKnownSeedProducts([customized]);
  assert.deepEqual(preserved.migratedIds, []);
  assert.equal(preserved.products[0], customized);
});

test("the previous APEXA X and Toss Front default photos migrate to exact hardware assets", () => {
  const previousProducts = createVerifiedPublicProducts("old").map((product) => {
    if (product.id === "pos-t8") return { ...product, imageUrl: "/assets/product/posbank-apexa-x-toss-pos.webp" };
    if (product.id === "term-k3") return { ...product, imageUrl: "/assets/product/toss-front.webp" };
    return product;
  });

  const migrated = normalizeKnownSeedProducts(previousProducts);
  assert.deepEqual(migrated.migratedIds, ["pos-t8", "term-k3"]);
  assert.equal(migrated.products[0].imageUrl, "/assets/product/posbank-apexa-x-white-toss.png");
  assert.equal(migrated.products[1].imageUrl, "/assets/product/toss-front.webp");
});
