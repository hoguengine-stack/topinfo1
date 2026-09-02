import React from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  MessageSquareText,
  PhoneCall,
  ReceiptText,
} from "lucide-react";
import type { CMSBlock } from "../../types";
import { getPublicBlockSubtitle } from "../../utils/cmsSettings";
import { PUBLIC_MEDIA, getPublicImageDimensions } from "../../utils/publicMedia";
import "../../styles/public-uplus-ai-redesign.css";

function AiPhoneButton({ text, target, onNavigate, secondary = false }: {
  text?: string;
  target?: string;
  onNavigate: (target: string) => void;
  secondary?: boolean;
}) {
  if (!text || !target) return null;
  return (
    <button
      type="button"
      className={`uplus-ai-button ${secondary ? "is-secondary" : "is-primary"}`}
      onClick={() => onNavigate(target)}
    >
      <span>{text}</span>
      <ArrowRight aria-hidden="true" />
    </button>
  );
}

const heroFlow = [
  {
    title: "손님이 자주 묻는 기본 문의를 먼저 받습니다",
    desc: "영업시간, 위치, 주차 안내처럼 반복되는 전화를 등록한 안내 기준으로 응대합니다.",
  },
  {
    title: "AI전화 가입 조건과 매장 전화기 구성을 함께 확인합니다",
    desc: "AI전화 서비스와 지원 단말은 가입 상품과 설치 조건에 따라 달라질 수 있어 상담에서 각각 확인합니다.",
  },
  {
    title: "응대 결과는 우리가게패키지 앱에서 다시 확인합니다",
    desc: "응대 내용과 문의 현황을 앱에서 보고 필요한 후속 응대를 이어갈 수 있습니다.",
  },
] as const;

const reportRows = [
  {
    label: "반복 문의",
    title: "영업시간 안내",
    desc: "등록한 영업시간과 휴무 기준으로 먼저 응대",
  },
  {
    label: "반복 문의",
    title: "위치 안내",
    desc: "매장 주소와 찾아오는 기준을 설정값 중심으로 전달",
  },
  {
    label: "반복 문의",
    title: "주차 안내",
    desc: "주차 가능 위치와 안내 문구를 매장 기준으로 정리",
  },
] as const;

const installChecks = [
  "가입 상품과 사용 가능한 설정 항목을 먼저 확인합니다.",
  "매장명, 주소, 영업시간, 휴무, 주차 안내 문구를 등록합니다.",
  "사장님이 직접 받을 전화와 AI가 먼저 받을 문의 범위를 정리합니다.",
  "우리가게패키지 앱에서 응대 이력과 문의 현황을 확인하는 경로를 안내합니다.",
] as const;

export function UplusAiPhoneHero({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  const reduceMotion = useReducedMotion();
  const subtitle = getPublicBlockSubtitle(block);
  const items = block.items || [];
  const heroImage = block.imageUrl && block.imageUrl !== "/assets/uplus/uplus-ip520ga-hero.png"
    ? block.imageUrl
    : PUBLIC_MEDIA.homeTelecom.aiPhoneDevice;
  const heroImageDimensions = getPublicImageDimensions(heroImage);

  return (
    <section className="uplus-ai-page uplus-ai-hero">
      <div className="public-container uplus-ai-shell">
        <div className="uplus-ai-hero__layout">
          <motion.div
            className="uplus-ai-hero__copy"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.54, ease: [0.22, 1, 0.36, 1] }}
          >
            {block.badge && <p className="uplus-ai-hero__badge">{block.badge}</p>}
            <h1>{block.title}</h1>
            {subtitle && <p className="uplus-ai-hero__lead">{subtitle}</p>}

            <ul className="uplus-ai-hero__facts">
              {items.slice(0, 3).map((item) => (
                <li key={item.title}>
                  <Check aria-hidden="true" />
                  <div>
                    <strong>{item.title}</strong>
                    {item.desc && <span>{item.desc}</span>}
                  </div>
                </li>
              ))}
            </ul>

            <div className="uplus-ai-hero__actions">
              <AiPhoneButton text={block.buttonText} target={block.buttonLink} onNavigate={onNavigate} />
              <AiPhoneButton text={block.button2Text} target={block.button2Link} onNavigate={onNavigate} secondary />
            </div>

            {block.note && <p className="uplus-ai-hero__note">{block.note}</p>}
          </motion.div>

          <motion.div
            className="uplus-ai-hero__visual"
            initial={reduceMotion ? false : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.62, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="uplus-ai-hero__visual-head">
              <div>
                <span>LG U+ AI전화</span>
                <strong>AI전화 가입 조건 · IP-520GA 단말 상담</strong>
              </div>
              <img
                src="/assets/uplus/uplus-logo.png"
                alt=""
                width="722"
                height="200"
                aria-hidden="true"
              />
            </div>

            <div className="uplus-ai-hero__device-stage">
              <div className="uplus-ai-hero__service-flow" aria-label="U+ AI전화 서비스 흐름 예시">
                <article>
                  <span className="uplus-ai-hero__flow-icon"><PhoneCall aria-hidden="true" /></span>
                  <small>손님 문의</small>
                  <strong>매장으로 전화</strong>
                  <p>영업시간 · 위치 · 주차처럼 자주 묻는 내용을 문의합니다.</p>
                </article>
                <span className="uplus-ai-hero__flow-arrow" aria-hidden="true"><ArrowRight /></span>
                <article className="is-ai">
                  <img
                    src="/assets/generated/uplus-ai-robot-white-384.webp"
                    alt=""
                    width="384"
                    height="576"
                    aria-hidden="true"
                  />
                  <small>AI 응대</small>
                  <strong>설정한 기준으로 안내</strong>
                  <p>사장님이 바로 받지 못한 반복 문의를 먼저 이어받습니다.</p>
                </article>
                <span className="uplus-ai-hero__flow-arrow" aria-hidden="true"><ArrowRight /></span>
                <article>
                  <span className="uplus-ai-hero__flow-icon"><MessageSquareText aria-hidden="true" /></span>
                  <small>앱 확인</small>
                  <strong>응대 내용 확인</strong>
                  <p>문의 유형과 응대 내용을 보고 필요한 후속 안내를 이어갑니다.</p>
                </article>
              </div>

              <div className="uplus-ai-hero__service-footer">
                <div className="uplus-ai-hero__report">
                  <span><ReceiptText aria-hidden="true" />우리가게패키지 앱에서 확인</span>
                  <strong>응대 내용 · 문의 유형 · 문의 현황</strong>
                  <small>실제 앱 화면이 아닌 서비스 흐름 안내입니다.</small>
                </div>
                <figure className="uplus-ai-hero__device-reference">
                  <img
                    src={heroImage}
                    alt="LG U+ IP-520GA 화이트 인터넷전화기"
                    width={heroImageDimensions?.width}
                    height={heroImageDimensions?.height}
                    fetchPriority="high"
                  />
                  <figcaption><strong>IP-520GA</strong><span>지원 단말 예시</span></figcaption>
                </figure>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="uplus-ai-hero__rail" aria-label="AI전화 운영 흐름">
          {heroFlow.map((item, index) => (
            <article key={item.title} className="uplus-ai-hero__rail-item">
              <span>{`0${index + 1}`}</span>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function UplusAiAppSection({ block }: { block: CMSBlock }) {
  const subtitle = getPublicBlockSubtitle(block);
  const items = block.items || [];
  const icons = [Clock3, MapPin, MessageSquareText];

  return (
    <section className="uplus-ai-page uplus-ai-app">
      <div className="public-container uplus-ai-shell">
        <div className="uplus-ai-app__intro">
          <div className="uplus-ai-app__copy">
            {block.badge && <p className="uplus-ai-app__badge">{block.badge}</p>}
            <h2>{block.title}</h2>
            {subtitle && <p className="uplus-ai-app__lead">{subtitle}</p>}
            <ul className="uplus-ai-app__feature-list">
              {items.map((item, index) => {
                const Icon = icons[index] || ReceiptText;
                return (
                  <li key={item.title}>
                    <Icon aria-hidden="true" />
                    <div>
                      <strong>{item.title}</strong>
                      {item.desc && <span>{item.desc}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="uplus-ai-app__report" aria-label="우리가게패키지 앱 리포트 구조 예시">
            <header>
              <div>
                <span>우리가게패키지 앱에서 확인</span>
                <strong>AI전화 응대 확인 항목</strong>
                <small>실제 고객 데이터나 앱 화면이 아닌 기능 흐름 예시입니다.</small>
              </div>
              <img
                src={PUBLIC_MEDIA.homeTelecom.aiPhoneDevice}
                alt="LG U+ IP-520GA 화이트 전화기"
                width="214"
                height="150"
                loading="lazy"
              />
            </header>

            <div className="uplus-ai-app__summary">
              <article>
                <span>확인 가능한 항목</span>
                <strong>응대 내용</strong>
                <small>무슨 문의였는지 다시 확인</small>
              </article>
              <article>
                <span>문의 현황</span>
                <strong>문의 유형과 시간대</strong>
                <small>반복되는 문의와 응대 이력을 확인</small>
              </article>
            </div>

            <div className="uplus-ai-app__calls">
              {reportRows.map((row) => (
                <article key={row.title}>
                  <span>{row.label}</span>
                  <strong>{row.title}</strong>
                  <small>{row.desc}</small>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="uplus-ai-app__details">
          <div className="uplus-ai-app__narrative">
            <h3>설치 전에는 안내 문구보다 운영 기준을 먼저 맞춥니다.</h3>
            <p>
              AI전화는 전화기만 놓는 작업으로 끝나지 않습니다. 매장에서 실제로 반복되는 문의가 무엇인지,
              가입 상품과 설정 범위 안에서 어떤 흐름으로 응답할지 확인해야 합니다.
            </p>
            <p>
              영업시간, 위치, 주차처럼 자주 묻는 질문을 먼저 정리하고, 응대 결과를 우리가게패키지 앱에서
              확인하는 방식까지 함께 안내해야 매장 전화 흐름이 안정적으로 이어집니다.
            </p>
          </div>

          <div className="uplus-ai-app__checklist">
            <p className="uplus-ai-app__checklist-kicker">설치 확인사항</p>
            <ul>
              {installChecks.map((item) => (
                <li key={item}>
                  <Check aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="uplus-ai-app__cta">
          <div>
            <p>가입 상품, 매장 설정 내용, 최신 적용 조건은 상담 시 확인해 드립니다.</p>
            <strong>매장 전화 응대 흐름을 기준으로 구성 상담을 진행합니다.</strong>
          </div>
          <a className="uplus-ai-app__cta-link" href="tel:031-487-4401">
            전화로 바로 문의하기
          </a>
        </div>
      </div>
    </section>
  );
}
