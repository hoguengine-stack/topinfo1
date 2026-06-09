import React from "react";
import { CMSPage, CMSBlock } from "../../types";


interface TextBlockProps {
  page: CMSPage;
  pages: CMSPage[];
  setPages: (pages: CMSPage[]) => void;
  block: CMSBlock;
  isEditModeActive: boolean;
  activeEditTarget: any;
  setActiveEditTarget: (target: any) => void;
  handleUpdateBlockData: (page: CMSPage, blockId: string, updatedData: Partial<CMSBlock>) => Promise<void>;
  db: any;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  page,
  pages,
  setPages,
  block,
  isEditModeActive,
  activeEditTarget,
  setActiveEditTarget,
  handleUpdateBlockData,
  db,
}) => {
  const textWidth = block.blockWidth || "max-w-2xl";
  const contentAlign = block.contentAlign || block.align || "left";
  const contentAlignClass = contentAlign === "left" ? "text-left" : contentAlign === "right" ? "text-right" : "text-center";
  const contentSize = block.contentSize || block.subtitleSize || "text-sm";
  const contentColor = block.contentColor || block.subtitleColor || "text-slate-600";
  const textValue = block.content || block.title || "";

  const handleTextChange = (newVal: string) => {
    handleUpdateBlockData?.(page, block.id, { title: "", content: newVal });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const currentWidth = parseInt(block.textBoxWidth || "") || 520;
    const currentHeight = parseInt(block.textBoxHeight || "") || 92;
    let latestBlocks = page.blocks;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.max(220, Math.min(980, currentWidth + moveEvent.clientX - startX));
      const nextHeight = Math.max(64, Math.min(520, currentHeight + moveEvent.clientY - startY));
      const updatedBlocks = page.blocks.map(b =>
        b.id === block.id
          ? { ...b, textBoxWidth: `${nextWidth}px`, textBoxHeight: `${nextHeight}px` }
          : b
      );
      latestBlocks = updatedBlocks;
      setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
      if (activeEditTarget && activeEditTarget.blockId === block.id) {
        setActiveEditTarget((prev: any) => prev ? {
          ...prev,
          block: { ...prev.block, textBoxWidth: `${nextWidth}px`, textBoxHeight: `${nextHeight}px` } as CMSBlock,
          page: { ...prev.page, blocks: updatedBlocks }
        } : null);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      // handled via local setPages real-time preview, but let's sync to DB
      const currentBlock = latestBlocks.find(b => b.id === block.id);
      if (currentBlock) {
        handleUpdateBlockData?.(page, block.id, { textBoxWidth: currentBlock.textBoxWidth, textBoxHeight: currentBlock.textBoxHeight });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <section
      onClick={(e) => {
        if (isEditModeActive) {
          e.stopPropagation();
          setActiveEditTarget({ type: "text", pageId: page.id, page, blockId: block.id, block, selectedElement: "block" });
        }
      }}
      style={{
        width: block.textBoxWidth || undefined,
        minHeight: block.textBoxHeight || undefined,
      }}
      className={`${block.textBoxWidth ? "" : textWidth} mx-auto bg-white border rounded-2xl shadow-3xs w-full relative ${
        isEditModeActive ? "cursor-text border-blue-500" : "border-slate-200"
      }`}
    >
      {isEditModeActive ? (
        <div className="w-full h-full min-h-[inherit] relative" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={textValue}
            onChange={(e) => handleTextChange(e.target.value)}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditModeActive) {
                setActiveEditTarget({ type: "text", pageId: page.id, page, blockId: block.id, block, selectedElement: "content" });
              }
            }}
            onFocus={() => {
              if (isEditModeActive) {
                setActiveEditTarget({ type: "text", pageId: page.id, page, blockId: block.id, block, selectedElement: "content" });
              }
            }}
            style={{
              fontSize: block.contentFontSize ? `${block.contentFontSize}pt` : undefined,
              letterSpacing: block.contentLetterSpacing ? `${block.contentLetterSpacing}px` : undefined,
              minHeight: block.textBoxHeight || "92px",
            }}
            className={`w-full h-full ${contentColor} ${contentSize} leading-relaxed font-sans bg-transparent border-0 resize-none px-5 py-4 focus:outline-none ${contentAlignClass}`}
            rows={Math.max(2, textValue.split('\n').length)}
            placeholder="텍스트를 입력하십시오."
          />
          <div
            className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center cursor-se-resize z-20 shadow-md active:scale-90"
            style={{ touchAction: "none" }}
            onMouseDown={handleResizeStart}
            title="텍스트 박스 크기 조절"
          >
            <span className="text-[10px] font-bold">↘</span>
          </div>
        </div>
      ) : (
        <p
          style={{
            fontSize: block.contentFontSize ? `${block.contentFontSize}pt` : undefined,
            letterSpacing: block.contentLetterSpacing ? `${block.contentLetterSpacing}px` : undefined,
            minHeight: block.textBoxHeight || "92px",
          }}
          className={`${contentColor} ${contentSize} leading-relaxed whitespace-pre-wrap ${contentAlignClass} px-5 py-4`}
        >
          {textValue || "여기에 본문 내용을 작성해 보십시오."}
        </p>
      )}

      {isEditModeActive && (
        <span className="sr-only">텍스트 편집 가능</span>
      )}
    </section>
  );
};
