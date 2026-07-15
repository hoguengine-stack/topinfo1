import React from "react";
import {
  BarChart3,
  CircleHelp,
  Clock3,
  Cpu,
  CreditCard,
  Heart,
  Layers3,
  LockKeyhole,
  Monitor,
  Plus,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { CMSPage, CMSBlock } from "../../types";


interface FeaturesBlockProps {
  page: CMSPage;
  pages: CMSPage[];
  setPages: (pages: CMSPage[]) => void;
  block: CMSBlock;
  isEditModeActive: boolean;
  activeEditTarget: any;
  setActiveEditTarget: (target: any) => void;
  handleLinkClick: (slug: string) => void;
  handleUpdateBlockData: (page: CMSPage, blockId: string, updatedData: Partial<CMSBlock>) => Promise<void>;
  db: any;
}

export const FeaturesBlock: React.FC<FeaturesBlockProps> = ({
  page,
  pages,
  setPages,
  block,
  isEditModeActive,
  activeEditTarget,
  setActiveEditTarget,
  handleLinkClick,
  handleUpdateBlockData,
  db,
}) => {
  const renderIconComponent = (iconName: string, defaultIdx: number) => {
    const trimmed = iconName ? iconName.trim() : "";
    const name = trimmed.toLowerCase();

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/") || trimmed.includes(".") || trimmed.startsWith("data:")) {
      return (
        <img
          src={trimmed}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain rounded-md"
        />
      );
    }

    const iconClass = "h-5 w-5";
    if (name === "zap") return <Zap className={iconClass} aria-hidden="true" />;
    if (name === "clock") return <Clock3 className={iconClass} aria-hidden="true" />;
    if (name === "creditcard" || name === "card" || name === "credit-card") return <CreditCard className={iconClass} aria-hidden="true" />;
    if (name === "barchart" || name === "chart" || name === "barchart3") return <BarChart3 className={iconClass} aria-hidden="true" />;
    if (name === "monitor") return <Monitor className={iconClass} aria-hidden="true" />;
    if (name === "smartphone" || name === "phone") return <Smartphone className={iconClass} aria-hidden="true" />;
    if (name === "cpu" || name === "chip") return <Cpu className={iconClass} aria-hidden="true" />;
    if (name === "layers") return <Layers3 className={iconClass} aria-hidden="true" />;
    if (name === "lock") return <LockKeyhole className={iconClass} aria-hidden="true" />;
    if (name === "shield" || name === "alert" || name === "shieldalert") return <ShieldCheck className={iconClass} aria-hidden="true" />;
    if (name === "sparkles" || name === "star") return <Sparkles className={iconClass} aria-hidden="true" />;
    if (name === "scrolltext") return <ScrollText className={iconClass} aria-hidden="true" />;
    if (name === "heart") return <Heart className={iconClass} aria-hidden="true" />;
    if (name === "shoppingbag") return <ShoppingBag className={iconClass} aria-hidden="true" />;
    if (name === "helpcircle") return <CircleHelp className={iconClass} aria-hidden="true" />;

    const val = defaultIdx % 4;
    if (val === 0) return <Zap className={iconClass} aria-hidden="true" />;
    if (val === 1) return <ShieldCheck className={iconClass} aria-hidden="true" />;
    if (val === 2) return <ReceiptText className={iconClass} aria-hidden="true" />;
    return <BarChart3 className={iconClass} aria-hidden="true" />;
  };

  const isHomeFeatures = page.slug === "home";
  const isTossFeatures = page.slug === "toss_pos";
  const isEditorialFeatures = isHomeFeatures || isTossFeatures;
  const isServiceRows = block.itemLayout === "service-rows" || (isHomeFeatures && block.id === "b2");
  const isProcessLayout = block.itemLayout === "process";
  const isFaqLayout = block.itemLayout === "faq";
  const isActionGrid = block.itemLayout === "action-grid";
  const gridColsCount = Number(block.gridCols) || (isProcessLayout ? Math.min(block.items?.length || 4, 5) : isEditorialFeatures ? 4 : 2);
  const isColumnLayout = block.itemLayout === "column";
  const useColumnLayout = isColumnLayout || isEditorialFeatures || isServiceRows || isProcessLayout || isActionGrid;
  const cardBg = block.cardBgColor || "bg-white";

  const isCardDark = cardBg.includes("bg-slate-900");
  const defaultTitleColor = isCardDark ? "text-white" : "text-slate-800";
  const defaultDescColor = isCardDark ? "text-slate-300" : "text-slate-500";

  const titleAlign = block.titleAlign || block.align || (isEditorialFeatures ? "left" : "center");
  const subtitleAlign = block.subtitleAlign || block.align || (isEditorialFeatures ? "left" : "center");

  const titleTextAlign = titleAlign === "left" ? "text-left" : titleAlign === "right" ? "text-right" : "text-center";
  const titleMxClass = titleAlign === "left" ? "mr-auto ml-0" : titleAlign === "right" ? "ml-auto mr-0" : "mx-auto";

  const subtitleTextAlign = subtitleAlign === "left" ? "text-left" : subtitleAlign === "right" ? "text-right" : "text-center";
  const subtitleMxClass = subtitleAlign === "left" ? "mr-auto ml-0" : subtitleAlign === "right" ? "ml-auto mr-0" : "mx-auto";

  return (
    <section className={isEditorialFeatures ? "w-full max-w-[1200px] mx-auto px-5 py-20 md:px-8 md:py-24 space-y-10" : "space-y-8 w-full"}>
      <div
        onClick={() => {
          if (isEditModeActive) {
            setActiveEditTarget({ type: "features", pageId: page.id, page, blockId: block.id, block, selectedElement: "block" });
          }
        }}
        className={`w-full ${isEditorialFeatures ? "max-w-3xl mr-auto ml-0" : "max-w-xl mx-auto"} space-y-3 ${
          isEditModeActive ? "cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-dashed rounded-3xl p-3 transition" : ""
        }`}
      >
        {isEditModeActive ? (
          <div className="space-y-2 w-full" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={block.title || ""}
              onChange={(e) => {
                const newVal = e.target.value;
                handleUpdateBlockData?.(page, block.id, { title: newVal });
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isEditModeActive) {
                  setActiveEditTarget({ type: "features", pageId: page.id, page, blockId: block.id, block, selectedElement: "title" });
                }
              }}
              onFocus={() => {
                if (isEditModeActive) {
                   setActiveEditTarget({ type: "features", pageId: page.id, page, blockId: block.id, block, selectedElement: "title" });
                }
              }}
              style={{
                fontSize: block.titleFontSize ? `${block.titleFontSize}pt` : undefined,
                letterSpacing: block.titleLetterSpacing ? `${block.titleLetterSpacing}px` : undefined,
              }}
              className={`w-full ${titleTextAlign} ${titleMxClass} bg-transparent border-0 focus:ring-1 focus:ring-blue-500 p-1 focus:outline-none rounded-lg hover:bg-blue-50/10 ${block.titleSize || "text-xl md:text-3xl font-extrabold tracking-tight"} ${block.titleColor || "text-slate-950"}`}
              placeholder="기능카드 영역 대제목"
            />
            <input
              type="text"
              value={block.subtitle || ""}
              onChange={(e) => {
                const newVal = e.target.value;
                handleUpdateBlockData?.(page, block.id, { subtitle: newVal });
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isEditModeActive) {
                  setActiveEditTarget({ type: "features", pageId: page.id, page, blockId: block.id, block, selectedElement: "subtitle" });
                }
              }}
              onFocus={() => {
                if (isEditModeActive) {
                  setActiveEditTarget({ type: "features", pageId: page.id, page, blockId: block.id, block, selectedElement: "subtitle" });
                }
              }}
              style={{
                fontSize: block.subtitleFontSize ? `${block.subtitleFontSize}pt` : undefined,
                letterSpacing: block.subtitleLetterSpacing ? `${block.subtitleLetterSpacing}px` : undefined,
              }}
              className={`w-full ${subtitleTextAlign} ${subtitleMxClass} bg-transparent border-0 focus:ring-1 focus:ring-blue-500 p-1 focus:outline-none rounded-lg hover:bg-blue-50/10 ${block.subtitleSize || "text-sm"} ${block.subtitleColor || "text-slate-500"}`}
              placeholder="기능카드 영역 상세 설명"
            />
          </div>
        ) : (
          <>
            <h2
              style={{
                fontSize: block.titleFontSize ? `${block.titleFontSize}pt` : undefined,
                letterSpacing: block.titleLetterSpacing ? `${block.titleLetterSpacing}px` : undefined,
              }}
              className={`${block.titleSize || "text-2xl md:text-4xl font-bold"} ${block.titleColor || "text-slate-950"} ${titleTextAlign} ${titleMxClass} block w-full leading-tight`}
            >
              {block.title || "타이틀 없음"}
            </h2>
            <p
              style={{
                fontSize: block.subtitleFontSize ? `${block.subtitleFontSize}pt` : undefined,
                letterSpacing: block.subtitleLetterSpacing ? `${block.subtitleLetterSpacing}px` : undefined,
              }}
              className={`${block.subtitleSize || "text-base"} ${block.subtitleColor || "text-slate-600"} mt-3 ${subtitleTextAlign} ${subtitleMxClass} block w-full leading-relaxed`}
            >
              {block.subtitle || "한 줄 메리트 설명 정렬과 기능을 드래그 또는 HUD로 자유롭게 편집하세요"}
            </p>
          </>
        )}
      </div>

      {isFaqLayout && !isEditModeActive ? (
        <div className="border-t border-slate-300">
          {(block.items || []).map((item, idx) => (
            <details key={`${item.title}-${idx}`} className="group border-b border-slate-300 bg-transparent">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base font-bold text-slate-950 marker:content-none">
                <span>{item.title}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-300 text-lg font-medium text-blue-700 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="max-w-3xl pb-6 pr-12 text-sm leading-7 text-slate-600">{item.desc}</p>
            </details>
          ))}
        </div>
      ) : (
      <div className={`grid grid-cols-1 ${
        gridColsCount === 1 ? 'md:grid-cols-1' :
        gridColsCount === 3 ? 'md:grid-cols-3' :
        gridColsCount === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
        gridColsCount === 5 ? 'md:grid-cols-3 lg:grid-cols-5' : 'md:grid-cols-2'
      } gap-4 md:gap-5`}>
        {(block.items || []).map((item, idx) => {
          const isCurrentlyEditingThisCard = isEditModeActive && activeEditTarget && activeEditTarget.blockId === block.id && activeEditTarget.itemIndex === idx;
          return (
            <div
              key={idx}
              onClick={(e) => {
                if (isEditModeActive) {
                  e.stopPropagation();
                  setActiveEditTarget({ type: "card", pageId: page.id, page, blockId: block.id, block, itemIndex: idx });
                }
              }}
              className={`${isServiceRows
                ? "rounded-none border-x-0 border-b-0 border-t border-slate-300 bg-transparent px-0 py-6 md:px-0 md:py-7 min-h-[170px] hover:bg-white/70"
                : isProcessLayout
                  ? "rounded-none border-x-0 border-b-0 border-t-2 border-blue-600 bg-transparent px-0 py-5 md:px-0 md:py-6 min-h-[190px]"
                  : "rounded-lg border border-slate-200 p-5 md:p-6 min-h-[190px] bg-white hover:shadow-sm hover:border-blue-300"
              } transition-colors flex relative group/feat ${block.cardBgColor ? cardBg : ""} ${
                isCurrentlyEditingThisCard ? "ring-4 ring-blue-500 border-transparent shadow-md bg-blue-50/5" : ""
              } ${
                isEditModeActive ? "cursor-pointer" : ""
              } ${
                block.blockAlign
                  ? block.blockAlign
                  : useColumnLayout
                    ? "flex-col items-start text-left gap-5"
                    : "flex-col items-start text-left gap-4 md:flex-row"
              }`}
            >
              {isProcessLayout && (
                <span className="site-display text-sm font-bold text-blue-700">{String(idx + 1).padStart(2, "0")}</span>
              )}
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 relative ${
                  item.icon && (item.icon.startsWith("http") || item.icon.startsWith("/") || item.icon.startsWith("data:"))
                    ? "bg-transparent border-0"
                    : (item.iconBg || (["bg-blue-50", "bg-emerald-50", "bg-amber-50", "bg-cyan-50"][idx % 4]))
                } ${item.iconColor || (["text-blue-700", "text-emerald-700", "text-amber-700", "text-cyan-700"][idx % 4])}`}>
                  {renderIconComponent(item.icon || "", idx)}
                </div>
              </div>

              <div className="flex-1 space-y-2 w-full text-left" onClick={(e) => isEditModeActive && e.stopPropagation()}>
                {item.badge && (
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-black inline-block tracking-widest uppercase mb-1 ${item.badgeBg || "bg-blue-100"} ${item.badgeColor || "text-blue-800"}`}>
                    {isEditModeActive ? (
                      <input
                        type="text"
                        value={item.badge || ""}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          const currentItems = [...(block.items || [])];
                          currentItems[idx] = { ...currentItems[idx], badge: newVal };
                          handleUpdateBlockData?.(page, block.id, { items: currentItems });
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditModeActive) {
                            setActiveEditTarget({ type: "card", pageId: page.id, page, blockId: block.id, block, itemIndex: idx });
                          }
                        }}
                        onFocus={() => {
                          if (isEditModeActive) {
                            setActiveEditTarget({ type: "card", pageId: page.id, page, blockId: block.id, block, itemIndex: idx });
                          }
                        }}
                        className="bg-transparent border-0 focus:ring-0 p-0 text-[10px] font-bold text-center focus:outline-none min-w-[30px]"
                        style={{ width: `${Math.max(2, (item.badge || "").length) * 6}px` }}
                      />
                    ) : (
                      item.badge
                    )}
                  </div>
                )}

                {isEditModeActive ? (
                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={(e) => {
                      const newVal = e.target.value;
                      const currentItems = [...(block.items || [])];
                      currentItems[idx] = { ...currentItems[idx], title: newVal };
                      handleUpdateBlockData?.(page, block.id, { items: currentItems });
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEditModeActive) {
                        setActiveEditTarget({ type: "card", pageId: page.id, page, blockId: block.id, block, itemIndex: idx });
                      }
                    }}
                    onFocus={() => {
                      if (isEditModeActive) {
                        setActiveEditTarget({ type: "card", pageId: page.id, page, blockId: block.id, block, itemIndex: idx });
                      }
                    }}
                    className={`w-full bg-blue-50/10 hover:bg-blue-50/20 border-b border-dashed border-slate-300 focus:ring-1 focus:ring-blue-500 p-1 rounded-lg focus:outline-none font-extrabold ${item.titleColor || defaultTitleColor} ${item.titleSize || "text-base"}`}
                    placeholder="혜택카드 대제목"
                  />
                ) : (
                  <h3 className={`${item.titleSize || "text-base"} font-bold ${item.titleColor || defaultTitleColor}`}>{item.title}</h3>
                )}

                {isEditModeActive ? (
                  <textarea
                    value={item.desc || ""}
                    onChange={(e) => {
                      const newVal = e.target.value;
                      const currentItems = [...(block.items || [])];
                      currentItems[idx] = { ...currentItems[idx], desc: newVal };
                      handleUpdateBlockData?.(page, block.id, { items: currentItems });
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEditModeActive) {
                        setActiveEditTarget({ type: "card", pageId: page.id, page, blockId: block.id, block, itemIndex: idx });
                      }
                    }}
                    onFocus={() => {
                      if (isEditModeActive) {
                        setActiveEditTarget({ type: "card", pageId: page.id, page, blockId: block.id, block, itemIndex: idx });
                      }
                    }}
                    className={`w-full bg-blue-50/10 hover:bg-blue-50/20 border border-transparent hover:border-blue-300 focus:ring-1 focus:ring-blue-500 p-1 rounded-lg focus:outline-none resize-none leading-relaxed ${item.descColor || defaultDescColor} ${item.descSize || "text-sm"}`}
                    rows={Math.max(1, (item.desc || "").split('\n').length)}
                    placeholder="혜택카드 상세 내용"
                  />
                ) : (
                  <p className={`${item.descSize || "text-sm"} ${item.descColor || defaultDescColor} leading-relaxed`}>{item.desc}</p>
                )}

                {item.buttonText && (
                  <div className={`pt-2 ${isColumnLayout ? "flex justify-center" : ""}`}>
                    {isEditModeActive ? (
                      <div className="inline-flex min-h-11 items-center gap-1.5 px-4 py-2 rounded-md font-bold bg-blue-600 text-white shadow-2xs">
                        <input
                          type="text"
                          value={item.buttonText || ""}
                          onChange={(e) => {
                            const newVal = e.target.value;
                            const currentItems = [...(block.items || [])];
                            currentItems[idx] = { ...currentItems[idx], buttonText: newVal };
                            handleUpdateBlockData?.(page, block.id, { items: currentItems });
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isEditModeActive) {
                              setActiveEditTarget({ type: "card", pageId: page.id, page, blockId: block.id, block, itemIndex: idx });
                            }
                          }}
                          onFocus={() => {
                            if (isEditModeActive) {
                              setActiveEditTarget({ type: "card", pageId: page.id, page, blockId: block.id, block, itemIndex: idx });
                            }
                          }}
                          className="bg-transparent border-0 focus:ring-0 p-0 text-center font-bold text-white text-xs focus:outline-none min-w-[60px]"
                          style={{ width: `${Math.max(4, (item.buttonText || "").length) * 8}px` }}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isEditModeActive) {
                            handleLinkClick(item.buttonLink || "request_consult");
                          }
                        }}
                        className="min-h-11 px-4 py-2 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors active:bg-blue-800"
                      >
                        {item.buttonText}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isEditModeActive && (
                <div className="absolute top-2 right-2 opacity-50 group-hover/feat:opacity-100 transition-opacity flex items-center gap-1.5">
                  <span className="text-[9px] bg-slate-900 border border-white/15 text-white px-2 py-0.5 rounded-full font-bold font-sans select-none">수정</span>
                  <button
                    type="button"
                    title="카드 요소 삭제"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const currentItems = (block.items || []).filter((_, idx2) => idx2 !== idx);
                      handleUpdateBlockData?.(page, block.id, { items: currentItems });
                    }}
                    className="p-1 bg-red-650 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {isEditModeActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const list = block.items || [];
              const updatedList = [...list, { title: "새로운 가맹 혜택", desc: "고객님의 비즈니스를 업그레이드 해 드리는 탑정보통신의 신규 혜택 상품입니다." }];
              handleUpdateBlockData?.(page, block.id, { items: updatedList });
            }}
            className="border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition min-h-[190px] font-bold text-xs"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            <span>새 혜택카드 요소 추가</span>
          </button>
        )}
      </div>
      )}
    </section>
  );
};
