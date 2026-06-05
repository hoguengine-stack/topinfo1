import React from "react";
import { Sparkles, ArrowRight, Trash2, Check } from "lucide-react";
import { CMSPage, CMSBlock } from "../../types";
import { updateDoc, doc } from "firebase/firestore";

interface BannerBlockProps {
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

export const BannerBlock: React.FC<BannerBlockProps> = ({
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
  const renderBannerSubElements = (block: CMSBlock, blockIdx: number) => {
    const list = block.elementOrder || ["badge", "title", "subtitle", "buttons", "iconImageUrl"];
    const mandatory = ["badge", "title", "subtitle", "buttons", "iconImageUrl"];
    const merged = [...list];
    mandatory.forEach(m => {
      if (!merged.includes(m)) merged.push(m);
    });

    return merged.map((el) => {
      let content = null;
      if (el === "badge" && block.badge) {
        content = (
          <div
            style={{
              fontSize: block.elementSizes?.["badge"]?.fontSize || undefined,
              width: block.elementSizes?.["badge"]?.width || undefined,
            }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-blue-300 rounded-full text-xs font-bold mb-2 border border-white/5 uppercase tracking-widest">
              {block.badgeIconUrl ? (
                <img 
                  src={block.badgeIconUrl} 
                  alt="badge icon" 
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 object-contain rounded shrink-0" 
                />
              ) : (
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300" /> 
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
                      setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "badge" });
                    }
                  }}
                  onFocus={() => {
                    if (isEditModeActive) {
                      setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "badge" });
                    }
                  }}
                  className="bg-transparent border-0 focus:ring-0 p-0 font-bold focus:outline-none text-blue-300 text-xs text-center"
                  style={{ width: `${Math.max(4, (block.badge || "").length) * 8}px` }}
                />
              ) : (
                block.badge
              )}
            </span>
          </div>
        );
      } else if (el === "title" && block.title !== "") {
        const titleSize = block.titleSize || "text-2xl md:text-3xl font-black";
        const titleColor = block.titleColor || "text-white";
 
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
                setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "title" });
              }
            }}
            onFocus={() => {
              if (isEditModeActive) {
                setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "title" });
              }
            }}
            style={{
              fontSize: block.titleFontSize ? `${block.titleFontSize}pt` : (block.elementSizes?.["title"]?.fontSize || undefined),
              letterSpacing: block.titleLetterSpacing ? `${block.titleLetterSpacing}px` : undefined,
              width: block.elementSizes?.["title"]?.width || undefined,
            }}
            className={`w-full bg-white/10 hover:bg-white/20 border border-transparent focus:ring-1 focus:ring-blue-400 p-2 rounded-xl focus:outline-none resize-none leading-normal font-sans text-white ${titleSize}`}
            rows={Math.max(2, (block.title || "").split('\n').reduce((acc, val) => acc + Math.max(1, Math.ceil(val.length / 28)), 0))}
            placeholder="배너 메인 타이틀"
          />
        ) : (
          <h3 
            style={{
              fontSize: block.titleFontSize ? `${block.titleFontSize}pt` : (block.elementSizes?.["title"]?.fontSize || undefined),
              letterSpacing: block.titleLetterSpacing ? `${block.titleLetterSpacing}px` : undefined,
              width: block.elementSizes?.["title"]?.width || undefined,
            }}
            className={`${titleSize} leading-normal whitespace-pre-line ${titleColor}`}
          >
            {block.title || "배너 타이틀을 입력하세요"}
          </h3>
        );
      } else if (el === "subtitle" && block.subtitle !== "") {
        const subtitleSize = block.subtitleSize || "text-sm";
        const subtitleColor = block.subtitleColor || "text-slate-400";
 
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
                setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "subtitle" });
              }
            }}
            onFocus={() => {
              if (isEditModeActive) {
                setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "subtitle" });
              }
            }}
            style={{
              fontSize: block.subtitleFontSize ? `${block.subtitleFontSize}pt` : (block.elementSizes?.["subtitle"]?.fontSize || undefined),
              letterSpacing: block.subtitleLetterSpacing ? `${block.subtitleLetterSpacing}px` : undefined,
              width: block.elementSizes?.["subtitle"]?.width || undefined,
            }}
            className={`w-full bg-white/10 hover:bg-white/20 border border-transparent focus:ring-1 focus:ring-blue-400 p-2 rounded-xl focus:outline-none resize-none leading-relaxed font-sans max-w-2xl ${subtitleSize} ${subtitleColor}`}
            rows={Math.max(2, (block.subtitle || "").split('\n').reduce((acc, val) => acc + Math.max(1, Math.ceil(val.length / 45)), 0))}
            placeholder="배너 상세 설명"
          />
        ) : (
          <p 
            style={{
              fontSize: block.subtitleFontSize ? `${block.subtitleFontSize}pt` : (block.elementSizes?.["subtitle"]?.fontSize || undefined),
              letterSpacing: block.subtitleLetterSpacing ? `${block.subtitleLetterSpacing}px` : undefined,
              width: block.elementSizes?.["subtitle"]?.width || undefined,
            }}
            className={`${subtitleSize} ${subtitleColor} leading-relaxed max-w-2xl`}
          >
            {block.subtitle || "이곳에 배너의 상세 소개 한 줄 메릿을 작성하세요"}
          </p>
        );
      } else if (el === "buttons" && (block.buttonText || block.button2Text)) {
        const b1Bg = block.buttonBgColor || "bg-white";
        const b1Text = block.buttonTextColor || "text-slate-950";
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
 
        const buttonsAlignClass = block.align ? (block.align === "left" ? "justify-start" : block.align === "right" ? "justify-end" : "justify-center") : (isCenterLayout ? "justify-center" : "justify-start");

        content = (
          <div className={`shrink-0 flex flex-wrap gap-4 items-center w-full md:w-auto mt-4 md:mt-2 ${buttonsAlignClass}`}>
            {block.buttonText && (
              isEditModeActive ? (
                <div 
                  style={{
                    backgroundColor: b1IsTailwindBg ? undefined : b1Bg,
                    color: b1IsTailwindText ? undefined : b1Text,
                    width: b1Width,
                    height: b1Height,
                    fontSize: b1FontSize,
                    letterSpacing: b1LetterSpacing,
                  }}
                  className={`relative font-semibold px-6 py-3.5 shadow-xl flex items-center justify-center border border-white/10 focus-within:ring-2 focus-within:ring-white ${b1Round} ${
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
                        setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "buttons" });
                      }
                    }}
                    onFocus={() => {
                      if (isEditModeActive) {
                        setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "buttons" });
                      }
                    }}
                    style={{ 
                      color: b1IsTailwindText ? undefined : b1Text,
                      fontSize: b1FontSize,
                      letterSpacing: b1LetterSpacing,
                    }}
                    className="bg-transparent border-0 focus:ring-0 p-0 text-center font-bold focus:outline-none min-w-[60px] max-w-full"
                  />
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1.5" />

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
                  className={`font-bold px-6 py-3.5 shadow-xl whitespace-nowrap active:scale-95 transition shrink-0 w-full sm:w-auto flex items-center justify-center gap-1.5 ${b1Round} ${
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
                  style={{
                    backgroundColor: b2IsTailwindBg ? undefined : b2Bg,
                    color: b2IsTailwindText ? undefined : b2Text,
                    width: b2Width,
                    height: b2Height,
                    fontSize: b2FontSize,
                    letterSpacing: b2LetterSpacing,
                  }}
                  className={`relative font-semibold px-6 py-3.5 shadow-xl flex items-center justify-center border border-white/10 focus-within:ring-2 focus-within:ring-white ${b2Round} ${
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
                        setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "buttons" });
                      }
                    }}
                    onFocus={() => {
                      if (isEditModeActive) {
                        setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "buttons" });
                      }
                    }}
                    style={{ 
                      color: b2IsTailwindText ? undefined : b2Text,
                      fontSize: b2FontSize,
                      letterSpacing: b2LetterSpacing,
                    }}
                    className="bg-transparent border-0 focus:ring-0 p-0 text-center font-bold focus:outline-none min-w-[60px] max-w-full"
                  />

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
                  className={`font-bold px-6 py-3.5 shadow-xl whitespace-nowrap active:scale-95 transition shrink-0 w-full sm:w-auto flex items-center justify-center gap-1.5 ${b2Round} ${
                    b2IsTailwindBg ? b2Bg : ""
                  } ${b2IsTailwindText ? b2Text : ""}`}
                >
                  {block.button2Text}
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
                setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "icon" });
              }
            }}
            className={`flex ${alignClass} my-4 relative group/insg`}
          >
            <img 
              src={block.iconImageUrl} 
              alt="custom custom-svg decoration" 
              referrerPolicy="no-referrer"
              className="hover:scale-105 transition duration-150 cursor-pointer" 
              style={{
                width: block.iconWidth || undefined,
                height: block.iconHeight || undefined,
                maxHeight: block.iconHeight ? undefined : "100px",
                marginTop: block.iconMarginTop ? `${block.iconMarginTop}px` : undefined,
                marginBottom: block.iconMarginBottom ? `${block.iconMarginBottom}px` : undefined,
                transform: `translate(${block.iconPositionX || 0}px, ${block.iconPositionY || 0}px)`,
                borderRadius: block.iconRoundness || "0.25rem",
                objectFit: "contain"
              }}
            />
            {isEditModeActive && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[8px] px-2 py-0.5 rounded font-bold">
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
              ? "hover:outline hover:outline-dashed hover:outline-blue-400 p-1.5 rounded-lg relative cursor-default" 
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

  const isCenterLayout = block.layoutStyle === "column_center";
  const isLeftColumnLayout = block.layoutStyle === "column_left";

  const bannerBg = block.bgColor || "bg-slate-900";
  const hasSideImage = block.bannerLayout === "side-image" && block.imageUrl;
  const hasBgImage = block.bannerLayout === "bg-image" && block.imageUrl;
  const hasWatermark = block.bannerLayout === "watermark" && block.imageUrl;

  const bannerStyle: React.CSSProperties = hasBgImage ? {
    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.85)), url(${block.imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  } : {};

  const customImageStyle: React.CSSProperties = {
    width: block.imageWidth || undefined,
    height: block.imageHeight || undefined,
    marginTop: block.imageMarginTop ? `${block.imageMarginTop}px` : undefined,
    marginBottom: block.imageMarginBottom ? `${block.imageMarginBottom}px` : undefined,
    transform: `translate(${block.imagePositionX || 0}px, ${block.imagePositionY || 0}px) rotate(${block.imageRotation || 0}deg)`,
    borderRadius: block.imageRoundness || undefined,
    objectFit: "contain",
  };

  const bannerAlignClass = block.align 
    ? (block.align === "left" ? "flex-col items-start text-left gap-6" : block.align === "right" ? "flex-col items-end text-right gap-6" : "flex-col items-center text-center gap-6")
    : (block.blockAlign 
        ? block.blockAlign 
        : isCenterLayout 
          ? "flex-col items-center text-center gap-6" 
          : isLeftColumnLayout 
            ? "flex-col items-start text-left gap-6" 
            : "flex-col md:flex-row md:items-center justify-between gap-8 text-left");

  const bannerTextAlignClass = block.align 
    ? (block.align === "left" ? "items-start text-left" : block.align === "right" ? "items-end text-right" : "items-center text-center")
    : (isCenterLayout ? "items-center text-center" : isLeftColumnLayout ? "items-start text-left" : "items-start text-left");

  return (
    <section 
      onClick={(e) => {
        if (isEditModeActive) {
          e.stopPropagation();
          setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "block" });
        }
      }}
      style={bannerStyle}
      className={`text-white rounded-3xl p-8 md:p-12 shadow-lg shadow-slate-955/20 transition-all ${bannerBg} flex relative w-full overflow-hidden ${
        isEditModeActive ? "cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-dashed" : ""
      } ${bannerAlignClass}`}
    >
      {/* Visual Watermark background effect */}
      {hasWatermark && (
        <img 
          src={block.imageUrl} 
          alt="watermark illustration" 
          referrerPolicy="no-referrer"
          className="absolute right-[-4%] bottom-[-5%] w-[180px] h-[180px] object-contain opacity-10 pointer-events-none select-none animate-pulse" 
          style={customImageStyle}
        />
      )}

      {/* Split Column layout or Standard block layout */}
      {hasSideImage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full my-1">
          {block.bannerImagePosition === "left" && (
            <div className="w-full flex justify-center">
              <img 
                src={block.imageUrl} 
                alt="banner illustration" 
                referrerPolicy="no-referrer"
                className="rounded-2xl transition duration-150 hover:scale-[1.01]" 
                style={{
                  maxHeight: "280px",
                  ...customImageStyle
                }}
              />
            </div>
          )}

          <div className="space-y-4 w-full border-0">
            {renderBannerSubElements(block, blockIdx)}
          </div>

          {block.bannerImagePosition !== "left" && (
            <div className="w-full flex justify-center">
              <img 
                src={block.imageUrl} 
                alt="banner illustration" 
                referrerPolicy="no-referrer"
                className="rounded-2xl transition duration-150 hover:scale-[1.01]" 
                style={{
                  maxHeight: "280px",
                  ...customImageStyle
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className={`flex-1 space-y-4 w-full flex flex-col ${bannerTextAlignClass}`} onClick={(e) => isEditModeActive && e.stopPropagation()}>
          
          {/* Inline Image on TOP */}
          {block.bannerLayout === "inline" && block.imageUrl && block.bannerImagePosition === "top" && (
            <div className={`w-full flex ${
              block.align === "left" ? "justify-start" : block.align === "right" ? "justify-end" : "justify-center"
            } mb-2`}>
              <img 
                src={block.imageUrl} 
                alt="inline banner illustration" 
                referrerPolicy="no-referrer"
                className="rounded-2xl transition hover:scale-[1.02]" 
                style={{
                  maxHeight: "180px",
                  ...customImageStyle
                }}
              />
            </div>
          )}

          {renderBannerSubElements(block, blockIdx)}

          {/* Inline Image on BOTTOM */}
          {block.bannerLayout === "inline" && block.imageUrl && block.bannerImagePosition !== "top" && (
            <div className={`w-full flex ${
              block.align === "left" ? "justify-start" : block.align === "right" ? "justify-end" : "justify-center"
            } mt-2`}>
              <img 
                src={block.imageUrl} 
                alt="inline banner illustration" 
                referrerPolicy="no-referrer"
                className="rounded-2xl transition hover:scale-[1.02]" 
                style={{
                  maxHeight: "180px",
                  ...customImageStyle
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Additional list items helper for Banner */}
      {block.items && block.items.length > 0 && (
        <div className={`flex flex-wrap gap-x-4 gap-y-2 pt-3 text-xs w-full ${
          isCenterLayout ? "justify-center" : "justify-start"
        }`}>
          {(block.items || []).map((bItem, bIdx) => (
            <span 
              key={bIdx} 
              className="flex items-center gap-1.5 font-semibold text-slate-200 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl shadow-3xs"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {isEditModeActive ? (
                <input
                  type="text"
                  value={bItem.title || ""}
                  onChange={async (e) => {
                    const newVal = e.target.value;
                    const currentItems = [...(block.items || [])];
                    currentItems[bIdx] = { ...currentItems[bIdx], title: newVal };
                    const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, items: currentItems } : b);
                    setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                    if (activeEditTarget && activeEditTarget.blockId === block.id) {
                      setActiveEditTarget((prev: any) => prev ? { ...prev, block: { ...prev.block, items: currentItems } as CMSBlock } : null);
                    }
                    await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isEditModeActive) {
                      setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "bullet" });
                    }
                  }}
                  onFocus={() => {
                    if (isEditModeActive) {
                      setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "bullet" });
                    }
                  }}
                  className="bg-transparent border-0 focus:ring-0 p-0 text-slate-100 font-semibold focus:outline-none text-xs min-w-[50px] text-center"
                  style={{ width: `${Math.max(4, (bItem.title || "").length) * 8}px` }}
                />
              ) : (
                <span>{bItem.title}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {isEditModeActive && (
        <span className="absolute top-2 right-2 bg-slate-900 border border-white/15 text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold pointer-events-none shadow-xs font-sans">
          텍스트 편집 & 드래그 순서 변경 가능
        </span>
      )}
    </section>
  );
};
