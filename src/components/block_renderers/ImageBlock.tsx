import React from "react";
import { CMSPage, CMSBlock } from "../../types";
import { updateDoc, doc } from "firebase/firestore";

interface ImageBlockProps {
  page: CMSPage;
  pages: CMSPage[];
  setPages: (pages: CMSPage[]) => void;
  block: CMSBlock;
  isEditModeActive: boolean;
  activeEditTarget: any;
  setActiveEditTarget: (target: any) => void;
  handleResizeStart: (e: React.MouseEvent, block: CMSBlock, elementKey: string) => void;
  handleLinkClick: (slug: string) => void;
  db: any;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({
  page,
  pages,
  setPages,
  block,
  isEditModeActive,
  activeEditTarget,
  setActiveEditTarget,
  handleResizeStart,
  handleLinkClick,
  db,
}) => {
  const alignmentClass = block.align === "left" ? "items-start" : block.align === "right" ? "items-end" : "items-center";
  const heightLimit = block.titleSize && block.titleSize !== "none" ? block.titleSize : "none";

  return (
    <section 
      onClick={(e) => {
        if (isEditModeActive) {
          e.stopPropagation();
          setActiveEditTarget({ type: "image", pageId: page.id, page, blockId: block.id, block, selectedElement: "image" });
        }
      }}
      className={`overflow-hidden rounded-3xl group/imgblock flex flex-col relative w-full ${alignmentClass} ${
        isEditModeActive ? "cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-dashed bg-blue-50/5 p-4" : ""
      }`}
    >
      <img
        src={block.imageUrl || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80"}
        alt={block.title || "홍보물 이미지"}
        referrerPolicy="no-referrer"
        className="transition"
        style={{
          width: block.imageWidth || undefined,
          height: block.imageHeight || undefined,
          maxHeight: heightLimit !== "none" ? heightLimit : undefined,
          marginTop: block.imageMarginTop ? `${block.imageMarginTop}px` : undefined,
          marginBottom: block.imageMarginBottom ? `${block.imageMarginBottom}px` : undefined,
          transform: `translate(${block.imagePositionX || 0}px, ${block.imagePositionY || 0}px) rotate(${block.imageRotation || 0}deg)`,
          borderRadius: block.imageRoundness || "1.5rem",
          objectFit: "contain"
        }}
      />
      {block.buttonText && (
        <div className="absolute inset-0 bg-slate-950/15 flex items-center justify-center p-4" onClick={(e) => isEditModeActive && e.stopPropagation()}>
          {isEditModeActive ? (
            <div 
              className="bg-blue-600 border border-blue-500 text-white font-extrabold px-9 py-4 rounded-2xl text-xs sm:text-sm shadow-xl flex items-center justify-center"
              style={{ boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.45)" }}
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
                    setActiveEditTarget({ type: "image", pageId: page.id, page, blockId: block.id, block, selectedElement: "buttons" });
                  }
                }}
                onFocus={() => {
                  if (isEditModeActive) {
                    setActiveEditTarget({ type: "image", pageId: page.id, page, blockId: block.id, block, selectedElement: "buttons" });
                  }
                }}
                className="bg-transparent border-0 focus:ring-0 p-0 text-center font-extrabold text-white text-xs sm:text-sm focus:outline-none min-w-[85px]"
                style={{ width: `${Math.max(4, (block.buttonText || "").length) * 11}px` }}
              />
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-9 py-4 rounded-2xl text-xs sm:text-sm shadow-xl active:scale-95 transition-all duration-150 border border-blue-500 shrink-0"
              style={{ boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.45)" }}
            >
              {block.buttonText}
            </button>
          )}
        </div>
      )}

      {isEditModeActive && (
        <>
          <div className="absolute top-3 right-3 opacity-65 bg-slate-900/80 border border-white/10 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold pointer-events-none font-sans select-none">
            직접 텍스트 편집 가능 (인스펙터 Double-click)
          </div>
          <div 
            className="absolute bottom-3 right-3 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center cursor-se-resize z-45 opacity-100 shadow-md active:scale-95 transition"
            style={{ touchAction: "none" }}
            onMouseDown={(e) => handleResizeStart(e, block, "image")}
          >
            <span className="text-sm font-bold">↘</span>
          </div>
        </>
      )}
    </section>
  );
};
