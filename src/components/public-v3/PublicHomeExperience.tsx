import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  Coffee,
  CreditCard,
  FileText,
  HeartHandshake,
  Monitor,
  PackageCheck,
  PhoneCall,
  ReceiptText,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Wifi,
  Wine,
  Wrench,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { CMSBlock, CMSPage } from "../../types";
import { HOME_SYSTEM_GRAPHICS, getPublicBlockSubtitle } from "../../utils/cmsSettings";
import { PUBLIC_MEDIA } from "../../utils/publicMedia";
import { getSectorKind } from "../../utils/sectorContent";
import { ApexaXVisual } from "./ApexaXVisual";

interface PublicHomeExperienceProps {
  page: CMSPage;
  pages: CMSPage[];
  onNavigate: (target: string) => void;
  renderScene?: (block: CMSBlock, scene: React.ReactNode) => React.ReactNode;
  renderFallback?: (block: CMSBlock) => React.ReactNode;
}

type CMSBlockItem = NonNullable<CMSBlock["items"]>[number];

const iconMap: Record<string, LucideIcon> = {
  phone: PhoneCall,
  wifi: Wifi,
  shield: ShieldCheck,
  monitor: Monitor,
  "credit-card": CreditCard,
  file: FileText,
  wrench: Wrench,
  receipt: ReceiptText,
  delivery: PackageCheck,
  chart: CircleCheck,
  check: CircleCheck,
  heart: HeartHandshake,
  layers: PackageCheck,
  scrolltext: ReceiptText,
  coffee: Coffee,
  utensils: UtensilsCrossed,
  bar: Wine,
  shop: ShoppingBag,
  beauty: Scissors,
};

function ItemIcon({ item, className }: { item?: CMSBlockItem; className?: string }) {
  const Icon = iconMap[item?.icon || ""] || Check;
  return <Icon className={className} aria-hidden="true" />;
}

function HomeButton({ text, target, onNavigate, secondary = false }: {
  text?: string;
  target?: string;
  onNavigate: (target: string) => void;
  secondary?: boolean;
}) {
  if (!text || !target) return null;
  return (
    <button
      type="button"
      className={`top-home-button ${secondary ? "is-secondary" : "is-primary"}`}
      onClick={() => onNavigate(target)}
    >
      <span>{text}</span>
      <ArrowRight aria-hidden="true" />
    </button>
  );
}

function SceneHeading({ block }: { block: CMSBlock }) {
  const subtitle = getPublicBlockSubtitle(block);
  return (
    <header className="top-home-heading">
      {block.badge && <span>{block.badge}</span>}
      <h2>{block.title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

function HomeHero({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  const reduceMotion = useReducedMotion();
  const subtitle = getPublicBlockSubtitle(block);

  return (
    <div className="top-home-hero">
      <div className="top-home-container top-home-hero__inner">
        <motion.div
          className="top-home-hero__copy"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="top-home-eyebrow">{block.badge || "탑정보통신 · 토스플레이스 직계약 대리점"}</p>
          <h1>{block.title || "매장 오픈의 연결을\n끝까지 맡습니다"}</h1>
          {subtitle && <p className="top-home-hero__lead">{subtitle}</p>}
          <div className="top-home-actions">
            <HomeButton text={block.buttonText || "무료 상담 신청"} target={block.buttonLink || "request_consult"} onNavigate={onNavigate} />
            <HomeButton text={block.button2Text || "대표·AS 031-487-4401"} target={block.button2Link || "tel:0314874401"} onNavigate={onNavigate} secondary />
          </div>
          {block.note && <p className="top-home-hero__note">{block.note}</p>}
        </motion.div>

        <motion.figure
          className="top-home-hero__product"
          initial={reduceMotion ? false : { opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.56, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="top-home-hero__product-media">
            <ApexaXVisual
              className="top-home-hero__apexa"
              src={PUBLIC_MEDIA.homeHero.tossPos}
              alt="화이트 포스뱅크 APEXA X와 토스포스 화면, 토스프론트, AHAPOS CPP-3000 프린터, 화이트 금전함 구성"
              variant="counter-set"
              eager
            />
          </div>
          <figcaption>
            <span>설치 가능 제품 예시</span>
            <strong>APEXA X · 토스프론트 · CPP-3000</strong>
          </figcaption>
        </motion.figure>
      </div>

    </div>
  );
}

type SystemKind = "pos" | "internet" | "ai" | "cctv" | "phone" | "other";

function getResponsibilityTarget(item: CMSBlockItem): { id: string; kind?: SystemKind } {
  const directTarget = /^#([a-z0-9-]+)(?::(pos|internet|ai|cctv|phone|other))?$/i.exec(item.buttonLink || "");
  if (directTarget) return { id: directTarget[1], kind: directTarget[2]?.toLowerCase() as SystemKind | undefined };

  const meaning = `${item.title || ""} ${item.desc || ""}`;
  if (/지원|AS|용지|자료|건의|불편/.test(meaning)) return { id: "support" };
  if (/통신|보안|인터넷|CCTV|전화/.test(meaning)) return { id: "services", kind: "internet" };
  if (/기존|장비|교체|바꾸/.test(meaning)) return { id: "services", kind: "pos" };
  return { id: "home-sector-picker" };
}

function HomeResponsibility({ block }: { block: CMSBlock }) {
  const items = block.items || [];
  const moveToTarget = (item: CMSBlockItem) => {
    const target = getResponsibilityTarget(item);
    if (target.kind) window.dispatchEvent(new CustomEvent("topinfo:select-service", { detail: { kind: target.kind } }));
    document.getElementById(target.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="top-home-responsibility">
      <div className="top-home-container top-home-responsibility__inner">
        <header>
          <span>{block.badge || "탑정보통신 매장 오픈 지원"}</span>
          <h2>{block.title || "상담부터 운영·AS까지 한 흐름으로"}</h2>
          {getPublicBlockSubtitle(block) && <p>{getPublicBlockSubtitle(block)}</p>}
        </header>
        <div className="top-home-responsibility__situations">
          {items.map((item, index) => (
            <button type="button" key={`${item.title}-${index}`} onClick={() => moveToTarget(item)}>
              <ItemIcon item={item} />
              <div><strong>{item.title}</strong>{item.desc && <p>{item.desc}</p>}</div>
              <ArrowRight aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getSystemKind(item: CMSBlockItem): SystemKind {
  if (item.mediaKind) return item.mediaKind;
  const title = item.title || "";
  if (title.includes("토스포스") || title.includes("주문·결제")) return "pos";
  if (title.includes("AI전화")) return "ai";
  if (title.includes("CCTV")) return "cctv";
  if (title.includes("인터넷전화")) return "phone";
  if (title.includes("인터넷")) return "internet";
  return "other";
}

function InternetCounterScene({ alt }: { alt: string }) {
  return (
    <div className="top-home-internet-scene" role="img" aria-label={alt}>
      <span className="top-home-internet-scene__signal is-left" aria-hidden="true" />
      <span className="top-home-internet-scene__signal is-right" aria-hidden="true" />
      <ApexaXVisual className="top-home-internet-scene__apexa" src={PUBLIC_MEDIA.homeHero.tossPos} alt="" variant="counter-set" />
      <img className="top-home-internet-scene__router" src={PUBLIC_MEDIA.homeTelecom.internetDevice} alt="" aria-hidden="true" loading="lazy" />
      <div className="top-home-internet-scene__label"><Wifi aria-hidden="true" /><div><strong>500M 인터넷 · Wi-Fi</strong><span>포스와 결제 장비를 안정적으로 연결</span></div></div>
    </div>
  );
}

function CctvMonitoringScene({ alt }: { alt: string }) {
  return (
    <div className="top-home-cctv-scene" role="img" aria-label={alt}>
      <div className="top-home-cctv-scene__phone" aria-hidden="true">
        <span className="top-home-cctv-scene__speaker" />
        <div className="top-home-cctv-scene__screen">
          <img src="/assets/generated/cctv-store-grid-person-free.png" alt="" loading="lazy" />
          {["출입구", "카운터", "매장 안", "창고"].map((label) => <span key={label}>{label}</span>)}
        </div>
        <span className="top-home-cctv-scene__home" />
      </div>
      <div className="top-home-cctv-scene__products" aria-hidden="true">
        <img src={PUBLIC_MEDIA.homeTelecom.cctvIndoor} alt="" loading="lazy" />
        <img src={PUBLIC_MEDIA.homeTelecom.cctvOutdoor} alt="" loading="lazy" />
        <img src={PUBLIC_MEDIA.homeTelecom.cctvPtz} alt="" loading="lazy" />
      </div>
      <div className="top-home-cctv-scene__status"><ShieldCheck aria-hidden="true" /><div><strong>매장 화면 4분할 확인</strong><span>이상 감지 알림 · 월 2회 긴급출동</span></div></div>
    </div>
  );
}

function AIPhoneScene({ alt }: { alt: string }) {
  return (
    <div className="top-home-ai-phone" role="img" aria-label={alt}>
      <img className="top-home-ai-phone__device" src={PUBLIC_MEDIA.homeTelecom.aiPhoneHero} alt="" aria-hidden="true" loading="lazy" decoding="async" />
      <div className="top-home-ai-phone__bubble">
        <img src="/assets/generated/uplus-ai-robot-white.png" alt="" aria-hidden="true" loading="lazy" />
        <div>
          <span>LG U+ AI가 바로 응대</span>
          <strong>영업시간 · 위치 · 주차</strong>
          <small>응대 내역과 손님 메모는 앱에서 확인</small>
        </div>
      </div>
      <div className="top-home-ai-phone__features" aria-hidden="true">
        <div><PhoneCall /><span><strong>24시간</strong>반복 문의 응대</span></div>
        <div><FileText /><span><strong>문의 리포트</strong>통화 내역·손님 메모</span></div>
        <div><Monitor /><span><strong>IP-520GA</strong>기존 번호 유지 상담</span></div>
      </div>
    </div>
  );
}

function SystemMedia({ item }: { item: CMSBlockItem }) {
  const kind = getSystemKind(item);

  const graphics: Partial<Record<SystemKind, { src: string; alt: string }>> = {
    pos: { src: HOME_SYSTEM_GRAPHICS.pos, alt: "손님이 카운터의 토스프론트에서 직접 결제하는 장면" },
    internet: { src: HOME_SYSTEM_GRAPHICS.internet, alt: "매장 인터넷이 포스와 결제단말기, 태블릿, 프린터를 연결하는 장면" },
    ai: { src: HOME_SYSTEM_GRAPHICS.ai, alt: "화이트 LG U+ IP-520GA 전화기와 AI 상담 안내" },
    cctv: { src: HOME_SYSTEM_GRAPHICS.cctv, alt: "매장 CCTV를 휴대폰으로 확인하고 이상 감지와 출동을 연결하는 장면" },
    phone: { src: HOME_SYSTEM_GRAPHICS.phone, alt: "매장에서 유선과 무선 인터넷전화를 함께 사용하는 장면" },
  };
  const graphic = graphics[kind];
  const mediaSrc = item.imageUrl || graphic?.src;
  const mediaAlt = item.imageAlt || graphic?.alt || `${item.title} 관련 장면`;

  if (kind === "internet" && mediaSrc === HOME_SYSTEM_GRAPHICS.internet) {
    return (
      <figure className="top-home-system-media is-internet">
        <InternetCounterScene alt={mediaAlt} />
      </figure>
    );
  }

  if (kind === "ai" && mediaSrc === HOME_SYSTEM_GRAPHICS.ai) {
    return (
      <figure className="top-home-system-media is-ai">
        <AIPhoneScene alt={mediaAlt} />
      </figure>
    );
  }

  if (kind === "cctv" && mediaSrc === HOME_SYSTEM_GRAPHICS.cctv) {
    return (
      <figure className="top-home-system-media is-cctv">
        <CctvMonitoringScene alt={mediaAlt} />
      </figure>
    );
  }

  if (mediaSrc) {
    return (
      <figure className={`top-home-system-media is-${kind}`}>
        <img src={mediaSrc} alt={mediaAlt} loading="lazy" decoding="async" />
      </figure>
    );
  }

  return (
    <figure className="top-home-system-media is-fallback">
      <ItemIcon item={item} />
      <strong>{item.title}</strong>
      <figcaption>매장 환경에 맞는 구성을 상담합니다.</figcaption>
    </figure>
  );
}

function HomeSystemStage({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  const items = block.items || [];
  const [activeIndex, setActiveIndex] = React.useState(0);
  const reduceMotion = useReducedMotion();
  const activeItem = items[activeIndex] || items[0];

  React.useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  React.useEffect(() => {
    const selectService = (event: Event) => {
      const kind = (event as CustomEvent<{ kind?: SystemKind }>).detail?.kind;
      if (!kind) return;
      const nextIndex = items.findIndex((item) => getSystemKind(item) === kind);
      if (nextIndex >= 0) setActiveIndex(nextIndex);
    };
    window.addEventListener("topinfo:select-service", selectService);
    return () => window.removeEventListener("topinfo:select-service", selectService);
  }, [items]);

  if (!activeItem) return null;
  return (
    <section className="top-home-system" id="services">
      <div className="top-home-container">
        <SceneHeading block={block} />
        <label className="top-home-system__select">
          <span>제품·서비스 선택</span>
          <select value={activeIndex} onChange={(event) => setActiveIndex(Number(event.target.value))}>
            {items.map((item, index) => <option value={index} key={`${item.title}-option`}>{item.title}</option>)}
          </select>
        </label>
        <div className="top-home-system__layout">
          <nav className="top-home-system__tabs" aria-label="매장 통신 서비스 선택">
            {items.map((item, index) => (
              <button
                type="button"
                key={`${item.title}-${index}`}
                className={index === activeIndex ? "is-active" : ""}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              >
                <ItemIcon item={item} />
                <strong>{item.title}</strong>
                <ChevronRight aria-hidden="true" />
              </button>
            ))}
          </nav>

          <div className="top-home-system__stage">
            <AnimatePresence mode="wait">
              <motion.div
                className="top-home-system__media"
                key={`${activeItem.title}-media`}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <SystemMedia item={activeItem} />
              </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                className="top-home-system__copy"
                key={`${activeItem.title}-copy`}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div>
                  {activeItem.badge && <span>{activeItem.badge}</span>}
                  <h3>{activeItem.title}</h3>
                  {activeItem.desc && <p>{activeItem.desc}</p>}
                </div>
                <HomeButton
                  text={activeItem.buttonText || block.buttonText || "매장 통신 상담"}
                  target={activeItem.buttonLink || block.buttonLink || "request_consult"}
                  onNavigate={onNavigate}
                  secondary
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <p className="top-home-system__notice">기능 이해를 위한 연출 이미지입니다. 실제 제품·화면·제공 범위는 상담 시 확인합니다.</p>
      </div>
    </section>
  );
}

function PackageCampaignVisual({ alt }: { alt: string }) {
  return (
    <div className="top-home-package__visual" role="img" aria-label={alt}>
      <img className="top-home-package__visual-bg" src={PUBLIC_MEDIA.homePackage.overview} alt="" aria-hidden="true" loading="lazy" />
      <div className="top-home-package__visual-copy" aria-hidden="true"><span>TOPINFO STORE PACKAGE</span><strong>내 매장에 필요한 장비만<br />한 번에 연결</strong></div>
      <div className="top-home-package__product is-pos" aria-hidden="true">
        <ApexaXVisual src={PUBLIC_MEDIA.homeHero.tossPos} alt="" variant="counter-set" />
        <span>APEXA X · 토스포스 카운터 세트</span>
      </div>
      <div className="top-home-package__product is-router" aria-hidden="true"><img src={PUBLIC_MEDIA.homeTelecom.internetDevice} alt="" /><span>500M Wi-Fi</span></div>
      <div className="top-home-package__product is-phone" aria-hidden="true"><img src={PUBLIC_MEDIA.homeTelecom.aiPhoneDevice} alt="" /><span>U+ AI전화</span></div>
      <div className="top-home-package__product is-cctv" aria-hidden="true"><img src={PUBLIC_MEDIA.homeTelecom.cctvIndoor} alt="" /><span>U+ 지능형 CCTV</span></div>
    </div>
  );
}

function HomePackage({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  const subtitle = getPublicBlockSubtitle(block);
  const campaignImage = block.imageUrl || PUBLIC_MEDIA.homePackage.overview;
  const campaignAlt = campaignImage === PUBLIC_MEDIA.homePackage.overview
    ? "탑정보통신이 구성하는 APEXA X 토스포스, 토스프론트, AHAPOS 프린터, LG U+ 인터넷·AI전화·CCTV 매장 패키지"
    : block.imageCaption || "매장 결합 상품 안내";
  const items = block.items || [];

  return (
    <section className="top-home-package" id="promotion">
      <div className="top-home-container">
        <figure className="top-home-package__campaign">
          {campaignImage === PUBLIC_MEDIA.homePackage.overview
            ? <PackageCampaignVisual alt={campaignAlt} />
            : <img src={campaignImage} alt={campaignAlt} loading="lazy" />}
          <figcaption>탑정보통신 맞춤 구성 이미지 · 실제 설치 장비와 제공 조건은 상담 결과를 기준으로 합니다.</figcaption>
        </figure>

        <div className="top-home-package__offer">
          <div className="top-home-package__copy">
            {block.badge && <span className="top-home-eyebrow">{block.badge}</span>}
            <h2>{block.title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="top-home-package__price-column">
            <div className="top-home-package__price">
              <small>LG U+ 인터넷 월 이용료 예시</small>
              <strong>{block.priceValue}<i>{block.priceUnit}</i></strong>
              {block.priceLabel && <em>{block.priceLabel}</em>}
            </div>
            {block.priceDetails && <p className="top-home-package__terms">{block.priceDetails}</p>}
            <p className="top-home-package__separation">월 {block.priceValue || "34,000"}원은 인터넷 이용료 예시이며 POS·CCTV·전화·주변 장비의 제공 및 비용 조건은 별도입니다.</p>
            <p className="top-home-package__basis">{block.note || "안내 기준일과 최신 적용 조건은 상담 시 다시 확인합니다."}</p>
            <HomeButton text={block.buttonText || "내 매장 조건 확인"} target={block.buttonLink || "request_consult"} onNavigate={onNavigate} />
          </div>
        </div>
        {items.length > 0 && (
          <ul className="top-home-package__included" aria-label={block.listLabel || "패키지 구성 예시"}>
            {items.map((item, index) => (
              <li key={`${item.title}-${index}`}><ItemIcon item={item} /><div><strong>{item.title}</strong>{item.desc && <span>{item.desc}</span>}</div></li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function RetailApexaScene({ alt }: { alt: string }) {
  return (
    <div className="top-home-retail-scene" role="img" aria-label={alt}>
      <img className="top-home-retail-scene__context" src="/assets/sector/sector-retail-apexa-x.webp" alt="" aria-hidden="true" loading="lazy" />
      <ApexaXVisual className="top-home-retail-scene__apexa" src={PUBLIC_MEDIA.homeHero.tossPos} alt="" variant="retail" />
      <img className="top-home-retail-scene__front" src={PUBLIC_MEDIA.homeHero.tossFront} alt="" aria-hidden="true" loading="lazy" />
      <div className="top-home-retail-scene__scan"><span>BARCODE</span><strong>상품 스캔 완료</strong><small>재고 수량 자동 반영</small></div>
    </div>
  );
}

function RestaurantDeliveryScene({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="top-home-delivery-scene" role="img" aria-label={alt}>
      <div className="top-home-delivery-scene__apps" aria-hidden="true">
        <img src="/assets/sector/delivery-baemin.png" alt="" />
        <img src="/assets/sector/delivery-yogiyo.png" alt="" />
        <img src="/assets/sector/delivery-coupangeats.png" alt="" />
      </div>
      <img className="top-home-delivery-scene__screen" src={src} alt="" aria-hidden="true" loading="lazy" />
      <div className="top-home-delivery-scene__summary" aria-hidden="true"><span>매장 + 배달</span><strong>오늘 매출을 한 화면에서</strong></div>
    </div>
  );
}

function SectorMediaShowcase({ item, sector, reduceMotion }: {
  item: CMSBlockItem;
  sector: ReturnType<typeof getSectorKind>;
  reduceMotion: boolean;
}) {
  const playlist = React.useMemo(() => item.mediaPlaylist?.length
    ? item.mediaPlaylist
    : item.imageUrl ? [{ imageUrl: item.imageUrl, staticImageUrl: item.staticImageUrl, imageAlt: item.imageAlt, caption: `${item.title} 사용 장면` }] : [],
  [item]);
  const [mediaIndex, setMediaIndex] = React.useState(0);

  React.useEffect(() => setMediaIndex(0), [item.title]);
  React.useEffect(() => {
    if (playlist.length < 2) return undefined;
    const duration = Math.max(4200, playlist[mediaIndex]?.durationMs || 6200);
    const timer = window.setTimeout(() => setMediaIndex((current) => (current + 1) % playlist.length), duration);
    return () => window.clearTimeout(timer);
  }, [mediaIndex, playlist]);

  const current = playlist[mediaIndex] || playlist[0];
  React.useEffect(() => {
    if (playlist.length < 2 || typeof window === "undefined") return undefined;
    const nextMedia = playlist[(mediaIndex + 1) % playlist.length];
    const preloader = new window.Image();
    preloader.decoding = "async";
    preloader.src = nextMedia.imageUrl;
    return () => { preloader.src = ""; };
  }, [mediaIndex, playlist]);

  if (!current) return null;
  const mediaSrc = current.imageUrl;
  const mediaAlt = current.imageAlt || item.imageAlt || `${item.title} 추천 기능 미리보기`;
  const isDelivery = sector === "restaurant" && current.imageUrl === "/assets/product/toss-delivery-sales.webp";
  const isRetailScan = sector === "retail" && current.imageUrl === "/assets/sector/sector-retail-scan.webp";

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          className="top-home-sector__media-stage"
          key={`${item.title}-${current.imageUrl}-${mediaIndex}`}
          initial={reduceMotion ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {isDelivery
            ? <RestaurantDeliveryScene src={mediaSrc} alt={mediaAlt} />
            : isRetailScan
              ? <RetailApexaScene alt={mediaAlt} />
              : <img src={mediaSrc} alt={mediaAlt} loading="eager" decoding="async" />}
        </motion.div>
      </AnimatePresence>
      {playlist.length > 1 && (
        <div className="top-home-sector__media-nav" aria-label={`${item.title} 기능 장면 선택`}>
          {playlist.map((media, index) => (
            <button
              type="button"
              className={index === mediaIndex ? "is-active" : ""}
              key={`${media.imageUrl}-${index}`}
              aria-label={`${index + 1}. ${media.caption || "기능 장면"}`}
              aria-pressed={index === mediaIndex}
              onClick={() => setMediaIndex(index)}
            />
          ))}
        </div>
      )}
      <figcaption><strong>{current.caption || `${item.title} 사용 장면`}</strong><span>관련 기능 장면이 자동으로 이어집니다.</span></figcaption>
    </>
  );
}

function HomeSectorStage({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  const items = block.items || [];
  const [activeIndex, setActiveIndex] = React.useState(0);
  const reduceMotion = useReducedMotion();
  const activeItem = items[activeIndex] || items[0];

  React.useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  if (!activeItem) return null;
  const included = (activeItem.desc || "").split("|").filter(Boolean);
  const activeSector = getSectorKind(activeItem, activeIndex);
  const detailsTarget = (block.buttonLink || "toss_pos") === "toss_pos"
    ? `toss_pos?sector=${activeSector}`
    : block.buttonLink || "toss_pos";
  return (
    <div className="top-home-sector" id="home-sector-picker">
      <div className="top-home-container">
        <SceneHeading block={block} />
        <label className="top-home-sector__select">
          <span>업종 선택</span>
          <select value={activeIndex} onChange={(event) => setActiveIndex(Number(event.target.value))}>
            {items.map((item, index) => <option value={index} key={`${item.title}-option`}>{item.title}</option>)}
          </select>
        </label>
        <nav className="top-home-sector__tabs" aria-label="업종 선택">
          {items.map((item, index) => (
            <button type="button" key={`${item.title}-${index}`} className={index === activeIndex ? "is-active" : ""} onClick={() => setActiveIndex(index)} aria-pressed={index === activeIndex}>
              <ItemIcon item={item} />
              <span>{item.title}</span>
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            className="top-home-sector__story"
            key={`${activeItem.title}-manifest`}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <div className="top-home-sector__summary">
              <ItemIcon item={activeItem} />
              <span>업종별 추천</span>
              <h3>{activeItem.title}</h3>
              {activeItem.badge && <p>{activeItem.badge}</p>}
              <ul>{included.map((label) => <li key={label}><Check aria-hidden="true" />{label}</li>)}</ul>
              <button type="button" onClick={() => onNavigate(detailsTarget)}>업종별 구성 자세히 보기 <ArrowRight /></button>
            </div>
            <figure className={`top-home-sector__media top-home-sector__media--${activeSector}`}>
              <SectorMediaShowcase item={activeItem} sector={activeSector} reduceMotion={Boolean(reduceMotion)} />
            </figure>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function HomeProcess({ block }: { block: CMSBlock }) {
  const items = block.items || [];
  return (
    <section className="top-home-process" id="installation">
      <div className="top-home-container">
        <SceneHeading block={block} />
        <div className="top-home-process__body">
          <aside>
            <span>안산·경기권 현장 지원</span>
            <strong>설치 뒤에도<br />같은 번호로</strong>
            <a href="tel:0314874401">031-487-4401</a>
            <p>{block.note || "경기도 안산시 상록구 천문로17 일영빌딩 2층"}</p>
          </aside>
          <ol>
            {items.map((item, index) => (
              <li key={`${item.title}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{item.title}</strong>{item.desc && <p>{item.desc}</p>}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function HomeSupport({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  return (
    <div className="top-home-support">
      <div className="top-home-container">
        <SceneHeading block={block} />
        <div className="top-home-support__links">
          {(block.items || []).map((item, index) => (
            <button type="button" key={`${item.title}-${index}`} onClick={() => item.buttonLink && onNavigate(item.buttonLink)}>
              <span><ItemIcon item={item} /></span>
              <div><strong>{item.title}</strong>{item.desc && <p>{item.desc}</p>}</div>
              <ArrowRight aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeFaq({ block }: { block?: CMSBlock }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  if (!block) return null;
  return (
    <div className="top-home-faq">
      <div className="top-home-container top-home-faq__inner">
        <SceneHeading block={block} />
        <div className="top-home-faq__list">
          {(block.items || []).map((item, index) => (
            <div className="top-home-faq__item" key={`${item.title}-${index}`}>
              <button
                type="button"
                id={`home-faq-question-${index}`}
                className={openIndex === index ? "is-open" : ""}
                onClick={() => setOpenIndex((current) => current === index ? null : index)}
                aria-expanded={openIndex === index}
                aria-controls={`home-faq-answer-${index}`}
              >
                <span><strong>{item.title}</strong><ChevronRight aria-hidden="true" /></span>
              </button>
              {openIndex === index && (
                <p id={`home-faq-answer-${index}`} role="region" aria-labelledby={`home-faq-question-${index}`}>{item.desc}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeCta({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  const subtitle = getPublicBlockSubtitle(block);
  return (
    <section className="top-home-cta" id="consultation">
      <div className="top-home-container top-home-cta__inner">
        <div>{block.badge && <span>{block.badge}</span>}<h2>{block.title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <div className="top-home-actions"><HomeButton text={block.buttonText} target={block.buttonLink} onNavigate={onNavigate} /><HomeButton text={block.button2Text} target={block.button2Link} onNavigate={onNavigate} secondary /></div>
      </div>
    </section>
  );
}

export function PublicHomeExperience({ page, pages, onNavigate, renderScene, renderFallback }: PublicHomeExperienceProps) {
  const blocks = page.blocks.filter((block) => block.type !== "custom_board");
  const homeSector = blocks.find((block) => block.id === "home-sector");
  const fallbackSector = pages.find((item) => item.slug === "toss_pos")?.blocks.find((block) => block.id === "toss-sector-configurator");
  const wrap = (block: CMSBlock | undefined, scene: React.ReactNode) => block && renderScene ? renderScene(block, scene) : scene;
  const openingIds = new Set(["home-hero"]);
  const recommendationIds = new Set(["home-signals", "home-sector"]);
  const customerCareIds = new Set(["home-support", "home-faq"]);
  const consumed = new Set<string>();
  const scenes: React.ReactNode[] = [];

  const sceneForBlock = (block: CMSBlock): React.ReactNode => {
    let scene: React.ReactNode;
    if (block.id === "home-hero") scene = <HomeHero block={block} onNavigate={onNavigate} />;
    else if (block.id === "home-signals") scene = <HomeResponsibility block={block} />;
    else if (block.id === "home-internet") scene = <HomeSystemStage block={block} onNavigate={onNavigate} />;
    else if (block.id === "home-package") scene = <HomePackage block={block} onNavigate={onNavigate} />;
    else if (block.id === "home-sector") scene = <HomeSectorStage block={block} onNavigate={onNavigate} />;
    else if (block.id === "home-process") scene = <HomeProcess block={block} />;
    else if (block.id === "home-support") scene = <HomeSupport block={block} onNavigate={onNavigate} />;
    else if (block.id === "home-faq") scene = <HomeFaq block={block} />;
    else if (block.id === "home-cta") scene = <HomeCta block={block} onNavigate={onNavigate} />;
    else scene = renderFallback?.(block) || null;
    return scene;
  };

  for (const block of blocks) {
    if (consumed.has(block.id)) continue;

    if (openingIds.has(block.id)) {
      const chapterBlocks = blocks.filter((candidate) => openingIds.has(candidate.id));
      chapterBlocks.forEach((candidate) => consumed.add(candidate.id));
      scenes.push(
        <section className="top-home-opening" key="top-home-opening">
          {chapterBlocks.map((candidate) => (
            <React.Fragment key={candidate.id}>{wrap(candidate, sceneForBlock(candidate))}</React.Fragment>
          ))}
        </section>,
      );
      continue;
    }

    if (recommendationIds.has(block.id)) {
      const chapterBlocks = blocks.filter((candidate) => recommendationIds.has(candidate.id));
      chapterBlocks.forEach((candidate) => consumed.add(candidate.id));
      scenes.push(
        <section className="top-home-recommendation" id="recommendations" key="top-home-recommendation">
          {chapterBlocks.map((candidate) => (
            <React.Fragment key={candidate.id}>{wrap(candidate, sceneForBlock(candidate))}</React.Fragment>
          ))}
          {!homeSector && fallbackSector && <HomeSectorStage block={fallbackSector} onNavigate={onNavigate} />}
        </section>,
      );
      continue;
    }

    if (customerCareIds.has(block.id)) {
      const chapterBlocks = blocks.filter((candidate) => customerCareIds.has(candidate.id));
      chapterBlocks.forEach((candidate) => consumed.add(candidate.id));
      scenes.push(
        <section className="top-home-customer-care" id="support" key="top-home-customer-care">
          {chapterBlocks.map((candidate) => (
            <React.Fragment key={candidate.id}>{wrap(candidate, sceneForBlock(candidate))}</React.Fragment>
          ))}
        </section>,
      );
      continue;
    }

    consumed.add(block.id);
    scenes.push(<React.Fragment key={block.id}>{wrap(block, sceneForBlock(block))}</React.Fragment>);

  }

  if (!blocks.some((block) => recommendationIds.has(block.id)) && fallbackSector) {
    scenes.splice(1, 0, <section className="top-home-recommendation" id="recommendations" key="top-home-recommendation"><HomeSectorStage block={fallbackSector} onNavigate={onNavigate} /></section>);
  }

  return <div className="top-home-experience">{scenes}</div>;
}
