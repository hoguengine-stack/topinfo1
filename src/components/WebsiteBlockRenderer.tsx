import React from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Barcode,
  BellRing,
  CalendarCheck2,
  Check,
  ChevronRight,
  CircleDollarSign,
  CloudUpload,
  Coffee,
  Cpu,
  CreditCard,
  FileText,
  HeartHandshake,
  LayoutGrid,
  Layers3,
  Monitor,
  PackageCheck,
  PhoneCall,
  Plus,
  ReceiptText,
  ScanLine,
  Search,
  ShieldCheck,
  ShoppingBag,
  Scissors,
  Smartphone,
  Sparkles,
  TabletSmartphone,
  TicketPercent,
  Trash2,
  Truck,
  UtensilsCrossed,
  UserRound,
  Wifi,
  Wine,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { CMSBlock, CMSPage, CMSSectorFeature, Product } from "../types";
import { FooterInfo } from "../utils/footerSettings";
import { getPublicBlockSubtitle, HOME_HERO_ITEMS } from "../utils/cmsSettings";
import { PUBLIC_MEDIA, getPublicImageDimensions, isBlockedPublicMedia, isDeprecatedPublicMedia } from "../utils/publicMedia";
import { createDefaultPublicProducts } from "../utils/publicProducts";
import { getPublicRoutePath } from "../utils/publicRoutes";
import { getSectorDetailGroups, getSectorKind, type SectorKind } from "../utils/sectorContent";
import { PublicConsultationForm, PublicPaperRequestForm } from "./public-v3/PublicForms";
import { PublicResourceBoard, PublicSuggestionBoard } from "./public-v3/PublicBoards";
import { PublicHomeExperience } from "./public-v3/PublicHomeExperience";
import { ApexaXVisual } from "./public-v3/ApexaXVisual";
import { UplusAiAppSection, UplusAiPhoneHero } from "./public-v3/UplusAiPhonePage";
import "../styles/public-toss-pos-redesign.css";

interface WebsiteBlockRendererProps {
  page: CMSPage;
  pages: CMSPage[];
  setPages: React.Dispatch<React.SetStateAction<CMSPage[]>>;
  isEditModeActive: boolean;
  activeEditTarget: any;
  setActiveEditTarget: (target: any) => void;
  showAddBlockMenuAtIndex: { pageId: string; index: number } | null;
  setShowAddBlockMenuAtIndex: (value: { pageId: string; index: number } | null) => void;
  handleMoveBlockUp: (page: CMSPage, index: number) => void;
  handleMoveBlockDown: (page: CMSPage, index: number) => void;
  handleDeleteBlock: (page: CMSPage, index: number) => void;
  handleInsertBlock: (page: CMSPage, index: number, type: "hero" | "features" | "text" | "banner" | "image" | "divider") => void;
  handleLinkClick: (slug: string) => void;
  handleUpdateBlockData: (page: CMSPage, blockId: string, updatedData: Partial<CMSBlock>) => Promise<void>;
  db: any;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  productFilter: string;
  setProductFilter: (value: string) => void;
  scheduleProductWrite: (productId: string, fields: Partial<Product>) => void;
  footerInfo: FooterInfo;
}

const iconMap: Record<string, LucideIcon> = {
  phone: PhoneCall,
  zap: Sparkles,
  shield: ShieldCheck,
  monitor: Monitor,
  chart: BarChart3,
  "credit-card": CreditCard,
  scrolltext: ReceiptText,
  layers: Layers3,
  heart: HeartHandshake,
  smartphone: Smartphone,
  cpu: Cpu,
  wifi: Wifi,
  package: PackageCheck,
  file: FileText,
  wrench: Wrench,
  coffee: Coffee,
  utensils: UtensilsCrossed,
  shop: ShoppingBag,
  bar: Wine,
  beauty: Scissors,
  delivery: Truck,
  coupon: TicketPercent,
  customer: UserRound,
  receipt: ReceiptText,
  layout: LayoutGrid,
  tablet: TabletSmartphone,
  upload: CloudUpload,
  barcode: Barcode,
  search: Search,
  calendar: CalendarCheck2,
  bell: BellRing,
  scan: ScanLine,
  check: Check,
};

type CMSBlockItem = NonNullable<CMSBlock["items"]>[number];

const standardItemImageCorrections: Record<string, Record<number, { legacy: string; current: string }>> = {
  "toss-hero": {
    1: { legacy: "/assets/product/toss-mobile-order.webp", current: "/assets/product/toss-delivery-sales.webp" },
  },
};

function resolveStandardItemImage(block: CMSBlock, item: CMSBlockItem | undefined, index: number) {
  const configuredImage = item?.imageUrl;
  const correction = standardItemImageCorrections[block.id]?.[index];

  // Migrate only untouched legacy defaults. Images selected in the CMS always take priority.
  if (correction && (!configuredImage || configuredImage === correction.legacy)) return correction.current;
  return configuredImage || block.imageUrl;
}

function isAiPhoneItem(item?: CMSBlockItem) {
  return Boolean(item?.title && /AI\s*전화/i.test(item.title));
}

type GeneratedServiceKind = "ai" | "toss" | "internet" | "cctv" | "phone";

function getGeneratedServiceKind(item?: CMSBlockItem): GeneratedServiceKind | null {
  const title = item?.title || "";
  if (isAiPhoneItem(item)) return "ai";
  if (/토스포스|토스프론트/.test(title)) return "toss";
  if (/CCTV/i.test(title)) return "cctv";
  if (/인터넷전화/.test(title)) return "phone";
  if (/인터넷/.test(title)) return "internet";
  return null;
}

function shouldUseGeneratedServiceGraphic(item?: CMSBlockItem) {
  return Boolean(getGeneratedServiceKind(item)) && (!item?.imageUrl || isDeprecatedPublicMedia(item.imageUrl));
}

function mediaPresentationClass(imageUrl?: string) {
  if (!imageUrl) return "";
  if (imageUrl.includes("uplus-internet-")) return "is-uplus-internet";
  if (imageUrl.includes("uplus-ai-phone-")) return "is-uplus-ai-phone";
  if (imageUrl.includes("uplus-cctv-")) return "is-uplus-cctv";
  if (imageUrl.includes("uplus-phone-")) return "is-uplus-phone";
  return "";
}

function UplusProductMedia({ imageUrl, alt }: { imageUrl?: string; alt: string }) {
  if (!imageUrl) return null;
  const mediaClass = mediaPresentationClass(imageUrl);
  const primaryDimensions = getPublicImageDimensions(imageUrl);
  const cameraOptions = mediaClass === "is-uplus-cctv"
    ? [
        { src: PUBLIC_MEDIA.homeTelecom.cctvOutdoor, alt: "LG U+ 실외형 CCTV 카메라" },
        { src: PUBLIC_MEDIA.homeTelecom.cctvPtz, alt: "LG U+ PTZ CCTV 카메라" },
      ]
    : [];

  return (
    <div className={`public-uplus-product-media ${mediaClass}`}>
      <img className="is-primary" src={imageUrl} alt={alt} width={primaryDimensions?.width} height={primaryDimensions?.height} loading="lazy" decoding="async" />
      {cameraOptions.map((camera) => {
        const dimensions = getPublicImageDimensions(camera.src);
        return <img className="is-camera-option" src={camera.src} alt={camera.alt} width={dimensions?.width} height={dimensions?.height} key={camera.src} loading="lazy" decoding="async" />;
      })}
    </div>
  );
}

const systemVisualSpecs: Record<GeneratedServiceKind, {
  icon: LucideIcon;
  title: string;
  metric: string;
  nodes: [LucideIcon, LucideIcon, LucideIcon];
}> = {
  ai: {
    icon: PhoneCall,
    title: "AI전화 자동 응대와 문의 분석",
    metric: "24h",
    nodes: [BellRing, BarChart3, Smartphone],
  },
  toss: {
    icon: Monitor,
    title: "토스포스 주문·결제·매출 연결",
    metric: "POS",
    nodes: [CreditCard, ReceiptText, BarChart3],
  },
  internet: {
    icon: Wifi,
    title: "인터넷과 매장 기기 연결",
    metric: "500M",
    nodes: [Monitor, CreditCard, Smartphone],
  },
  cctv: {
    icon: ShieldCheck,
    title: "지능형 CCTV 모니터링",
    metric: "FHD",
    nodes: [Monitor, Smartphone, BellRing],
  },
  phone: {
    icon: PhoneCall,
    title: "유·무선 인터넷전화 연결",
    metric: "TEL",
    nodes: [Smartphone, Wifi, BellRing],
  },
};

function IconFlowVisual({
  kind,
  mainIcon: MainIcon,
  nodes,
  metric,
  label,
  compact = false,
}: {
  kind: string;
  mainIcon: LucideIcon;
  nodes: [LucideIcon, LucideIcon, LucideIcon];
  metric?: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className={`public-icon-flow-visual is-${kind} ${compact ? "is-compact" : ""}`} role="img" aria-label={label}>
      <i className="public-icon-flow-visual__ring" aria-hidden="true" />
      <span className="public-icon-flow-visual__main"><MainIcon aria-hidden="true" /></span>
      <span className="public-icon-flow-visual__nodes" aria-hidden="true">
        {nodes.map((NodeIcon, index) => <i key={index}><NodeIcon /></i>)}
      </span>
      {metric && <b>{metric}</b>}
    </div>
  );
}

function SystemServiceVisual({ kind, compact = false }: { kind: GeneratedServiceKind; compact?: boolean }) {
  const spec = systemVisualSpecs[kind];
  return (
    <IconFlowVisual kind={kind} mainIcon={spec.icon} nodes={spec.nodes} metric={spec.metric} label={spec.title} compact={compact} />
  );
}

function ServiceIllustration({ item, compact = false }: { item: CMSBlockItem; compact?: boolean }) {
  const generatedKind = getGeneratedServiceKind(item);
  if (generatedKind) return <SystemServiceVisual kind={generatedKind} compact={compact} />;

  const MainIcon = iconMap[item.icon || "wrench"] || Wrench;
  const isMembership = item.icon === "file";
  return (
    <IconFlowVisual
      kind={isMembership ? "membership" : "support"}
      mainIcon={MainIcon}
      nodes={isMembership ? [FileText, ShieldCheck, CreditCard] : [Search, Wrench, Check]}
      metric={isMembership ? "VAN" : "A/S"}
      label={`${item.title} 지원 흐름`}
      compact={compact}
    />
  );
}

const fallbackProducts = createDefaultPublicProducts("");

const tossPageBlockOrder = [
  "toss-hero",
  "toss-platforms",
  "toss-flow",
  "toss-sector-configurator",
  "toss-operation",
  "toss-resources",
  "toss-cta",
] as const;

const tossComposedBlockIds = new Set([
  "toss-order",
  "toss-front",
  "toss-delivery",
  "toss-customer",
]);

type TossFlowStepId = "order" | "payment" | "output" | "management";

interface TossMediaSpec {
  kind?: "image" | "apexa";
  apexaVariant?: "product" | "counter-set";
  src: string;
  alt: string;
  staticSrc?: string;
  ratio?: string;
  label?: string;
}

const TOSS_APPROVED_MEDIA = new Set([
  PUBLIC_MEDIA.homeHero.tossPos,
  PUBLIC_MEDIA.homeHero.tossFront,
  "/assets/product/toss-pos-screen.webp",
  "/assets/product/toss-mobile-order.webp",
  "/assets/product/toss-delivery.webp",
  "/assets/product/toss-delivery-sales.webp",
  "/assets/product/toss-pos-receipt.webp",
  "/assets/product/toss-sales.webp",
  "/assets/operations/inventory.webp",
  "/assets/operations/bulk-register.webp",
  "/assets/operations/sales-calendar.webp",
  "/assets/operations/order-status.webp",
  "/assets/operations/auto-discount.webp",
  "/assets/operations/receipt-settings.webp",
  "/assets/sector/sector-cafe.webp",
  "/assets/sector/sector-cafe-static.webp",
  "/assets/sector/feature-cafe-pickup.png",
  "/assets/sector/feature-table-order.webp",
  "/assets/sector/feature-order-pos.webp",
  "/assets/sector/sector-bar.webp",
  "/assets/sector/sector-bar-static.webp",
  "/assets/sector/feature-front-wallpaper-static.webp",
  "/assets/sector/feature-market-price.webp",
  "/assets/sector/feature-market-price-static.webp",
  "/assets/sector/beauty-reservation-register.webp",
  "/assets/sector/beauty-reservation-register-static.webp",
  "/assets/sector/beauty-schedule-ui.png",
  "/assets/sector/beauty-customer-note.png",
]);

function resolveApprovedTossMedia(configured: string | undefined, fallback: string) {
  return configured && !isBlockedPublicMedia(configured) && TOSS_APPROVED_MEDIA.has(configured) ? configured : fallback;
}

interface TossSectorBlueprint {
  heading: string;
  summary: string;
  workflow: string[];
  primary: TossMediaSpec;
  supporting: Array<{
    title: string;
    description: string;
    media: TossMediaSpec;
  }>;
}

const TOSS_SECTOR_BLUEPRINTS: Record<SectorKind, TossSectorBlueprint> = {
  cafe: {
    heading: "빠른 주문 회전과 픽업 동선이 중요한 카페·베이커리",
    summary: "카운터 주문, 픽업 준비, 재고 확인을 한 흐름으로 보고 싶은 매장에 맞는 구성이 중심입니다.",
    workflow: [
      "카운터 주문과 휴대폰 픽업 주문을 함께 받습니다.",
      "토스프론트와 포스 화면을 분리해 피크 시간 결제 동선을 줄입니다.",
      "원두·음료 상품 재고와 매출 흐름을 포스에서 바로 확인합니다.",
    ],
    primary: {
      src: "/assets/sector/sector-cafe.webp",
      staticSrc: "/assets/sector/sector-cafe-static.webp",
      alt: "카페 카운터에서 토스프론트를 미니 키오스크처럼 사용하는 공식 장면",
      ratio: "4 / 5",
      label: "고객이 직접 고르고 결제하는 카운터 장면",
    },
    supporting: [
      {
        title: "픽업 주문 연결",
        description: "휴대폰으로 먼저 주문하고 매장에서 바로 찾아가는 흐름을 보여줍니다.",
        media: {
          src: "/assets/sector/feature-cafe-pickup.png",
          alt: "카페 고객이 휴대폰으로 픽업 주문을 진행하는 공식 화면",
          ratio: "4 / 3",
        },
      },
      {
        title: "영수증 구성",
        description: "글자 크기와 출력 레이아웃을 매장 운영 방식에 맞춰 확인합니다.",
        media: {
          src: "/assets/operations/receipt-settings.webp",
          alt: "토스포스 영수증 구성 설정 공식 화면",
          ratio: "4 / 3",
        },
      },
    ],
  },
  restaurant: {
    heading: "홀 주문, 테이블 주문, 배달 주문이 함께 움직이는 음식점",
    summary: "주문 유입 경로가 여러 개인 매장에서 주문 누락을 줄이고 주방 전달 흐름을 정리할 때 적합한 구성을 먼저 봅니다.",
    workflow: [
      "테이블 QR 주문과 카운터 주문을 함께 받습니다.",
      "배달 주문과 품절·매출 화면을 한곳에서 확인합니다.",
      "홀 주문 접수와 주방 전달 흐름을 업종 구조에 맞춰 정리합니다.",
    ],
    primary: {
      src: "/assets/sector/feature-table-order.webp",
      alt: "음식점 테이블에서 QR 주문을 진행하는 공식 장면",
      ratio: "16 / 10",
      label: "테이블에서 시작되는 주문 흐름",
    },
    supporting: [
      {
        title: "배달 주문 통합",
        description: "배달 주문과 매출 흐름을 포스 화면에서 함께 보는 장면입니다.",
        media: {
          src: "/assets/product/toss-delivery-sales.webp",
          alt: "배달 주문과 매출을 토스포스에서 통합 확인하는 공식 화면",
          ratio: "16 / 10",
        },
      },
      {
        title: "주문 접수 화면",
        description: "카운터와 홀 동선에 맞춰 주문용 포스를 분리해 쓰는 장면입니다.",
        media: {
          src: "/assets/sector/feature-order-pos.webp",
          alt: "음식점 주문 접수와 포스 운영 공식 화면",
          ratio: "3 / 2",
        },
      },
    ],
  },
  bar: {
    heading: "신분 확인과 추가 주문, 재고 흐름이 함께 움직이는 술집·바",
    summary: "고객 확인 절차와 잦은 추가 주문, 주류 재고 확인이 모두 필요한 매장에 맞춘 흐름입니다.",
    workflow: [
      "고객이 자리에서 주문한 내용을 포스에서 바로 받습니다.",
      "토스프론트에서 손님 확인이 필요한 절차를 이어서 진행합니다.",
      "주류와 안주 재고 흐름을 영업 중에도 확인합니다.",
    ],
    primary: {
      src: "/assets/sector/sector-bar.webp",
      staticSrc: "/assets/sector/sector-bar-static.webp",
      alt: "술집 카운터에서 토스프론트로 신분증을 확인하는 공식 장면",
      ratio: "4 / 5",
      label: "결제와 확인 절차가 만나는 카운터",
    },
    supporting: [
      {
        title: "고객 화면 설정",
        description: "토스프론트 화면을 매장 분위기와 운영 목적에 맞춰 설정하는 장면입니다.",
        media: {
          src: "/assets/sector/feature-front-wallpaper-static.webp",
          alt: "토스프론트 고객 화면 설정 공식 장면",
          ratio: "16 / 10",
        },
      },
      {
        title: "조건별 할인",
        description: "시간대와 주문 조건에 맞춰 할인을 설정하는 운영 화면입니다.",
        media: {
          src: "/assets/operations/auto-discount.webp",
          alt: "토스포스 조건별 자동 할인 공식 화면",
          ratio: "4 / 3",
        },
      },
    ],
  },
  retail: {
    heading: "상품 등록, 검색, 가격 입력이 잦은 도·소매 카운터",
    summary: "상품 수가 많거나 가격이 자주 바뀌는 매장에서 POS 본체와 검색·등록 기능을 함께 검토할 때 읽기 쉬운 구성입니다.",
    workflow: [
      "POSBANK APEXA X 화이트 본체에서 기본 판매 화면을 확인합니다.",
      "상품 검색과 대량 등록 기능으로 초기 입력 시간을 줄입니다.",
      "가격이 자주 바뀌는 상품도 결제 시점에 바로 입력합니다.",
    ],
    primary: {
      src: "/assets/sector/feature-market-price.webp",
      staticSrc: "/assets/sector/feature-market-price-static.webp",
      alt: "토스포스에서 판매 시점 가격을 입력하는 공식 화면",
      ratio: "16 / 10",
      label: "판매 시점 가격 입력 화면",
    },
    supporting: [
      {
        title: "대량 등록",
        description: "상품이 많을 때 한 번에 올리는 공식 기능 화면입니다.",
        media: {
          src: "/assets/operations/bulk-register.webp",
          alt: "토스포스 대량 상품 등록 공식 화면",
          ratio: "4 / 3",
        },
      },
      {
        title: "상품 등록과 가격 입력",
        description: "대량 상품 등록과 유동 가격 입력처럼 카운터 실무에 가까운 기능을 함께 확인합니다.",
        media: {
          src: "/assets/operations/bulk-register.webp",
          alt: "토스포스 대량 상품 등록 제품 화면 예시",
          ratio: "4 / 3",
        },
      },
    ],
  },
  beauty: {
    heading: "예약과 담당자 일정, 고객 메모를 함께 다루는 뷰티·서비스 매장",
    summary: "예약 조회와 고객 응대 기록이 결제 흐름과 같이 움직여야 하는 서비스 업종에 맞는 설계입니다.",
    workflow: [
      "휴대폰과 PC에서 예약을 조회하고 바로 등록합니다.",
      "담당자별 일정과 방문 전 알림 흐름을 함께 확인합니다.",
      "고객 메모와 다음 방문 준비를 결제 이후까지 이어서 관리합니다.",
    ],
    primary: {
      src: "/assets/sector/beauty-reservation-register.webp",
      staticSrc: "/assets/sector/beauty-reservation-register-static.webp",
      alt: "뷰티 매장에서 예약을 조회하고 등록하는 공식 장면",
      ratio: "16 / 10",
      label: "예약과 고객 응대가 시작되는 화면",
    },
    supporting: [
      {
        title: "담당자 스케줄",
        description: "담당자별 예약과 빈 시간을 한 화면에서 보는 장면입니다.",
        media: {
          src: "/assets/sector/beauty-schedule-ui.png",
          alt: "뷰티 매장 담당자 스케줄 공식 화면",
          ratio: "3 / 2",
        },
      },
      {
        title: "고객 메모",
        description: "고객별 이력과 요청 사항을 남기는 공식 장면입니다.",
        media: {
          src: "/assets/sector/beauty-customer-note.png",
          alt: "뷰티 고객 메모 공식 화면",
          ratio: "3 / 2",
        },
      },
    ],
  },
};

function splitPipeList(value?: string) {
  return (value || "").split("|").map((item) => item.trim()).filter(Boolean);
}

function getTossPageBlocks(page: CMSPage) {
  return new Map(page.blocks.map((block) => [block.id, block]));
}

function colorStyle(value?: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;
}

function backgroundStyle(block: CMSBlock): React.CSSProperties | undefined {
  const backgroundColor = colorStyle(block.bgColor);
  return backgroundColor ? { backgroundColor } : undefined;
}

function Icon({ name, className = "" }: { name?: string; className?: string }) {
  const Component = iconMap[(name || "").toLowerCase()] || Check;
  return <Component className={className} aria-hidden="true" />;
}

function LinkButton({
  text,
  target,
  secondary = false,
  onNavigate,
}: {
  text?: string;
  target?: string;
  secondary?: boolean;
  onNavigate: (target: string) => void;
}) {
  if (!text || !target) return null;
  return (
    <button type="button" className={`public-button ${secondary ? "public-button--secondary" : "public-button--primary"}`} onClick={() => onNavigate(target)}>
      {text} <ArrowRight aria-hidden="true" />
    </button>
  );
}

function TossMediaFigure({
  media,
  className = "",
  eager = false,
}: {
  media: TossMediaSpec;
  className?: string;
  eager?: boolean;
}) {
  const ratioStyle = media.ratio ? { "--toss-media-ratio": media.ratio } as React.CSSProperties : undefined;
  const classes = ["public-toss-media", media.staticSrc ? "has-static-fallback" : "", className].filter(Boolean).join(" ");
  const mediaDimensions = getPublicImageDimensions(media.src);
  const staticDimensions = getPublicImageDimensions(media.staticSrc);

  return (
    <figure className={classes} style={ratioStyle}>
      {media.kind === "apexa" ? (
        <ApexaXVisual
          className="public-toss-media__apexa"
          src={media.src}
          alt={media.alt}
          variant={media.apexaVariant || "product"}
          eager={eager}
        />
      ) : (
        <>
          <img
            className="public-toss-media__animated"
            src={media.src}
            alt={media.alt}
            width={mediaDimensions?.width}
            height={mediaDimensions?.height}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={eager ? "high" : undefined}
          />
          {media.staticSrc && (
            <img
              className="public-toss-media__static"
              src={media.staticSrc}
              alt=""
              width={staticDimensions?.width}
              height={staticDimensions?.height}
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
          )}
        </>
      )}
      {media.label && <figcaption>{media.label}</figcaption>}
    </figure>
  );
}

function TossHeroSection({
  block,
  onNavigate,
}: {
  block: CMSBlock;
  onNavigate: (target: string) => void;
}) {
  const subtitle = getPublicBlockSubtitle(block);
  const items = block.items || [];

  return (
    <section className="public-toss-hero-section" style={backgroundStyle(block)}>
      <div className="public-container public-toss-hero">
        <div className="public-toss-hero__copy">
          {block.badge && <p className="public-kicker">{block.badge}</p>}
          <h1 style={{ color: colorStyle(block.titleColor) }}>
            {(block.title || "").split("\n").map((line, index) => <React.Fragment key={`${line}-${index}`}>{index > 0 && <br />}{line}</React.Fragment>)}
          </h1>
          {subtitle && <p className="public-toss-hero__lead" style={{ color: colorStyle(block.subtitleColor) }}>{subtitle}</p>}
          {block.note && <p className="public-toss-hero__note">{block.note}</p>}
          <div className="public-toss-hero__actions">
            <LinkButton text={block.buttonText} target={block.buttonLink} onNavigate={onNavigate} />
            <LinkButton text={block.button2Text} target={block.button2Link} secondary onNavigate={onNavigate} />
          </div>
        </div>

        <div className="public-toss-hero__stage">
          <TossMediaFigure
            media={{
              kind: "apexa",
              apexaVariant: "counter-set",
              src: PUBLIC_MEDIA.homeHero.tossPos,
              alt: "POSBANK APEXA X-1500 화이트 본체, 화이트 금전함, AHAPOS CPP-3000 프린터, Toss Front 구성 예시",
              ratio: "3 / 2",
            }}
            className="public-toss-hero__media"
            eager
          />
          <p className="public-toss-hero__equipment">
            구성 예시 <span>APEXA X-1500</span><span>AHAPOS CPP-3000</span><span>Toss Front</span><span>화이트 금전함</span>
          </p>
          <aside className="public-toss-hero__definition" aria-label="토스포스 핵심 범위">
            <span>제품 정의</span>
            <strong>주문, 결제, 배달, 재고, 매출을 한 화면 흐름으로 정리하는 POS</strong>
            <ul>
              {items.map((item, index) => (
                <li key={`${item.title}-${index}`}>
                  <Icon name={item.icon} />
                  <div>
                    <b>{item.title}</b>
                    {item.desc && <small>{item.desc}</small>}
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}

function TossFitSection({
  block,
  heroBlock,
  onNavigate,
}: {
  block: CMSBlock;
  heroBlock?: CMSBlock;
  onNavigate: (target: string) => void;
}) {
  const subtitle = getPublicBlockSubtitle(block);
  const signals = heroBlock?.items || [];

  return (
    <section className="public-toss-fit-section" style={backgroundStyle(block)}>
      <div className="public-container">
        <SectionHeading block={block} />
        <div className="public-toss-fit">
          <div className="public-toss-fit__copy">
            {subtitle && <p className="public-toss-fit__lead">{subtitle}</p>}
            {block.content && <p className="public-toss-fit__body">{block.content}</p>}
            <div className="public-toss-fit__signals">
              <span>매장 적합성</span>
              <ul>
                {signals.map((item, index) => (
                  <li key={`${item.title}-${index}`}>
                    <Icon name={item.icon} />
                    <div>
                      <strong>{item.title}</strong>
                      {item.desc && <small>{item.desc}</small>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="public-toss-fit__platforms">
              <span>설치 환경</span>
              <div>
                {(block.items || []).map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    <Icon name={item.icon} />
                    <strong>{item.title}</strong>
                    {item.desc && <small>{item.desc}</small>}
                  </article>
                ))}
              </div>
              {block.imageCaption && <p>{block.imageCaption}</p>}
            </div>
            <LinkButton text={block.buttonText || "토스포스 구성 확인하기"} target={block.buttonLink || "request_consult"} onNavigate={onNavigate} />
          </div>

          <div className="public-toss-fit__media">
            <TossMediaFigure
              media={{
                src: "/assets/product/toss-pos-screen.webp",
                alt: "토스포스 주문 화면 공식 캡처",
                ratio: "16 / 10",
                label: "토스포스 공식 주문 화면 예시",
              }}
              className="public-toss-fit__primary-media"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TossCounterFlowSection({
  orderBlock,
  frontBlock,
  deliveryBlock,
  customerBlock,
  operationsBlock,
  onNavigate,
}: {
  orderBlock?: CMSBlock;
  frontBlock?: CMSBlock;
  deliveryBlock?: CMSBlock;
  customerBlock?: CMSBlock;
  operationsBlock?: CMSBlock;
  onNavigate: (target: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = React.useState<TossFlowStepId>("order");
  const operationItems = operationsBlock?.items || [];
  const orderStatus = operationItems.find((item) => item.title.includes("주문")) || operationItems[3];
  const receiptSetting = operationItems.find((item) => item.title.includes("영수증")) || operationItems[5];
  const inventory = operationItems.find((item) => item.title.includes("재고")) || operationItems[0];
  const sales = operationItems.find((item) => item.title.includes("매출")) || operationItems[2];
  const customerItems = customerBlock?.items || [];

  const steps: Record<TossFlowStepId, {
    railLabel: string;
    title: string;
    description?: string;
    bullets: string[];
    primary: TossMediaSpec;
    secondary?: TossMediaSpec;
  }> = {
    order: {
      railLabel: "ORDER",
      title: "주문이 들어오는 경로를 한 화면 흐름으로 모읍니다",
      description: orderBlock ? getPublicBlockSubtitle(orderBlock) : "휴대폰 주문, 테이블 주문, 배달 주문을 매장 흐름 안에서 확인합니다.",
      bullets: [
        ...((orderBlock?.items || []).map((item) => item.title).filter(Boolean)),
        deliveryBlock?.items?.[0]?.title || "주요 배달앱 연결",
      ].slice(0, 4),
      primary: {
        src: "/assets/product/toss-mobile-order.webp",
        alt: "휴대폰 주문이 토스포스와 연결되는 공식 화면",
        ratio: "16 / 10",
        label: "휴대폰 주문과 포스 연결",
      },
      secondary: {
        src: resolveApprovedTossMedia(deliveryBlock?.imageUrl, "/assets/product/toss-delivery.webp"),
        alt: "배달 주문이 토스포스와 연결되는 공식 화면",
        ratio: "16 / 10",
        label: "배달 주문 연결 화면",
      },
    },
    payment: {
      railLabel: "PAYMENT",
      title: frontBlock?.title || "손님 결제와 고객 화면을 카운터에 함께 둡니다",
      description: frontBlock ? getPublicBlockSubtitle(frontBlock) : "토스프론트를 손님 결제 화면과 고객 안내 화면으로 함께 검토합니다.",
      bullets: [
        "결제 단말기",
        "고객 화면",
        "미니 키오스크",
      ],
      primary: {
        src: PUBLIC_MEDIA.homeHero.tossFront,
        alt: "토스프론트 화이트 제품 이미지",
        ratio: "1 / 1",
        label: "Toss Front",
      },
      secondary: {
        kind: "apexa",
        src: PUBLIC_MEDIA.homeHero.tossPos,
        alt: "POSBANK APEXA X-1500 화이트 본체에 토스포스 화면을 적용한 제품 이미지",
        ratio: "4 / 3",
        label: "카운터 본체와 함께 비교",
      },
    },
    output: {
      railLabel: "OUTPUT",
      title: "주문 전달과 영수증 구성을 매장 방식에 맞춥니다",
      description: orderStatus?.desc || "주문 진행 상태와 출력 구성을 한곳에서 확인합니다.",
      bullets: [
        orderStatus?.title || "주문 진행 상태 확인",
        receiptSetting?.title || "영수증 구성 설정",
        "출력 위치와 전달 순서는 업종별로 다시 설계합니다.",
      ],
      primary: {
        src: "/assets/product/toss-pos-receipt.webp",
        alt: "토스포스와 영수증 출력 공식 장면",
        ratio: "4 / 3",
        label: "출력 흐름이 포함된 공식 장면",
      },
      secondary: {
        src: receiptSetting?.imageUrl || "/assets/operations/receipt-settings.webp",
        alt: "영수증 구성을 조정하는 토스포스 공식 화면",
        ratio: "4 / 3",
        label: "영수증 설정 화면",
      },
    },
    management: {
      railLabel: "MANAGEMENT",
      title: customerBlock?.title || "결제 뒤에도 재고와 매출, 고객 흐름을 이어서 봅니다",
      description: customerBlock ? getPublicBlockSubtitle(customerBlock) : "재고, 매출, 고객 흐름을 운영 화면에서 이어서 관리합니다.",
      bullets: [
        customerItems[0]?.title || "고객 흐름 확인",
        inventory?.title || "상품별 재고관리",
        sales?.title || "매출 비교·달력",
      ],
      primary: {
        src: resolveApprovedTossMedia(customerBlock?.imageUrl, "/assets/operations/sales-calendar.webp"),
        alt: "토스포스에서 기간별 매출 흐름을 확인하는 제품 화면 예시",
        ratio: "16 / 10",
        label: "결제 이후 매장 운영 흐름",
      },
      secondary: {
        src: "/assets/product/toss-sales.webp",
        alt: "토스포스 매출 현황 공식 화면",
        ratio: "16 / 10",
        label: "매출 현황 확인",
      },
    },
  };

  const current = steps[activeStep];

  return (
    <section className="public-toss-flow-section">
      <div className="public-container">
        <header className="public-toss-flow__head">
          <p className="public-kicker">매장 운영 흐름</p>
          <h2>주문, 손님 결제, 출력, 관리가 한 흐름으로 이어집니다</h2>
          <p>아래 순서로 카운터 흐름을 먼저 읽고, 이어서 업종별 설계와 운영 도구를 확인할 수 있게 구성했습니다.</p>
        </header>

        <div className="public-toss-flow">
          <nav aria-label="토스포스 카운터 흐름">
            {(Object.entries(steps) as Array<[TossFlowStepId, typeof current]>).map(([stepId, step], index) => (
              <button
                type="button"
                key={stepId}
                className={activeStep === stepId ? "is-active" : ""}
                aria-pressed={activeStep === stepId}
                onClick={() => setActiveStep(stepId)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.railLabel}</strong>
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            <motion.article
              className="public-toss-flow__panel"
              key={activeStep}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="public-toss-flow__copy">
                <span>{current.railLabel}</span>
                <h3>{current.title}</h3>
                {current.description && <p>{current.description}</p>}
                <ul>
                  {current.bullets.map((bullet) => <li key={bullet}><Check aria-hidden="true" />{bullet}</li>)}
                </ul>
                <LinkButton text="이 흐름으로 상담하기" target="request_consult" onNavigate={onNavigate} />
              </div>

              <div className={`public-toss-flow__media ${current.secondary ? "has-secondary" : ""}`}>
                <TossMediaFigure media={current.primary} className="is-primary" />
                {current.secondary && <TossMediaFigure media={current.secondary} className="is-secondary" />}
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function TossIndustryConfiguratorSection({
  block,
  onNavigate,
}: {
  block: CMSBlock;
  onNavigate: (target: string) => void;
}) {
  const items = block.items || [];
  const getRequestedSectorIndex = React.useCallback(() => {
    if (typeof window === "undefined") return -1;
    const requestedSector = new URLSearchParams(window.location.search).get("sector");
    return items.findIndex((item, itemIndex) => getSectorKind(item, itemIndex) === requestedSector);
  }, [items]);
  const [activeIndex, setActiveIndex] = React.useState(() => {
    if (typeof window === "undefined") return 0;
    const requestedIndex = getRequestedSectorIndex();
    return requestedIndex >= 0 ? requestedIndex : 0;
  });
  const shouldReduceMotion = useReducedMotion();
  const sectorListRef = React.useRef<HTMLDivElement | null>(null);
  const sectorButtonRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const detailsAnchorRef = React.useRef<HTMLDivElement | null>(null);
  const activeItem = items[activeIndex] || items[0];
  const activeKind = getSectorKind(activeItem, activeIndex);
  const blueprint = TOSS_SECTOR_BLUEPRINTS[activeKind];
  const included = splitPipeList(activeItem?.desc);

  React.useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  React.useEffect(() => {
    const syncSectorFromHistory = () => {
      const requestedIndex = getRequestedSectorIndex();
      setActiveIndex(requestedIndex >= 0 ? requestedIndex : 0);
    };
    window.addEventListener("popstate", syncSectorFromHistory);
    return () => window.removeEventListener("popstate", syncSectorFromHistory);
  }, [getRequestedSectorIndex]);

  React.useEffect(() => {
    const list = sectorListRef.current;
    const button = sectorButtonRefs.current[activeIndex];
    if (!list || !button || list.scrollWidth <= list.clientWidth) return;
    const left = button.offsetLeft - (list.clientWidth - button.offsetWidth) / 2;
    list.scrollTo({ left, behavior: shouldReduceMotion ? "auto" : "smooth" });
  }, [activeIndex, shouldReduceMotion]);

  const handleSectorSelect = (index: number) => {
    setActiveIndex(index);
    if (typeof window === "undefined") return;
    const nextUrl = new URL(window.location.href);
    nextUrl.pathname = getPublicRoutePath("toss_pos") || nextUrl.pathname;
    nextUrl.searchParams.delete("page");
    nextUrl.searchParams.set("sector", getSectorKind(items[index], index));
    if (new URLSearchParams(window.location.search).get("sector") !== nextUrl.searchParams.get("sector")) {
      window.history.pushState({ page: "toss_pos", sector: nextUrl.searchParams.get("sector") }, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    }
    window.requestAnimationFrame(() => {
      detailsAnchorRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" });
    });
  };

  return (
    <section className="public-toss-sector-section" style={backgroundStyle(block)}>
      <div className="public-container">
        <SectionHeading block={block} />
        <nav className="public-toss-sector-nav" aria-label="업종별 설계 선택">
          <span>업종</span>
          <div ref={sectorListRef}>
            {items.map((item, index) => (
              <button
                type="button"
                ref={(element) => { sectorButtonRefs.current[index] = element; }}
                key={`${item.title}-${index}`}
                className={activeIndex === index ? "is-active" : ""}
                aria-pressed={activeIndex === index}
                onClick={() => handleSectorSelect(index)}
              >
                <Icon name={item.icon} />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="public-toss-sector" ref={detailsAnchorRef}>
          <div className="public-toss-sector__copy">
            <span>{activeItem?.badge || "업종별 설계"}</span>
            <h3>{blueprint.heading}</h3>
            <p>{blueprint.summary}</p>
            <div className="public-toss-sector__stack">
              <article>
                <strong>검토 장비와 기능</strong>
                <ul>
                  {included.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}
                </ul>
              </article>
              <article>
                <strong>운영 흐름</strong>
                <ol>
                  {blueprint.workflow.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </article>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              className="public-toss-sector__stage"
              key={activeKind}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <TossMediaFigure media={blueprint.primary} className="public-toss-sector__primary" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="public-toss-sector__proof">
          {blueprint.supporting.map((scene) => (
            <article key={scene.title}>
              <div>
                <span>공식 기능 장면</span>
                <strong>{scene.title}</strong>
                <p>{scene.description}</p>
              </div>
              <TossMediaFigure media={scene.media} />
            </article>
          ))}
        </div>

        <div className="public-toss-sector__cta">
          {block.content && <p>{block.content}</p>}
          <LinkButton text={block.buttonText || "업종별 구성 상담"} target={block.buttonLink || "request_consult"} onNavigate={onNavigate} />
        </div>
      </div>
    </section>
  );
}

function TossOperationsConsoleSection({ block }: { block: CMSBlock }) {
  const items = block.items || [];
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeItem = items[activeIndex] || items[0];
  const shouldReduceMotion = useReducedMotion();
  const activeMedia = activeItem?.imageUrl && TOSS_APPROVED_MEDIA.has(activeItem.imageUrl)
    ? activeItem.imageUrl
    : undefined;

  React.useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  return (
    <section className="public-toss-ops-section" style={backgroundStyle(block)}>
      <div className="public-container">
        <SectionHeading block={block} />
        <div className="public-toss-ops">
          <nav aria-label="토스포스 운영 도구 선택">
            {items.map((item, index) => (
              <button
                type="button"
                key={`${item.title}-${index}`}
                className={activeIndex === index ? "is-active" : ""}
                aria-pressed={activeIndex === index}
                onClick={() => setActiveIndex(index)}
              >
                <Icon name={item.icon} />
                <div>
                  <strong>{item.title}</strong>
                  {item.desc && <small>{item.desc}</small>}
                </div>
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            <motion.article
              className="public-toss-ops__panel"
              key={`${activeItem?.title}-${activeIndex}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeMedia ? (
                <TossMediaFigure
                  media={{
                    src: activeMedia,
                    alt: `${activeItem?.title || "선택 기능"} 토스포스 공식 화면`,
                    ratio: "4 / 3",
                  }}
                  className="public-toss-ops__media"
                />
              ) : (
                <div className="public-toss-ops__media-check" role="status">
                  <ShieldCheck aria-hidden="true" />
                  <strong>이미지 근거 확인 필요</strong>
                  <p>승인된 공식 기능 화면이 연결되면 이 영역에 표시합니다.</p>
                </div>
              )}
              <div className="public-toss-ops__metric">
                <span>선택 기능</span>
                <strong>{activeItem?.title}</strong>
                {activeItem?.desc && <p>{activeItem.desc}</p>}
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function TossReadinessSection({
  block,
  platformsBlock,
  sectorBlock,
  frontBlock,
  footerInfo,
  onNavigate,
}: {
  block: CMSBlock;
  platformsBlock?: CMSBlock;
  sectorBlock?: CMSBlock;
  frontBlock?: CMSBlock;
  footerInfo: FooterInfo;
  onNavigate: (target: string) => void;
}) {
  const checklist = [
    {
      title: "현재 사용하는 기기와 운영체제 확인",
      description: platformsBlock?.imageCaption || "Windows, Android, iOS, Mac 중 현재 매장 환경을 먼저 확인합니다.",
    },
    {
      title: "업종별 주문 동선과 필요한 장비 정리",
      description: sectorBlock?.content || "업종과 매장 규모에 따라 권장 장비가 달라집니다.",
    },
    {
      title: "손님 결제 화면과 출력 위치 확인",
      description: frontBlock ? getPublicBlockSubtitle(frontBlock) : "결제 단말기와 고객 화면, 출력 흐름을 함께 검토합니다.",
    },
    {
      title: "설치 가능 지역과 방문 조건 문의",
      description: `${footerInfo.companyName}에서 매장 위치와 설치 환경을 확인한 뒤 가능한 지원 범위를 안내합니다.`,
    },
  ];

  return (
    <section className="public-toss-ready-section" style={backgroundStyle(block)}>
      <div className="public-container">
        <header className="public-toss-ready__head">
          <p className="public-kicker">설치 전 확인</p>
          <h2>상담 전에 이 순서만 정리하면 구성 안내가 빨라집니다</h2>
          <p>{block.subtitle || "제품 정보와 설치 지원을 확인하세요."}</p>
        </header>

        <div className="public-toss-ready">
          <div className="public-toss-ready__checklist">
            {checklist.map((item, index) => (
              <article key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>

          <aside className="public-toss-ready__actions">
            <strong>{block.title || "공식 정보와 설치 상담"}</strong>
            <div>
              {(block.items || []).map((item, index) => (
                <button type="button" key={`${item.title}-${index}`} onClick={() => item.buttonLink && onNavigate(item.buttonLink)}>
                  <span><Icon name={item.icon} /></span>
                  <div>
                    <b>{item.title}</b>
                    {item.desc && <small>{item.desc}</small>}
                  </div>
                  <ChevronRight aria-hidden="true" />
                </button>
              ))}
            </div>
            <a href={`tel:${footerInfo.phone.replace(/[^\d+]/g, "")}`}>
              <PhoneCall aria-hidden="true" />
              <span>{footerInfo.phone}</span>
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}

function TossFinalCtaSection({
  block,
  onNavigate,
}: {
  block: CMSBlock;
  onNavigate: (target: string) => void;
}) {
  const subtitle = getPublicBlockSubtitle(block);

  return (
    <section className="public-toss-final-cta" style={backgroundStyle(block)}>
      <div className="public-container">
        {block.badge && <p className="public-kicker">{block.badge}</p>}
        <h2 style={{ color: colorStyle(block.titleColor) }}>{block.title}</h2>
        {subtitle && <p style={{ color: colorStyle(block.subtitleColor) }}>{subtitle}</p>}
        <div className="public-toss-final-cta__actions">
          <LinkButton text={block.buttonText || "상담 신청"} target={block.buttonLink || "request_consult"} onNavigate={onNavigate} />
          {block.button2Text && block.button2Link && <LinkButton text={block.button2Text} target={block.button2Link} secondary onNavigate={onNavigate} />}
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ block, dark = false }: { block: CMSBlock; dark?: boolean }) {
  const subtitle = getPublicBlockSubtitle(block);
  return (
    <header className={`public-section-heading ${dark ? "is-dark" : ""}`} style={{ textAlign: block.titleAlign || block.align || "left" }}>
      {block.badge && <p className="public-kicker">{block.badge}</p>}
      {block.title && <h2 style={{ color: colorStyle(block.titleColor) }}>{block.title}</h2>}
      {subtitle && <p style={{ color: colorStyle(block.subtitleColor) }}>{subtitle}</p>}
    </header>
  );
}

function HeroSection({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  const items = block.items ?? HOME_HERO_ITEMS;
  const subtitle = getPublicBlockSubtitle(block);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeItem = items[activeIndex] || items[0];
  const usesGeneratedVisual = block.id === "home-hero" && Boolean(activeItem) && (
    shouldUseGeneratedServiceGraphic(activeItem)
    || (!activeItem?.imageUrl && (activeItem?.icon === "file" || activeItem?.icon === "wrench"))
  );
  const activeImageUrl = usesGeneratedVisual ? undefined : resolveStandardItemImage(block, activeItem, activeIndex);
  const mediaClass = mediaPresentationClass(activeImageUrl);
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  React.useEffect(() => {
    if (items.length < 2 || shouldReduceMotion) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % items.length), 4200);
    return () => window.clearInterval(timer);
  }, [items.length, shouldReduceMotion]);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--hero-rotate-x", `${y * -4}deg`);
    event.currentTarget.style.setProperty("--hero-rotate-y", `${x * 6}deg`);
    event.currentTarget.style.setProperty("--hero-shift-x", `${x * 16}px`);
    event.currentTarget.style.setProperty("--hero-shift-y", `${y * 12}px`);
  };

  const resetPointer = (event: React.PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--hero-rotate-x", "0deg");
    event.currentTarget.style.setProperty("--hero-rotate-y", "0deg");
    event.currentTarget.style.setProperty("--hero-shift-x", "0px");
    event.currentTarget.style.setProperty("--hero-shift-y", "0px");
  };

  return (
    <section className="public-clean-hero" style={backgroundStyle(block)} onPointerMove={handlePointerMove} onPointerLeave={resetPointer}>
      <div className="public-container public-clean-hero__layout">
        <motion.div className="public-clean-hero__copy" initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}>
          {block.badge && <p className="public-clean-hero__badge">{block.badge}</p>}
          <h1 style={{ color: colorStyle(block.titleColor) }}>
            {(block.title || "").split("\n").map((line, index) => <React.Fragment key={`${line}-${index}`}>{index > 0 && <br />}{index === 1 ? <span>{line}</span> : line}</React.Fragment>)}
          </h1>
          {subtitle && <p className="public-clean-hero__lead" style={{ color: colorStyle(block.subtitleColor) }}>{subtitle}</p>}
          <div className="public-clean-hero__actions">
            <LinkButton text={block.buttonText} target={block.buttonLink} onNavigate={onNavigate} />
            <LinkButton text={block.button2Text} target={block.button2Link} secondary onNavigate={onNavigate} />
          </div>
        </motion.div>

        <motion.figure className={`public-clean-hero__visual ${mediaClass} ${usesGeneratedVisual ? "has-generated-service" : ""}`} initial={shouldReduceMotion ? false : { opacity: 0, y: 32, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.72, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>
          <AnimatePresence mode="wait">
            {usesGeneratedVisual && activeItem ? (
              <motion.div className="public-clean-hero__generated" key={`${activeItem.title}-${activeIndex}`} initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 1.01 }} transition={{ duration: 0.36 }}>
                <ServiceIllustration item={activeItem} />
              </motion.div>
            ) : activeImageUrl === PUBLIC_MEDIA.homeHero.tossPos ? (
              <motion.div
                className="public-clean-hero__apexa"
                key={`${activeImageUrl}-${activeIndex}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 1.01 }}
                transition={{ duration: 0.36 }}
              >
                <ApexaXVisual src={activeImageUrl} alt={`${activeItem?.title || "토스포스"} 추천 구성`} variant="product" />
              </motion.div>
            ) : activeImageUrl ? (
              <motion.img
                key={`${activeImageUrl}-${activeIndex}`}
                src={activeImageUrl}
                alt={`${activeItem?.title || "토스포스"} 추천 구성`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 1.01 }}
                transition={{ duration: 0.36 }}
              />
            ) : null}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {activeItem && <motion.figcaption key={`${activeItem.title}-${activeIndex}`} initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
              <span><Icon name={activeItem.icon} /></span>
              <div><strong>{activeItem.title}</strong></div>
            </motion.figcaption>}
          </AnimatePresence>
          <nav aria-label="매장 오픈 지원 범위">{items.map((item, index) => <button type="button" key={`${item.title}-${index}`} className={activeIndex === index ? "is-active" : ""} aria-label={item.title} aria-pressed={activeIndex === index} onClick={() => setActiveIndex(index)} />)}</nav>
        </motion.figure>
      </div>
    </section>
  );
}

function OfferSection({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  const items = block.items || [];
  const subtitle = getPublicBlockSubtitle(block);
  const visualItems = items.filter((item) => item.imageUrl || shouldUseGeneratedServiceGraphic(item)).slice(0, 4);
  const priceValue = block.priceValue?.trim();
  const hasVerifiedPrice = Boolean(priceValue && priceValue !== "0");
  const productStageDimensions = getPublicImageDimensions(block.imageUrl);

  return (
    <section className="public-offer-section" style={backgroundStyle(block)}>
      <div className="public-container public-offer">
        <div className="public-offer__copy">
          {block.badge && <p className="public-kicker">{block.badge}</p>}
          <h2>{block.title}</h2>
          {subtitle && <p>{subtitle}</p>}
          {hasVerifiedPrice && (
            <div className="public-offer__price">
              <span>{block.priceLabel || "인터넷 결합 패키지"}</span>
              <strong>{priceValue}<small>{block.priceUnit || "원"}</small></strong>
              {block.priceDetails && <p>{block.priceDetails}</p>}
            </div>
          )}
          <div className="public-offer__included">
            <p>{block.listLabel || "패키지 포함 항목"}</p>
            <ul>{items.slice(0, 6).map((item, index) => <li key={`${item.title}-${index}`}><Check aria-hidden="true" /><strong>{item.title}</strong></li>)}</ul>
          </div>
          <LinkButton text={block.buttonText || "구성 상담받기"} target={block.buttonLink || "request_consult"} onNavigate={onNavigate} />
        </div>
        <div className="public-offer__visual">
          <div className="public-offer__device-grid">
            {visualItems.map((item, index) => (
              <article key={`${item.title}-${index}`}>
                <figure className={shouldUseGeneratedServiceGraphic(item) ? "is-generated-service-visual" : mediaPresentationClass(item.imageUrl)}>
                  {shouldUseGeneratedServiceGraphic(item)
                    ? <ServiceIllustration item={item} compact />
                    : item.imageUrl && <img src={item.imageUrl} alt={`${item.title} 실제 제품 및 서비스 화면`} />}
                </figure>
                <div><Icon name={item.icon} /><strong>{item.title}</strong></div>
              </article>
            ))}
          </div>
          <figure className="public-offer__product-stage">{block.imageUrl && <img src={block.imageUrl} alt="토스포스와 결제단말기 제품 구성" width={productStageDimensions?.width} height={productStageDimensions?.height} loading="lazy" decoding="async" />}</figure>
        </div>
      </div>
    </section>
  );
}

function TelecomShowcaseSection({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  const items = block.items || [];

  return (
    <section className="public-telecom-showcase-section" style={backgroundStyle(block)}>
      <div className="public-container">
        <div className="public-telecom-showcase__brand"><img src="/assets/uplus/uplus-logo.png" alt="LG U+" /><span>소상공인 매장 통신</span></div>
        <SectionHeading block={block} />
        <div className="public-telecom-showcase">
          {items.map((item, index) => (
            <article className={index === 0 ? "is-wide" : ""} key={`${item.title}-${index}`}>
              <div className="public-telecom-showcase__copy">
                <span><Icon name={item.icon} />{item.badge}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
              <figure className={shouldUseGeneratedServiceGraphic(item) ? "is-generated-service-visual" : mediaPresentationClass(item.imageUrl)}>
                {shouldUseGeneratedServiceGraphic(item)
                  ? <ServiceIllustration item={item} />
                  : <UplusProductMedia imageUrl={item.imageUrl} alt={`${item.title} 제품과 기능 안내 이미지`} />}
                {!shouldUseGeneratedServiceGraphic(item) && item.staticImageUrl && <img className="public-telecom-showcase__secondary-media" src={item.staticImageUrl} alt={`${item.title} 설치 및 이용 구성`} loading="lazy" decoding="async" />}
              </figure>
            </article>
          ))}
        </div>
        <div className="public-telecom-showcase__action"><LinkButton text={block.buttonText || "매장 통신 상담"} target={block.buttonLink || "request_consult"} onNavigate={onNavigate} /></div>
      </div>
    </section>
  );
}

function SectorFeatureMedia({
  feature,
  icon: FeatureIcon,
}: {
  feature: CMSSectorFeature;
  icon: LucideIcon;
}) {
  const hasMotionFallback = Boolean(feature.imageUrl && feature.staticImageUrl);
  const imageUrl = feature.imageUrl;
  const imageDimensions = getPublicImageDimensions(imageUrl);

  return (
    <figure
      className={imageUrl ? "has-image" : "has-generated-visual"}
      data-motion-media={hasMotionFallback ? "true" : undefined}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={`${feature.title} 화면 예시`} width={imageDimensions?.width} height={imageDimensions?.height} loading="lazy" decoding="async" />
      ) : (
        <div className="public-sector-feature-card__mock" aria-hidden="true">
          <FeatureIcon />
        </div>
      )}
    </figure>
  );
}

function SectorFeatureShowcase({ item, index }: { item: NonNullable<CMSBlock["items"]>[number] | undefined; index: number }) {
  const kind = getSectorKind(item, index);
  const groups = getSectorDetailGroups(item, index);
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={`public-sector-details public-sector-details--${kind}`}
        key={kind}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {groups.map((group, groupIndex) => {
          const isPrimaryGroup = groupIndex === 0;
          const featureContent = (
            <div className={`public-sector-feature-grid ${isPrimaryGroup ? "is-primary-sequence" : "is-secondary-list"}`}>
              {group.features.map((feature, featureIndex) => {
                const FeatureIcon = iconMap[feature.icon || "check"] || Check;
                const isCoreScene = isPrimaryGroup && featureIndex < 3;
                return (
                  <article
                    className={`public-sector-feature-card ${isCoreScene ? "is-core-scene" : "is-detail-scene"} ${feature.size === "wide" ? "is-wide" : ""}`}
                    key={feature.id}
                    data-feature-id={feature.id}
                    data-feature-index={featureIndex + 1}
                  >
                    <div className="public-sector-feature-card__copy">
                      {feature.eyebrow && (
                        <span>
                          {isPrimaryGroup && <b>{String(featureIndex + 1).padStart(2, "0")}</b>}
                          {feature.eyebrow}
                        </span>
                      )}
                      <h4>{feature.title}</h4>
                      {feature.description && <p>{feature.description}</p>}
                    </div>
                    <SectorFeatureMedia
                      feature={feature}
                      icon={FeatureIcon}
                    />
                  </article>
                );
              })}
            </div>
          );

          if (isPrimaryGroup) {
            return (
              <section className="public-sector-detail-group is-primary-group" key={group.id}>
                <header>
                  <span>{item?.title || "업종별 토스포스"}</span>
                  <h3>{group.title}</h3>
                  {group.subtitle && <p>{group.subtitle}</p>}
                </header>
                {featureContent}
              </section>
            );
          }

          return (
            <section className="public-sector-detail-group is-secondary-group" key={group.id}>
              <details>
                <summary>
                  <span>더 살펴보기</span>
                  <div>
                    <strong>{group.title}</strong>
                    <small>{group.features.length}개 기능 · {group.subtitle || "결제 이후의 고객 관리를 이어갑니다."}</small>
                  </div>
                  <ChevronRight aria-hidden="true" />
                </summary>
                {featureContent}
              </details>
            </section>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

function StoreConfiguratorSection({ block, onNavigate, footerInfo }: { block: CMSBlock; onNavigate: (target: string) => void; footerInfo: FooterInfo }) {
  const items = block.items || [];
  const getRequestedSectorIndex = React.useCallback(() => {
    if (typeof window === "undefined") return -1;
    const requestedSector = new URLSearchParams(window.location.search).get("sector");
    return items.findIndex((item, itemIndex) => getSectorKind(item, itemIndex) === requestedSector);
  }, [items]);
  const [activeIndex, setActiveIndex] = React.useState(() => {
    if (typeof window === "undefined") return 0;
    const requestedSector = new URLSearchParams(window.location.search).get("sector");
    const requestedIndex = items.findIndex((item, itemIndex) => getSectorKind(item, itemIndex) === requestedSector);
    return requestedIndex >= 0 ? requestedIndex : 0;
  });
  const sectorListRef = React.useRef<HTMLDivElement | null>(null);
  const sectorButtonRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const detailsAnchorRef = React.useRef<HTMLDivElement | null>(null);
  const activeItem = items[activeIndex] || items[0];
  const included = (activeItem?.desc || "").split("|").map((item) => item.trim()).filter(Boolean);
  const shouldReduceMotion = useReducedMotion();
  const activeVisualUrl = activeItem?.imageUrl || block.imageUrl;
  const activeVisualDimensions = getPublicImageDimensions(activeVisualUrl);

  React.useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  React.useEffect(() => {
    const syncSectorFromHistory = () => {
      const requestedIndex = getRequestedSectorIndex();
      setActiveIndex(requestedIndex >= 0 ? requestedIndex : 0);
    };
    window.addEventListener("popstate", syncSectorFromHistory);
    return () => window.removeEventListener("popstate", syncSectorFromHistory);
  }, [getRequestedSectorIndex]);

  React.useEffect(() => {
    const list = sectorListRef.current;
    const button = sectorButtonRefs.current[activeIndex];
    if (!list || !button || list.scrollWidth <= list.clientWidth) return;
    const left = button.offsetLeft - (list.clientWidth - button.offsetWidth) / 2;
    list.scrollTo({ left, behavior: shouldReduceMotion ? "auto" : "smooth" });
  }, [activeIndex, shouldReduceMotion]);

  const handleSectorSelect = (index: number, moveToDetails = false) => {
    setActiveIndex(index);
    if (typeof window !== "undefined") {
      const nextUrl = new URL(window.location.href);
      nextUrl.pathname = getPublicRoutePath("toss_pos") || nextUrl.pathname;
      nextUrl.searchParams.delete("page");
      const nextSector = getSectorKind(items[index], index);
      nextUrl.searchParams.set("sector", nextSector);
      if (new URLSearchParams(window.location.search).get("sector") !== nextSector) {
        window.history.pushState({ page: "toss_pos", sector: nextSector }, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
      }
    }
    if (!moveToDetails) return;
    window.requestAnimationFrame(() => {
      detailsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <section className="public-store-configurator-section" style={backgroundStyle(block)}>
      <div className="public-container">
        <SectionHeading block={block} />
        <nav className="public-sector-switcher" aria-label="상세 기능 업종 선택">
          <span>업종</span>
          <div ref={sectorListRef}>
            {items.map((item, index) => (
              <button
                type="button"
                ref={(element) => { sectorButtonRefs.current[index] = element; }}
                key={`detail-${item.title}-${index}`}
                className={activeIndex === index ? "is-active" : ""}
                aria-pressed={activeIndex === index}
                onClick={() => handleSectorSelect(index, true)}
              >
                <Icon name={item.icon} />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="public-store-configurator public-store-configurator--focused">
          <div className="public-store-configurator__stage">
            <AnimatePresence mode="wait">
              {activeVisualUrl && (
                <motion.div
                  className="public-store-configurator__visual"
                  key={`${activeVisualUrl}-${activeIndex}`}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="public-store-configurator__media">
                    <img
                      src={activeVisualUrl}
                      alt={`${activeItem?.title || "매장"} 토스포스 추천 구성`}
                      width={activeVisualDimensions?.width}
                      height={activeVisualDimensions?.height}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="public-store-configurator__summary">
            <div className="public-store-configurator__summary-title">
              <span>선택한 업종</span>
              <strong>{activeItem?.title || "업종을 선택하세요"}</strong>
            </div>
            <ul>{included.map((item) => <li key={item}><Check />{item}</li>)}</ul>
            <LinkButton text={block.buttonText || "이 구성으로 상담"} target={block.buttonLink || "request_consult"} onNavigate={onNavigate} />
          </aside>
        </div>
        <div className="public-sector-details-anchor" ref={detailsAnchorRef}>
          <SectorFeatureShowcase item={activeItem} index={activeIndex} />
        </div>
        <aside className="public-sector-support-strip">
          <div>
            <span>{footerInfo.companyName} 설치 상담</span>
            <strong>설치 가능 지역과 방문 조건을 확인하세요</strong>
            <p>매장 위치와 설치 환경을 확인한 뒤 가능한 일정과 지원 범위를 안내합니다.</p>
          </div>
          <a href={`tel:${footerInfo.phone.replace(/[^\d+]/g, "")}`}><PhoneCall aria-hidden="true" />{footerInfo.phone}</a>
          <LinkButton text={block.buttonText || "업종별 구성 상담"} target={block.buttonLink || "request_consult"} onNavigate={onNavigate} />
        </aside>
      </div>
    </section>
  );
}

function EditorialBanner({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  const imageOnLeft = block.bannerImagePosition === "left";
  const subtitle = getPublicBlockSubtitle(block);
  return (
    <section className={`public-editorial ${imageOnLeft ? "is-image-left" : ""}`} style={backgroundStyle(block)}>
      <div className="public-container public-editorial__inner">
        <div className="public-editorial__copy">
          {block.badge && <p className="public-kicker">{block.badge}</p>}
          <h2 style={{ color: colorStyle(block.titleColor) }}>{block.title}</h2>
          {subtitle && <p style={{ color: colorStyle(block.subtitleColor) }}>{subtitle}</p>}
          {(block.items || []).length > 0 && <ul>{block.items?.map((item, index) => <li key={`${item.title}-${index}`}><Check /><span>{item.title}</span></li>)}</ul>}
          <div className="public-editorial__actions"><LinkButton text={block.buttonText} target={block.buttonLink} onNavigate={onNavigate} /><LinkButton text={block.button2Text} target={block.button2Link} secondary onNavigate={onNavigate} /></div>
        </div>
        <figure className="public-editorial__media">{block.imageUrl ? <img src={block.imageUrl} alt={`${block.title || "서비스"} 제품 안내`} /> : <div className="public-editorial__placeholder"><Monitor /></div>}</figure>
      </div>
    </section>
  );
}

function CalloutBanner({ block, onNavigate, isPageIntro }: { block: CMSBlock; onNavigate: (target: string) => void; isPageIntro: boolean }) {
  const subtitle = getPublicBlockSubtitle(block);
  const showsProductSystem = isPageIntro && block.id === "products-intro";
  const copy = (
    <>
      {block.badge && <p className="public-kicker">{block.badge}</p>}
      {isPageIntro ? <h1 style={{ color: colorStyle(block.titleColor) }}>{block.title}</h1> : <h2 style={{ color: colorStyle(block.titleColor) }}>{block.title}</h2>}
      {subtitle && <p style={{ color: colorStyle(block.subtitleColor) }}>{subtitle}</p>}
      <div className="public-callout__actions"><LinkButton text={block.buttonText} target={block.buttonLink} onNavigate={onNavigate} /><LinkButton text={block.button2Text} target={block.button2Link} secondary onNavigate={onNavigate} /></div>
    </>
  );
  return (
    <section className={`${isPageIntro ? "public-page-intro" : "public-callout"}${showsProductSystem ? " has-product-system" : ""}`} style={backgroundStyle(block)}>
      <div className="public-container">
        {showsProductSystem ? (
          <>
            <div className="public-page-intro__copy">{copy}</div>
            <figure className="public-page-intro__product-system">
              <ApexaXVisual src={PUBLIC_MEDIA.homeHero.tossPos} alt="POSBANK APEXA X와 토스포스 카운터 구성 예시" variant="counter-set" eager />
              <figcaption>APEXA X · 토스포스 · 프린터 · 금전함 · 토스프론트 구성 예시</figcaption>
            </figure>
          </>
        ) : copy}
      </div>
    </section>
  );
}

function ProcessSection({ block }: { block: CMSBlock }) {
  return (
    <section className="public-opening-process-section" style={backgroundStyle(block)}>
      <div className="public-container public-opening-process-layout">
        <div className="public-opening-process-intro">
          <SectionHeading block={block} />
        </div>
        <ol className="public-opening-process">
          {(block.items || []).map((item, index) => (
            <li key={`${item.title}-${index}`}>
              <span className="public-opening-process__number">{String(index + 1).padStart(2, "0")}</span>
              <span className="public-opening-process__icon"><Icon name={item.icon} /></span>
              <span className="public-opening-process__copy"><h3>{item.title}</h3></span>
              <ArrowRight aria-hidden="true" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ActionSection({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  return (
    <section className="public-action-section" style={backgroundStyle(block)}>
      <div className="public-container">
        <SectionHeading block={block} />
        <div className="public-action-list">
          {(block.items || []).map((item, index) => (
            <button type="button" key={`${item.title}-${index}`} onClick={() => item.buttonLink && onNavigate(item.buttonLink)}>
              <span className="public-action-list__icon"><Icon name={item.icon} /></span>
              <span className="public-action-list__copy"><strong>{item.title}</strong></span>
              <span className="public-action-list__label">{item.buttonText || "바로가기"}<ChevronRight /></span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection({ block }: { block: CMSBlock }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <section className="public-faq-section" style={backgroundStyle(block)}>
      <div className="public-container public-faq-layout">
        <SectionHeading block={block} />
        <div className="public-faq-list">
          {(block.items || []).map((item, index) => (
            <details key={`${item.title}-${index}`} open={openIndex === index}>
              <summary
                aria-expanded={openIndex === index}
                onClick={(event) => {
                  event.preventDefault();
                  setOpenIndex((current) => current === index ? null : index);
                }}
              >
                <span>{item.title}</span><Plus aria-hidden="true" />
              </summary>
              <p>{item.desc}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function OpeningConsoleSection({ block }: { block: CMSBlock }) {
  return (
    <section className="public-opening-console-section" style={backgroundStyle(block)}>
      <div className="public-container public-opening-console-layout">
        <SectionHeading block={block} />
        <div className="public-opening-console" aria-label="탑정보통신 매장 오픈 지원 범위">
          <div className="public-opening-console__flow">
          {(block.items || []).map((item, index) => (
            <article key={`${item.title}-${index}`}>
                <span className="public-opening-console__icon"><Icon name={item.icon} /></span>
                <span className="public-opening-console__copy"><strong>{item.title}</strong></span>
                <Check aria-hidden="true" />
            </article>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceStoriesSection({ block }: { block: CMSBlock }) {
  const items = block.items || [];
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeItem = items[activeIndex] || items[0];
  const usesGeneratedVisual = block.id === "home-services" && Boolean(activeItem) && (
    shouldUseGeneratedServiceGraphic(activeItem)
    || (!activeItem?.imageUrl && (activeItem?.icon === "file" || activeItem?.icon === "wrench"))
  );
  const activeImageUrl = usesGeneratedVisual ? undefined : resolveStandardItemImage(block, activeItem, activeIndex);
  const mediaClass = mediaPresentationClass(activeImageUrl);
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  return (
    <section className="public-service-story-section" style={backgroundStyle(block)}>
      <div className="public-container">
        <SectionHeading block={block} />
        <div className="public-service-story">
          <nav aria-label="제공 서비스 선택">
            {items.map((item, index) => (
              <button type="button" key={`${item.title}-${index}`} className={activeIndex === index ? "is-active" : ""} aria-pressed={activeIndex === index} onClick={() => setActiveIndex(index)}>
                <span><Icon name={item.icon} /></span>
                <strong>{item.title}</strong>
                <ArrowRight aria-hidden="true" />
              </button>
            ))}
          </nav>
          <figure className={`is-service-${activeIndex} ${mediaClass} ${usesGeneratedVisual ? "has-generated-service" : ""}`}>
            <AnimatePresence mode="wait">
              {usesGeneratedVisual && activeItem ? (
                <motion.div className="public-service-story__generated" key={`${activeItem.title}-${activeIndex}`} initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 1.01 }} transition={{ duration: 0.3 }}>
                  <ServiceIllustration item={activeItem} />
                </motion.div>
              ) : activeImageUrl ? (
                <motion.img
                  key={`${activeImageUrl}-${activeIndex}`}
                  src={activeImageUrl}
                  alt={`${activeItem?.title || "토스포스"} 제품 구성`}
                  loading="lazy"
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                />
              ) : null}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.figcaption key={`${activeItem?.title}-${activeIndex}`} initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.24 }}>
                <p>{activeItem?.desc}</p>
              </motion.figcaption>
            </AnimatePresence>
          </figure>
        </div>
      </div>
    </section>
  );
}

function PlatformStageSection({ block }: { block: CMSBlock }) {
  return (
    <section className="public-platform-stage-section" style={backgroundStyle(block)}>
      <div className="public-container public-platform-stage-layout">
        <figure className="public-platform-stage__media">
          {block.imageUrl && <img src={block.imageUrl} alt="다양한 기기에서 사용하는 토스포스" loading="lazy" />}
          {(block.note || block.content) && <figcaption>{block.note && <span>{block.note}</span>}{block.content && <strong>{block.content}</strong>}</figcaption>}
        </figure>
        <div className="public-platform-stage__content">
          <SectionHeading block={block} />
          <div className="public-platform-stage__list">
            {(block.items || []).map((item, index) => (
              <article key={`${item.title}-${index}`}>
                <span><Icon name={item.icon} /></span>
                <div><strong>{item.title}</strong><small>{item.desc}</small></div>
                <Check aria-hidden="true" />
              </article>
            ))}
          </div>
          {block.imageCaption && <p className="public-platform-stage__note">{block.imageCaption}</p>}
        </div>
      </div>
    </section>
  );
}

function CustomerLoopSection({ block }: { block: CMSBlock }) {
  const imageUrl = block.imageUrl && !isBlockedPublicMedia(block.imageUrl) ? block.imageUrl : undefined;

  return (
    <section className="public-customer-loop-section" style={backgroundStyle(block)}>
      <div className="public-container">
        <SectionHeading block={block} />
        <div className="public-customer-loop">
          <figure className={imageUrl ? undefined : "is-code-visual"}>
            {imageUrl && <img src={imageUrl} alt="토스포스 고객관리 기능" loading="lazy" />}
            {!imageUrl && (
              <div className="public-customer-loop__visual" aria-label="리뷰, 포인트, 쿠폰으로 이어지는 고객관리 흐름">
                <span><HeartHandshake aria-hidden="true" /><strong>리뷰</strong></span>
                <ArrowRight aria-hidden="true" />
                <span><UserRound aria-hidden="true" /><strong>포인트</strong></span>
                <ArrowRight aria-hidden="true" />
                <span><TicketPercent aria-hidden="true" /><strong>쿠폰</strong></span>
              </div>
            )}
            {(block.note || block.content) && <figcaption>{block.note && <span>{block.note}</span>}{block.content && <strong>{block.content}</strong>}</figcaption>}
          </figure>
          <ol>
            {(block.items || []).map((item, index) => (
              <li key={`${item.title}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><Icon name={item.icon} /><strong>{item.title}</strong><p>{item.desc}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function OperationsConsoleSection({ block }: { block: CMSBlock }) {
  const items = block.items || [];
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeItem = items[activeIndex] || items[0];
  const shouldReduceMotion = useReducedMotion();
  const fallbackImages = [
    "/assets/operations/inventory.webp",
    "/assets/operations/bulk-register.webp",
    "/assets/operations/sales-calendar.webp",
    "/assets/operations/order-status.webp",
    "/assets/operations/auto-discount.webp",
    "/assets/operations/receipt-settings.webp",
  ];
  const configuredImageUrl = activeItem?.imageUrl;
  const fallbackImageUrl = fallbackImages[activeIndex];
  const activeImageUrl = block.id === "toss-operation" && fallbackImageUrl
    && (!configuredImageUrl || configuredImageUrl === block.imageUrl || configuredImageUrl === "/assets/product/toss-sales.webp")
    ? fallbackImageUrl
    : configuredImageUrl || fallbackImageUrl || block.imageUrl;
  const activeImageDimensions = getPublicImageDimensions(activeImageUrl);

  React.useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  return (
    <section className="public-ops-console-section" style={backgroundStyle(block)}>
      <div className="public-container">
        <SectionHeading block={block} />
        <div className="public-ops-console">
          <div className="public-ops-console__body">
            <nav aria-label="토스포스 운영 기능 선택">
              {items.map((item, index) => (
                <button type="button" key={`${item.title}-${index}`} className={activeIndex === index ? "is-active" : ""} aria-pressed={activeIndex === index} onClick={() => setActiveIndex(index)}>
                  <Icon name={block.id === "toss-operation" && index === 1 && item.icon === "credit-card" ? "barcode" : item.icon} /><span>{item.title}</span>
                </button>
              ))}
            </nav>
            <figure className={`is-tool-${activeIndex}`}>
              <AnimatePresence mode="wait">
                {activeImageUrl && (
                  <motion.img
                    key={`${activeImageUrl}-${activeIndex}`}
                    src={activeImageUrl}
                    alt={`${activeItem?.title || "토스포스 운영관리"} 화면`}
                    width={activeImageDimensions?.width}
                    height={activeImageDimensions?.height}
                    loading="lazy"
                    decoding="async"
                    initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 1.01 }}
                    transition={{ duration: 0.28 }}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.div className="public-ops-console__metric" key={`${activeItem?.title}-${activeIndex}`} initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.24 }}><span>선택 기능</span><strong>{activeItem?.title}</strong><p>{activeItem?.desc}</p></motion.div>
              </AnimatePresence>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureSection({ block }: { block: CMSBlock }) {
  return (
    <section className="public-feature-list-section" style={backgroundStyle(block)}>
      <div className="public-container public-feature-list-layout">
        <SectionHeading block={block} />
        <div className="public-feature-list">
          {(block.items || []).map((item, index) => (
            <article key={`${item.title}-${index}`}>
              <span><Icon name={item.icon} /></span>
              <div><h3>{item.title}</h3><p>{item.desc}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TextSection({ block }: { block: CMSBlock }) {
  return <section className="public-text-section" style={backgroundStyle(block)}><div className="public-container"><SectionHeading block={block} /><div className="public-text-section__content" style={{ color: colorStyle(block.contentColor) }}>{block.content}</div></div></section>;
}

function ImageSection({ block }: { block: CMSBlock }) {
  return <section className="public-image-section" style={backgroundStyle(block)}><div className="public-container">{block.title && <SectionHeading block={block} />}{block.imageUrl && <img src={block.imageUrl} alt={block.title || "탑정보통신 서비스 이미지"} />}</div></section>;
}

const PRODUCT_CATEGORY_ORDER = [
  "포스",
  "단말기",
  "키오스크",
  "테이블오더",
  "주변기기",
  "통신",
  "보안",
  "기타",
] as const;

const KNOWN_PRODUCT_CATEGORIES = new Set<string>(PRODUCT_CATEGORY_ORDER);

function normalizeProductCategory(category: Product["category"] | string) {
  return String(category || "").trim() || "기타";
}

function compareProductsByCategory(left: Product, right: Product) {
  const leftCategory = normalizeProductCategory(left.category);
  const rightCategory = normalizeProductCategory(right.category);
  const leftIndex = PRODUCT_CATEGORY_ORDER.indexOf(leftCategory as (typeof PRODUCT_CATEGORY_ORDER)[number]);
  const rightIndex = PRODUCT_CATEGORY_ORDER.indexOf(rightCategory as (typeof PRODUCT_CATEGORY_ORDER)[number]);
  const normalizedLeftIndex = leftIndex === -1 ? PRODUCT_CATEGORY_ORDER.length : leftIndex;
  const normalizedRightIndex = rightIndex === -1 ? PRODUCT_CATEGORY_ORDER.length : rightIndex;

  if (normalizedLeftIndex !== normalizedRightIndex) return normalizedLeftIndex - normalizedRightIndex;
  if (leftCategory !== rightCategory) {
    return leftCategory.localeCompare(rightCategory, "ko-KR", { numeric: true, sensitivity: "base" });
  }
  return left.name.localeCompare(right.name, "ko-KR", { numeric: true, sensitivity: "base" });
}

function getProductCategoryDomKey(category: string) {
  return Array.from(category)
    .map((character) => character.codePointAt(0)?.toString(36) || "0")
    .join("-");
}

function ProductCatalog({
  products,
  filter,
  setFilter,
  onNavigate,
  isEditModeActive,
  setActiveEditTarget,
  page,
}: {
  products: Product[];
  filter: string;
  setFilter: (value: string) => void;
  onNavigate: (target: string) => void;
  isEditModeActive: boolean;
  setActiveEditTarget: (target: any) => void;
  page: CMSPage;
}) {
  const source = products.length > 0 ? products : fallbackProducts;
  const orderedSource = React.useMemo(() => [...source].sort(compareProductsByCategory), [source]);
  const categories = React.useMemo(() => {
    const availableCategories = Array.from(new Set(orderedSource.map((item) => normalizeProductCategory(item.category))));
    const orderedCategories = PRODUCT_CATEGORY_ORDER.filter((category) => availableCategories.includes(category));
    const unknownCategories = availableCategories
      .filter((category) => !KNOWN_PRODUCT_CATEGORIES.has(category))
      .sort((left, right) => left.localeCompare(right, "ko-KR", { numeric: true, sensitivity: "base" }));

    return ["전체", ...orderedCategories, ...unknownCategories];
  }, [orderedSource]);
  const activeCategory = categories.includes(filter) ? filter : categories[0];
  const tabGroupId = React.useId().replace(/:/g, "");
  const tabRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const lastFocusedCategoryRef = React.useRef<string | null>(null);
  const previousCategorySignatureRef = React.useRef(categories.join("\u0000"));
  const categorySignature = categories.join("\u0000");

  const getTabId = (category: string) => `${tabGroupId}-product-tab-${getProductCategoryDomKey(category)}`;
  const getPanelId = (category: string) => `${tabGroupId}-product-panel-${getProductCategoryDomKey(category)}`;

  React.useEffect(() => {
    if (filter !== activeCategory) setFilter(activeCategory);
  }, [activeCategory, filter, setFilter]);

  React.useLayoutEffect(() => {
    if (previousCategorySignatureRef.current === categorySignature) return;

    const lastFocusedCategory = lastFocusedCategoryRef.current;
    const activeElement = document.activeElement;
    const focusStayedOnTab = Array.from(tabRefs.current.values()).some((tab) => tab === activeElement);

    if (lastFocusedCategory && !focusStayedOnTab && (!activeElement || activeElement === document.body)) {
      const categoryToFocus = categories.includes(lastFocusedCategory) ? lastFocusedCategory : activeCategory;
      tabRefs.current.get(categoryToFocus)?.focus();
      lastFocusedCategoryRef.current = categoryToFocus;
    }

    previousCategorySignatureRef.current = categorySignature;
  }, [activeCategory, categories, categorySignature]);

  const handleCategoryKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % categories.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + categories.length) % categories.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = categories.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextCategory = categories[nextIndex];
    setFilter(nextCategory);
    tabRefs.current.get(nextCategory)?.focus();
  };

  return (
    <section className="public-product-catalog">
      <div className="public-container">
        <header className="public-product-catalog__head is-filter-only">
          <div className="public-segmented-control" role="tablist" aria-label="제품 분류" aria-orientation="horizontal">
            {categories.map((category, index) => {
              const isActive = activeCategory === category;
              return (
                <button
                  type="button"
                  id={getTabId(category)}
                  role="tab"
                  aria-controls={getPanelId(category)}
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  className={isActive ? "is-active" : ""}
                  onClick={() => setFilter(category)}
                  onFocus={() => {
                    lastFocusedCategoryRef.current = category;
                  }}
                  onKeyDown={(event) => handleCategoryKeyDown(event, index)}
                  ref={(node) => {
                    if (node) tabRefs.current.set(category, node);
                    else tabRefs.current.delete(category);
                  }}
                  key={category}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </header>
        {categories.map((category) => {
          const isActive = activeCategory === category;
          const categoryProducts = category === "전체"
            ? orderedSource
            : orderedSource.filter((item) => normalizeProductCategory(item.category) === category);
          const visibleProducts = isActive ? categoryProducts : [];
          const resultCountClass = categoryProducts.length === 0
            ? "has-no-results"
            : categoryProducts.length === 1
              ? "has-single-result"
              : "has-multiple-results";

          return (
            <div
              className={`public-product-grid ${resultCountClass}`}
              id={getPanelId(category)}
              role="tabpanel"
              aria-labelledby={getTabId(category)}
              tabIndex={isActive ? 0 : -1}
              data-result-count={categoryProducts.length}
              data-result-state={categoryProducts.length === 1 ? "single" : categoryProducts.length === 0 ? "empty" : "multiple"}
              hidden={!isActive}
              key={category}
            >
              {visibleProducts.map((product) => {
                const isProductCutout = product.imageUrl.startsWith("/assets/product/")
                  || product.imageUrl.startsWith("/assets/uplus/");
                const productImageDimensions = getPublicImageDimensions(product.imageUrl);

                return (
                  <article key={product.id} className={isEditModeActive ? "is-editable" : ""} onClick={() => isEditModeActive && products.length > 0 && setActiveEditTarget({ type: "product", pageId: page.id, page, productId: product.id, product })}>
                    <figure className={isProductCutout ? "is-product-cutout" : ""} data-product-id={product.id}>
                      {product.imageUrl === PUBLIC_MEDIA.homeHero.tossPos
                        ? <ApexaXVisual className="public-product-grid__apexa" src={product.imageUrl} alt={`${product.name} 제품 이미지`} variant="product" />
                        : <img src={product.imageUrl} alt={`${product.name} 제품 이미지`} width={productImageDimensions?.width} height={productImageDimensions?.height} loading="lazy" decoding="async" />}
                      <span>{product.category}</span>
                    </figure>
                    <div><h3>{product.name}</h3><p>{product.description}</p><ul>{product.features?.slice(0, 3).map((feature) => <li key={feature}><Check />{feature}</li>)}</ul><footer><strong>{product.price || "상담 문의"}</strong><button type="button" disabled={isEditModeActive} onClick={(event) => { event.stopPropagation(); onNavigate("request_consult"); }}>구성 상담 <ArrowRight /></button></footer></div>
                  </article>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EditorBar({
  page,
  block,
  index,
  selected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  page: CMSPage;
  block: CMSBlock;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`public-editor-bar ${selected ? "is-selected" : ""}`}>
      <button type="button" onClick={onSelect}><Sparkles /> {page.title} · {block.type}</button>
      <div>
        <button type="button" onClick={onMoveUp} disabled={index === 0} title="위로 이동" aria-label="위로 이동"><ArrowUp /></button>
        <button type="button" onClick={onMoveDown} disabled={index === page.blocks.length - 1} title="아래로 이동" aria-label="아래로 이동"><ArrowDown /></button>
        <button type="button" onClick={onDelete} title="섹션 삭제" aria-label="섹션 삭제"><Trash2 /></button>
      </div>
    </div>
  );
}

function InsertBlockControl({
  page,
  index,
  isOpen,
  setOpen,
  insert,
}: {
  page: CMSPage;
  index: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  insert: (type: "hero" | "features" | "text" | "banner" | "image" | "divider") => void;
}) {
  const options: { type: "hero" | "features" | "text" | "banner" | "image" | "divider"; label: string }[] = [
    { type: "hero", label: "히어로" },
    { type: "features", label: "기능 목록" },
    { type: "banner", label: "이미지 섹션" },
    { type: "text", label: "텍스트" },
    { type: "image", label: "이미지" },
    { type: "divider", label: "구분선" },
  ];
  return (
    <div className="public-insert-control">
      <button type="button" onClick={() => setOpen(!isOpen)} aria-label="아래에 섹션 추가"><Plus /></button>
      {isOpen && <div><header><span>새 섹션</span><button type="button" onClick={() => setOpen(false)}><X /></button></header>{options.map((option) => <button type="button" key={option.type} onClick={() => insert(option.type)}>{option.label}<ChevronRight /></button>)}</div>}
    </div>
  );
}

export const WebsiteBlockRenderer: React.FC<WebsiteBlockRendererProps> = ({
  page,
  pages,
  isEditModeActive,
  activeEditTarget,
  setActiveEditTarget,
  showAddBlockMenuAtIndex,
  setShowAddBlockMenuAtIndex,
  handleMoveBlockUp,
  handleMoveBlockDown,
  handleDeleteBlock,
  handleInsertBlock,
  handleLinkClick,
  products,
  productFilter,
  setProductFilter,
  footerInfo,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const visibleBlocks = page.blocks.filter((block) => block.type !== "custom_board");
  const tossBlocks = page.slug === "toss_pos" ? getTossPageBlocks(page) : null;
  const isFunctionalPage = [
    "request_consult",
    "request_paper",
    "board_suggestions",
    "board_resources",
    "products",
    "industries",
    "promotion_pos",
    "used_pos",
    "support",
  ].includes(page.slug);

  const renderBlock = (block: CMSBlock, index: number) => {
    if (page.slug === "uplus_ai_phone" && block.id === "uplus-ai-hero") return <UplusAiPhoneHero block={block} onNavigate={handleLinkClick} />;
    if (page.slug === "toss_pos" && block.id === "toss-hero") return <TossHeroSection block={block} onNavigate={handleLinkClick} />;
    if (page.slug === "toss_pos" && block.id === "toss-platforms") return <TossFitSection block={block} heroBlock={tossBlocks?.get("toss-hero")} onNavigate={handleLinkClick} />;
    if (page.slug === "toss_pos" && block.id === "toss-sector-configurator") return <TossIndustryConfiguratorSection block={block} onNavigate={handleLinkClick} />;
    if (page.slug === "toss_pos" && block.id === "toss-operation") return <TossOperationsConsoleSection block={block} />;
    if (page.slug === "toss_pos" && block.id === "toss-resources") {
      return (
        <TossReadinessSection
          block={block}
          platformsBlock={tossBlocks?.get("toss-platforms")}
          sectorBlock={tossBlocks?.get("toss-sector-configurator")}
          frontBlock={tossBlocks?.get("toss-front")}
          footerInfo={footerInfo}
          onNavigate={handleLinkClick}
        />
      );
    }
    if (page.slug === "toss_pos" && block.id === "toss-cta") return <TossFinalCtaSection block={block} onNavigate={handleLinkClick} />;
    if (block.type === "hero") return <HeroSection block={block} onNavigate={handleLinkClick} />;
    if (block.id === "home-internet" || block.itemLayout === "telecom-showcase") return <TelecomShowcaseSection block={block} onNavigate={handleLinkClick} />;
    if (block.type === "banner") {
      if (block.bannerLayout === "offer" || block.id === "home-package") return <OfferSection block={block} onNavigate={handleLinkClick} />;
      if (block.bannerLayout === "side-image" || block.imageUrl) return <EditorialBanner block={block} onNavigate={handleLinkClick} />;
      return <CalloutBanner block={block} onNavigate={handleLinkClick} isPageIntro={isFunctionalPage && index === 0} />;
    }
    if (block.type === "features") {
      if (block.itemLayout === "process") return <ProcessSection block={block} />;
      if (block.itemLayout === "action-grid") return <ActionSection block={block} onNavigate={handleLinkClick} />;
      if (block.itemLayout === "faq") return <FaqSection block={block} />;
      if (block.itemLayout === "opening-console") return <OpeningConsoleSection block={block} />;
      if (block.itemLayout === "service-stories") return <ServiceStoriesSection block={block} />;
      if (block.itemLayout === "platform-stage") return <PlatformStageSection block={block} />;
      if (block.itemLayout === "customer-loop") return <CustomerLoopSection block={block} />;
      if (block.itemLayout === "operations-console") return <OperationsConsoleSection block={block} />;
      if (block.itemLayout === "store-configurator") return <StoreConfiguratorSection block={block} onNavigate={handleLinkClick} footerInfo={footerInfo} />;
      if (block.itemLayout === "uplus-ai-app") return <UplusAiAppSection block={block} />;
      return <FeatureSection block={block} />;
    }
    if (block.type === "text") return <TextSection block={block} />;
    if (block.type === "image") return <ImageSection block={block} />;
    if (block.type === "divider") return <div className="public-container"><hr className="public-divider" /></div>;
    return null;
  };

  const renderFunction = () => {
    if (page.slug === "request_consult") return <PublicConsultationForm company={footerInfo} />;
    if (page.slug === "request_paper") return <PublicPaperRequestForm company={footerInfo} />;
    if (page.slug === "board_suggestions") return <PublicSuggestionBoard company={footerInfo} />;
    if (page.slug === "board_resources") return <PublicResourceBoard />;
    if (page.slug === "products") return <ProductCatalog products={products} filter={productFilter} setFilter={setProductFilter} onNavigate={handleLinkClick} isEditModeActive={isEditModeActive} setActiveEditTarget={setActiveEditTarget} page={page} />;
    return null;
  };

  if (page.slug === "home") {
    const renderHomeScene = (block: CMSBlock, scene: React.ReactNode) => {
      if (!isEditModeActive) return scene;
      const originalIndex = page.blocks.findIndex((item) => item.id === block.id);
      if (originalIndex < 0) return scene;
      const selected = activeEditTarget?.blockId === block.id;
      return (
        <React.Fragment key={block.id}>
          <div className={`public-edit-section ${selected ? "is-selected" : ""}`} onClick={(event) => {
            event.stopPropagation();
            setActiveEditTarget({ type: block.type, pageId: page.id, page, blockId: block.id, block });
          }}>
            <EditorBar page={page} block={block} index={originalIndex} selected={selected} onSelect={() => setActiveEditTarget({ type: block.type, pageId: page.id, page, blockId: block.id, block })} onMoveUp={() => handleMoveBlockUp(page, originalIndex)} onMoveDown={() => handleMoveBlockDown(page, originalIndex)} onDelete={() => handleDeleteBlock(page, originalIndex)} />
            {scene}
          </div>
          <InsertBlockControl
            page={page}
            index={originalIndex}
            isOpen={showAddBlockMenuAtIndex?.pageId === page.id && showAddBlockMenuAtIndex.index === originalIndex}
            setOpen={(open) => setShowAddBlockMenuAtIndex(open ? { pageId: page.id, index: originalIndex } : null)}
            insert={(type) => handleInsertBlock(page, originalIndex, type)}
          />
        </React.Fragment>
      );
    };

    return (
      <div className="public-page public-page--home">
        <PublicHomeExperience
          page={page}
          pages={pages}
          onNavigate={handleLinkClick}
          renderScene={renderHomeScene}
          renderFallback={(block) => renderBlock(block, page.blocks.findIndex((item) => item.id === block.id))}
        />
      </div>
    );
  }

  if (page.slug === "toss_pos" && !isEditModeActive) {
    const orderedCoreBlocks = tossPageBlockOrder
      .map((id) => id === "toss-flow" ? null : tossBlocks?.get(id))
      .filter(Boolean) as CMSBlock[];
    const renderedBlockIds = new Set([
      ...Array.from(tossComposedBlockIds),
      ...orderedCoreBlocks.map((block) => block.id),
    ]);
    const extraBlocks = visibleBlocks.filter((block) => !renderedBlockIds.has(block.id));

    return (
      <div className="public-page public-page--toss_pos">
        {orderedCoreBlocks.slice(0, 2).map((block) => (
          <motion.div
            key={block.id}
            className="public-section-reveal"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 38 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderBlock(block, page.blocks.findIndex((item) => item.id === block.id))}
          </motion.div>
        ))}

        <motion.div
          className="public-section-reveal"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 38 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          <TossCounterFlowSection
            orderBlock={tossBlocks?.get("toss-order")}
            frontBlock={tossBlocks?.get("toss-front")}
            deliveryBlock={tossBlocks?.get("toss-delivery")}
            customerBlock={tossBlocks?.get("toss-customer")}
            operationsBlock={tossBlocks?.get("toss-operation")}
            onNavigate={handleLinkClick}
          />
        </motion.div>

        {orderedCoreBlocks.slice(2).map((block) => (
          <motion.div
            key={block.id}
            className="public-section-reveal"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 38 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderBlock(block, page.blocks.findIndex((item) => item.id === block.id))}
          </motion.div>
        ))}

        {extraBlocks.map((block, index) => (
          <motion.div
            key={block.id}
            className="public-section-reveal"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 38 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderBlock(block, index)}
          </motion.div>
        ))}
        {renderFunction()}
      </div>
    );
  }

  return (
    <div className={`public-page public-page--${page.slug}`}>
      {visibleBlocks.map((block, index) => {
        const originalIndex = page.blocks.findIndex((item) => item.id === block.id);
        const selected = activeEditTarget?.blockId === block.id;
        return (
          <React.Fragment key={block.id}>
            <section className={isEditModeActive ? `public-edit-section ${selected ? "is-selected" : ""}` : undefined} onClick={(event) => {
              if (!isEditModeActive) return;
              event.stopPropagation();
              setActiveEditTarget({ type: block.type, pageId: page.id, page, blockId: block.id, block });
            }}>
              {isEditModeActive && <EditorBar page={page} block={block} index={originalIndex} selected={selected} onSelect={() => setActiveEditTarget({ type: block.type, pageId: page.id, page, blockId: block.id, block })} onMoveUp={() => handleMoveBlockUp(page, originalIndex)} onMoveDown={() => handleMoveBlockDown(page, originalIndex)} onDelete={() => handleDeleteBlock(page, originalIndex)} />}
              {isEditModeActive || block.type === "hero" ? renderBlock(block, index) : (
                <motion.div
                  className="public-section-reveal"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 38 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
                >
                  {renderBlock(block, index)}
                </motion.div>
              )}
            </section>
            {isEditModeActive && (
              <InsertBlockControl
                page={page}
                index={originalIndex}
                isOpen={showAddBlockMenuAtIndex?.pageId === page.id && showAddBlockMenuAtIndex.index === originalIndex}
                setOpen={(open) => setShowAddBlockMenuAtIndex(open ? { pageId: page.id, index: originalIndex } : null)}
                insert={(type) => handleInsertBlock(page, originalIndex, type)}
              />
            )}
          </React.Fragment>
        );
      })}
      {renderFunction()}
    </div>
  );
};
