import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Clock3, MapPin, MessageSquareText, PhoneCall } from "lucide-react";
import type { CMSBlock } from "../../types";
import { getPublicBlockSubtitle } from "../../utils/cmsSettings";
import { PUBLIC_MEDIA } from "../../utils/publicMedia";

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

export function UplusAiPhoneHero({ block, onNavigate }: { block: CMSBlock; onNavigate: (target: string) => void }) {
  const reduceMotion = useReducedMotion();
  const subtitle = getPublicBlockSubtitle(block);
  const items = block.items || [];

  return (
    <section className="uplus-ai-hero">
      <div className="public-container uplus-ai-hero__layout">
        <motion.div
          className="uplus-ai-hero__copy"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
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
                <div><strong>{item.title}</strong>{item.desc && <span>{item.desc}</span>}</div>
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
          initial={reduceMotion ? false : { opacity: 0, x: 26 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.64, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            className="uplus-ai-hero__phone"
            src={block.imageUrl || PUBLIC_MEDIA.homeTelecom.aiPhoneHero}
            alt="LG U+ 화이트 IP-520GA 유선 인터넷전화기"
            fetchPriority="high"
          />
          <div className="uplus-ai-hero__speech">
            <img src="/assets/generated/uplus-ai-robot-white.png" alt="" aria-hidden="true" />
            <div>
              <span>AI 응대 중</span>
              <strong>오늘은 오후 10시까지 영업해요.</strong>
              <small>위치와 주차 안내도 이어서 도와드릴게요.</small>
            </div>
          </div>
          <div className="uplus-ai-hero__report" aria-label="AI전화 응대 리포트 예시">
            <span><PhoneCall aria-hidden="true" />오늘 문의</span>
            <strong>18건</strong>
            <small>영업시간 7 · 위치 6 · 주차 5</small>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function UplusAiAppSection({ block }: { block: CMSBlock }) {
  const subtitle = getPublicBlockSubtitle(block);
  const items = block.items || [];
  const icons = [Clock3, MessageSquareText, MapPin];

  return (
    <section className="uplus-ai-app">
      <div className="public-container uplus-ai-app__layout">
        <div className="uplus-ai-app__copy">
          {block.badge && <p className="public-kicker">{block.badge}</p>}
          <h2>{block.title}</h2>
          {subtitle && <p>{subtitle}</p>}
          <ul>
            {items.map((item, index) => {
              const Icon = icons[index] || Check;
              return <li key={item.title}><Icon aria-hidden="true" /><div><strong>{item.title}</strong>{item.desc && <span>{item.desc}</span>}</div></li>;
            })}
          </ul>
        </div>

        <div className="uplus-ai-app__device" aria-label="우리가게패키지 앱의 AI전화 문의 리포트 예시">
          <header><span>우리가게패키지</span><strong>AI전화 리포트</strong></header>
          <div className="uplus-ai-app__summary">
            <div><span>오늘 응대</span><strong>18</strong><small>건</small></div>
            <div><span>AI 응대율</span><strong>94</strong><small>%</small></div>
          </div>
          <div className="uplus-ai-app__calls">
            <article><span>오후 2:14</span><strong>주차 문의</strong><small>건물 뒤편 전용 주차장 안내 완료</small></article>
            <article><span>오후 1:42</span><strong>영업시간 문의</strong><small>오늘 영업 종료 시간 안내 완료</small></article>
            <article><span>오전 11:08</span><strong>위치 문의</strong><small>매장 주소와 찾아오는 길 안내 완료</small></article>
          </div>
        </div>
      </div>
    </section>
  );
}
