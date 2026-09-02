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
import { PUBLIC_MEDIA, getPublicImageDimensions, isBlockedPublicMedia } from "../../utils/publicMedia";
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
  const heroImage = block.imageUrl || "/assets/product/posbank-apexa-x-white-official.png";

  return (
    <section className="top-home-hero">
      <div className="top-home-hero__backdrop">
        <ApexaXVisual
          className="top-home-hero__machine"
          src={heroImage}
          alt="포스뱅크 APEXA X 화이트 모델에서 실행 중인 토스POS 주문·결제 화면"
          variant="product"
          eager
        />
      </div>
      <div className="top-home-hero__shade" aria-hidden="true" />
      <div className="top-home-container top-home-hero__inner">
        <motion.div
          className="top-home-hero__copy"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="top-home-eyebrow">{block.badge || "탑정보통신 · 매장 운영 설계"}</p>
          <h1>{block.title || "계산대가 아니라,\n매장의 흐름을 설계합니다"}</h1>
          {subtitle && <p className="top-home-hero__lead">{subtitle}</p>}
          <div className="top-home-actions">
            <HomeButton text={block.buttonText || "내 매장 구성 상담"} target={block.buttonLink || "request_consult"} onNavigate={onNavigate} />
            <HomeButton text={block.button2Text || "토스POS 구성 확인"} target={block.button2Link || "toss_pos"} onNavigate={onNavigate} secondary />
          </div>
          {block.note && <p className="top-home-hero__note">{block.note}</p>}
        </motion.div>
      </div>
      <div className="top-home-hero__equipment" aria-label="대표 취급 범위">
        <span>POSBANK APEXA X</span>
        <span>토스POS · 토스프론트</span>
        <span>설치·사용 안내·운영 문의</span>
      </div>
    </section>
  );
}

function HomeFlowRail({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  const items = block.items || [];
  const selectItem = (item: CMSBlockItem) => {
    const target = item.buttonLink || block.buttonLink;
    if (!target) return;
    if (target.startsWith("#")) {
      document.getElementById(target.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    onNavigate(target);
  };

  return (
    <section className="top-home-flow" aria-labelledby="top-home-flow-title">
      <div className="top-home-container top-home-flow__inner">
        <header>
          {block.badge && <span>{block.badge}</span>}
          <h2 id="top-home-flow-title">{block.title}</h2>
          {getPublicBlockSubtitle(block) && <p>{getPublicBlockSubtitle(block)}</p>}
        </header>
        <ol className="top-home-flow__rail">
          {items.map((item, index) => {
            const content = (
              <>
                <span className="top-home-flow__index">{String(index + 1).padStart(2, "0")}</span>
                <ItemIcon item={item} className="top-home-flow__icon" />
                <div>
                  {item.badge && <small>{item.badge}</small>}
                  <strong>{item.title}</strong>
                  {item.desc && <p>{item.desc}</p>}
                </div>
                {(item.buttonLink || block.buttonLink) && <ArrowRight aria-hidden="true" />}
              </>
            );

            return (
              <li key={`${item.title}-${index}`}>
                {item.buttonLink || block.buttonLink
                  ? <button type="button" onClick={() => selectItem(item)}>{content}</button>
                  : <div>{content}</div>}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

type SystemKind = "pos" | "internet" | "ai" | "cctv" | "phone" | "other";
type ResponsibilityKind = "opening" | "replace" | "connect" | "support";

function getResponsibilityTarget(item: CMSBlockItem): { id: string; kind?: SystemKind } {
  const directTarget = /^#([a-z0-9-]+)(?::(pos|internet|ai|cctv|phone|other))?$/i.exec(item.buttonLink || "");
  if (directTarget) return { id: directTarget[1], kind: directTarget[2]?.toLowerCase() as SystemKind | undefined };

  const meaning = `${item.title || ""} ${item.desc || ""}`;
  if (/지원|AS|용지|자료|건의|불편/.test(meaning)) return { id: "support" };
  if (/통신|보안|인터넷|CCTV|전화/.test(meaning)) return { id: "services", kind: "internet" };
  if (/기존|장비|교체|바꾸/.test(meaning)) return { id: "services", kind: "pos" };
  return { id: "home-sector-picker" };
}

function getResponsibilityKind(item: CMSBlockItem): ResponsibilityKind {
  const target = getResponsibilityTarget(item);
  if (target.id === "support") return "support";
  if (target.kind === "internet") return "connect";
  if (target.kind === "pos") return "replace";
  return "opening";
}

const responsibilityLabels: Record<ResponsibilityKind, string> = {
  opening: "신규 오픈",
  replace: "장비 교체",
  connect: "통신·보안",
  support: "운영 지원",
};

function ResponsibilityVisual({ kind }: { kind: ResponsibilityKind }) {
  if (kind === "opening") {
    return (
      <span className="top-home-responsibility__visual is-opening" aria-hidden="true">
        <span className="top-home-responsibility__floor" />
        <span className="top-home-responsibility__hub"><ShoppingBag /></span>
        <span className="top-home-responsibility__node is-a"><Wifi /></span>
        <span className="top-home-responsibility__node is-b"><CreditCard /></span>
        <span className="top-home-responsibility__node is-c"><Wrench /></span>
      </span>
    );
  }

  if (kind === "replace") {
    return (
      <span className="top-home-responsibility__visual is-replace" aria-hidden="true">
        <span className="top-home-responsibility__device is-before"><Monitor /></span>
        <ArrowRight className="top-home-responsibility__transfer" />
        <span className="top-home-responsibility__device is-after"><Monitor /></span>
      </span>
    );
  }

  if (kind === "connect") {
    return (
      <span className="top-home-responsibility__visual is-connect" aria-hidden="true">
        <span className="top-home-responsibility__network-line is-a" />
        <span className="top-home-responsibility__network-line is-b" />
        <span className="top-home-responsibility__network-line is-c" />
        <span className="top-home-responsibility__network-hub"><Wifi /></span>
        <span className="top-home-responsibility__network-node is-a"><CreditCard /></span>
        <span className="top-home-responsibility__network-node is-b"><Monitor /></span>
        <span className="top-home-responsibility__network-node is-c"><ShieldCheck /></span>
      </span>
    );
  }

  return (
    <span className="top-home-responsibility__visual is-support" aria-hidden="true">
      <span className="top-home-responsibility__support-call">
        <PhoneCall />
        <span><small>설치·AS</small><strong>031-487-4401</strong></span>
      </span>
      <span className="top-home-responsibility__support-tools">
        <span><Wrench /></span>
        <span><ReceiptText /></span>
        <span><FileText /></span>
      </span>
    </span>
  );
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
          {items.map((item, index) => {
            const kind = getResponsibilityKind(item);
            return (
              <button
                type="button"
                className={`top-home-responsibility__situation is-${kind}`}
                key={`${item.title}-${index}`}
                onClick={() => moveToTarget(item)}
              >
                <span className="top-home-responsibility__copy">
                  <span className="top-home-responsibility__label"><ItemIcon item={item} />{responsibilityLabels[kind]}</span>
                  <strong>{item.title}</strong>
                  {item.desc && <span className="top-home-responsibility__description">{item.desc}</span>}
                  <span className="top-home-responsibility__action">필요한 구성 확인 <ArrowRight aria-hidden="true" /></span>
                </span>
                <ResponsibilityVisual kind={kind} />
              </button>
            );
          })}
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

const SYSTEM_STANDARD_MEDIA: Record<SystemKind, readonly string[]> = {
  pos: [
    HOME_SYSTEM_GRAPHICS.pos,
    "/assets/generated/system-pos-apexa-x-toss.webp",
    "/assets/generated/system-pos-order-payment.webp",
    PUBLIC_MEDIA.homeHero.tossPos,
  ],
  internet: [
    HOME_SYSTEM_GRAPHICS.internet,
    "/assets/generated/system-internet-connect.webp",
    PUBLIC_MEDIA.homeTelecom.internet,
    PUBLIC_MEDIA.homeTelecom.internetDevice,
  ],
  ai: [
    HOME_SYSTEM_GRAPHICS.ai,
    "/assets/generated/system-ai-phone.webp",
    PUBLIC_MEDIA.homeTelecom.aiPhoneDevice,
    PUBLIC_MEDIA.homeTelecom.aiPhoneHero,
  ],
  cctv: [
    HOME_SYSTEM_GRAPHICS.cctv,
    "/assets/generated/system-cctv.webp",
    PUBLIC_MEDIA.homeTelecom.cctvArchitecture,
    PUBLIC_MEDIA.homeTelecom.cctvIndoor,
  ],
  phone: [
    HOME_SYSTEM_GRAPHICS.phone,
    "/assets/generated/system-internet-phone.webp",
    PUBLIC_MEDIA.homeTelecom.phoneDesk,
    PUBLIC_MEDIA.homeTelecom.phoneWireless,
    PUBLIC_MEDIA.homeTelecom.aiPhoneDevice,
  ],
  other: [],
};

const SYSTEM_SCENE_FACTS: Record<SystemKind, readonly string[]> = {
  pos: ["직원 주문 확인", "손님 결제", "완료 흐름 확인"],
  internet: ["POS 주문", "결제 장비", "출력 장비"],
  ai: ["반복 문의 응대", "앱에서 응대 이력 확인", "지원 단말 조건 확인"],
  cctv: ["휴대폰 확인", "실내·실외 카메라", "현장 조건 상담"],
  phone: ["매장 대표번호", "유선 LAN 연결", "번호 유지 조건 상담"],
  other: ["매장 환경 확인", "필요 장비 구성", "설치 범위 상담"],
};

const SYSTEM_SCENE_ALTS: Record<SystemKind, string> = {
  pos: "화이트 POSBANK APEXA X의 Toss POS 주문 화면 구성 예시와 Toss Front 손님 결제 장비를 함께 배치한 모습",
  internet: "LG U+ 매장 인터넷 공유기에서 POS와 결제 장비, 출력 장비로 연결되는 구성",
  ai: "화이트 LG U+ IP-520GA 인터넷전화기 옆에 AI가 영업시간, 위치, 주차 문의를 안내하는 서비스 흐름",
  cctv: "휴대폰 모니터링 화면 예시와 LG U+ 실내형, 실외형, PTZ CCTV 카메라 구성",
  phone: "화이트 LG U+ IP-520GA 인터넷전화가 손님 전화와 매장 대표번호를 연결하는 구성",
  other: "매장 환경에 맞춰 제품과 서비스를 연결하는 구성",
};

function PosOrderPaymentScene({ alt }: { alt: string }) {
  return (
    <div className="top-home-system-v2__visual is-pos" role="img" aria-label={alt}>
      <div className="top-home-system-v2__pos-devices" aria-hidden="true">
        <ApexaXVisual
          className="top-home-system-v2__apexa"
          src="/assets/product/posbank-apexa-x-white-official.png"
          alt=""
          variant="product"
        />
        <img
          className="top-home-system-v2__front"
          src={PUBLIC_MEDIA.homeHero.tossFront}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>
      <ol className="top-home-system-v2__pos-flow" aria-hidden="true">
        <li><Monitor /><span>직원 주문 확인</span></li>
        <li><CreditCard /><span>손님 결제</span></li>
        <li><CircleCheck /><span>완료 확인</span></li>
      </ol>
      <p className="top-home-system-v2__model" aria-hidden="true">POSBANK APEXA X-1500 · Toss POS · Toss Front</p>
    </div>
  );
}

function InternetNetworkScene({ alt }: { alt: string }) {
  return (
    <div className="top-home-system-v2__visual is-internet" role="img" aria-label={alt}>
      <div className="top-home-system-v2__network-core" aria-hidden="true">
        <span><Wifi /></span>
        <img src={PUBLIC_MEDIA.homeTelecom.internetDevice} alt="" loading="lazy" decoding="async" />
        <strong>매장 인터넷</strong>
        <small>공유기에서 필요한 장비로</small>
      </div>
      <div className="top-home-system-v2__network-lines" aria-hidden="true">
        <span className="is-pos" />
        <span className="is-payment" />
        <span className="is-output" />
      </div>
      <ul className="top-home-system-v2__network-nodes" aria-hidden="true">
        <li className="is-pos"><Monitor /><strong>POS</strong><span>주문·운영</span></li>
        <li className="is-payment"><CreditCard /><strong>결제</strong><span>카운터 장비</span></li>
        <li className="is-output"><ReceiptText /><strong>출력</strong><span>영수증·주방</span></li>
      </ul>
    </div>
  );
}

function AIPhoneScene({ alt }: { alt: string }) {
  return (
    <div className="top-home-system-v2__visual is-ai" role="img" aria-label={alt}>
      <div className="top-home-system-v2__ai-bubble" aria-hidden="true">
        <img src="/assets/generated/uplus-ai-robot-white-384.webp" alt="" width="384" height="576" loading="lazy" decoding="async" />
        <div>
          <span>AI 응대</span>
          <strong>영업시간 · 위치 · 주차</strong>
          <small>응대 이력과 문의 현황은 앱에서 확인</small>
        </div>
      </div>
      <div className="top-home-system-v2__ai-route" aria-hidden="true">
        <span><PhoneCall />손님 문의</span>
        <i />
        <span><FileText />응대 내역</span>
      </div>
      <img
        className="top-home-system-v2__ip520ga"
        src={PUBLIC_MEDIA.homeTelecom.aiPhoneDevice}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
      />
      <p className="top-home-system-v2__model" aria-hidden="true">LG U+ IP-520GA · 지원 조건 확인</p>
    </div>
  );
}

function CctvMonitoringScene({ alt }: { alt: string }) {
  return (
    <div className="top-home-system-v2__visual is-cctv" role="img" aria-label={alt}>
      <div className="top-home-system-v2__monitor-phone" aria-hidden="true">
        <span className="top-home-system-v2__monitor-speaker" />
        <div className="top-home-system-v2__monitor-screen">
          <img src="/assets/generated/cctv-store-grid-person-free-480.webp" alt="" width="480" height="960" loading="lazy" decoding="async" />
          <span>모니터링 화면 예시</span>
        </div>
      </div>
      <div className="top-home-system-v2__camera-set" aria-hidden="true">
        <figure><img src={PUBLIC_MEDIA.homeTelecom.cctvIndoor} alt="" loading="lazy" /><figcaption>실내형</figcaption></figure>
        <figure><img src={PUBLIC_MEDIA.homeTelecom.cctvOutdoor} alt="" loading="lazy" /><figcaption>실외형</figcaption></figure>
        <figure><img src={PUBLIC_MEDIA.homeTelecom.cctvPtz} alt="" loading="lazy" /><figcaption>PTZ</figcaption></figure>
      </div>
      <ol className="top-home-system-v2__cctv-flow" aria-hidden="true">
        <li><Monitor />매장 확인</li>
        <li><ShieldCheck />이상 알림</li>
        <li><PhoneCall />지원 연결</li>
      </ol>
    </div>
  );
}

function InternetPhoneScene({ alt }: { alt: string }) {
  return (
    <div className="top-home-system-v2__visual is-phone" role="img" aria-label={alt}>
      <div className="top-home-system-v2__phone-route" aria-hidden="true">
        <div><PhoneCall /><strong>손님 전화</strong><span>매장 문의</span></div>
        <i />
        <figure>
          <img src={PUBLIC_MEDIA.homeTelecom.aiPhoneDevice} alt="" loading="lazy" decoding="async" />
          <figcaption>IP-520GA</figcaption>
        </figure>
        <i />
        <div><Wifi /><strong>매장 대표번호</strong><span>인터넷전화 연결</span></div>
      </div>
      <p className="top-home-system-v2__phone-note" aria-hidden="true">번호 유지와 설치 조건은 상담에서 확인합니다.</p>
    </div>
  );
}

function SystemMedia({ item }: { item: CMSBlockItem }) {
  const kind = getSystemKind(item);
  const customMedia = item.imageUrl?.trim();
  const hasCustomMedia = Boolean(
    customMedia
    && !isBlockedPublicMedia(customMedia)
    && !SYSTEM_STANDARD_MEDIA[kind].includes(customMedia),
  );
  const mediaAlt = hasCustomMedia
    ? item.imageAlt || `${item.title}의 매장 사용 장면`
    : SYSTEM_SCENE_ALTS[kind];

  if (hasCustomMedia && customMedia) {
    return (
      <figure className="top-home-system-v2__custom-media">
        <img src={customMedia} alt={mediaAlt} loading="lazy" decoding="async" />
      </figure>
    );
  }

  if (kind === "pos") return <PosOrderPaymentScene alt={mediaAlt} />;
  if (kind === "internet") return <InternetNetworkScene alt={mediaAlt} />;
  if (kind === "ai") return <AIPhoneScene alt={mediaAlt} />;
  if (kind === "cctv") return <CctvMonitoringScene alt={mediaAlt} />;
  if (kind === "phone") return <InternetPhoneScene alt={mediaAlt} />;

  return (
    <figure className="top-home-system-v2__fallback">
      <ItemIcon item={item} />
      <strong>{item.title}</strong>
      <figcaption>매장 환경을 확인해 필요한 구성을 상담합니다.</figcaption>
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
  const activeKind = getSystemKind(activeItem);
  const sceneFacts = SYSTEM_SCENE_FACTS[activeKind];

  return (
    <section className="top-home-system top-home-system-v2" id="services">
      <div className="top-home-container">
        <div className="top-home-system-v2__heading">
          <SceneHeading block={block} />
          <p><span>제품·서비스 체험</span>매장 운영의 어느 지점에 연결되는지 확인하세요.</p>
        </div>

        <label className="top-home-system__select top-home-system-v2__select">
          <span>제품·서비스 선택</span>
          <select value={activeIndex} onChange={(event) => setActiveIndex(Number(event.target.value))}>
            {items.map((item, index) => <option value={index} key={`${item.title}-option`}>{item.title}</option>)}
          </select>
        </label>

        <div className="top-home-system-v2__shell">
          <nav className="top-home-system-v2__tabs" aria-label="제품·서비스 선택">
            {items.map((item, index) => (
              <button
                type="button"
                key={`${item.title}-${index}`}
                className={index === activeIndex ? "is-active" : ""}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              >
                <span className="top-home-system-v2__tab-index">{String(index + 1).padStart(2, "0")}</span>
                <ItemIcon item={item} />
                <strong>{item.title}</strong>
                <ChevronRight aria-hidden="true" />
              </button>
            ))}
          </nav>

          <div className="top-home-system-v2__stage">
            <AnimatePresence mode="wait">
              <motion.article
                className={`top-home-system-v2__scene is-${activeKind}`}
                key={`${activeItem.title}-${activeKind}`}
                role="region"
                aria-label={`${activeItem.title} 안내`}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="top-home-system-v2__media">
                  <SystemMedia item={activeItem} />
                </div>
                <div className="top-home-system-v2__copy">
                  <div>
                    {activeItem.badge && <span className="top-home-system-v2__badge">{activeItem.badge}</span>}
                    <h3>{activeItem.title}</h3>
                    {activeItem.desc && <p>{activeItem.desc}</p>}
                    <ul>
                      {sceneFacts.map((fact) => <li key={fact}><Check aria-hidden="true" />{fact}</li>)}
                    </ul>
                  </div>
                  <HomeButton
                    text={activeItem.buttonText || block.buttonText || "내 매장 구성 상담"}
                    target={activeItem.buttonLink || block.buttonLink || "request_consult"}
                    onNavigate={onNavigate}
                    secondary
                  />
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>

        <p className="top-home-system__notice top-home-system-v2__notice">
          제품과 기능을 이해하기 위한 구성 예시입니다. 실제 설치 장비와 서비스 제공 범위는 매장 환경과 상담 결과에 따라 달라질 수 있습니다.
        </p>
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
  const isUnverifiedLegacyPrice = block.priceValue === "34,000"
    && Boolean(block.priceDetails?.includes("일반 월 43,000"));
  const showVerifiedPrice = Boolean(block.priceLabel && block.priceValue && block.priceUnit)
    && !isUnverifiedLegacyPrice;

  return (
    <section className="top-home-package" id="promotion">
      <div className="top-home-container">
        <figure className="top-home-package__campaign">
          {campaignImage === PUBLIC_MEDIA.homePackage.overview
            ? <PackageCampaignVisual alt={campaignAlt} />
            : <img src={campaignImage} alt={campaignAlt} loading="lazy" />}
          <figcaption>연출 이미지 · 실제 설치 장비와 제공 조건은 상담 결과를 기준으로 합니다.</figcaption>
        </figure>

        <div className="top-home-package__offer">
          <div className="top-home-package__copy">
            {block.badge && <span className="top-home-eyebrow">{block.badge}</span>}
            <h2>{block.title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="top-home-package__price-column">
            {showVerifiedPrice ? (
              <>
                <div className="top-home-package__price">
                  <small>확인된 인터넷 월 이용료</small>
                  <strong>{block.priceValue}<i>{block.priceUnit}</i></strong>
                  {block.priceLabel && <em>{block.priceLabel}</em>}
                </div>
                {block.priceDetails && <p className="top-home-package__terms">{block.priceDetails}</p>}
                <p className="top-home-package__separation">POS·CCTV·전화·주변 장비의 제공 및 비용 조건은 별도로 확인합니다.</p>
              </>
            ) : (
              <div className="top-home-package__condition">
                <span>매장별 조건 확인</span>
                <strong>요금과 제공 장비는<br />상담에서 현재 기준으로 확인</strong>
                <p>약정·결합·설치 환경과 필요한 장비에 따라 구성이 달라질 수 있습니다.</p>
              </div>
            )}
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

function RestaurantDeliveryScene({ src, alt, onError }: { src: string; alt: string; onError: () => void }) {
  return (
    <div className="top-home-delivery-scene" role="img" aria-label={alt}>
      <div className="top-home-delivery-scene__apps" aria-hidden="true">
        <img src="/assets/sector/delivery-baemin.png" alt="" />
        <img src="/assets/sector/delivery-yogiyo.png" alt="" />
        <img src="/assets/sector/delivery-coupangeats.png" alt="" />
      </div>
      <img className="top-home-delivery-scene__screen" src={src} alt="" aria-hidden="true" loading="lazy" onError={onError} />
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
  const [isNearViewport, setIsNearViewport] = React.useState(false);
  const mediaStageRef = React.useRef<HTMLDivElement | null>(null);
  const current = playlist[mediaIndex] || playlist[0];
  const currentUrl = current?.imageUrl || "";
  const [failedMedia, setFailedMedia] = React.useState<"none" | "primary" | "all">("none");

  React.useEffect(() => setMediaIndex(0), [item.title]);
  React.useEffect(() => setFailedMedia("none"), [currentUrl, reduceMotion]);
  React.useEffect(() => {
    const target = mediaStageRef.current;
    if (!target || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return undefined;
    }

    const observer = new window.IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setIsNearViewport(true);
      observer.disconnect();
    }, { rootMargin: "400px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [item.title]);

  React.useEffect(() => {
    if (reduceMotion || !isNearViewport || playlist.length < 2) return undefined;
    const duration = Math.max(4200, playlist[mediaIndex]?.durationMs || 6200);
    const timer = window.setTimeout(() => setMediaIndex((current) => (current + 1) % playlist.length), duration);
    return () => window.clearTimeout(timer);
  }, [isNearViewport, mediaIndex, playlist, reduceMotion]);

  React.useEffect(() => {
    if (reduceMotion || !isNearViewport || playlist.length < 2 || typeof window === "undefined") return undefined;
    const nextMedia = playlist[(mediaIndex + 1) % playlist.length];
    const preloader = new window.Image();
    preloader.decoding = "async";
    preloader.src = nextMedia.imageUrl;
    return () => { preloader.src = ""; };
  }, [isNearViewport, mediaIndex, playlist, reduceMotion]);

  if (!current) return null;
  const shouldDeferAnimation = Boolean(current.staticImageUrl) && !isNearViewport;
  const displayMediaSrc = shouldDeferAnimation ? current.staticImageUrl || current.imageUrl : current.imageUrl;
  const mediaSrc = failedMedia === "primary" && current.staticImageUrl
    ? current.staticImageUrl
    : displayMediaSrc;
  const mediaAlt = current.imageAlt || item.imageAlt || `${item.title} 추천 기능 미리보기`;
  const isDelivery = sector === "restaurant" && current.imageUrl === "/assets/product/toss-delivery-sales.webp";
  const handleMediaError = () => {
    if (mediaSrc === current.imageUrl && current.staticImageUrl && current.staticImageUrl !== current.imageUrl) {
      setFailedMedia("primary");
      return;
    }
    setFailedMedia("all");
  };
  const mediaDimensions = getPublicImageDimensions(mediaSrc);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          className="top-home-sector__media-stage"
          key={`${item.title}-${mediaSrc}-${mediaIndex}`}
          initial={reduceMotion ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          ref={mediaStageRef}
        >
          {failedMedia === "all" ? (
            <div className="top-home-sector__media-fallback" role="img" aria-label={mediaAlt}>
              <ItemIcon item={item} />
              <strong>기능 이미지를 불러오지 못했습니다</strong>
              <span>다른 장면을 선택하거나 잠시 후 다시 확인해 주세요.</span>
            </div>
          ) : isDelivery ? (
            <RestaurantDeliveryScene src={mediaSrc} alt={mediaAlt} onError={handleMediaError} />
          ) : (
            <img
              src={mediaSrc}
              alt={mediaAlt}
              width={mediaDimensions?.width}
              height={mediaDimensions?.height}
              loading={isNearViewport ? "eager" : "lazy"}
              decoding="async"
              onError={handleMediaError}
            />
          )}
        </motion.div>
      </AnimatePresence>
      {playlist.length > 1 && (
        <div
          className="top-home-sector__media-nav"
          aria-label={`${item.title} 기능 장면 선택`}
        >
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
            <span>설치 가능 지역 상담</span>
            <strong>설치 전부터<br />운영 이후까지</strong>
            <a href="tel:0314874401">031-487-4401</a>
            <p>{block.note || "경기도 안산시 상록구 천문로17 일영빌딩 2층"}</p>
            <div className="top-home-process__signal" aria-hidden="true">
              <span><PhoneCall /></span>
              <ChevronRight />
              <span><Monitor /></span>
              <ChevronRight />
              <span><Wrench /></span>
            </div>
          </aside>
          <ol>
            {items.map((item, index) => (
              <li key={`${item.title}-${index}`}>
                <span className="top-home-process__index">{String(index + 1).padStart(2, "0")}</span>
                <span className="top-home-process__icon"><ItemIcon item={item} /></span>
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
            <button
              type="button"
              className={`top-home-support__link is-${index + 1}`}
              key={`${item.title}-${index}`}
              onClick={() => item.buttonLink && onNavigate(item.buttonLink)}
            >
              <span className="top-home-support__icon"><ItemIcon item={item} /></span>
              <div className="top-home-support__copy"><strong>{item.title}</strong>{item.desc && <p>{item.desc}</p>}</div>
              <span className="top-home-support__action">{item.buttonText || "지원 메뉴 열기"}<ArrowRight aria-hidden="true" /></span>
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
                <span>
                  <small className="top-home-faq__index">{String(index + 1).padStart(2, "0")}</small>
                  <strong>{item.title}</strong>
                  <ChevronRight aria-hidden="true" />
                </span>
              </button>
              <p
                id={`home-faq-answer-${index}`}
                role="region"
                aria-labelledby={`home-faq-question-${index}`}
                hidden={openIndex !== index}
              >
                {item.desc}
              </p>
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
    else if (block.id === "home-flow") scene = <HomeFlowRail block={block} onNavigate={onNavigate} />;
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
