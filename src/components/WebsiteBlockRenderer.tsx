import React from "react";
import { ChevronUp, ChevronDown, Trash2, Settings, Move } from "lucide-react";
import { CMSPage, CMSBlock } from "../types";

import { mergeBlockFields } from "../utils/cmsSettings";

// Import modular block renderers

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
  handleUpdateBlockData: (page: CMSPage, blockId: string, updatedData: Partial<CMSBlock>) => Promise<void>;
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
  handleUpdateBlockData,
  db,
}) => {
  // Page-level Context Menu states
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    blockIndex: number;
    pageId: string;
  } | null>(null);

  const [isDraggingBlockId, setIsDraggingBlockId] = React.useState<string | null>(null);
  const [snapLines, setSnapLines] = React.useState<{ type: 'v' | 'h'; coordinate: number }[]>([]);

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
    let latestBlocks = page.blocks;

    if (elementKey === "block-position") {
      const startPosX = block.posX || 0;
      const startPosY = block.posY || 0;
      setIsDraggingBlockId(block.id);

      const containerEl = document.getElementById("block-renderer-container");
      if (!containerEl) return;
      const containerRect = containerEl.getBoundingClientRect();

      const draggedEl = document.getElementById(`block-wrapper-${block.id}`);
      if (!draggedEl) return;
      const draggedRect = draggedEl.getBoundingClientRect();
      const draggedStartLocalRect = {
        left: draggedRect.left - containerRect.left,
        right: draggedRect.right - containerRect.left,
        top: draggedRect.top - containerRect.top,
        bottom: draggedRect.bottom - containerRect.top,
        width: draggedRect.width,
        height: draggedRect.height,
        centerX: draggedRect.left - containerRect.left + draggedRect.width / 2,
        centerY: draggedRect.top - containerRect.top + draggedRect.height / 2
      };

      const otherBlocks = page.blocks.filter(b => b.id !== block.id);
      const otherLocalRects = otherBlocks.map(otherBlock => {
        const el = document.getElementById(`block-wrapper-${otherBlock.id}`);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          id: otherBlock.id,
          left: rect.left - containerRect.left,
          right: rect.right - containerRect.left,
          top: rect.top - containerRect.top,
          bottom: rect.bottom - containerRect.top,
          width: rect.width,
          height: rect.height,
          centerX: rect.left - containerRect.left + rect.width / 2,
          centerY: rect.top - containerRect.top + rect.height / 2
        };
      }).filter(Boolean) as any[];

      const onMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const rawNewPosX = startPosX + dx;
        const rawNewPosY = startPosY + dy;

        const proposedLocalLeft = draggedStartLocalRect.left + dx;
        const proposedLocalTop = draggedStartLocalRect.top + dy;
        const proposedLocalRight = proposedLocalLeft + draggedStartLocalRect.width;
        const proposedLocalBottom = proposedLocalTop + draggedStartLocalRect.height;
        const proposedLocalCenterX = proposedLocalLeft + draggedStartLocalRect.width / 2;
        const proposedLocalCenterY = proposedLocalTop + draggedStartLocalRect.height / 2;

        const SNAP_THRESHOLD = 25;
        let finalPosX = rawNewPosX;
        let finalPosY = rawNewPosY;
        const newSnapLines: { type: 'v' | 'h'; coordinate: number }[] = [];

        // Horizontal snap (X-axis alignment, draws vertical guide line)
        let bestDiffX = SNAP_THRESHOLD;
        let snapX = null;

        // Grid snap back to center/original position checks first
        if (Math.abs(rawNewPosX) < bestDiffX) {
          bestDiffX = Math.abs(rawNewPosX);
          snapX = {
            posX: 0,
            lineCoord: draggedStartLocalRect.centerX - startPosX
          };
        }

        for (const other of otherLocalRects) {
          const checks = [
            { target: other.left, current: proposedLocalLeft, snapPos: other.left },
            { target: other.right, current: proposedLocalLeft, snapPos: other.right },
            { target: other.centerX, current: proposedLocalCenterX, snapPos: other.centerX - draggedStartLocalRect.width / 2 },
            { target: other.left, current: proposedLocalRight, snapPos: other.left - draggedStartLocalRect.width },
            { target: other.right, current: proposedLocalRight, snapPos: other.right - draggedStartLocalRect.width },
          ];
          for (const check of checks) {
            const diff = Math.abs(check.current - check.target);
            if (diff < bestDiffX) {
              bestDiffX = diff;
              snapX = {
                posX: startPosX + (check.snapPos - draggedStartLocalRect.left),
                lineCoord: check.target
              };
            }
          }
        }
        if (snapX !== null) {
          finalPosX = snapX.posX;
          newSnapLines.push({ type: 'v', coordinate: snapX.lineCoord });
        }

        // Vertical snap (Y-axis alignment, draws horizontal guide line)
        let bestDiffY = SNAP_THRESHOLD;
        let snapY = null;

        // Grid snap back to center/original position checks first
        if (Math.abs(rawNewPosY) < bestDiffY) {
          bestDiffY = Math.abs(rawNewPosY);
          snapY = {
            posY: 0,
            lineCoord: draggedStartLocalRect.centerY - startPosY
          };
        }

        for (const other of otherLocalRects) {
          const checks = [
            { target: other.top, current: proposedLocalTop, snapPos: other.top },
            { target: other.bottom, current: proposedLocalTop, snapPos: other.bottom },
            { target: other.centerY, current: proposedLocalCenterY, snapPos: other.centerY - draggedStartLocalRect.height / 2 },
            { target: other.top, current: proposedLocalBottom, snapPos: other.top - draggedStartLocalRect.height },
            { target: other.bottom, current: proposedLocalBottom, snapPos: other.bottom - draggedStartLocalRect.height },
          ];
          for (const check of checks) {
            const diff = Math.abs(check.current - check.target);
            if (diff < bestDiffY) {
              bestDiffY = diff;
              snapY = {
                posY: startPosY + (check.snapPos - draggedStartLocalRect.top),
                lineCoord: check.target
              };
            }
          }
        }
        if (snapY !== null) {
          finalPosY = snapY.posY;
          newSnapLines.push({ type: 'h', coordinate: snapY.lineCoord });
        }

        setSnapLines(newSnapLines);

        const updatedBlocks = mergeBlockFields(page.blocks, block.id, {
          posX: finalPosX,
          posY: finalPosY,
        });
        latestBlocks = updatedBlocks;
        setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
      };

      const onMouseUp = async () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        setIsDraggingBlockId(null);
        setSnapLines([]);

        const finalBlock = latestBlocks.find(b => b.id === block.id);
        if (finalBlock) {
          handleUpdateBlockData(page, block.id, {
            posX: finalBlock.posX || 0,
            posY: finalBlock.posY || 0,
          });
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return;
    }

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

        const updatedBlocks = mergeBlockFields(page.blocks, block.id, {
          [isB1 ? "buttonWidth" : "button2Width"]: `${newWidth}px`,
          [isB1 ? "buttonHeight" : "button2Height"]: `${newHeight}px`,
        } as Partial<CMSBlock>);
        latestBlocks = updatedBlocks;
        setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
      };

      const onMouseUp = async () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        handleUpdateBlockData(page, block.id, {});
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

        const updatedBlocks = mergeBlockFields(page.blocks, block.id, {
          iconWidth: `${newWidth}px`,
          iconHeight: `${newHeight}px`,
        });
        latestBlocks = updatedBlocks;
        setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
      };

      const onMouseUp = async () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        handleUpdateBlockData(page, block.id, {});
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

        const updatedBlocks = mergeBlockFields(page.blocks, block.id, {
          imageWidth: `${newWidth}px`,
          imageHeight: `${newHeight}px`,
        });
        latestBlocks = updatedBlocks;
        setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
      };

      const onMouseUp = async () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        handleUpdateBlockData(page, block.id, {});
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

        const updatedBlocks = mergeBlockFields(page.blocks, block.id, {
          imageHeight: `${newHeight}px`,
          imageMarginTop: `${newMargin}`,
          imageMarginBottom: `${newMargin}`,
        });
        latestBlocks = updatedBlocks;
        setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
      };

      const onMouseUp = async () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        handleUpdateBlockData(page, block.id, {});
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

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;

      const newWidth = Math.min(100, Math.max(20, currentWidth + Math.floor(dx / 5)));
      const { fontSize: _removedFontSize, ...elementSizeWithoutFontSize } = elSize;

      const newElementSizes = {
        ...currentSizes,
        [elementKey]: {
          ...elementSizeWithoutFontSize,
          width: elementKey === "buttons" ? undefined : `${newWidth}%`,
        }
      };

      const updatedBlocks = mergeBlockFields(page.blocks, block.id, { elementSizes: newElementSizes });
      latestBlocks = updatedBlocks;
      setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
    };

    const onMouseUp = async () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      handleUpdateBlockData(page, block.id, {});
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleDeleteSubElement = async (blockId: string, el: string) => {
    let fields: Partial<CMSBlock> = {};
    if (el === "badge") {
      fields = { badge: "" };
    } else if (el === "subtitle") {
      fields = { subtitle: "" };
    } else if (el === "buttons") {
      fields = { buttonText: "", button2Text: "" };
    } else if (el === "iconImageUrl") {
      fields = { iconImageUrl: "" };
    } else if (el === "title") {
      fields = { title: "" };
    }

    if (activeEditTarget && activeEditTarget.blockId === blockId) {
      setActiveEditTarget(null);
    }

    try {
      await handleUpdateBlockData(page, blockId, fields);
    } catch (err) {
      console.error("Sub-element deletion failed", err);
    }
  };

  return (
    <div
      id="block-renderer-container"
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
      className="space-y-20 w-full flex flex-col items-center px-6 min-h-[500px] relative"
    >
      {page.blocks.map((block, blockIndex) => {
        const renderBlockContent = () => {
          if (block.type === "hero") {
            const migratedBlock = { ...block, type: "banner" as const, layoutStyle: block.layoutStyle || "column_center" };
            return (
              <BannerBlock
                page={page}
                pages={pages}
                setPages={setPages}
                block={migratedBlock}
                blockIdx={blockIndex}
                isEditModeActive={isEditModeActive}
                activeEditTarget={activeEditTarget}
                setActiveEditTarget={setActiveEditTarget}
                handleDeleteSubElement={handleDeleteSubElement}
                handleResizeStart={handleResizeStart}
                handleLinkClick={handleLinkClick}
                handleUpdateBlockData={handleUpdateBlockData}
                db={db}
              />
            );
          }

          if (block.type === "features") {
            return (
              <FeaturesBlock
                handleUpdateBlockData={handleUpdateBlockData}
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
                handleUpdateBlockData={handleUpdateBlockData}
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
                handleUpdateBlockData={handleUpdateBlockData}
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
                handleUpdateBlockData={handleUpdateBlockData}
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

        const selectedSubElement = activeEditTarget?.blockId === block.id ? activeEditTarget?.selectedElement : undefined;
        const isTextSubElementSelected =
          (block.type === "hero" || block.type === "banner") &&
          ["badge", "title", "subtitle"].includes(selectedSubElement);
        const showBlockFrame = isEditModeActive && block.type !== "text" && !isTextSubElementSelected;
        const showBlockToolbar = isEditModeActive && !isTextSubElementSelected;
        const widthVal = block.type === "text" ? "max-w-none" : (block.blockWidth || "max-w-5xl");
        return (
          <div
            key={block.id}
            id={`block-wrapper-${block.id}`}
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
            style={{
              transform: block.posX || block.posY ? `translate(${block.posX || 0}px, ${block.posY || 0}px)` : undefined,
              zIndex: isDraggingBlockId === block.id ? 50 : undefined,
            }}
            className={`relative w-full ${widthVal} mx-auto ${
              isDraggingBlockId === block.id ? "" : "transition-all duration-300"
            } ${showBlockFrame ? "group/block" : ""}`}
          >
            {/* Absolute dashed outline overlay to prevent padding/size discrepancy */}
            {showBlockFrame && (
              <div className="absolute -inset-4 border-2 border-dashed border-blue-400/30 rounded-3xl pointer-events-none group-hover/block:border-blue-500/80 transition-all duration-200" />
            )}

            {/* Block toolbar controls overlay (repositioned outside the block bounds) */}
            {showBlockToolbar && (
              <div className="absolute top-[-36px] right-0 flex items-center gap-1.5 bg-slate-900/90 text-white rounded-xl p-1 z-30 opacity-70 hover:opacity-100 group-hover/block:opacity-100 transition-opacity border border-white/10 shadow-lg" style={{ backdropFilter: "blur(4px)" }}>
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
                <button
                  type="button"
                  title="블록 이동 (상하좌우 드래그)"
                  style={{ touchAction: "none" }}
                  onMouseDown={(e) => handleResizeStart(e, block, "block-position")}
                  className="p-1.5 hover:bg-white/10 rounded text-blue-400 hover:text-blue-300 transition cursor-move"
                >
                  <Move className="w-3.5 h-3.5" />
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
                        await handleUpdateBlockData(page, clickedBlock.id, { items: currentItems });
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
                            const order = clickedBlock.elementOrder ? (clickedBlock.elementOrder.includes("buttons") ? clickedBlock.elementOrder : [...clickedBlock.elementOrder, "buttons"]) : undefined;
                            await handleUpdateBlockData(page, clickedBlock.id, {
                              buttonText: "신청 등록 버튼",
                              elementOrder: order
                            });
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
                            const order = clickedBlock.elementOrder ? (clickedBlock.elementOrder.includes("subtitle") ? clickedBlock.elementOrder : [...clickedBlock.elementOrder, "subtitle"]) : undefined;
                            await handleUpdateBlockData(page, clickedBlock.id, {
                              subtitle: "성공을 지원하는 상세 보조 설명을 직접 입력하세요.",
                              elementOrder: order
                            });
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
                            const order = clickedBlock.elementOrder ? (clickedBlock.elementOrder.includes("badge") ? clickedBlock.elementOrder : ["badge", ...clickedBlock.elementOrder]) : undefined;
                            await handleUpdateBlockData(page, clickedBlock.id, {
                              badge: "신규 제휴 프로모션",
                              elementOrder: order
                            });
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
                        const newContent = (clickedBlock.content || "") + "\n새로운 추가 문단을 작성해 보세요.";
                        await handleUpdateBlockData(page, clickedBlock.id, { content: newContent });
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
                handleInsertBlock(page, contextMenu.blockIndex, "banner");
                setContextMenu(null);
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-blue-600 rounded-xl transition text-left cursor-pointer"
            >
              <span>⭐</span>
              <span>대형 메인 배너 추가</span>
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

      {/* Snap Alignment Guides */}
      {snapLines.map((line, idx) => (
        <div
          key={idx}
          style={
            line.type === "v"
              ? { left: `${line.coordinate}px`, top: 0, bottom: 0, width: 0, position: "absolute" }
              : { top: `${line.coordinate}px`, left: 0, right: 0, height: 0, position: "absolute" }
          }
          className={`z-55 pointer-events-none border-blue-500 border-dashed ${
            line.type === "v" ? "border-l-2" : "border-t-2"
          }`}
        />
      ))}
    </div>
  );
};
