import React from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { ArrowRight, PhoneCall, Sparkles } from "lucide-react";

export function PublicScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 28, mass: 0.22 });
  return <motion.div className="public-scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

interface PublicActionDockProps {
  currentUrl: string;
  phone: string;
  isEditModeActive: boolean;
  onNavigate: (target: string) => void;
}

export function PublicActionDock({ currentUrl, phone, isEditModeActive, onNavigate }: PublicActionDockProps) {
  const [visible, setVisible] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();
  const enabled = ["home", "toss_pos", "products"].includes(currentUrl) && !isEditModeActive;

  React.useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }

    const update = () => {
      const page = document.documentElement;
      const nearFooter = window.scrollY + window.innerHeight > page.scrollHeight - 420;
      setVisible(window.scrollY > 620 && !nearFooter);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled, currentUrl]);

  const cleanPhone = phone.replace(/[^\d+]/g, "");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="public-action-dock-shell" initial={shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.98 }} transition={{ duration: 0.24 }}>
          <aside className="public-action-dock" aria-label="빠른 상담">
            <div className="public-action-dock__status"><Sparkles /><span><small>탑정보통신</small><strong>매장 오픈 상담 가능</strong></span></div>
            <a href={`tel:${cleanPhone}`}><PhoneCall /> <span>{phone}</span></a>
            <button type="button" onClick={() => onNavigate("request_consult")}>무료 상담 <ArrowRight /></button>
          </aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
