import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  createDefaultCMSPages,
  getPublicBlockSubtitle,
  getNavigationLabel,
  getOrderedVisiblePages,
  HOME_SECTOR_MEDIA_SOURCE_IDS,
  HOME_SECTOR_ITEMS,
  HOME_SERVICE_ITEMS,
  mergeBlockFields,
  PUBLIC_DESIGN_VERSION,
  restoreStandardCMSPages,
} from "./cmsSettings";
import { CMSBlock, CMSPage, NavigationSettings } from "../types";
import { DEPRECATED_PUBLIC_MEDIA, PUBLIC_MEDIA } from "./publicMedia";
import { getSectorDetailGroups, SECTOR_CONTENT_DEFAULTS, type SectorKind } from "./sectorContent";
import {
  BLOCKED_DEFAULT_SECTOR_MEDIA,
  BLOCKED_PUBLIC_EVIDENCE_MEDIA,
  DEFAULT_SECTOR_MEDIA_POLICY,
  MAX_DEFAULT_SECTOR_PLAYLIST_BYTES,
} from "./sectorMediaPolicy";

const pages: CMSPage[] = [
  { id: "home", slug: "home", title: "홈", isCustom: false, createdAt: "now", blocks: [] },
  { id: "products", slug: "products", title: "제품군소개", isCustom: false, createdAt: "now", blocks: [] },
  { id: "request_consult", slug: "request_consult", title: "가맹상담", isCustom: false, createdAt: "now", blocks: [] },
  { id: "custom", slug: "custom", title: "커스텀", isCustom: true, createdAt: "now", blocks: [] },
];

test("navigation settings hide and order visible pages", () => {
  const settings: NavigationSettings = {
    home: { label: "첫 화면", visible: true, order: 2 },
    products: { visible: false, order: 1 },
    request_consult: { visible: true, order: 0 },
    custom: { visible: true, order: 3 },
  };

  const ordered = getOrderedVisiblePages(pages, settings);

  assert.deepEqual(ordered.map((page) => page.slug), ["request_consult", "home", "custom"]);
  assert.equal(getNavigationLabel(pages[0], settings), "첫 화면");
});

test("mergeBlockFields updates only the selected block", () => {
  const blocks: CMSBlock[] = [
    { id: "a", type: "hero", title: "A" },
    { id: "b", type: "image", title: "B", imageWidth: "100px" },
  ];

  const updated = mergeBlockFields(blocks, "b", { imageWidth: "320px", imageHeight: "180px" });

  assert.equal(updated[0], blocks[0]);
  assert.deepEqual(updated[1], { id: "b", type: "image", title: "B", imageWidth: "320px", imageHeight: "180px" });
  assert.notEqual(updated[1], blocks[1]);
});

test("default CMS pages provide renderable public homepage content", () => {
  const defaultPages = createDefaultCMSPages("fixed-date");
  const home = defaultPages.find((page) => page.id === "home");
  const aiPhone = defaultPages.find((page) => page.id === "uplus_ai_phone");

  assert.ok(home);
  assert.equal(home.slug, "home");
  assert.ok(home.blocks.length >= 1);
  assert.equal(home.createdAt, "fixed-date");
  assert.ok(aiPhone);
  assert.equal(aiPhone.blocks[0].imageUrl, PUBLIC_MEDIA.homeTelecom.aiPhoneDevice);
});

test("default home media excludes retired assets and keeps physical media unique", () => {
  const home = createDefaultCMSPages("fixed-date").find((page) => page.id === "home");
  assert.ok(home);

  const urls = home.blocks.flatMap((block) => [
    block.imageUrl,
    ...(block.items || []).flatMap((item) => [item.imageUrl, item.staticImageUrl]),
  ]).filter((url): url is string => Boolean(url));
  Object.values(DEPRECATED_PUBLIC_MEDIA).forEach((deprecatedPath) => {
    assert.equal(urls.includes(deprecatedPath), false);
  });
  assert.equal(new Set(urls).size, urls.length);

  const hero = home.blocks.find((block) => block.id === "home-hero");
  const offer = home.blocks.find((block) => block.id === "home-package");
  const telecom = home.blocks.find((block) => block.id === "home-internet");
  const services = home.blocks.find((block) => block.id === "home-services");

  assert.equal(hero?.imageUrl, "/assets/product/posbank-apexa-x-white-official.png");
  assert.equal(offer?.imageUrl, PUBLIC_MEDIA.homePackage.overview);
  assert.equal(telecom?.imageUrl, undefined);
  assert.equal(services, undefined);
  assert.equal(offer?.items?.find((item) => item.title.includes("토스포스"))?.imageUrl, undefined);

  const generatedOverviewItems = [
    ...(hero?.items || []).filter((item) => /AI전화|CCTV|인터넷 500M/.test(item.title)),
    ...(offer?.items || [])
      .filter((item) => /토스포스|AI전화|CCTV|인터넷전화|500M 인터넷/.test(item.title)),
  ];
  assert.ok(generatedOverviewItems.length >= 7);
  assert.equal(generatedOverviewItems.every((item) => !item.imageUrl), true);
});

test("default public pages use existing local media without same-page repetition", () => {
  const deprecatedPaths = new Set<string>(Object.values(DEPRECATED_PUBLIC_MEDIA));

  createDefaultCMSPages("fixed-date").forEach((page) => {
    const urls = page.blocks.flatMap((block) => [
      block.imageUrl,
      ...(block.items || []).flatMap((item) => [item.imageUrl, item.staticImageUrl]),
    ]).filter((url): url is string => Boolean(url));

    assert.equal(new Set(urls).size, urls.length, `${page.id} has repeated media`);
    urls.forEach((url) => {
      assert.equal(deprecatedPaths.has(url), false, `${page.id} uses retired media: ${url}`);
      assert.equal(url.startsWith("/assets/"), true, `${page.id} uses non-local media: ${url}`);
      assert.equal(fs.existsSync(path.join(process.cwd(), "public", url)), true, `${page.id} is missing media: ${url}`);
    });
  });
});

test("home sectors use unique, rights-tracked media with valid animation fallbacks", () => {
  const activeSourceIds: string[] = [];
  let animatedSceneCount = 0;
  const sectorByTitle: ReadonlyMap<string, SectorKind> = new Map([
    ["카페·베이커리", "cafe"],
    ["음식점", "restaurant"],
    ["술집·바", "bar"],
    ["도·소매업", "retail"],
    ["뷰티·서비스", "beauty"],
  ] as const);
  const allUrls = HOME_SECTOR_ITEMS.flatMap((item) => {
    assert.ok((item.mediaPlaylist?.length || 0) >= 3, `${item.title} has fewer than three scenes`);
    const playlist = item.mediaPlaylist || [];
    let playlistBytes = 0;
    playlist.forEach((media) => {
      assert.equal(Boolean(BLOCKED_DEFAULT_SECTOR_MEDIA[media.imageUrl]), false, `${item.title} uses blocked media: ${media.imageUrl}`);
      assert.equal(/\.(mp4|webm|mov)(?:$|\?)/i.test(media.imageUrl), false, `${item.title} uses video without explicit autoplay/muted/loop/playsInline support`);
      const policy = DEFAULT_SECTOR_MEDIA_POLICY[media.imageUrl];
      assert.ok(policy, `${item.title} has no media policy for ${media.imageUrl}`);
      assert.equal(policy.sectors.includes(sectorByTitle.get(item.title)!), true, `${media.imageUrl} is not approved for ${item.title}`);
      assert.equal(policy.firstFrameReviewed, true, `${media.imageUrl} has no reviewed first frame`);
      assert.equal(policy.rightsStatus, "partner-public-media-redistribution-pending");

      const localPath = path.join(process.cwd(), "public", media.imageUrl);
      assert.equal(fs.existsSync(localPath), true, `${item.title} is missing ${media.imageUrl}`);
      const bytes = fs.readFileSync(localPath);
      const isAnimated = bytes.includes(Buffer.from("ANMF")) || bytes.includes(Buffer.from("fcTL"));
      assert.equal(bytes.byteLength <= policy.maxBytes, true, `${media.imageUrl} exceeds its media budget`);
      playlistBytes += bytes.byteLength;

      if (policy.kind === "animated-image") {
        animatedSceneCount += 1;
        assert.equal(isAnimated, true, `${media.imageUrl} is registered as animated but has one frame`);
        assert.equal(media.staticImageUrl, policy.staticImageUrl, `${media.imageUrl} does not use its canonical static fallback`);
        assert.ok(policy.staticImageUrl, `${media.imageUrl} has no static fallback`);
        const staticPath = path.join(process.cwd(), "public", policy.staticImageUrl);
        assert.equal(fs.existsSync(staticPath), true, `${media.imageUrl} fallback is missing`);
        const staticBytes = fs.readFileSync(staticPath);
        assert.equal(staticBytes.includes(Buffer.from("ANMF")) || staticBytes.includes(Buffer.from("fcTL")), false, `${media.imageUrl} fallback is animated`);
      } else {
        assert.equal(isAnimated, false, `${media.imageUrl} is animated but registered as static`);
      }

      const sourceId = HOME_SECTOR_MEDIA_SOURCE_IDS[media.imageUrl];
      assert.ok(sourceId, `${item.title} has no canonical source id for ${media.imageUrl}`);
      activeSourceIds.push(sourceId);
    });
    assert.equal(playlistBytes <= MAX_DEFAULT_SECTOR_PLAYLIST_BYTES, true, `${item.title} playlist exceeds ${MAX_DEFAULT_SECTOR_PLAYLIST_BYTES} bytes`);
    return playlist.map((media) => media.imageUrl);
  });
  assert.ok(animatedSceneCount >= 4, "sector playlists lost all meaningful animated product demonstrations");
  assert.equal(new Set(allUrls).size, allUrls.length, "sector playlists repeat the same media");
  assert.equal(new Set(activeSourceIds).size, activeSourceIds.length, "sector playlists reuse the same original content under another file name");

  const cafeUrls = HOME_SECTOR_ITEMS.find((item) => item.title === "카페·베이커리")?.mediaPlaylist?.map((media) => media.imageUrl) || [];
  assert.equal(cafeUrls.includes("/assets/sector/feature-cafe-kiosk.webp"), false, "cafe repeats the same kiosk source twice");

  const restaurantUrls = HOME_SECTOR_ITEMS.find((item) => item.title === "음식점")?.mediaPlaylist?.map((media) => media.imageUrl) || [];
  assert.equal(restaurantUrls.some((url) => /market-price|retail|barcode|customer-analysis|receipt|review/.test(url)), false, "restaurant contains unrelated or unverified media");
});

test("sector detail content excludes blocked receipts and maps every feature to its industry", () => {
  const restaurantUrls = SECTOR_CONTENT_DEFAULTS.restaurant.groups.flatMap((group) => group.features.map((feature) => feature.imageUrl || ""));
  const retailUrls = SECTOR_CONTENT_DEFAULTS.retail.groups.flatMap((group) => group.features.map((feature) => feature.imageUrl || ""));
  const cafeUrls = SECTOR_CONTENT_DEFAULTS.cafe.groups.flatMap((group) => group.features.map((feature) => feature.imageUrl || ""));

  assert.equal(restaurantUrls.includes("/assets/sector/feature-market-price.webp"), false);
  assert.equal(restaurantUrls.includes("/assets/sector/feature-restaurant-receipt.png"), false);
  assert.equal(restaurantUrls.includes("/assets/sector/feature-restaurant-review.webp"), false);
  assert.equal(restaurantUrls.includes("/assets/operations/order-status.webp"), true);
  assert.equal(retailUrls.includes("/assets/sector/feature-market-price.webp"), true);
  assert.equal(retailUrls.includes("/assets/sector/feature-retail-barcode.webp"), false);
  assert.equal(retailUrls.includes("/assets/sector/sector-retail-scan.webp"), false);
  assert.equal(retailUrls.includes("/assets/operations/bulk-register.webp"), true);
  assert.equal(retailUrls.includes("/assets/operations/sales-calendar.webp"), true);
  assert.equal(cafeUrls.includes("/assets/sector/feature-cafe-receipt.png"), false);
  assert.equal(cafeUrls.includes("/assets/operations/receipt-settings.webp"), true);

  Object.entries(SECTOR_CONTENT_DEFAULTS).forEach(([sector, content]) => {
    const urls = content.groups.flatMap((group) => group.features.map((feature) => feature.imageUrl).filter(Boolean));
    assert.equal(new Set(urls).size, urls.length, `${sector} detail content repeats media`);
    urls.forEach((url) => assert.equal(Boolean(BLOCKED_PUBLIC_EVIDENCE_MEDIA[url!]), false, `${sector} detail uses blocked evidence media: ${url}`));
  });
});

test("sector detail migration replaces known unsafe defaults but preserves operator media", () => {
  const unsafeRestaurant = getSectorDetailGroups({
    title: "음식점",
    desc: "",
    icon: "utensils",
    detailGroups: [{
      id: "legacy",
      title: "기존 기본값",
      features: [{
        id: "restaurant-receipt",
        title: "영수증 커스텀",
        description: "기존 기본 설명",
        imageUrl: "/assets/sector/feature-restaurant-receipt.png",
      }],
    }],
  }, 1);
  const customRestaurant = getSectorDetailGroups({
    title: "음식점",
    desc: "",
    icon: "utensils",
    detailGroups: [{
      id: "custom",
      title: "운영자 콘텐츠",
      features: [{
        id: "restaurant-receipt",
        title: "운영자 기능",
        description: "운영자가 직접 작성",
        imageUrl: "/assets/operator/restaurant-proof.webp",
      }],
    }],
  }, 1);

  assert.equal(unsafeRestaurant[0].features[0].id, "restaurant-order-status");
  assert.equal(unsafeRestaurant[0].features[0].imageUrl, "/assets/operations/order-status.webp");
  assert.equal(customRestaurant[0].features[0].id, "restaurant-receipt");
  assert.equal(customRestaurant[0].features[0].imageUrl, "/assets/operator/restaurant-proof.webp");
});

test("restoreStandardCMSPages upgrades only exact legacy sector playlists and preserves operator media", () => {
  const legacyCafe = {
    ...HOME_SECTOR_ITEMS[0],
    mediaPlaylist: [
      { imageUrl: "/assets/sector/sector-cafe.webp" },
      { imageUrl: "/assets/sector/feature-cafe-kiosk.webp" },
      { imageUrl: "/assets/sector/feature-cafe-pickup.png" },
      { imageUrl: "/assets/sector/feature-cafe-receipt.png" },
    ],
  };
  const operatorRestaurant = {
    ...HOME_SECTOR_ITEMS[1],
    mediaPlaylist: [{ imageUrl: "/assets/operator/restaurant-custom.webp", caption: "운영자 장면" }],
  };
  const restored = restoreStandardCMSPages([{
    id: "home",
    slug: "home",
    title: "홈",
    isCustom: false,
    createdAt: "old",
    designVersion: 19,
    blocks: [{ id: "home-sector", type: "features", items: [legacyCafe, operatorRestaurant] }],
  }]);
  const sector = restored.find((page) => page.id === "home")?.blocks.find((block) => block.id === "home-sector");
  const cafeUrls = sector?.items?.[0].mediaPlaylist?.map((media) => media.imageUrl) || [];
  const restaurantUrls = sector?.items?.[1].mediaPlaylist?.map((media) => media.imageUrl) || [];

  assert.deepEqual(cafeUrls, HOME_SECTOR_ITEMS[0].mediaPlaylist?.map((media) => media.imageUrl));
  assert.deepEqual(restaurantUrls, ["/assets/operator/restaurant-custom.webp"]);
});

test("restoreStandardCMSPages removes only known unsafe default playlists", () => {
  const legacyByTitle = new Map([
    ["카페·베이커리", [
      "/assets/sector/sector-cafe.webp",
      "/assets/sector/feature-coupon.webp",
      "/assets/sector/feature-cafe-pickup.png",
      "/assets/sector/feature-cafe-receipt.png",
    ]],
    ["음식점", [
      "/assets/product/toss-delivery-sales.webp",
      "/assets/sector/feature-table-order.webp",
      "/assets/sector/feature-order-pos.webp",
      "/assets/sector/feature-restaurant-review.webp",
    ]],
    ["술집·바", [
      "/assets/sector/sector-bar.webp",
      "/assets/sector/feature-front-wallpaper.webp",
      "/assets/sector/feature-bar-store.png",
      "/assets/operations/auto-discount.webp",
    ]],
    ["도·소매업", [
      "/assets/operations/inventory.webp",
      "/assets/sector/feature-retail-barcode.webp",
      "/assets/operations/bulk-register.webp",
      "/assets/sector/feature-market-price.webp",
      "/assets/operations/sales-calendar.webp",
    ]],
  ]);
  const customBeauty = [{ imageUrl: "/assets/operator/beauty-custom.webp", caption: "운영자 장면" }];
  const items = HOME_SECTOR_ITEMS.map((item) => ({
    ...item,
    mediaPlaylist: item.title === "뷰티·서비스"
      ? customBeauty
      : legacyByTitle.get(item.title)!.map((imageUrl) => ({ imageUrl })),
  }));

  const restored = restoreStandardCMSPages([{
    id: "home",
    slug: "home",
    title: "홈",
    isCustom: false,
    createdAt: "old",
    designVersion: PUBLIC_DESIGN_VERSION,
    blocks: [{ id: "home-sector", type: "features", items }],
  }]);
  const restoredItems = restored[0].blocks[0].items || [];

  restoredItems.slice(0, 4).forEach((item, index) => {
    assert.deepEqual(
      item.mediaPlaylist?.map((media) => media.imageUrl),
      HOME_SECTOR_ITEMS[index].mediaPlaylist?.map((media) => media.imageUrl),
    );
  });
  assert.deepEqual(restoredItems[4].mediaPlaylist, customBeauty);
});

test("restoreStandardCMSPages fills missing and empty standard pages", () => {
  const defaultPages = createDefaultCMSPages("fixed-date");
  const restored = restoreStandardCMSPages(
    [
      { id: "home", slug: "home", title: "홈 수정본", isCustom: false, createdAt: "old", blocks: [] },
      {
        id: "custom",
        slug: "custom",
        title: "커스텀",
        isCustom: true,
        createdAt: "old",
        blocks: [{ id: "custom-text", type: "text", content: "유지" }],
      },
    ],
    defaultPages,
  );

  const home = restored.find((page) => page.id === "home");
  const products = restored.find((page) => page.id === "products");
  const custom = restored.find((page) => page.id === "custom");

  assert.ok(home);
  assert.equal(home.title, "홈 수정본");
  assert.ok(home.blocks.length >= 1);
  assert.ok(products);
  assert.ok(custom);
  assert.deepEqual(custom.blocks, [{ id: "custom-text", type: "text", content: "유지" }]);
});

test("restoreStandardCMSPages preserves edited blocks at the current design version", () => {
  const editedBlocks: CMSBlock[] = [{ id: "edited-hero", type: "hero", title: "운영자 수정 제목" }];
  const restored = restoreStandardCMSPages([
    {
      id: "home",
      slug: "home",
      title: "홈",
      isCustom: false,
      createdAt: "old",
      designVersion: PUBLIC_DESIGN_VERSION,
      blocks: editedBlocks,
    },
  ]);

  assert.deepEqual(restored.find((page) => page.id === "home")?.blocks, editedBlocks);
});

test("standard verbose copy is shortened while custom copy and custom sections are preserved", () => {
  const verboseHero: CMSBlock = {
    id: "home-hero",
    type: "hero",
    subtitle: "LG U+ 인터넷·AI전화·지능형 CCTV부터 토스포스, 결제단말기, 카드사 가맹과 설치 이후 AS까지 한 담당 흐름으로 연결합니다.",
  };
  const customHero: CMSBlock = { ...verboseHero, subtitle: "운영자가 직접 작성한 설명" };
  assert.equal(getPublicBlockSubtitle(verboseHero), "인터넷·통신·결제 장비를 한 번에 설치하고 관리합니다.");
  assert.equal(getPublicBlockSubtitle(customHero), "운영자가 직접 작성한 설명");

  const restored = restoreStandardCMSPages([
    {
      id: "home",
      slug: "home",
      title: "홈",
      isCustom: false,
      createdAt: "old",
      designVersion: PUBLIC_DESIGN_VERSION,
      blocks: [
        verboseHero,
        {
          id: "home-services",
          type: "features",
          title: "오픈에 필요한 일을 따로 맡기지 마세요",
          items: HOME_SERVICE_ITEMS,
        },
        {
          id: "home-services-custom",
          type: "features",
          title: "운영자 맞춤 섹션",
          items: HOME_SERVICE_ITEMS,
        },
      ],
    },
  ]);
  const blocks = restored.find((page) => page.id === "home")?.blocks || [];
  assert.equal(blocks.find((block) => block.id === "home-hero")?.subtitle, "인터넷·통신·결제 장비를 한 번에 설치하고 관리합니다.");
  assert.equal(blocks.some((block) => block.id === "home-services"), false);
  assert.equal(blocks.some((block) => block.id === "home-services-custom"), true);
});

test("current home media migration removes retired defaults but preserves custom media", () => {
  const restored = restoreStandardCMSPages([
    {
      id: "home",
      slug: "home",
      title: "홈",
      isCustom: false,
      createdAt: "old",
      designVersion: PUBLIC_DESIGN_VERSION,
      blocks: [
        {
          id: "home-hero",
          type: "hero",
          imageUrl: "/assets/product/toss-lineup.webp",
          items: [
            { title: "LG U+ 인터넷 500M", desc: "기존 기본 이미지", imageUrl: "/assets/uplus/uplus-internet-pos-network.png" },
            { title: "U+ AI전화", desc: "퇴역 인물 사진", imageUrl: DEPRECATED_PUBLIC_MEDIA.aiPhonePortrait },
            { title: "운영자 이미지", desc: "직접 지정", imageUrl: "https://example.com/custom.jpg" },
          ],
        },
        {
          id: "home-package",
          type: "banner",
          imageUrl: "/assets/product/toss-lineup.webp",
          items: [
            { title: "LG U+ 500M 인터넷", desc: "기존 공유기", imageUrl: "/assets/uplus/uplus-internet-router.png" },
            { title: "U+ AI전화", desc: "기존 인물", imageUrl: DEPRECATED_PUBLIC_MEDIA.aiPhonePortrait },
            { title: "U+ 지능형 CCTV", desc: "기존 카메라", imageUrl: "/assets/uplus/uplus-cctv-indoor.png" },
            { title: "토스포스 + 토스프론트", desc: "제품 구성", imageUrl: "/assets/product/toss-lineup.webp" },
          ],
        },
        {
          id: "home-services",
          type: "features",
          imageUrl: "/assets/product/toss-lineup-compact.webp",
          items: [
            { title: "토스포스·토스프론트", desc: "기존 포스", imageUrl: "/assets/product/toss-pos-receipt.webp" },
            { title: "U+ AI전화", desc: "기존 인물", imageUrl: DEPRECATED_PUBLIC_MEDIA.aiPhonePortrait },
            { title: "U+ 지능형 CCTV", desc: "기존 카메라", imageUrl: "/assets/uplus/uplus-cctv-indoor.png" },
            { title: "U+ 인터넷전화", desc: "기존 전화기", imageUrl: "/assets/uplus/uplus-phone-wireless.png" },
          ],
        },
        {
          id: "home-internet",
          type: "features",
          items: [
            { title: "토스포스 주문·결제", desc: "기존 기본 장면", imageUrl: "/assets/product/toss-delivery-sales.webp" },
            { title: "U+ AI전화", desc: "이미지 누락" },
            { title: "소상공인 인터넷 500M", desc: "운영자 지정 장면", imageUrl: "https://example.com/custom-scene.webp", imageAlt: "운영자가 직접 입력한 설명" },
          ],
        },
        {
          id: "home-sector",
          type: "features",
          items: [
            { title: "카페·베이커리", desc: "운영자 지정", imageUrl: "https://example.com/custom-cafe.webp" },
            { title: "음식점", desc: "기존 기본 장면", imageUrl: "/assets/sector/sector-restaurant.webp" },
            { title: "도·소매업", desc: "기존 기본 장면", imageUrl: "/assets/sector/sector-retail.webp" },
            { title: "뷰티·서비스", desc: "기존 기본 장면", imageUrl: "/assets/sector/sector-beauty.webp" },
          ],
        },
      ],
    },
  ]);

  const hero = restored.find((page) => page.id === "home")?.blocks[0];
  assert.equal(hero?.imageUrl, undefined);
  assert.equal(hero?.items?.[0].imageUrl, undefined);
  assert.equal(hero?.items?.[1].imageUrl, undefined);
  assert.equal(hero?.items?.[2].imageUrl, "https://example.com/custom.jpg");

  const offer = restored.find((page) => page.id === "home")?.blocks[1];
  assert.equal(offer?.imageUrl, PUBLIC_MEDIA.homePackage.overview);
  assert.equal(offer?.items?.slice(0, 3).every((item) => !item.imageUrl), true);
  assert.equal(offer?.items?.[3].imageUrl, undefined);

  const services = restored.find((page) => page.id === "home")?.blocks[2];
  assert.equal(services?.imageUrl, undefined);
  assert.equal(services?.items?.every((item) => !item.imageUrl), true);

  const system = restored.find((page) => page.id === "home")?.blocks.find((block) => block.id === "home-internet");
  assert.equal(system?.items?.[0].imageUrl, undefined);
  assert.equal(system?.items?.[0].mediaKind, "pos");
  assert.equal(Boolean(system?.items?.[0].imageAlt), true);
  assert.equal(system?.items?.[1].imageUrl, undefined);
  assert.equal(system?.items?.[1].mediaKind, "ai");
  assert.equal(system?.items?.[1].buttonLink, "uplus_ai_phone");
  assert.equal(system?.items?.[2].imageUrl, "https://example.com/custom-scene.webp");
  assert.equal(system?.items?.[2].mediaKind, "internet");
  assert.equal(system?.items?.[2].imageAlt, "운영자가 직접 입력한 설명");

  const sector = restored.find((page) => page.id === "home")?.blocks.find((block) => block.id === "home-sector");
  assert.equal(sector?.items?.[0].imageUrl, "https://example.com/custom-cafe.webp");
  assert.equal(sector?.items?.[1].imageUrl, "/assets/sector/feature-table-order.webp");
  assert.equal(sector?.items?.[2].imageUrl, "/assets/sector/feature-market-price-static.webp");
  assert.equal(sector?.items?.[3].imageUrl, "/assets/sector/beauty-reservation-register.webp");
  assert.equal(Boolean(sector?.items?.[1].imageAlt), true);
  assert.equal(Boolean(sector?.items?.[2].imageAlt), true);
  assert.equal(Boolean(sector?.items?.[3].imageAlt), true);
});

test("current Toss page migration removes the baked-background configurator fallback", () => {
  const restored = restoreStandardCMSPages([
    {
      id: "toss_pos",
      slug: "toss_pos",
      title: "토스포스",
      isCustom: false,
      createdAt: "old",
      designVersion: PUBLIC_DESIGN_VERSION,
      blocks: [
        {
          id: "toss-hero",
          type: "hero",
          imageUrl: "/assets/product/toss-pos-receipt.webp",
          items: [{ title: "주문·결제", desc: "기존 중복 이미지", imageUrl: "/assets/product/toss-pos-receipt.webp" }],
        },
        {
          id: "toss-sector-configurator",
          type: "features",
          imageUrl: DEPRECATED_PUBLIC_MEDIA.tossLineupCompactBakedBackground,
          items: [
            { title: "음식점", desc: "기존 기본 장면", imageUrl: "/assets/sector/sector-restaurant.webp" },
            { title: "도·소매업", desc: "기존 기본 장면", imageUrl: "/assets/sector/sector-retail.webp" },
            { title: "뷰티·서비스", desc: "기존 기본 장면", imageUrl: "/assets/sector/sector-beauty.webp" },
          ],
        },
        { id: "toss-operation", type: "features", imageUrl: "/assets/product/toss-sales.webp" },
        { id: "custom-toss-media", type: "image", imageUrl: "https://example.com/operator-image.png" },
      ],
    },
  ]);

  const tossPage = restored.find((page) => page.id === "toss_pos");
  assert.equal(tossPage?.blocks[0].imageUrl, PUBLIC_MEDIA.homeHero.tossPos);
  assert.equal(tossPage?.blocks[0].items?.[0].imageUrl, undefined);
  assert.equal(tossPage?.blocks[1].imageUrl, undefined);
  assert.equal(tossPage?.blocks[1].items?.[0].imageUrl, "/assets/sector/feature-table-order.webp");
  assert.equal(tossPage?.blocks[1].items?.[1].imageUrl, "/assets/sector/feature-market-price-static.webp");
  assert.equal(tossPage?.blocks[1].items?.[2].imageUrl, "/assets/sector/beauty-reservation-register.webp");
  assert.equal(tossPage?.blocks[2].imageUrl, undefined);
  assert.equal(tossPage?.blocks[3].imageUrl, "https://example.com/operator-image.png");
});

test("standard APEXA X copy is upgraded while operator copy is preserved", () => {
  const restored = restoreStandardCMSPages([
    {
      id: "home",
      slug: "home",
      title: "홈",
      isCustom: false,
      createdAt: "old",
      designVersion: PUBLIC_DESIGN_VERSION,
      blocks: [
        {
          id: "home-hero",
          type: "hero",
          items: [
            { title: "토스포스", desc: "주문·결제·매장 운영 연결" },
            { title: "운영자 항목", desc: "직접 작성한 설명" },
          ],
        },
        {
          id: "home-faq",
          type: "features",
          itemLayout: "faq",
          items: [
            { title: "토스포스는 어떤 기기에서 사용할 수 있나요?", desc: "Windows, Android, iOS, Mac 환경을 지원하며 매장 장비 구성에 맞춰 설치를 안내합니다." },
            { title: "운영자 질문", desc: "직접 작성한 답변" },
          ],
        },
      ],
    },
  ]);

  const blocks = restored.find((page) => page.id === "home")?.blocks || [];
  assert.equal(blocks[0].items?.[0].desc, "APEXA X · 주문·결제·매장 운영");
  assert.equal(blocks[0].items?.[1].desc, "직접 작성한 설명");
  assert.equal(blocks[1].items?.[0].title, "탑정보통신의 기본 토스포스 장비는 무엇인가요?");
  assert.equal(blocks[1].items?.[0].desc?.includes("APEXA X-1500"), true);
  assert.equal(blocks[1].items?.[1].desc, "직접 작성한 답변");
});

test("restoreStandardCMSPages upgrades only outdated standard page blocks", () => {
  const outdatedBlocks: CMSBlock[] = [{ id: "old-hero", type: "hero", title: "이전 디자인" }];
  const customBlocks: CMSBlock[] = [{ id: "custom-text", type: "text", content: "커스텀 유지" }];
  const restored = restoreStandardCMSPages([
    {
      id: "home",
      slug: "home",
      title: "홈",
      isCustom: false,
      createdAt: "old",
      designVersion: PUBLIC_DESIGN_VERSION - 1,
      blocks: outdatedBlocks,
    },
    {
      id: "custom",
      slug: "custom",
      title: "커스텀",
      isCustom: true,
      createdAt: "old",
      designVersion: PUBLIC_DESIGN_VERSION - 1,
      blocks: customBlocks,
    },
  ]);

  assert.notDeepEqual(restored.find((page) => page.id === "home")?.blocks, outdatedBlocks);
  assert.deepEqual(restored.find((page) => page.id === "custom")?.blocks, customBlocks);
});

test("restoreStandardCMSPages strips blocked media from custom pages and nested fields", () => {
  const restored = restoreStandardCMSPages([{
    id: "custom-media",
    slug: "custom-media",
    title: "커스텀 미디어",
    isCustom: true,
    createdAt: "old",
    blocks: [{
      id: "custom-block",
      type: "features",
      imageUrl: "/assets/product/toss-customer-coupon.webp",
      items: [{
        title: "운영자 항목",
        desc: "유지",
        imageUrl: "https://example.com/operator-safe.webp",
        mediaPlaylist: [
          { imageUrl: "/assets/sector/feature-cafe-receipt.png" },
          { imageUrl: "https://example.com/operator-scene.webp" },
        ],
        detailGroups: [{
          id: "detail",
          title: "상세",
          features: [{
            id: "blocked-feature",
            title: "차단 기능",
            imageUrl: "/assets/sector/feature-customer-profile.png",
          }],
        }],
      }],
    }],
  }]);

  const block = restored.find((page) => page.id === "custom-media")?.blocks[0];
  assert.equal(block?.imageUrl, undefined);
  assert.equal(block?.items?.[0].imageUrl, "https://example.com/operator-safe.webp");
  assert.deepEqual(block?.items?.[0].mediaPlaylist?.map((media) => media.imageUrl), ["https://example.com/operator-scene.webp"]);
  assert.equal(block?.items?.[0].detailGroups?.[0].features[0].imageUrl, undefined);
});
