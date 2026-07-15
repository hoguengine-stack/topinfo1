import React from "react";
import { Radio, ArrowRight, Trash2, Check, Move } from "lucide-react";
import { CMSPage, CMSBlock } from "../../types";


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
  handleUpdateBlockData: (page: CMSPage, blockId: string, updatedData: Partial<CMSBlock>) => Promise<void>;
  db: any;
  variant?: "home-hero" | "home-cta" | "package" | "feature-story" | "standard";
  fallbackImageUrl?: string;
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
  handleUpdateBlockData,
  db,
  variant = "standard",
  fallbackImageUrl,
}) => {
  const isCenterLayout = block.layoutStyle === "column_center";
  const isLeftColumnLayout = block.layoutStyle === "column_left";
  const bannerBg = block.bgColor || "bg-slate-900";
  const isHomeHero = variant === "home-hero";
  const isHomeCta = variant === "home-cta";
  const isPackage = variant === "package";
  const isFeatureStory = variant === "feature-story";
  const effectiveImageUrl = block.imageUrl || fallbackImageUrl;

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
        const badgeAlign = block.badgeAlign || block.align || (isCenterLayout ? "center" : "left");
        const badgeJustifyClass = badgeAlign === "left" ? "justify-start" : badgeAlign === "right" ? "justify-end" : "justify-center";
        content = (
          <div
            className={`flex w-full ${badgeJustifyClass}`}
            style={{
              fontSize: block.elementSizes?.["badge"]?.fontSize || undefined,
              width: block.elementSizes?.["badge"]?.width || undefined,
            }}
          >
            <span className={`inline-flex min-h-8 items-center gap-2 border px-3 py-1 text-xs font-bold mb-2 ${
              isHomeCta
                ? "border-blue-200 bg-blue-50 text-blue-800 rounded-md"
                : "border-white/15 bg-white/10 text-blue-100 rounded-md"
            }`}>
              {block.badgeIconUrl ? (
                <img
                  src={block.badgeIconUrl}
                  alt="badge icon"
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 object-contain rounded shrink-0"
                />
              ) : (
                <Radio className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              {isEditModeActive ? (
                <input
                  type="text"
                  value={block.badge || ""}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    handleUpdateBlockData?.(page, block.id, { badge: newVal });
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
        const titleSize = block.titleSize || (
          isHomeHero
            ? "text-4xl md:text-6xl font-black"
            : isHomeCta
              ? "text-3xl md:text-4xl font-bold"
              : "text-2xl md:text-3xl font-black"
        );
        const titleColor = block.titleColor || (isHomeCta ? "text-slate-950" : "text-white");
        const titleAlign = block.titleAlign || block.align || (isCenterLayout ? "center" : "left");
        const titleAlignClass = titleAlign === "left" ? "text-left" : titleAlign === "right" ? "text-right" : "text-center";
        const HeadingTag = isHomeHero ? "h1" : "h2";

        content = isEditModeActive ? (
          <textarea
            value={block.title || ""}
            onChange={(e) => {
              const newVal = e.target.value;
              handleUpdateBlockData?.(page, block.id, { title: newVal });
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
            className={`w-full bg-white/10 hover:bg-white/20 border border-transparent focus:ring-1 focus:ring-blue-400 p-2 rounded-lg focus:outline-none resize-none leading-[1.18] ${titleColor} ${titleSize} ${titleAlignClass}`}
            rows={Math.max(2, (block.title || "").split('\n').reduce((acc, val) => acc + Math.max(1, Math.ceil(val.length / 28)), 0))}
            placeholder="배너 메인 타이틀"
          />
        ) : (
          <HeadingTag
            style={{
              fontSize: block.titleFontSize ? `${block.titleFontSize}pt` : (block.elementSizes?.["title"]?.fontSize || undefined),
              letterSpacing: block.titleLetterSpacing ? `${block.titleLetterSpacing}px` : undefined,
              width: block.elementSizes?.["title"]?.width || undefined,
            }}
            className={`${titleSize} leading-[1.18] whitespace-pre-line w-full block ${titleColor} ${titleAlignClass}`}
          >
            {block.title || "배너 타이틀을 입력하세요"}
          </HeadingTag>
        );
      } else if (el === "subtitle" && block.subtitle !== "") {
        const subtitleSize = block.subtitleSize || (isHomeHero ? "text-base md:text-lg" : "text-sm");
        const subtitleColor = block.subtitleColor || (isHomeCta ? "text-slate-600" : isHomeHero ? "text-slate-200" : "text-slate-400");
        const subtitleAlign = block.subtitleAlign || block.align || (isCenterLayout ? "center" : "left");
        const subtitleAlignClass = subtitleAlign === "left" ? "text-left" : subtitleAlign === "right" ? "text-right" : "text-center";
        const subtitleMxClass = subtitleAlign === "left" ? "mr-auto ml-0" : subtitleAlign === "right" ? "ml-auto mr-0" : "mx-auto";

        content = isEditModeActive ? (
          <textarea
            value={block.subtitle || ""}
            onChange={(e) => {
              const newVal = e.target.value;
              handleUpdateBlockData?.(page, block.id, { subtitle: newVal });
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
            className={`w-full bg-white/10 hover:bg-white/20 border border-transparent focus:ring-1 focus:ring-blue-400 p-2 rounded-lg focus:outline-none resize-none leading-relaxed max-w-2xl ${subtitleSize} ${subtitleColor} ${subtitleAlignClass} ${subtitleMxClass}`}
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
            className={`${subtitleSize} ${subtitleColor} leading-relaxed max-w-2xl w-full block ${subtitleAlignClass} ${subtitleMxClass}`}
          >
            {block.subtitle || "이곳에 배너의 상세 소개 한 줄 메릿을 작성하세요"}
          </p>
        );
      } else if (el === "buttons" && (block.buttonText || block.button2Text)) {
        const b1Bg = block.buttonBgColor || (isHomeCta ? "bg-blue-600" : "bg-white");
        const b1Text = block.buttonTextColor || (isHomeCta ? "text-white" : "text-slate-950");
        const b1Round = block.buttonRoundness || "rounded-lg";
        const b1IsTailwindBg = b1Bg.startsWith("bg-");
        const b1IsTailwindText = b1Text.startsWith("text-");

        const b2Bg = block.button2BgColor || "bg-white/10";
        const b2Text = block.button2TextColor || "text-white";
        const b2Round = block.button2Roundness || "rounded-lg";
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

        const buttonsAlign = block.buttonsAlign || block.align || (isCenterLayout ? "center" : "left");
        const buttonsAlignClass = buttonsAlign === "left" ? "justify-start" : buttonsAlign === "right" ? "justify-end" : "justify-center";

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
                    onChange={(e) => {
                      const newVal = e.target.value;
                      handleUpdateBlockData?.(page, block.id, { buttonText: newVal });
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
                    onChange={(e) => {
                      const newVal = e.target.value;
                      handleUpdateBlockData?.(page, block.id, { button2Text: newVal });
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

      const elAlign = el === "badge" ? (block.badgeAlign || block.align || (isCenterLayout ? "center" : "left"))
                    : el === "title" ? (block.titleAlign || block.align || (isCenterLayout ? "center" : "left"))
                    : el === "subtitle" ? (block.subtitleAlign || block.align || (isCenterLayout ? "center" : "left"))
                    : el === "buttons" ? (block.buttonsAlign || block.align || (isCenterLayout ? "center" : "left"))
                    : el === "iconImageUrl" ? (block.align || (isCenterLayout ? "center" : "left"))
                    : (block.align || "center");

      const subAlignClass = elAlign === "left" ? "items-start text-left" : elAlign === "right" ? "items-end text-right" : "items-center text-center";
      const isTextElement = el === "badge" || el === "title" || el === "subtitle";
      const elementWidth = isTextElement ? block.elementSizes?.[el]?.width : undefined;
      const getTextControlRight = (offset: string) => {
        if (!elementWidth) return undefined;
        if (elAlign === "left") return `calc(100% - ${elementWidth} + ${offset})`;
        if (elAlign === "right") return offset;
        return `calc((100% - ${elementWidth}) / 2 + ${offset})`;
      };

      return (
        <div
          key={el}
          className={`w-full flex flex-col group/sub transition ${subAlignClass} ${
            isEditModeActive
              ? isTextElement
                ? "relative cursor-default"
                : "hover:outline hover:outline-dashed hover:outline-blue-400 p-1.5 rounded-lg relative cursor-default"
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
                style={isTextElement ? { right: getTextControlRight("0.375rem") } : undefined}
              >
                <Trash2 className="w-3 h-3" />
              </button>
              {el !== "buttons" && (
                <div
                  className="absolute bottom-1 right-1 w-5 h-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center cursor-se-resize z-45 opacity-0 group-hover/sub:opacity-100 transition shadow-md active:scale-90"
                  style={{
                    touchAction: "none",
                    ...(isTextElement ? { right: getTextControlRight("0.25rem") } : {})
                  }}
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

  const hasSideImage = block.bannerLayout === "side-image" && effectiveImageUrl;
  const hasBgImage = block.bannerLayout === "bg-image" && effectiveImageUrl;
  const hasWatermark = block.bannerLayout === "watermark" && effectiveImageUrl;

  const bannerStyle: React.CSSProperties = hasBgImage ? {
    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.85)), url(${effectiveImageUrl})`,
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

  const renderEditControls = () => isEditModeActive ? (
    <>
      <button
        type="button"
        title="배너 이동 (상하좌우 드래그)"
        style={{ touchAction: "none" }}
        onMouseDown={(e) => handleResizeStart(e, block, "block-position")}
        className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-3 py-2 rounded-md text-[10px] font-bold shadow-lg flex items-center gap-1.5 cursor-move z-40 transition"
      >
        <Move className="w-3 h-3" aria-hidden="true" />
        <span>이동</span>
      </button>
      <span className="absolute top-3 right-24 bg-slate-950 border border-white/15 text-slate-200 px-2.5 py-2 rounded-md text-[10px] font-bold pointer-events-none shadow-xs z-40">
        텍스트 편집 · 순서 변경
      </span>
    </>
  ) : null;

  const renderStoryItems = (storyBlock: CMSBlock) => {
    if (!storyBlock.items?.length && !isEditModeActive) return null;

    return (
      <div className="mt-4 grid w-full gap-3 sm:grid-cols-2">
        {(storyBlock.items || []).map((item, itemIndex) => (
          <div key={`${item.title}-${itemIndex}`} className="flex items-start gap-3 border-t border-slate-300 pt-3 text-left">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              {isEditModeActive ? (
                <>
                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={(e) => {
                      const nextItems = [...(storyBlock.items || [])];
                      nextItems[itemIndex] = { ...nextItems[itemIndex], title: e.target.value };
                      handleUpdateBlockData(page, storyBlock.id, { items: nextItems });
                    }}
                    className="w-full rounded-md border border-dashed border-blue-300 bg-white px-2 py-1 text-sm font-bold text-slate-900"
                  />
                  <textarea
                    value={item.desc || ""}
                    onChange={(e) => {
                      const nextItems = [...(storyBlock.items || [])];
                      nextItems[itemIndex] = { ...nextItems[itemIndex], desc: e.target.value };
                      handleUpdateBlockData(page, storyBlock.id, { items: nextItems });
                    }}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-md border border-dashed border-blue-200 bg-white px-2 py-1 text-xs leading-5 text-slate-600"
                  />
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  {item.desc && <p className="mt-1 text-xs leading-5 text-slate-600">{item.desc}</p>}
                </>
              )}
            </div>
          </div>
        ))}
        {isEditModeActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateBlockData(page, storyBlock.id, {
                items: [...(storyBlock.items || []), { title: "새 항목", desc: "설명을 입력하세요." }],
              });
            }}
            className="min-h-12 rounded-md border border-dashed border-blue-400 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"
          >
            항목 추가
          </button>
        )}
      </div>
    );
  };

  if (isHomeHero) {
    const heroBlock: CMSBlock = {
      ...block,
      align: "left",
      titleAlign: block.titleAlign || "left",
      subtitleAlign: block.subtitleAlign || "left",
      badgeAlign: block.badgeAlign || "left",
      buttonsAlign: block.buttonsAlign || "left",
      layoutStyle: "column_left",
      buttonRoundness: block.buttonRoundness === "rounded-full" ? "rounded-lg" : block.buttonRoundness,
    };
    const heroImageUrl = effectiveImageUrl
      ?.replace(/w=\d+/, "w=1800")
      .replace(/q=\d+/, "q=85");

    return (
      <section
        onClick={(e) => {
          if (isEditModeActive) {
            e.stopPropagation();
            setActiveEditTarget({ type: "hero", pageId: page.id, page, blockId: block.id, block, selectedElement: "block" });
          }
        }}
        className={`site-home-hero relative flex w-full overflow-hidden bg-[#0b1830] text-white ${isEditModeActive ? "cursor-pointer" : ""}`}
      >
        {heroImageUrl && (
          <img
            src={heroImageUrl}
            alt="탑정보통신 결제기기 서비스 현장"
            referrerPolicy="no-referrer"
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-[#071427]/80" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center px-5 py-12 md:px-8 md:py-20">
          <div
            className="flex w-full max-w-[760px] flex-col items-start gap-3 text-left"
            onClick={(e) => isEditModeActive && e.stopPropagation()}
          >
            {renderBannerSubElements(heroBlock, blockIdx)}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 z-20 h-1 w-28 bg-[#22a68a]" aria-hidden="true" />
        {renderEditControls()}
      </section>
    );
  }

  if (isPackage || isFeatureStory) {
    const storyBlock: CMSBlock = {
      ...block,
      align: "left",
      titleAlign: block.titleAlign || "left",
      subtitleAlign: block.subtitleAlign || "left",
      badgeAlign: block.badgeAlign || "left",
      buttonsAlign: block.buttonsAlign || "left",
      layoutStyle: "column_left",
      titleColor: block.titleColor || "text-slate-950",
      subtitleColor: block.subtitleColor || "text-slate-600",
      buttonBgColor: block.buttonBgColor || "bg-blue-600",
      buttonTextColor: block.buttonTextColor || "text-white",
      buttonRoundness: block.buttonRoundness || "rounded-lg",
      button2BgColor: block.button2BgColor || "bg-white",
      button2TextColor: block.button2TextColor || "text-slate-900",
      button2Roundness: block.button2Roundness || "rounded-lg",
    };
    const imageOnLeft = block.bannerImagePosition === "left";
    const storyImageUrl = effectiveImageUrl
      ?.replace(/w=\d+/, "w=1400")
      .replace(/q=\d+/, "q=85");

    return (
      <section
        onClick={(e) => {
          if (isEditModeActive) {
            e.stopPropagation();
            setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "block" });
          }
        }}
        className={`relative w-full overflow-hidden border-y border-slate-200 ${
          isPackage ? "bg-[#edf4fb]" : blockIdx % 2 === 0 ? "bg-white" : "bg-[#f7f9fc]"
        } ${isEditModeActive ? "cursor-pointer" : ""}`}
      >
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-2 lg:gap-16">
          <div
            className={`flex w-full flex-col items-start gap-2 text-left ${imageOnLeft ? "lg:order-2" : "lg:order-1"}`}
            onClick={(e) => isEditModeActive && e.stopPropagation()}
          >
            {renderBannerSubElements(storyBlock, blockIdx)}
            {renderStoryItems(storyBlock)}
          </div>
          <div className={`${imageOnLeft ? "lg:order-1" : "lg:order-2"}`}>
            {storyImageUrl ? (
              <img
                src={storyImageUrl}
                alt={block.title ? `${block.title.replace(/\n/g, " ")} 안내 이미지` : "탑정보통신 서비스 안내 이미지"}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="aspect-[4/3] w-full rounded-lg border border-slate-200 bg-white object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm font-bold text-slate-400">
                이미지 영역
              </div>
            )}
          </div>
        </div>
        {renderEditControls()}
      </section>
    );
  }

  if (isHomeCta) {
    const ctaBlock: CMSBlock = {
      ...block,
      align: "left",
      titleAlign: block.titleAlign || "left",
      subtitleAlign: block.subtitleAlign || "left",
      badgeAlign: block.badgeAlign || "left",
      buttonsAlign: block.buttonsAlign || "left",
      layoutStyle: "column_left",
      titleColor: block.titleColor || "text-slate-950",
      subtitleColor: block.subtitleColor || "text-slate-600",
      buttonBgColor: block.buttonBgColor === "bg-white" ? "bg-blue-600" : block.buttonBgColor,
      buttonTextColor: block.buttonTextColor || "text-white",
      buttonRoundness: block.buttonRoundness || "rounded-lg",
    };

    return (
      <section
        onClick={(e) => {
          if (isEditModeActive) {
            e.stopPropagation();
            setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "block" });
          }
        }}
        className={`relative w-full overflow-hidden border-y border-[#cbd9e8] bg-[#e8f0f8] ${isEditModeActive ? "cursor-pointer" : ""}`}
      >
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start px-5 py-14 md:px-8 md:py-20">
          <div className="flex w-full max-w-[820px] flex-col items-start gap-2 text-left" onClick={(e) => isEditModeActive && e.stopPropagation()}>
            {renderBannerSubElements(ctaBlock, blockIdx)}
          </div>
        </div>
        {renderEditControls()}
      </section>
    );
  }

  return (
    <section
      onClick={(e) => {
        if (isEditModeActive) {
          e.stopPropagation();
          setActiveEditTarget({ type: "banner", pageId: page.id, page, blockId: block.id, block, selectedElement: "block" });
        }
      }}
      style={bannerStyle}
      className={`text-white rounded-lg border border-white/10 p-7 md:p-11 shadow-sm transition-all ${bannerBg} flex relative w-full overflow-hidden ${
        isEditModeActive ? "cursor-pointer" : ""
      } ${bannerAlignClass}`}
    >
      {/* Visual Watermark background effect */}
      {hasWatermark && (
        <img
          src={effectiveImageUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute right-[-4%] bottom-[-5%] w-[180px] h-[180px] object-contain opacity-10 pointer-events-none select-none"
          style={customImageStyle}
        />
      )}

      {/* Split Column layout or Standard block layout */}
      {hasSideImage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full my-1">
          {block.bannerImagePosition === "left" && (
            <div className="w-full flex justify-center">
              <img
                src={effectiveImageUrl}
                alt={block.title ? `${block.title.replace(/\n/g, " ")} 관련 이미지` : "탑정보통신 서비스 이미지"}
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
                src={effectiveImageUrl}
                alt={block.title ? `${block.title.replace(/\n/g, " ")} 관련 이미지` : "탑정보통신 서비스 이미지"}
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
          {block.bannerLayout === "inline" && effectiveImageUrl && block.bannerImagePosition === "top" && (
            <div className={`w-full flex ${
              block.align === "left" ? "justify-start" : block.align === "right" ? "justify-end" : "justify-center"
            } mb-2`}>
              <img
                src={effectiveImageUrl}
                alt={block.title ? `${block.title.replace(/\n/g, " ")} 관련 이미지` : "탑정보통신 서비스 이미지"}
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
          {block.bannerLayout === "inline" && effectiveImageUrl && block.bannerImagePosition !== "top" && (
            <div className={`w-full flex ${
              block.align === "left" ? "justify-start" : block.align === "right" ? "justify-end" : "justify-center"
            } mt-2`}>
              <img
                src={effectiveImageUrl}
                alt={block.title ? `${block.title.replace(/\n/g, " ")} 관련 이미지` : "탑정보통신 서비스 이미지"}
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
                  onChange={(e) => {
                    const newVal = e.target.value;
                    const currentItems = [...(block.items || [])];
                    currentItems[bIdx] = { ...currentItems[bIdx], title: newVal };
                    handleUpdateBlockData?.(page, block.id, { items: currentItems });
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

      {renderEditControls()}
    </section>
  );
};
