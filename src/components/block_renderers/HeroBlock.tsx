import React from "react";
import { Sparkles, ArrowRight, Trash2 } from "lucide-react";
import { CMSPage, CMSBlock } from "../../types";
import { updateDoc, doc } from "firebase/firestore";

interface HeroBlockProps {
  page: CMSPage;
  pages: CMSPage[];
  setPages: (pages: CMSPage[]) => void;
  block: CMSBlock;
  blockIdx: number;
  isEditModeActive: boolean;
  activeEditTarget: any;
  setActiveEditTarget: (target: any) => void;
  handleDeleteSubElement: (blockId: string, el: string) => Promise<void>;
  handleResizeStart: (e: React.MouseEvent, block: CMSBlock, elementKey: string) => void;
  handleLinkClick: (slug: string) => void;
  db: any;
}

export const HeroBlock: React.FC<HeroBlockProps> = ({
  page,
  pages,
  setPages,
  block,
  blockIdx,
  isEditModeActive,
  activeEditTarget,
  setActiveEditTarget,
  handleDeleteSubElement,
  handleResizeStart,
  handleLinkClick,
  db,
}) => {
  const renderHeroSubElements = (block: CMSBlock, blockIdx: number) => {
    const list = block.elementOrder || ["badge", "title", "subtitle", "buttons", "iconImageUrl"];
    const mandatory = ["badge", "title", "subtitle", "buttons", "iconImageUrl"];
    const merged = [...list];
    mandatory.forEach(m => {
      if (!merged.includes(m)) merged.push(m);
    });

    return merged.map((el) => {
      let content = null;
      if (el === "badge" && block.badge !== "") {
        const alignClass = block.align === "left" ? "justify-start" : block.align === "right" ? "justify-end" : "justify-center";
        content = (
          <div className={`flex ${alignClass} w-full`}>
            <div 
              style={{
                fontSize: block.elementSizes?.["badge"]?.fontSize || undefined,
                width: block.elementSizes?.["badge"]?.width || undefined,
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-5/30 text-blue-600 rounded-full text-xs font-semibold select-none"
            >
              {block.badgeIconUrl ? (
                <img 
                  src={block.badgeIconUrl} 
                  alt="badge icon" 
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 object-contain rounded shrink-0" 
                />
              ) : (
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500 animate-pulse" /> 
              )}
              {isEditModeActive ? (
                <input
                  type="text"
                  value={block.badge || ""}
                  onChange={async (e) => {
                    const newVal = e.target.value;
                    const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, badge: newVal } : b);
                    setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                    if (activeEditTarget && activeEditTarget.blockId === block.id) {
                      setActiveEditTarget((prev: any) => prev ? { ...prev, block: { ...prev.block, badge: newVal } as CMSBlock } : null);
                    }
                    await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isEditModeActive) {
                      setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "badge" });
                    }
                  }}
                  onFocus={() => {
                    if (isEditModeActive) {
                      setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "badge" });
                    }
                  }}
                  className="bg-transparent border-0 focus:ring-0 p-0 font-extrabold focus:outline-none text-blue-600 text-xs text-center min-w-[60px]"
                  style={{ width: `${Math.max(4, (block.badge || "").length) * 8}px` }}
                />
              ) : (
                block.badge
              )}
            </div>
          </div>
        );
      } else if (el === "title" && block.title !== "") {
        const titleSize = block.titleSize || "text-4xl md:text-6xl font-black";
        const titleColor = block.titleColor || "text-slate-900";
        const textAlignClass = block.align === "left" ? "text-left" : block.align === "right" ? "text-right" : "text-center";
        const alignMxClass = block.align === "left" ? "mr-auto ml-0" : block.align === "right" ? "ml-auto mr-0" : "mx-auto";

        content = isEditModeActive ? (
          <textarea
            value={block.title || ""}
            onChange={async (e) => {
              const newVal = e.target.value;
              const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, title: newVal } : b);
              setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
              if (activeEditTarget && activeEditTarget.blockId === block.id) {
                setActiveEditTarget((prev: any) => prev ? { ...prev, block: { ...prev.block, title: newVal } as CMSBlock } : null);
              }
              await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditModeActive) {
                setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "title" });
              }
            }}
            onFocus={() => {
              if (isEditModeActive) {
                setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "title" });
              }
            }}
            style={{
              fontSize: block.titleFontSize ? `${block.titleFontSize}pt` : (block.elementSizes?.["title"]?.fontSize || undefined),
              letterSpacing: block.titleLetterSpacing ? `${block.titleLetterSpacing}px` : undefined,
              width: block.elementSizes?.["title"]?.width || undefined,
            }}
            className={`w-full ${textAlignClass} bg-transparent border-0 focus:ring-1 focus:ring-blue-500 p-2 rounded-xl focus:outline-none resize-none leading-tight font-sans ${alignMxClass} ${titleColor} ${titleSize}`}
            rows={Math.max(2, (block.title || "").split('\n').reduce((acc, val) => acc + Math.max(1, Math.ceil(val.length / 28)), 0))}
            placeholder="메인 대제목 타이틀"
          />
        ) : (
          <h1 
            style={{
              fontSize: block.titleFontSize ? `${block.titleFontSize}pt` : (block.elementSizes?.["title"]?.fontSize || undefined),
              letterSpacing: block.titleLetterSpacing ? `${block.titleLetterSpacing}px` : undefined,
              width: block.elementSizes?.["title"]?.width || undefined,
            }}
            className={`${titleSize} leading-tight whitespace-pre-line tracking-tight inline-block w-full ${textAlignClass} ${titleColor}`}
          >
            {block.title}
          </h1>
        );
      } else if (el === "subtitle" && block.subtitle !== "") {
        const textAlignClass = block.align === "left" ? "text-left" : block.align === "right" ? "text-right" : "text-center";
        const alignMxClass = block.align === "left" ? "mr-auto ml-0" : block.align === "right" ? "ml-auto mr-0" : "mx-auto";

        content = isEditModeActive ? (
          <textarea
            value={block.subtitle || ""}
            onChange={async (e) => {
              const newVal = e.target.value;
              const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, subtitle: newVal } : b);
              setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
              if (activeEditTarget && activeEditTarget.blockId === block.id) {
                setActiveEditTarget((prev: any) => prev ? { ...prev, block: { ...prev.block, subtitle: newVal } as CMSBlock } : null);
              }
              await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditModeActive) {
                setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "subtitle" });
              }
            }}
            onFocus={() => {
              if (isEditModeActive) {
                setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "subtitle" });
              }
            }}
            style={{
              fontSize: block.subtitleFontSize ? `${block.subtitleFontSize}pt` : (block.elementSizes?.["subtitle"]?.fontSize || undefined),
              letterSpacing: block.subtitleLetterSpacing ? `${block.subtitleLetterSpacing}px` : undefined,
              width: block.elementSizes?.["subtitle"]?.width || undefined,
            }}
            className={`w-full ${textAlignClass} text-slate-500 text-sm md:text-base mt-4 leading-relaxed font-sans bg-transparent border-0 focus:ring-1 focus:ring-blue-500 resize-none p-2 focus:outline-none hover:bg-blue-50/10 rounded-xl ${alignMxClass}`}
            rows={Math.max(2, (block.subtitle || "").split('\n').reduce((acc, val) => acc + Math.max(1, Math.ceil(val.length / 45)), 0))}
            placeholder="상세 보조 설명문을 작성하세요."
          />
        ) : (
          <p 
            style={{
              fontSize: block.subtitleFontSize ? `${block.subtitleFontSize}pt` : (block.elementSizes?.["subtitle"]?.fontSize || undefined),
              letterSpacing: block.subtitleLetterSpacing ? `${block.subtitleLetterSpacing}px` : undefined,
              width: block.elementSizes?.["subtitle"]?.width || undefined,
            }}
            className={`text-slate-500 text-base md:text-lg mt-6 leading-relaxed whitespace-pre-line font-sans ${textAlignClass} ${alignMxClass}`}
          >
            {block.subtitle}
          </p>
        );
      } else if (el === "buttons" && (block.buttonText || block.button2Text)) {
        const b1Bg = block.buttonBgColor || "bg-blue-600";
        const b1Text = block.buttonTextColor || "text-white";
        const b1Round = block.buttonRoundness || "rounded-2xl";
        const b1IsTailwindBg = b1Bg.startsWith("bg-");
        const b1IsTailwindText = b1Text.startsWith("text-");
 
        const b2Bg = block.button2BgColor || "bg-white/10";
        const b2Text = block.button2TextColor || "text-white";
        const b2Round = block.button2Roundness || "rounded-2xl";
        const b2IsTailwindBg = b2Bg.startsWith("bg-");
        const b2IsTailwindText = b2Text.startsWith("text-");

        const b1Width = block.buttonWidth || undefined;
        const b1Height = block.buttonHeight || undefined;
        const b1FontSize = block.buttonFontSize ? (/^\d+$/.test(block.buttonFontSize) ? `${block.buttonFontSize}px` : block.buttonFontSize) : (block.elementSizes?.["buttons"]?.fontSize || undefined);
        const b1LetterSpacing = block.buttonLetterSpacing || undefined;

        const b2Width = block.button2Width || undefined;
        const b2Height = block.button2Height || undefined;
        const b2FontSize = block.button2FontSize ? (/^\d+$/.test(block.button2FontSize) ? `${block.button2FontSize}px` : block.button2FontSize) : (block.elementSizes?.["buttons"]?.fontSize || undefined);
        const b2LetterSpacing = block.button2LetterSpacing || undefined;

        content = (
          <div className={`pt-4 flex flex-col sm:flex-row items-center ${block.align === "left" ? "justify-start" : block.align === "right" ? "justify-end" : "justify-center"} gap-4`}>
            {block.buttonText && (
              isEditModeActive ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: b1IsTailwindBg ? undefined : b1Bg,
                    color: b1IsTailwindText ? undefined : b1Text,
                    width: b1Width,
                    height: b1Height,
                    fontSize: b1FontSize,
                    letterSpacing: b1LetterSpacing,
                  }}
                  className={`relative shadow-lg shadow-blue-600/15 flex items-center justify-center gap-2 font-sans focus-within:ring-2 focus-within:ring-white px-6 py-3.5 ${b1Round} ${
                    b1IsTailwindBg ? b1Bg : ""
                  } ${b1IsTailwindText ? b1Text : ""}`}
                >
                  <input
                    type="text"
                    value={block.buttonText || ""}
                    onChange={async (e) => {
                      const newVal = e.target.value;
                      const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, buttonText: newVal } : b);
                      setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                      if (activeEditTarget && activeEditTarget.blockId === block.id) {
                        setActiveEditTarget((prev: any) => prev ? { ...prev, block: { ...prev.block, buttonText: newVal } as CMSBlock } : null);
                      }
                      await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEditModeActive) {
                        setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "buttons" });
                      }
                    }}
                    onFocus={() => {
                      if (isEditModeActive) {
                        setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "buttons" });
                      }
                    }}
                    style={{ 
                      color: b1IsTailwindText ? undefined : b1Text, 
                      fontSize: b1FontSize,
                      letterSpacing: b1LetterSpacing 
                    }}
                    className="bg-transparent border-0 focus:ring-0 p-0 text-center font-bold focus:outline-none min-w-[60px] max-w-full"
                  />
                  <ArrowRight className="w-4 h-4 shrink-0" />
                  
                  {/* Handle precisely on button 1 bottom-right */}
                  <div 
                    className="absolute bottom-1 right-1 w-4 h-4 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center cursor-se-resize z-50 transition shadow-md active:scale-95"
                    style={{ touchAction: "none" }}
                    onMouseDown={(e) => handleResizeStart(e, block, "button1")}
                  >
                    <span className="text-[9px] font-bold">↘</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    if (!isEditModeActive) {
                      e.stopPropagation();
                      handleLinkClick(block.buttonLink || "request_consult");
                    }
                  }}
                  style={{
                    backgroundColor: b1IsTailwindBg ? undefined : b1Bg,
                    color: b1IsTailwindText ? undefined : b1Text,
                    width: b1Width,
                    height: b1Height,
                    fontSize: b1FontSize,
                    letterSpacing: b1LetterSpacing,
                  }}
                  className={`shadow-lg shadow-blue-600/15 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 font-sans font-bold px-6 py-3.5 ${b1Round} ${
                    b1IsTailwindBg ? b1Bg : ""
                  } ${b1IsTailwindText ? b1Text : ""}`}
                >
                  {block.buttonText}
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              )
            )}
 
            {block.button2Text && (
              isEditModeActive ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: b2IsTailwindBg ? undefined : b2Bg,
                    color: b2IsTailwindText ? undefined : b2Text,
                    width: b2Width,
                    height: b2Height,
                    fontSize: b2FontSize,
                    letterSpacing: b2LetterSpacing,
                  }}
                  className={`relative shadow-lg border border-white/10 flex items-center justify-center gap-2 font-sans focus-within:ring-2 focus-within:ring-white px-6 py-3.5 ${b2Round} ${
                    b2IsTailwindBg ? b2Bg : ""
                  } ${b2IsTailwindText ? b2Text : ""}`}
                >
                  <input
                    type="text"
                    value={block.button2Text || ""}
                    onChange={async (e) => {
                      const newVal = e.target.value;
                      const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, button2Text: newVal } : b);
                      setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                      if (activeEditTarget && activeEditTarget.blockId === block.id) {
                        setActiveEditTarget((prev: any) => prev ? { ...prev, block: { ...prev.block, button2Text: newVal } as CMSBlock } : null);
                      }
                      await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEditModeActive) {
                        setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "buttons" });
                      }
                    }}
                    onFocus={() => {
                      if (isEditModeActive) {
                        setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "buttons" });
                      }
                    }}
                    style={{ 
                      color: b2IsTailwindText ? undefined : b2Text, 
                      fontSize: b2FontSize,
                      letterSpacing: b2LetterSpacing 
                    }}
                    className="bg-transparent border-0 focus:ring-0 p-0 text-center font-bold focus:outline-none min-w-[60px] max-w-full"
                  />
                  <ArrowRight className="w-4 h-4 shrink-0" />

                  {/* Handle precisely on button 2 bottom-right */}
                  <div 
                    className="absolute bottom-1 right-1 w-4 h-4 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center cursor-se-resize z-50 transition shadow-md active:scale-95"
                    style={{ touchAction: "none" }}
                    onMouseDown={(e) => handleResizeStart(e, block, "button2")}
                  >
                    <span className="text-[9px] font-bold">↘</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    if (!isEditModeActive) {
                      e.stopPropagation();
                      handleLinkClick(block.button2Link || "home");
                    }
                  }}
                  style={{
                    backgroundColor: b2IsTailwindBg ? undefined : b2Bg,
                    color: b2IsTailwindText ? undefined : b2Text,
                    width: b2Width,
                    height: b2Height,
                    fontSize: b2FontSize,
                    letterSpacing: b2LetterSpacing,
                  }}
                  className={`shadow-lg border border-white/10 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 font-sans font-bold px-6 py-3.5 ${b2Round} ${
                    b2IsTailwindBg ? b2Bg : ""
                  } ${b2IsTailwindText ? b2Text : ""}`}
                >
                  {block.button2Text}
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              )
            )}
          </div>
        );
      } else if (el === "iconImageUrl" && block.iconImageUrl) {
        const alignClass = block.align === "left" ? "justify-start" : block.align === "right" ? "justify-end" : "justify-center";
        content = (
          <div 
            onClick={(e) => {
              if (isEditModeActive) {
                e.stopPropagation();
                setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "icon" });
              }
            }}
            className={`flex ${alignClass} my-6 relative group/insg`}
          >
            <img 
              src={block.iconImageUrl} 
              alt="custom custom-svg decoration" 
              referrerPolicy="no-referrer"
              className="hover:scale-105 transition duration-150 cursor-pointer" 
              style={{
                width: block.iconWidth || undefined,
                height: block.iconHeight || undefined,
                maxHeight: block.iconHeight ? undefined : "140px",
                marginTop: block.iconMarginTop ? `${block.iconMarginTop}px` : undefined,
                marginBottom: block.iconMarginBottom ? `${block.iconMarginBottom}px` : undefined,
                transform: `translate(${block.iconPositionX || 0}px, ${block.iconPositionY || 0}px)`,
                borderRadius: block.iconRoundness || "0.25rem",
                objectFit: "contain"
              }}
            />
            {isEditModeActive && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[9px] px-2.5 py-1 rounded font-bold">
                1.svg 등 이미지 / 드래그 가능 ↕
              </div>
            )}
          </div>
        );
      }

      if (!content) return null;

      return (
        <div
          key={el}
          className={`w-full group/sub transition ${
            isEditModeActive 
              ? "hover:outline hover:outline-dashed hover:outline-blue-400 p-2 rounded-xl relative cursor-default" 
              : ""
          }`}
        >
          {isEditModeActive && (
            <>
              <button
                type="button"
                title="이 요소 삭제"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleDeleteSubElement(block.id, el);
                }}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover/sub:opacity-100 bg-red-600 hover:bg-red-700 text-white font-bold p-1 rounded-lg transition z-20 shadow-xs flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              {el !== "buttons" && (
                <div 
                  className="absolute bottom-1 right-1 w-5 h-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center cursor-se-resize z-45 opacity-0 group-hover/sub:opacity-100 transition shadow-md active:scale-90"
                  style={{ touchAction: "none" }}
                  onMouseDown={(e) => handleResizeStart(e, block, el)}
                >
                  <span className="text-[10px] font-bold">↘</span>
                </div>
              )}
            </>
          )}
          {content}
        </div>
      );
    });
  };

  const sectionAlignClass = block.align === "left" ? "text-left" : block.align === "right" ? "text-right" : "text-center";

  return (
    <section 
      onClick={(e) => {
        if (isEditModeActive) {
          e.stopPropagation();
          setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "block" });
        }
      }}
      className={`w-full ${sectionAlignClass} md:py-10 ${block.blockWidth || "max-w-5xl"} mx-auto space-y-4 relative ${
        isEditModeActive ? "cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-dashed hover:bg-blue-50/5 rounded-3xl p-6 transition" : ""
      }`}
    >
      {renderHeroSubElements(block, blockIdx)}

      {isEditModeActive && (
        <span className="absolute top-2 right-2 bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold pointer-events-none shadow-xs">
          텍스트 편집 & 드래그 순서 변경 가능
        </span>
      )}
    </section>
  );
};
