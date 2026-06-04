import React from "react";
import { CMSPage, CMSBlock } from "../../types";
import { updateDoc, doc } from "firebase/firestore";

interface TextBlockProps {
  page: CMSPage;
  pages: CMSPage[];
  setPages: (pages: CMSPage[]) => void;
  block: CMSBlock;
  isEditModeActive: boolean;
  activeEditTarget: any;
  setActiveEditTarget: (target: any) => void;
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
  db,
}) => {
  const textWidth = block.blockWidth || "max-w-2xl";

  return (
    <section 
      onClick={(e) => {
        if (isEditModeActive) {
          e.stopPropagation();
          setActiveEditTarget({ type: "text", pageId: page.id, page, blockId: block.id, block, selectedElement: "block" });
        }
      }}
      className={`${textWidth} mx-auto bg-white border border-slate-150 p-8 md:p-12 rounded-3xl shadow-3xs space-y-4 w-full relative ${
        isEditModeActive ? "cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-dashed" : ""
      }`}
    >
      {isEditModeActive ? (
        <div className="space-y-4 w-full text-left" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
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
                setActiveEditTarget({ type: "text", pageId: page.id, page, blockId: block.id, block, selectedElement: "title" });
              }
            }}
            onFocus={() => {
              if (isEditModeActive) {
                setActiveEditTarget({ type: "text", pageId: page.id, page, blockId: block.id, block, selectedElement: "title" });
              }
            }}
            className="w-full text-xl font-bold text-slate-900 border-b pb-2 mb-4 focus:ring-1 focus:ring-blue-500 hover:bg-slate-50 rounded-lg p-1 focus:outline-none"
            placeholder="본문 타이틀"
          />
          <textarea
            value={block.content || ""}
            onChange={async (e) => {
              const newVal = e.target.value;
              const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, content: newVal } : b);
              setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
              if (activeEditTarget && activeEditTarget.blockId === block.id) {
                setActiveEditTarget((prev: any) => prev ? { ...prev, block: { ...prev.block, content: newVal } as CMSBlock } : null);
              }
              await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
            }}
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
            className="w-full text-slate-600 text-sm leading-relaxed font-sans bg-transparent border-0 focus:ring-1 focus:ring-blue-500 resize-none p-2 focus:outline-none hover:bg-slate-100 rounded-xl"
            rows={Math.max(4, (block.content || "").split('\n').length)}
            placeholder="본문 내용을 입력하십시오."
          />
        </div>
      ) : (
        <>
          {block.title && (
            <h3 className="text-xl font-bold text-slate-900 border-b pb-4 mb-4 text-left">
              {block.title}
            </h3>
          )}
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap text-left">
            {block.content || "여기에 본문 내용을 작성해 보십시오."}
          </p>
        </>
      )}

      {isEditModeActive && (
        <span className="absolute top-2 right-2 bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold pointer-events-none font-sans select-none">
          텍스트 편집 가능
        </span>
      )}
    </section>
  );
};
