import React from "react";
import { ChevronUp, ChevronDown, Trash2, Settings } from "lucide-react";
import { CMSPage, CMSBlock } from "../types";
import { updateDoc, doc } from "firebase/firestore";

// Import modular block renderers
import { HeroBlock } from "./block_renderers/HeroBlock";
import { FeaturesBlock } from "./block_renderers/FeaturesBlock";
import { TextBlock } from "./block_renderers/TextBlock";
import { BannerBlock } from "./block_renderers/BannerBlock";
import { DividerBlock } from "./block_renderers/DividerBlock";
import { ImageBlock } from "./block_renderers/ImageBlock";

interface WebsiteBlockRendererProps {
  page: CMSPage;
  pages: CMSPage[];
  setPages: (pages: CMSPage[]) => void;
  isEditModeActive: boolean;
  activeEditTarget: any;
  setActiveEditTarget: (target: any) => void;
  showAddBlockMenuAtIndex: { pageId: string; index: number } | null;
  setShowAddBlockMenuAtIndex: (val: any) => void;
  handleMoveBlockUp: (page: CMSPage, index: number) => void;
  handleMoveBlockDown: (page: CMSPage, index: number) => void;
  handleDeleteBlock: (page: CMSPage, index: number) => void;
  handleInsertBlock: (page: CMSPage, index: number, type: "hero" | "features" | "text" | "banner" | "image" | "divider") => void;
  handleLinkClick: (slug: string) => void;
  db: any;
}

export const WebsiteBlockRenderer: React.FC<WebsiteBlockRendererProps> = ({
  page,
  pages,
  setPages,
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
  db,
}) => {
  // Page-level Context Menu states
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    blockIndex: number;
    pageId: string;
  } | null>(null);

  React.useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  const handleResizeStart = (e: React.MouseEvent, block: CMSBlock, elementKey: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    if (elementKey === "button1" || elementKey === "button2") {
      const isB1 = elementKey === "button1";
      const currentWidthStr = isB1 ? (block.buttonWidth || "180px") : (block.button2Width || "180px");
      const currentHeightStr = isB1 ? (block.buttonHeight || "56px") : (block.button2Height || "56px");
      const currentWidth = parseInt(currentWidthStr) || 180;
      const currentHeight = parseInt(currentHeightStr) || 56;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const newWidth = Math.max(50, currentWidth + dx);
        const newHeight = Math.max(20, currentHeight + dy);

        const updatedBlocks = page.blocks.map(b => 
          b.id === block.id 
            ? { 
                ...b, 
                [isB1 ? "buttonWidth" : "button2Width"]: `${newWidth}px`, 
                [isB1 ? "buttonHeight" : "button2Height"]: `${newHeight}px` 
              } 
            : b
        );
        setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
      };

      const onMouseUp = async () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        await updateDoc(doc(db, "cms_pages", page.id), { blocks: page.blocks });
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return;
    }

    if (elementKey === "iconImageUrl") {
      const currentWidthStr = block.iconWidth || "120px";
      const currentHeightStr = block.iconHeight || "120px";
      const currentWidth = parseInt(currentWidthStr) || 120;
      const currentHeight = parseInt(currentHeightStr) || 120;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const newWidth = Math.max(30, currentWidth + dx);
        const newHeight = Math.max(30, currentHeight + dy);

        const updatedBlocks = page.blocks.map(b => 
          b.id === block.id 
            ? { ...b, iconWidth: `${newWidth}px`, iconHeight: `${newHeight}px` } 
            : b
        );
        setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
      };

      const onMouseUp = async () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        await updateDoc(doc(db, "cms_pages", page.id), { blocks: page.blocks });
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return;
    }

    if (block.type === "image" && elementKey === "image") {
      const currentWidthStr = block.imageWidth || "600px";
      const currentHeightStr = block.imageHeight || "400px";
      const currentWidth = parseInt(currentWidthStr) || 600;
      const currentHeight = parseInt(currentHeightStr) || 400;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const newWidth = Math.max(40, currentWidth + dx);
        const newHeight = Math.max(40, currentHeight + dy);

        const updatedBlocks = page.blocks.map(b => 
          b.id === block.id 
            ? { ...b, imageWidth: `${newWidth}px`, imageHeight: `${newHeight}px` } 
            : b
        );
        setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
      };

      const onMouseUp = async () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        await updateDoc(doc(db, "cms_pages", page.id), { blocks: page.blocks });
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return;
    }

    if (block.type === "divider" && elementKey === "divider") {
      const currentHeightStr = block.imageHeight || "2px";
      const currentHeight = parseInt(currentHeightStr) || 2;
      const currentMarginTop = parseInt(block.imageMarginTop || "24") || 24;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const newHeight = Math.max(1, Math.min(20, currentHeight + Math.floor(dy / 5)));
        const newMargin = Math.max(4, Math.min(120, currentMarginTop + Math.floor(dx / 4)));

        const updatedBlocks = page.blocks.map(b => 
          b.id === block.id 
            ? { ...b, imageHeight: `${newHeight}px`, imageMarginTop: `${newMargin}`, imageMarginBottom: `${newMargin}` } 
            : b
        );
        setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
      };

      const onMouseUp = async () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        await updateDoc(doc(db, "cms_pages", page.id), { blocks: page.blocks });
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return;
    }

    const currentSizes = block.elementSizes || {};
    const elSize = currentSizes[elementKey] || {};
    
    let currentWidth = 100;
    if (elSize.width && elSize.width.endsWith("%")) {
      currentWidth = parseInt(elSize.width) || 100;
    }
    
    let currentFontSize = 16;
    if (elementKey === "title") {
      currentFontSize = block.type === "hero" ? 48 : 28;
    } else if (elementKey === "subtitle") {
      currentFontSize = 16;
    } else if (elementKey === "badge") {
      currentFontSize = 12;
    }
    
    if (elSize.fontSize && elSize.fontSize.endsWith("px")) {
      currentFontSize = parseInt(elSize.fontSize) || currentFontSize;
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const newWidth = Math.min(100, Math.max(20, currentWidth + Math.floor(dx / 5)));
      const newFontSize = Math.max(9, currentFontSize + Math.floor(dy / 4));

      const newElementSizes = {
        ...currentSizes,
        [elementKey]: {
          ...elSize,
          width: elementKey === "buttons" ? undefined : `${newWidth}%`,
          fontSize: `${newFontSize}px`
        }
      };

      const updatedBlocks = page.blocks.map(b => 
        b.id === block.id 
          ? { ...b, elementSizes: newElementSizes } 
          : b
      );
      setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
    };

    const onMouseUp = async () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      await updateDoc(doc(db, "cms_pages", page.id), { blocks: page.blocks });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleDeleteSubElement = async (blockId: string, el: string) => {
    try {
      const updatedBlocks = page.blocks.map(b => {
        if (b.id === blockId) {
          const updated = { ...b };
          if (el === "badge") {
            updated.badge = "";
          } else if (el === "subtitle") {
            updated.subtitle = "";
          } else if (el === "buttons") {
            updated.buttonText = "";
            updated.button2Text = "";
          } else if (el === "iconImageUrl") {
            updated.iconImageUrl = "";
          } else if (el === "title") {
            updated.title = "";
          }
          return updated;
        }
        return b;
      });
      setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
      if (activeEditTarget && activeEditTarget.blockId === blockId) {
        setActiveEditTarget(null);
      }
      await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
    } catch (err) {
      console.error("Sub-element deletion failed", err);
    }
  };

  return (
    <div 
      onContextMenu={(e) => {
        if (isEditModeActive && e.target === e.currentTarget) {
          e.preventDefault();
          setContextMenu({
            x: e.pageX,
            y: e.pageY,
            blockIndex: page.blocks.length - 1,
            pageId: page.id
          });
        }
      }}
      className="space-y-20 w-full flex flex-col items-center px-6 min-h-[500px]"
    >
      {page.blocks.map((block, blockIndex) => {
        const renderBlockContent = () => {
          if (block.type === "hero") {
            return (
              <HeroBlock
                page={page}
                pages={pages}
                setPages={setPages}
                block={block}
                blockIdx={blockIndex}
                isEditModeActive={isEditModeActive}
                activeEditTarget={activeEditTarget}
                setActiveEditTarget={setActiveEditTarget}
                handleDeleteSubElement={handleDeleteSubElement}
                handleResizeStart={handleResizeStart}
                handleLinkClick={handleLinkClick}
                db={db}
              />
            );
          }

          if (block.type === "features") {
            return (
              <FeaturesBlock
                page={page}
                pages={pages}
                setPages={setPages}
                block={block}
                isEditModeActive={isEditModeActive}
                activeEditTarget={activeEditTarget}
                setActiveEditTarget={setActiveEditTarget}
                handleLinkClick={handleLinkClick}
                db={db}
              />
            );
          }

          if (block.type === "text") {
            return (
              <TextBlock
                page={page}
                pages={pages}
                setPages={setPages}
                block={block}
                isEditModeActive={isEditModeActive}
                activeEditTarget={activeEditTarget}
                setActiveEditTarget={setActiveEditTarget}
                db={db}
              />
            );
          }

          if (block.type === "banner") {
            return (
              <BannerBlock
                page={page}
                pages={pages}
                setPages={setPages}
                block={block}
                blockIdx={blockIndex}
                isEditModeActive={isEditModeActive}
                activeEditTarget={activeEditTarget}
                setActiveEditTarget={setActiveEditTarget}
                handleDeleteSubElement={handleDeleteSubElement}
                handleResizeStart={handleResizeStart}
                handleLinkClick={handleLinkClick}
                db={db}
              />
            );
          }

          if (block.type === "divider") {
            return (
              <DividerBlock
                page={page}
                block={block}
                isEditModeActive={isEditModeActive}
                setActiveEditTarget={setActiveEditTarget}
                handleResizeStart={handleResizeStart}
              />
            );
          }

          if (block.type === "image") {
            return (
              <ImageBlock
                page={page}
                pages={pages}
                setPages={setPages}
                block={block}
                isEditModeActive={isEditModeActive}
                activeEditTarget={activeEditTarget}
                setActiveEditTarget={setActiveEditTarget}
                handleResizeStart={handleResizeStart}
                handleLinkClick={handleLinkClick}
                db={db}
              />
            );
          }

          return null;
        };

        const widthVal = block.blockWidth || "max-w-5xl";
        return (
          <div 
            key={block.id} 
            onContextMenu={(e) => {
              if (isEditModeActive) {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  x: e.pageX,
                  y: e.pageY,
                  blockIndex: blockIndex,
                  pageId: page.id
                });
              }
            }}
            className={`relative transition-all duration-300 w-full ${widthVal} mx-auto ${
              isEditModeActive 
                ? "border-2 border-dashed border-blue-400/50 p-6 rounded-3xl hover:border-blue-500 hover:bg-blue-50/5 hover:shadow-inner group/block" 
                : ""
            }`}
          >
            {/* Block toolbar controls overlay */}
            {isEditModeActive && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-900/90 text-white rounded-xl p-1 z-30 opacity-70 hover:opacity-100 group-hover/block:opacity-100 transition-opacity border border-white/10 shadow-lg" style={{ backdropFilter: "blur(4px)" }}>
                <span className="text-[10px] font-bold text-slate-300 px-1.5 capitalize">
                  {block.type === "hero" ? "히어로 배너" : block.type === "features" ? "기능 카드" : block.type === "text" ? "줄글 섹션" : "홍보 띠배너"}
                </span>
                <div className="w-px h-3 bg-white/20" />
                <button
                  type="button"
                  title="블록 상세 설정 (배경, 정렬, 버튼, 레이아웃)"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setActiveEditTarget({ type: block.type as any, pageId: page.id, page, blockId: block.id, block });
                  }}
                  className="p-1.5 hover:bg-white/10 rounded text-blue-400 hover:text-blue-300 transition"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-3 bg-white/20" />
                <button
                  type="button"
                  title="위로 이동"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleMoveBlockUp(page, blockIndex);
                  }}
                  disabled={blockIndex === 0}
                  className="p-1 hover:bg-white/10 rounded disabled:opacity-30 text-slate-300 transition"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="아래로 이동"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleMoveBlockDown(page, blockIndex);
                  }}
                  disabled={blockIndex === page.blocks.length - 1}
                  className="p-1 hover:bg-white/10 rounded disabled:opacity-30 text-slate-300 transition"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="정말 삭제"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDeleteBlock(page, blockIndex);
                  }}
                  className="p-1.5 bg-red-650 hover:bg-red-700 text-white rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {renderBlockContent()}

            {/* Block Insertion control button displayed inline */}
            {isEditModeActive && (
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-40">
                {showAddBlockMenuAtIndex?.index === blockIndex && showAddBlockMenuAtIndex?.pageId === page.id ? (
                  <div className="bg-slate-900 border border-white/25 rounded-2xl p-2 md:p-2.5 shadow-2xl flex items-center gap-1.5 text-white animate-in zoom-in-95 duration-150">
                    <span className="text-[10px] font-bold text-slate-400 px-1">추가할 유형:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertBlock(page, blockIndex, "hero")}
                      className="text-[10px] bg-slate-800 hover:bg-blue-600 px-2 py-1 rounded-lg font-bold transition whitespace-nowrap"
                    >
                      히어로 배너
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertBlock(page, blockIndex, "features")}
                      className="text-[10px] bg-slate-800 hover:bg-blue-600 px-2 py-1 rounded-lg font-bold transition whitespace-nowrap"
                    >
                      피처 카드형
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertBlock(page, blockIndex, "text")}
                      className="text-[10px] bg-slate-800 hover:bg-blue-600 px-2 py-1 rounded-lg font-bold transition whitespace-nowrap"
                    >
                      줄글 섹션
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertBlock(page, blockIndex, "banner")}
                      className="text-[10px] bg-slate-800 hover:bg-blue-600 px-2 py-1 rounded-lg font-bold transition whitespace-nowrap"
                    >
                      홍보 띠배너
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertBlock(page, blockIndex, "image")}
                      className="text-[10px] bg-slate-800 hover:bg-blue-600 px-2 py-1 rounded-lg font-bold transition whitespace-nowrap"
                    >
                      배너 통이미지
                    </button>
                    <div className="w-px h-4 bg-white/20 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => setShowAddBlockMenuAtIndex(null)}
                      className="text-[10px] text-slate-400 hover:text-white px-1.5 py-1 font-bold whitespace-nowrap"
                    >
                      닫기
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddBlockMenuAtIndex({ pageId: page.id, index: blockIndex })}
                    className="flex items-center gap-1 bg-white border border-blue-400/60 text-blue-600 hover:bg-blue-50 hover:border-blue-550 rounded-full px-4 py-1.5 shadow-sm text-[10px] font-black transition-all hover:scale-105 active:scale-95 duration-150"
                  >
                    <span>➕ 이 뒤에 새 구역 삽입</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {contextMenu && (() => {
        const clickedBlock = page.blocks[contextMenu.blockIndex];
        return (
          <div 
            className="absolute bg-slate-900 border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl text-white font-sans w-56 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-100"
            style={{ 
              left: `${contextMenu.x}px`, 
              top: `${contextMenu.y}px`,
              position: "absolute"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* If clicked inside a block, show dynamic sub-element/sub-card insertion */}
            {clickedBlock && (
              <>
                <div className="text-[10px] uppercase font-black tracking-wider text-emerald-400 px-3.5 py-1.4 flex items-center gap-1.5 border-b border-white/5 pb-1.5 mb-1 select-none">
                  <span>📥 이 섹션 내부에 추가 (Inside)</span>
                </div>
                
                {clickedBlock.type === "features" && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const currentItems = [...(clickedBlock.items || [])];
                        currentItems.push({
                          title: "새 우대 혜택카드 요소를 이곳에 추가합니다.",
                          desc: "이 카드의 혜택 우대조건과 보조 설명 내용을 상세하게 직접 작성할 수 있습니다."
                        });
                        const updatedBlocks = page.blocks.map((b, idx) => idx === contextMenu.blockIndex ? { ...b, items: currentItems } : b);
                        setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                        await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
                      } catch (err) {
                        console.error("Failed to add internal card item", err);
                      }
                      setContextMenu(null);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-600 rounded-xl transition text-left cursor-pointer border border-emerald-500/20 bg-emerald-500/5 mb-1"
                  >
                    <span>➕ 피처 카드 추가</span>
                  </button>
                )}

                {(clickedBlock.type === "hero" || clickedBlock.type === "banner") && (
                  <>
                    {(!clickedBlock.buttonText || clickedBlock.buttonText === "") && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const updatedBlocks = page.blocks.map((b, idx) => {
                              if (idx === contextMenu.blockIndex) {
                                return { 
                                  ...b, 
                                  buttonText: "신청 등록 버튼", 
                                  elementOrder: b.elementOrder ? (b.elementOrder.includes("buttons") ? b.elementOrder : [...b.elementOrder, "buttons"]) : undefined
                                };
                              }
                              return b;
                            });
                            setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                            await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
                          } catch (err) {
                            console.error("Failed to add button inside block", err);
                          }
                          setContextMenu(null);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-600 rounded-xl transition text-left cursor-pointer border border-emerald-500/20 bg-emerald-500/5 mb-1"
                      >
                        <span>🔘 콜투액션 버튼 추가</span>
                      </button>
                    )}

                    {(!clickedBlock.subtitle || clickedBlock.subtitle === "") && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const updatedBlocks = page.blocks.map((b, idx) => {
                              if (idx === contextMenu.blockIndex) {
                                return { 
                                  ...b, 
                                  subtitle: "성공을 지원하는 상세 보조 설명을 직접 입력하세요.", 
                                  elementOrder: b.elementOrder ? (b.elementOrder.includes("subtitle") ? b.elementOrder : [...b.elementOrder, "subtitle"]) : undefined
                                };
                              }
                              return b;
                            });
                            setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                            await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
                          } catch (err) {
                            console.error("Failed to add subtitle", err);
                          }
                          setContextMenu(null);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-600 rounded-xl transition text-left cursor-pointer border border-emerald-500/20 bg-emerald-500/5 mb-1"
                      >
                        <span>📝 보조 설명문 추가</span>
                      </button>
                    )}

                    {(!clickedBlock.badge || clickedBlock.badge === "") && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const updatedBlocks = page.blocks.map((b, idx) => {
                              if (idx === contextMenu.blockIndex) {
                                return { 
                                  ...b, 
                                  badge: "신규 제휴 프로모션", 
                                  elementOrder: b.elementOrder ? (b.elementOrder.includes("badge") ? b.elementOrder : ["badge", ...b.elementOrder]) : undefined
                                };
                              }
                              return b;
                            });
                            setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                            await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
                          } catch (err) {
                            console.error("Failed to add badge", err);
                          }
                          setContextMenu(null);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-600 rounded-xl transition text-left cursor-pointer border border-emerald-500/20 bg-emerald-500/5 mb-1"
                      >
                        <span>🏷️ 미니 뱃지 태그 추가</span>
                      </button>
                    )}
                  </>
                )}
                
                {clickedBlock.type === "text" && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const updatedBlocks = page.blocks.map((b, idx) => {
                          if (idx === contextMenu.blockIndex) {
                            return { 
                              ...b, 
                              content: (b.content || "") + "\n새로운 추가 문단을 작성해 보세요."
                            };
                          }
                          return b;
                        });
                        setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                        await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
                      } catch (err) {
                        console.error("Failed to add paragraph description", err);
                      }
                      setContextMenu(null);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-600 rounded-xl transition text-left cursor-pointer border border-emerald-500/20 bg-emerald-500/5 mb-1"
                  >
                    <span>➕ 텍스트 문단 추가</span>
                  </button>
                )}
                
                <div className="h-px bg-white/5 my-1" />
              </>
            )}

            <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 px-3.5 py-1 flex items-center gap-1.5 border-b border-white/5 pb-1.5 mb-1 select-none">
              <span>✨ 구역 추가 (Add Section)</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                handleInsertBlock(page, contextMenu.blockIndex, "image");
                setContextMenu(null);
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-blue-600 rounded-xl transition text-left cursor-pointer"
            >
              <span>🖼️</span>
              <span>이미지 추가 (통배너)</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                handleInsertBlock(page, contextMenu.blockIndex, "text");
                setContextMenu(null);
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-blue-600 rounded-xl transition text-left cursor-pointer"
            >
              <span>📝</span>
              <span>텍스트박스 추가</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                handleInsertBlock(page, contextMenu.blockIndex, "divider");
                setContextMenu(null);
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-blue-600 rounded-xl transition text-left cursor-pointer"
            >
              <span>➖</span>
              <span>구분선 추가</span>
            </button>
            <div className="h-px bg-white/5 my-1" />
            <button
              type="button"
              onClick={async () => {
                handleInsertBlock(page, contextMenu.blockIndex, "hero");
                setContextMenu(null);
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-blue-600 rounded-xl transition text-left cursor-pointer"
            >
              <span>⭐</span>
              <span>히어로 대형 배너</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                handleInsertBlock(page, contextMenu.blockIndex, "features");
                setContextMenu(null);
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-blue-600 rounded-xl transition text-left cursor-pointer"
            >
              <span>⚡</span>
              <span>피처 카드형</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                handleInsertBlock(page, contextMenu.blockIndex, "banner");
                setContextMenu(null);
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-blue-600 rounded-xl transition text-left cursor-pointer"
            >
              <span>📢</span>
              <span>스마트 띠배너</span>
            </button>
          </div>
        );
      })()}
    </div>
  );
};
