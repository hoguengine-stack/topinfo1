import React from "react";
import { Trash2 } from "lucide-react";
import { CMSPage, CMSBlock } from "../../types";
import { updateDoc, doc } from "firebase/firestore";

interface FeaturesBlockProps {
  page: CMSPage;
  pages: CMSPage[];
  setPages: (pages: CMSPage[]) => void;
  block: CMSBlock;
  isEditModeActive: boolean;
  activeEditTarget: any;
  setActiveEditTarget: (target: any) => void;
  handleLinkClick: (slug: string) => void;
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
  db,
}) => {
  const renderIconComponent = (iconName: string, defaultIdx: number) => {
    const trimmed = iconName ? iconName.trim() : "";
    const name = trimmed.toLowerCase();
    
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/") || trimmed.includes(".") || trimmed.startsWith("data:")) {
      return (
        <img 
          src={trimmed} 
          alt="icon" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-xl" 
        />
      );
    }

    if (name === "zap") return <span className="text-xl">⚡</span>;
    if (name === "clock") return <span className="text-xl">⏰</span>;
    if (name === "creditcard" || name === "card" || name === "credit-card") return <span className="text-xl">💳</span>;
    if (name === "barchart" || name === "chart" || name === "barchart3") return <span className="text-xl">📊</span>;
    if (name === "monitor") return <span className="text-xl">📺</span>;
    if (name === "smartphone" || name === "phone") return <span className="text-xl">📱</span>;
    if (name === "cpu" || name === "chip") return <span className="text-xl">💻</span>;
    if (name === "layers") return <span className="text-xl">🥞</span>;
    if (name === "lock") return <span className="text-xl">🔒</span>;
    if (name === "shield" || name === "alert" || name === "shieldalert") return <span className="text-xl">🛡️</span>;
    if (name === "sparkles" || name === "star") return <span className="text-xl">✨</span>;
    if (name === "scrolltext") return <span className="text-xl">📜</span>;
    if (name === "heart") return <span className="text-xl">💖</span>;
    if (name === "shoppingbag") return <span className="text-xl">🛍️</span>;
    if (name === "helpcircle") return <span className="text-xl">❓</span>;
    
    const val = defaultIdx % 4;
    if (val === 0) return <span className="text-xl">⚡</span>;
    if (val === 1) return <span className="text-xl">⏰</span>;
    if (val === 2) return <span className="text-xl">💳</span>;
    return <span className="text-xl">📊</span>;
  };

  const gridColsCount = block.gridCols || 2;
  const isColumnLayout = block.itemLayout === "column";
  const cardBg = block.cardBgColor || "bg-white";
  
  const isCardDark = cardBg.includes("bg-slate-900");
  const defaultTitleColor = isCardDark ? "text-white" : "text-slate-800";
  const defaultDescColor = isCardDark ? "text-slate-300" : "text-slate-500";
  
  const titleAlign = block.titleAlign || block.align || "center";
  const subtitleAlign = block.subtitleAlign || block.align || "center";

  const titleTextAlign = titleAlign === "left" ? "text-left" : titleAlign === "right" ? "text-right" : "text-center";
  const titleMxClass = titleAlign === "left" ? "mr-auto ml-0" : titleAlign === "right" ? "ml-auto mr-0" : "mx-auto";

  const subtitleTextAlign = subtitleAlign === "left" ? "text-left" : subtitleAlign === "right" ? "text-right" : "text-center";
  const subtitleMxClass = subtitleAlign === "left" ? "mr-auto ml-0" : subtitleAlign === "right" ? "ml-auto mr-0" : "mx-auto";

  return (
    <section className="space-y-8 w-full">
      <div 
        onClick={() => {
          if (isEditModeActive) {
            setActiveEditTarget({ type: "features", pageId: page.id, page, blockId: block.id, block, selectedElement: "block" });
          }
        }}
        className={`w-full max-w-xl mx-auto space-y-3 ${
          isEditModeActive ? "cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-dashed rounded-3xl p-3 transition" : ""
        }`}
      >
        {isEditModeActive ? (
          <div className="space-y-2 w-full" onClick={(e) => e.stopPropagation()}>
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
              className={`${block.titleSize || "text-xl md:text-3xl font-extrabold tracking-tight"} ${block.titleColor || "text-slate-950"} ${titleTextAlign} ${titleMxClass} block w-full`}
            >
              {block.title || "타이틀 없음"}
            </h2>
            <p 
              style={{
                fontSize: block.subtitleFontSize ? `${block.subtitleFontSize}pt` : undefined,
                letterSpacing: block.subtitleLetterSpacing ? `${block.subtitleLetterSpacing}px` : undefined,
              }}
              className={`${block.subtitleSize || "text-sm"} ${block.subtitleColor || "text-slate-500"} mt-3 ${subtitleTextAlign} ${subtitleMxClass} block w-full`}
            >
              {block.subtitle || "한 줄 메리트 설명 정렬과 기능을 드래그 또는 HUD로 자유롭게 편집하세요"}
            </p>
          </>
        )}
      </div>

      <div className={`grid grid-cols-1 ${
        gridColsCount === 1 ? 'md:grid-cols-1' :
        gridColsCount === 3 ? 'md:grid-cols-3' :
        gridColsCount === 4 ? 'md:grid-cols-4' : 'md:grid-cols-2'
      } gap-6`}>
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
              className={`rounded-3xl p-6 md:p-8 border shadow-xs transition-all flex relative group/feat ${cardBg} ${
                isCurrentlyEditingThisCard ? "ring-4 ring-blue-500 border-transparent shadow-md bg-blue-50/5" : "border-slate-150 hover:shadow-md hover:border-slate-250"
              } ${
                isEditModeActive ? "cursor-pointer" : ""
              } ${
                block.blockAlign 
                  ? block.blockAlign 
                  : isColumnLayout 
                    ? "flex-col items-center text-center gap-4" 
                    : "flex-col items-start text-left gap-4 md:flex-row"
              }`}
            >
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs relative ${
                  item.icon && (item.icon.startsWith("http") || item.icon.startsWith("/") || item.icon.startsWith("data:"))
                    ? "bg-transparent border-0"
                    : (item.iconBg || "bg-blue-50")
                } ${item.iconColor || "text-blue-600"}`}>
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
                        onChange={async (e) => {
                          const newVal = e.target.value;
                          const currentItems = [...(block.items || [])];
                          currentItems[idx] = { ...currentItems[idx], badge: newVal };
                          const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, items: currentItems } : b);
                          setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                          if (activeEditTarget && activeEditTarget.blockId === block.id && activeEditTarget.itemIndex === idx) {
                            setActiveEditTarget((prev: any) => prev ? { ...prev, block: { ...prev.block, items: currentItems } as CMSBlock } : null);
                          }
                          await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
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
                    onChange={async (e) => {
                      const newVal = e.target.value;
                      const currentItems = [...(block.items || [])];
                      currentItems[idx] = { ...currentItems[idx], title: newVal };
                      const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, items: currentItems } : b);
                      setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                      if (activeEditTarget && activeEditTarget.blockId === block.id && activeEditTarget.itemIndex === idx) {
                        setActiveEditTarget((prev: any) => prev ? { ...prev, block: { ...prev.block, items: currentItems } as CMSBlock } : null);
                      }
                      await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
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
                  <h4 className={`${item.titleSize || "text-base"} font-extrabold ${item.titleColor || defaultTitleColor}`}>{item.title}</h4>
                )}

                {isEditModeActive ? (
                  <textarea
                    value={item.desc || ""}
                    onChange={async (e) => {
                      const newVal = e.target.value;
                      const currentItems = [...(block.items || [])];
                      currentItems[idx] = { ...currentItems[idx], desc: newVal };
                      const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, items: currentItems } : b);
                      setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                      if (activeEditTarget && activeEditTarget.blockId === block.id && activeEditTarget.itemIndex === idx) {
                        setActiveEditTarget((prev: any) => prev ? { ...prev, block: { ...prev.block, items: currentItems } as CMSBlock } : null);
                      }
                      await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
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
                      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold bg-blue-600 text-white shadow-2xs">
                        <input
                          type="text"
                          value={item.buttonText || ""}
                          onChange={async (e) => {
                            const newVal = e.target.value;
                            const currentItems = [...(block.items || [])];
                            currentItems[idx] = { ...currentItems[idx], buttonText: newVal };
                            const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, items: currentItems } : b);
                            setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                            if (activeEditTarget && activeEditTarget.blockId === block.id && activeEditTarget.itemIndex === idx) {
                              setActiveEditTarget((prev: any) => prev ? { ...prev, block: { ...prev.block, items: currentItems } as CMSBlock } : null);
                            }
                            await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
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
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95 shadow-2xs"
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
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const currentItems = (block.items || []).filter((_, idx2) => idx2 !== idx);
                      const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, items: currentItems } : b);
                      setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
                      if (activeEditTarget && activeEditTarget.blockId === block.id && activeEditTarget.itemIndex === idx) {
                        setActiveEditTarget(null);
                      }
                      await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
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
            onClick={async (e) => {
              e.stopPropagation();
              const list = block.items || [];
              const updatedList = [...list, { title: "새로운 가맹 혜택", desc: "고객님의 비즈니스를 업그레이드 해 드리는 탑정보통신의 신규 혜택 상품입니다." }];
              
              const updatedBlocks = page.blocks.map(b => b.id === block.id ? { ...b, items: updatedList } : b);
              setPages(pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p));
              setActiveEditTarget({ type: "card", pageId: page.id, page, blockId: block.id, block, itemIndex: updatedList.length - 1 });
              await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
            }}
            className="border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/5 text-blue-600 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 transition min-h-[140px] font-bold text-xs"
          >
            <span className="text-lg">➕</span>
            <span>새 혜택카드 요소 추가</span>
          </button>
        )}
      </div>
    </section>
  );
};
