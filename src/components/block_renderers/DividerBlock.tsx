import React from "react";
import { CMSPage, CMSBlock } from "../../types";

interface DividerBlockProps {
  page: CMSPage;
  block: CMSBlock;
  isEditModeActive: boolean;
  setActiveEditTarget: (target: any) => void;
  handleResizeStart: (e: React.MouseEvent, block: CMSBlock, elementKey: string) => void;
}

export const DividerBlock: React.FC<DividerBlockProps> = ({
  page,
  block,
  isEditModeActive,
  setActiveEditTarget,
  handleResizeStart,
}) => {
  const dividerColor = block.bgColor || "bg-slate-300";
  const dividerWidth = block.blockWidth || "max-w-2xl";
  const mt = block.imageMarginTop ? parseInt(block.imageMarginTop) || 24 : 24;
  const mb = block.imageMarginBottom ? parseInt(block.imageMarginBottom) || 24 : 24;

  return (
    <section 
      onClick={(e) => {
        if (isEditModeActive) {
          e.stopPropagation();
          setActiveEditTarget({ type: "divider", pageId: page.id, page, blockId: block.id, block, selectedElement: "divider" });
        }
      }}
      className={`w-full py-4 flex flex-col items-center relative ${
        isEditModeActive ? "cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-dashed rounded-3xl p-2 transition bg-blue-50/5" : ""
      }`}
    >
      <div 
        className={`w-full ${dividerWidth} mx-auto transition-all`}
        style={{
          marginTop: `${mt}px`,
          marginBottom: `${mb}px`,
          height: block.imageHeight || "2px",
          backgroundColor: dividerColor.startsWith("bg-") ? undefined : dividerColor,
        }}
      >
        {dividerColor.startsWith("bg-") && (
          <div className={`w-full h-full ${dividerColor} rounded-full`} />
        )}
      </div>
      {isEditModeActive && (
        <>
          <div className="absolute top-1 left-2 text-[8px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded font-sans">
            구분선 (Divider / 선)
          </div>
          <div 
            className="absolute bottom-1 right-1 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center cursor-se-resize z-45 opacity-100 shadow-md active:scale-95 transition"
            style={{ touchAction: "none" }}
            onMouseDown={(e) => handleResizeStart(e, block, "divider")}
          >
            <span className="text-xs font-bold">↘</span>
          </div>
        </>
      )}
    </section>
  );
};
