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
import { PUBLIC_MEDIA, isDeprecatedPublicMedia } from "../utils/publicMedia";
import { createVerifiedPublicProducts } from "../utils/publicProducts";
import { getSectorDetailGroups, getSectorKind } from "../utils/sectorContent";
import { PublicConsultationForm, PublicPaperRequestForm } from "./public-v3/PublicForms";
import { PublicResourceBoard, PublicSuggestionBoard } from "./public-v3/PublicBoards";
import { PublicHomeExperience } from "./public-v3/PublicHomeExperience";
import { ApexaXVisual } from "./public-v3/ApexaXVisual";
import { UplusAiAppSection, UplusAiPhoneHero } from "./public-v3/UplusAiPhonePage";

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
  const cameraOptions = mediaClass === "is-uplus-cctv"
    ? [
        { src: PUBLIC_MEDIA.homeTelecom.cctvOutdoor, alt: "LG U+ 실외형 CCTV 카메라" },
        { src: PUBLIC_MEDIA.homeTelecom.cctvPtz, alt: "LG U+ PTZ CCTV 카메라" },
      ]
    : [];

  return (
    <div className={`public-uplus-product-media ${mediaClass}`}>
      <img className="is-primary" src={imageUrl} alt={alt} loading="lazy" decoding="async" />
      {cameraOptions.map((camera) => <img className="is-camera-option" src={camera.src} alt={camera.alt} key={camera.src} loading="lazy" decoding="async" />)}
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

const fallbackProducts = createVerifiedPublicProducts("");

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

  return (
    <section className="public-offer-section" style={backgroundStyle(block)}>
      <div className="public-container public-offer">
        <div className="public-offer__copy">
          {block.badge && <p className="public-kicker">{block.badge}</p>}
          <h2>{block.title}</h2>
          {subtitle && <p>{subtitle}</p>}
          <div className="public-offer__price">
            <span>{block.priceLabel || "인터넷 결합 패키지"}</span>
            <strong>{block.priceValue || "0"}<small>{block.priceUnit || "원"}</small></strong>
            {block.priceDetails && <p>{block.priceDetails}</p>}
          </div>
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
          <figure className="public-offer__product-stage">{block.imageUrl && <img src={block.imageUrl} alt="토스포스와 결제단말기 제품 구성" />}</figure>
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
                  : <UplusProductMedia imageUrl={item.imageUrl} alt={`${item.title} LG U+ 공식 제품 및 서비스 이미지`} />}
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

  return (
    <figure
      className={imageUrl ? "has-image" : "has-generated-visual"}
      data-motion-media={hasMotionFallback ? "true" : undefined}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={`${feature.title} 화면 예시`} loading="lazy" decoding="async" />
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
      nextUrl.searchParams.set("page", "toss_pos");
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
            <span>{footerInfo.companyName} 현장 지원</span>
            <strong>안산·경기권 설치부터 교육·AS까지</strong>
            <p>매장 조건을 확인한 뒤 필요한 장비만 구성하고 운영 이후 요청까지 한 창구에서 이어갑니다.</p>
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
  return (
    <section className={isPageIntro ? "public-page-intro" : "public-callout"} style={backgroundStyle(block)}>
      <div className="public-container">
        {block.badge && <p className="public-kicker">{block.badge}</p>}
        {isPageIntro ? <h1 style={{ color: colorStyle(block.titleColor) }}>{block.title}</h1> : <h2 style={{ color: colorStyle(block.titleColor) }}>{block.title}</h2>}
        {subtitle && <p style={{ color: colorStyle(block.subtitleColor) }}>{subtitle}</p>}
        <div className="public-callout__actions"><LinkButton text={block.buttonText} target={block.buttonLink} onNavigate={onNavigate} /><LinkButton text={block.button2Text} target={block.button2Link} secondary onNavigate={onNavigate} /></div>
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
  const imageUrl = block.id === "toss-customer" && (!block.imageUrl || block.imageUrl === "/assets/product/toss-coupon.webp")
    ? "/assets/product/toss-customer-coupon.webp"
    : block.imageUrl;

  return (
    <section className="public-customer-loop-section" style={backgroundStyle(block)}>
      <div className="public-container">
        <SectionHeading block={block} />
        <div className="public-customer-loop">
          <figure>
            {imageUrl && <img src={imageUrl} alt="토스포스 고객관리 기능" loading="lazy" />}
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
  const categories = ["전체", ...Array.from(new Set(source.map((item) => item.category)))];
  const visible = filter === "전체" ? source : source.filter((item) => item.category === filter);

  return (
    <section className="public-product-catalog">
      <div className="public-container">
        <header className="public-product-catalog__head is-filter-only"><div className="public-segmented-control" role="tablist" aria-label="제품 분류">{categories.map((category) => <button type="button" role="tab" aria-selected={filter === category} className={filter === category ? "is-active" : ""} onClick={() => setFilter(category)} key={category}>{category}</button>)}</div></header>
        <div className="public-product-grid">
          {visible.map((product) => (
            <article key={product.id} className={isEditModeActive ? "is-editable" : ""} onClick={() => isEditModeActive && products.length > 0 && setActiveEditTarget({ type: "product", pageId: page.id, page, productId: product.id, product })}>
              <figure className={product.imageUrl.startsWith("/assets/product/") ? "is-product-cutout" : ""}>
                {product.imageUrl === PUBLIC_MEDIA.homeHero.tossPos
                  ? <ApexaXVisual className="public-product-grid__apexa" src={product.imageUrl} alt={`${product.name} 제품 이미지`} variant="product" />
                  : <img src={product.imageUrl} alt={`${product.name} 제품 이미지`} loading="lazy" decoding="async" />}
                <span>{product.category}</span>
              </figure>
              <div><h3>{product.name}</h3><p>{product.description}</p><ul>{product.features?.slice(0, 3).map((feature) => <li key={feature}><Check />{feature}</li>)}</ul><footer><strong>{product.price || "상담 문의"}</strong><button type="button" disabled={isEditModeActive} onClick={(event) => { event.stopPropagation(); onNavigate("request_consult"); }}>구성 상담 <ArrowRight /></button></footer></div>
            </article>
          ))}
        </div>
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
  const isFunctionalPage = ["request_consult", "request_paper", "board_suggestions", "board_resources", "products"].includes(page.slug);

  const renderBlock = (block: CMSBlock, index: number) => {
    if (page.slug === "uplus_ai_phone" && block.id === "uplus-ai-hero") return <UplusAiPhoneHero block={block} onNavigate={handleLinkClick} />;
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
    if (page.slug === "request_consult") return <PublicConsultationForm />;
    if (page.slug === "request_paper") return <PublicPaperRequestForm />;
    if (page.slug === "board_suggestions") return <PublicSuggestionBoard />;
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
