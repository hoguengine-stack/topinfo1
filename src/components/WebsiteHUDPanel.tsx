import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Check,
  Paintbrush,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Baseline,
  Sliders,
  Keyboard,
  RotateCcw,
  Trash2,
  ChevronDown,
  LayoutGrid,
  Link,
  Plus,
  Image as ImageIcon,
  BookOpen,
  Upload
} from "lucide-react";
import { CMSPage, CMSBlock, NavigationSettings } from "../types";
import { doc, updateDoc } from "firebase/firestore";

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id: string;
}

const removeColorBackground = (
  base64Str: string,
  mode: "white" | "black" | "checkerboard",
  onChange: (value: string) => void
) => {
  if (!base64Str || !base64Str.startsWith("data:image/")) return;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    if (mode === "white") {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const maxVal = Math.max(r, g, b);
        const minVal = Math.min(r, g, b);
        if (minVal > 215 && (maxVal - minVal) < 25) {
          data[i + 3] = 0; // set transparent
        }
      }
    } else if (mode === "black") {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const maxVal = Math.max(r, g, b);
        if (maxVal < 45) {
          data[i + 3] = 0; // set transparent
        }
      }
    } else if (mode === "checkerboard") {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const maxVal = Math.max(r, g, b);
        const minVal = Math.min(r, g, b);
        const diff = maxVal - minVal;

        // Remove white and neutral gray squares of checkerboards
        // including transition blurred edge pixels
        if (diff < 22 && minVal > 115) {
          data[i + 3] = 0; // set transparent
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    onChange(canvas.toDataURL("image/png"));
  };
  img.src = base64Str;
};

const removeTargetColor = (
  base64Str: string,
  targetR: number,
  targetG: number,
  targetB: number,
  tolerance: number = 24,
  onChange: (value: string) => void
) => {
  if (!base64Str || !base64Str.startsWith("data:image/")) return;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const diffR = Math.abs(r - targetR);
      const diffG = Math.abs(g - targetG);
      const diffB = Math.abs(b - targetB);

      if (diffR <= tolerance && diffG <= tolerance && diffB <= tolerance) {
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    onChange(canvas.toDataURL("image/png"));
  };
  img.src = base64Str;
};

const extractMajorColors = (
  base64Str: string,
  callback: (colors: [number, number, number][]) => void
) => {
  if (!base64Str || !base64Str.startsWith("data:image/")) {
    callback([]);
    return;
  }
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 30;
    canvas.height = 30;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      callback([]);
      return;
    }
    ctx.drawImage(img, 0, 0, 30, 30);
    try {
      const imgData = ctx.getImageData(0, 0, 30, 30);
      const data = imgData.data;
      const colorCounts: { [key: string]: { rgb: [number, number, number], count: number } } = {};

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 50) continue; // skip already transparent pixels

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // chunk colors to bin similar ones
        const rB = Math.round(r / 20) * 20;
        const gB = Math.round(g / 20) * 20;
        const bB = Math.round(b / 20) * 20;
        const key = `${rB},${gB},${bB}`;
        if (!colorCounts[key]) {
          colorCounts[key] = { rgb: [r, g, b], count: 0 };
        }
        colorCounts[key].count++;
      }

      const sorted = Object.values(colorCounts).sort((a, b) => b.count - a.count);
      const topColors = sorted.slice(0, 8).map(item => item.rgb);
      callback(topColors);
    } catch (e) {
      console.warn("Could not extract image colors due to space bounds or CORS", e);
      callback([]);
    }
  };
  img.src = base64Str;
};

const ImageUploader: React.FC<ImageUploaderProps> = ({ label, value, onChange, placeholder, id }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedColors, setDetectedColors] = useState<[number, number, number][]>([]);

  useEffect(() => {
    if (value && value.startsWith("data:image/")) {
      extractMajorColors(value, setDetectedColors);
    } else {
      setDetectedColors([]);
    }
  }, [value]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Result = e.target?.result as string;
      const isPngHeader = base64Result.startsWith("data:image/png") ||
                          base64Result.startsWith("data:image/webp") ||
                          base64Result.startsWith("data:image/gif") ||
                          base64Result.startsWith("data:image/svg+xml");

      // For files under 400KB, use the raw read base64 directly to absolutely avoid any loss, distortion, or transparency issues from canvas
      if (file.size < 400000) {
        onChange(base64Result);
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Limit max dimensions to 960px to keep firestore database document payloads light and fast
        const MAX_WIDTH = 960;
        const MAX_HEIGHT = 960;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, width, height); // Clear to preserve transparency
          ctx.drawImage(img, 0, 0, width, height);

          const nameLower = file.name.toLowerCase();
          const isTransparent = file.type === "image/png" ||
                                file.type === "image/gif" ||
                                file.type === "image/webp" ||
                                file.type === "image/svg+xml" ||
                                nameLower.endsWith(".png") ||
                                nameLower.endsWith(".gif") ||
                                nameLower.endsWith(".webp") ||
                                nameLower.endsWith(".svg") ||
                                isPngHeader;

          const compressed = canvas.toDataURL(isTransparent ? "image/png" : "image/jpeg", 0.85);
          onChange(compressed);
        } else {
          onChange(base64Result);
        }
      };
      img.src = base64Result;
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const isBase64 = value && value.startsWith("data:image/");

  return (
    <div className="space-y-1 font-sans">
      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 mb-0.5">{label}</label>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-2 transition flex flex-col gap-1.5 ${
          isDragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/25 blur-none"
        }`}
      >
        <div className="flex items-center gap-1.5">
          {value ? (
            <div className="relative group/thumb w-8 h-8 rounded overflow-hidden border border-slate-200 dark:border-slate-800 bg-white flex-shrink-0 flex items-center justify-center">
              <img src={value} className="w-full h-full object-contain" alt="Preview" referrerPolicy="no-referrer" />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute inset-0 bg-red-600/85 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition duration-150"
                title="지우기"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-8 h-8 rounded border-2 border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-650 flex-shrink-0">
              <ImageIcon className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 roundedpx px-2 py-0.5 text-slate-800 dark:text-white text-xs font-mono truncate"
              placeholder={placeholder || "경로나 https://... 주소 입력"}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 text-[9px]">
          <span className="text-slate-400 dark:text-slate-500 truncate max-w-[170px]">
            {isBase64 ? "✓ PC에서 직접 업로드됨" : "PNG/JPG 파일 드래그앤드롭 지원"}
          </span>
          <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer transition flex items-center gap-1 shrink-0">
            <Upload className="w-2.5 h-2.5" />
            <span>파일 찾기</span>
            <input
              type="file"
              id={id}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFile(file);
                }
              }}
            />
          </label>
        </div>

        {error && (
          <p className="text-[9px] text-red-500 font-medium">{error}</p>
        )}

        {value && value.startsWith("data:image/") && (
          <div className="mt-1 p-2 bg-slate-150/40 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800/80 space-y-2 text-[9px] font-sans">
            <div className="flex items-center justify-between gap-1">
              <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                배경 간편 제거 툴:
              </span>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => removeColorBackground(value, "white", onChange)}
                  className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded font-medium transition cursor-pointer"
                  title="흰색 배경 제거"
                >
                  흰색 제거
                </button>
                <button
                  type="button"
                  onClick={() => removeColorBackground(value, "black", onChange)}
                  className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded font-medium transition cursor-pointer"
                  title="검은색 배경 제거"
                >
                  검은색 제거
                </button>
                <button
                  type="button"
                  onClick={() => removeColorBackground(value, "checkerboard", onChange)}
                  className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded font-bold transition flex items-center gap-0.5 cursor-pointer animate-pulse"
                  title="투명 바둑판무늬(격자배경) 강제 제거"
                >
                  격자 제거 🪄
                </button>
              </div>
            </div>

            {detectedColors.length > 0 && (
              <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center gap-1">
                <span className="text-slate-450 dark:text-slate-400 font-semibold">🎯 클릭하여 지우기:</span>
                <div className="flex flex-wrap gap-1">
                  {detectedColors.map((rgb, idx) => {
                    const colorStr = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => removeTargetColor(value, rgb[0], rgb[1], rgb[2], 26, onChange)}
                        className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 transition hover:scale-125 focus:outline-none cursor-pointer relative"
                        style={{ backgroundColor: colorStr }}
                        title={`${colorStr} 색상 및 유사한 색상 제거`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export interface WebsiteHUDPanelProps {
  isEditModeActive: boolean;
  activeEditTarget: {
    type: "nav" | "hero" | "features" | "card" | "banner" | "text" | "image" | "divider";
    pageId?: string;
    page: CMSPage;
    blockId?: string;
    block?: CMSBlock;
    itemIndex?: number;
    selectedElement?: string;
  } | null;
  setActiveEditTarget: (target: any) => void;
  pages: CMSPage[];
  setPages: (pages: CMSPage[]) => void;

  handleHUDChange: (updatedFields: Partial<CMSBlock>) => Promise<void>;
  handleHUDCardChange: (updatedFields: Partial<{ title: string; desc: string; icon: string; buttonText?: string; buttonLink?: string }>) => Promise<void>;
  handleHUDDeleteCardItem: () => Promise<void>;
  handleNavTitleChange: (newTitle: string) => Promise<void>;
  handleNavVisibilityChange: (visible: boolean) => Promise<void>;
  navigationSettings: NavigationSettings;
  db: any;
  isCmsSaving?: boolean;
}

export const WebsiteHUDPanel: React.FC<WebsiteHUDPanelProps> = ({
  isEditModeActive,
  activeEditTarget,
  setActiveEditTarget,
  pages,
  setPages,
  handleHUDChange,
  handleHUDCardChange,
  handleHUDDeleteCardItem,
  handleNavTitleChange,
  handleNavVisibilityChange,
  navigationSettings,
  db,
  isCmsSaving,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<"bg" | "align" | "size" | "color" | "keyboard" | "layout" | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(true);

  // Automatically reopen the popover with correct settings whenever the selected element changes
  useEffect(() => {
    if (activeEditTarget) {
      setIsPopoverOpen(true);
    }
  }, [
    activeEditTarget?.blockId,
    activeEditTarget?.selectedElement,
    activeEditTarget?.itemIndex,
    activeEditTarget?.type
  ]);

  if (!isEditModeActive) return null;
  if (!activeEditTarget) return null;

  const block = activeEditTarget.block;

  const getCurrentAlignFieldAndValue = () => {
    if (!block) return { field: "align" as const, value: "center" as const };
    const sel = activeEditTarget?.selectedElement;
    if (sel === "badge") {
      return { field: "badgeAlign" as const, value: block.badgeAlign || block.align || "center" };
    }
    if (sel === "title") {
      return { field: "titleAlign" as const, value: block.titleAlign || block.align || "center" };
    }
    if (sel === "subtitle") {
      return { field: "subtitleAlign" as const, value: block.subtitleAlign || block.align || "center" };
    }
    if (sel === "content") {
      return { field: "contentAlign" as const, value: block.contentAlign || block.align || "center" };
    }
    if (sel === "buttons") {
      return { field: "buttonsAlign" as const, value: block.buttonsAlign || block.align || "center" };
    }
    return { field: "align" as const, value: block.align || "center" };
  };

  // Toolbar Click switches context to the selected aspect of the block
  const handleToolbarClick = (type: "bg" | "align" | "size" | "color" | "keyboard" | "layout") => {
    if (!activeEditTarget) return;

    let elementToSelect = activeEditTarget.selectedElement || "block";

    if (type === "bg") {
      elementToSelect = "block";
    } else if (type === "layout") {
      if (elementToSelect === "block") {
        elementToSelect = "image";
      }
    } else {
      if (elementToSelect === "block") {
        elementToSelect = (activeEditTarget.type === "text" || activeEditTarget.type === "image") ? "content" : "title";
      }
    }

    setActiveEditTarget({
      ...activeEditTarget,
      selectedElement: elementToSelect
    });

    setIsPopoverOpen(true);
  };

  const selectedElement = activeEditTarget?.selectedElement || "block";

  const getFriendlyElementName = () => {
    if (activeEditTarget.type === "nav") return "🌐 네비게이션 메뉴 편집";
    if (activeEditTarget.type === "card") return "💳 개별 카드 혜택 편집";

    switch (selectedElement) {
      case "badge": return "🏷️ 상단 배지 라벨 및 아이콘";
      case "title": return "✍️ 메인 대제목 내용 및 스타일";
      case "subtitle": return "📝 보조 설명문 (Subtitle)";
      case "buttons": return "🔘 행동 단추 버튼 및 링크";
      case "icon": return "🛡️ 삽입 데코레이션 이미지";
      case "image": return "🖼️ 대표 이미지 및 배치 스타일";
      case "bullet": return "🏁 특징 리스트 불릿";
      case "content": return "✍️ 본문 대텍스트 내용";
      case "divider": return "➖ 분할 구분선 길이/간격";
      case "block":
      default:
        return "🌌 구역 전체 테마 배경 & 배치 정렬";
    }
  };

  const renderSelectedElementSettings = () => {
    // 1. NAV MENU
    if (activeEditTarget.type === "nav") {
      const slug = activeEditTarget.page?.slug;
      const visible = slug ? navigationSettings[slug]?.visible !== false : true;
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400">선택한 메뉴 탭 표시이름</label>
            <input
              type="text"
              value={activeEditTarget.page?.title || ""}
              onChange={(e) => handleNavTitleChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-850 dark:text-white text-xs focus:ring-1 focus:ring-blue-500 font-sans"
              placeholder="예: 홈, 건의사항 등"
            />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 px-3 py-2 text-xs font-bold text-slate-650 dark:text-slate-300">
            <span>상단/모바일 메뉴에 노출</span>
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => handleNavVisibilityChange(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
          </label>
        </div>
      );
    }

    if (!block) return null;

    // 2. CARD ITEM (Features)
    if (activeEditTarget.type === "card" && activeEditTarget.itemIndex !== undefined) {
      const itemsList = block.items || [];
      const currentItem = itemsList[activeEditTarget.itemIndex] || { title: "", desc: "", icon: "Sparkles" };
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
            <span>카드 #{activeEditTarget.itemIndex + 1} 항목 편집</span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">상징 요약 아이콘</label>
            <select
              value={currentItem.icon || "Sparkles"}
              onChange={(e) => handleHUDCardChange({ icon: e.target.value })}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-850 dark:text-white"
            >
              <option value="Sparkles">✨ 반짝이 별 (Sparkles)</option>
              <option value="CreditCard">💳 신용카드 전산 (CreditCard)</option>
              <option value="ScrollText">📜 영수증 인쇄 (ScrollText)</option>
              <option value="ShieldCheck">🛡️ 보안 안심결제 (ShieldCheck)</option>
              <option value="Heart">💖 고객 감동지원 (Heart)</option>
              <option value="ShoppingBag">🛍️ 가맹 유통지원 (ShoppingBag)</option>
              <option value="Settings">⚙️ 최신 기술설치 (Settings)</option>
              <option value="Phone">📞 긴급 장애상담 (Phone)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">카드 항목 타이틀</label>
            <input
              type="text"
              value={currentItem.title || ""}
              onChange={(e) => handleHUDCardChange({ title: e.target.value })}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">항목 문안 보조 설명</label>
            <textarea
              rows={3}
              value={currentItem.desc || ""}
              onChange={(e) => handleHUDCardChange({ desc: e.target.value })}
              className="text-xs w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-850 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleHUDDeleteCardItem}
              className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-bold py-1.5 rounded-lg text-[10px] transition flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> 이 특징 카드만 삭제
            </button>
          </div>
        </div>
      );
    }

    // 3. UNIFIED TEXT ELEMENTS (Badge, Title, Subtitle, Content)
    const isTextElement = ["badge", "title", "subtitle", "content"].includes(selectedElement);
    if (isTextElement) {
      let textField = "title";
      let textLabel = "✍️ 텍스트";
      let alignField = "titleAlign";
      let fontSizeField = "titleFontSize";
      let letterSpacingField = "titleLetterSpacing";
      let sizeField = "titleSize";
      let colorField = "titleColor";

      if (selectedElement === "badge") {
        textField = "badge";
        textLabel = "🛡️ 상단 배지";
        alignField = "badgeAlign";
        fontSizeField = "badgeFontSize";
        letterSpacingField = "badgeLetterSpacing";
        sizeField = "badgeSize";
        colorField = "badgeColor";
      } else if (selectedElement === "title") {
        textField = "title";
        textLabel = "✍️ 메인 대제목";
        alignField = "titleAlign";
        fontSizeField = "titleFontSize";
        letterSpacingField = "titleLetterSpacing";
        sizeField = "titleSize";
        colorField = "titleColor";
      } else if (selectedElement === "subtitle") {
        textField = "subtitle";
        textLabel = "📝 보조 설명문";
        alignField = "subtitleAlign";
        fontSizeField = "subtitleFontSize";
        letterSpacingField = "subtitleLetterSpacing";
        sizeField = "subtitleSize";
        colorField = "subtitleColor";
      } else if (selectedElement === "content") {
        textField = "content";
        textLabel = "📄 본문 내용";
        alignField = "contentAlign";
        fontSizeField = "contentFontSize";
        letterSpacingField = "contentLetterSpacing";
        sizeField = "contentSize";
        colorField = "contentColor";
      }

      return (
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">{textLabel} 문구 내용</label>
            <textarea
              rows={textField === "content" ? 5 : 2}
              value={block[textField as keyof CMSBlock] as string || ""}
              onChange={(e) => handleUpdateField({ [textField]: e.target.value })}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-850 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-sans leading-normal"
              placeholder={`${textLabel} 문구를 입력하세요.`}
            />
          </div>

          {selectedElement === "badge" && (
            <div className="pt-1">
              <ImageUploader
                label="🛡️ 배지 왼쪽 커스텀 아이콘 (SVG/PNG/JPG)"
                value={block.badgeIconUrl || ""}
                onChange={(val) => handleUpdateField({ badgeIconUrl: val })}
                placeholder="배지 글자 왼쪽에 표시될 아이콘"
                id="hud-badge-icon-uploader"
              />
            </div>
          )}

          {/* Alignment */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
            <span className="block text-[10px] font-bold text-slate-400 mb-1">🏁 개별 정렬방향 조절</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { align: "left", label: "왼쪽 정렬", icon: AlignLeft },
                { align: "center", label: "가운데", icon: AlignCenter },
                { align: "right", label: "오른쪽 정렬", icon: AlignRight }
              ].map((alignItem) => {
                const Icon = alignItem.icon;
                const currentAlignVal = block[alignField as keyof CMSBlock] || block.align || "center";
                return (
                  <button
                    key={alignItem.align}
                    onClick={() => handleUpdateField({ [alignField]: alignItem.align as any })}
                    className={`py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 transition text-[10px] font-bold ${
                      currentAlignVal === alignItem.align
                        ? "border-blue-500 bg-blue-50/10 text-blue-600 dark:text-blue-400 font-bold scale-[1.01]"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{alignItem.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Sizes & Sliders */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">📐 글자 크기 조절 (pt)</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md font-mono font-bold">
                {(block[fontSizeField as keyof CMSBlock] as string) || "기본값"} {(block[fontSizeField as keyof CMSBlock] as string) ? "pt" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="6"
                max="72"
                step="1"
                value={(block[fontSizeField as keyof CMSBlock] as string) || (selectedElement === "title" ? "28" : selectedElement === "subtitle" ? "14" : "12")}
                onChange={(e) => handleUpdateField({ [fontSizeField]: e.target.value })}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <input
                type="number"
                min="6"
                max="100"
                value={(block[fontSizeField as keyof CMSBlock] as string) || ""}
                onChange={(e) => handleUpdateField({ [fontSizeField]: e.target.value })}
                className="w-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-1.5 py-1 text-slate-850 dark:text-white text-center text-xs focus:outline-none"
                placeholder="자동"
              />
            </div>
          </div>

          {/* Letter Spacing */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">↔️ 자간 조절 (Letter-spacing, px)</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md font-mono font-bold">
                {(block[letterSpacingField as keyof CMSBlock] as string) || "0"} px
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-10"
                max="30"
                step="0.5"
                value={(block[letterSpacingField as keyof CMSBlock] as string) || "0"}
                onChange={(e) => handleUpdateField({ [letterSpacingField]: e.target.value })}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <input
                type="number"
                min="-20"
                max="50"
                step="0.5"
                value={(block[letterSpacingField as keyof CMSBlock] as string) || "0"}
                onChange={(e) => handleUpdateField({ [letterSpacingField]: e.target.value })}
                className="w-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-1.5 py-1 text-slate-850 dark:text-white text-center text-xs focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Style Presets */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850">
            <span className="block text-[10px] font-bold text-slate-400">대표 스타일 크기 프리셋 (Tailwind)</span>
            <div className="grid grid-cols-2 gap-1.5">
              {sizePresets.map((size) => (
                <button
                  key={size.value}
                  onClick={() => handleUpdateField({ [sizeField]: size.value })}
                  className={`px-2 py-1.5 rounded-lg border text-[10px] text-left font-semibold transition ${
                    block[sizeField as keyof CMSBlock] === size.value
                      ? "border-blue-500 bg-blue-50/10 text-blue-600 dark:text-blue-400 font-bold"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Color */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850">
            <span className="block text-[10px] font-bold text-slate-400">글자 강조 전용 색상</span>
            <div className="grid grid-cols-2 gap-1.5">
              {fgColorsList.map((fg) => (
                <button
                  key={fg.value}
                  onClick={() => handleUpdateField({ [colorField]: fg.value })}
                  className={`px-2.5 py-1.5 rounded-lg border text-left text-[10px] font-semibold transition flex items-center justify-between ${
                    block[colorField as keyof CMSBlock] === fg.value
                      ? "border-blue-500 bg-blue-50/10 text-blue-600 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>{fg.label}</span>
                  <span className={`w-3 h-3 rounded-full border ${fg.value.replace("text-", "bg-")}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 6. BUTTONS
    if (selectedElement === "buttons") {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 mb-1">행동 버튼 1 명칭</label>
              <input
                type="text"
                value={block.buttonText || ""}
                onChange={(e) => handleUpdateField({ buttonText: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1 text-slate-850 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="가맹상담"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 mb-1">버튼 1 연결탭</label>
              <select
                value={block.buttonLink || "home"}
                onChange={(e) => handleUpdateField({ buttonLink: e.target.value })}
                className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-850 text-xs rounded-lg px-1.5 py-1 text-slate-600 dark:text-slate-300"
              >
                <option value="home">홈</option>
                <option value="products">제품 리스트</option>
                <option value="request_consult">가맹상담 신청</option>
                <option value="request_paper">용지 무료신청</option>
                <option value="board_suggestions">건의 게시판</option>
                <option value="board_resources">기술 자료실</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-50 dark:border-slate-800">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 mb-1">➕ 버튼 2 명칭</label>
              <input
                type="text"
                value={block.button2Text || ""}
                onChange={(e) => handleUpdateField({ button2Text: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1 text-slate-850 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="보조 버튼 설명"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 mb-1">버튼 2 연결탭</label>
              <select
                value={block.button2Link || "home"}
                onChange={(e) => handleUpdateField({ button2Link: e.target.value })}
                className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-850 text-xs rounded-lg px-1.5 py-1 text-slate-600 dark:text-slate-300"
              >
                <option value="home">홈</option>
                <option value="products">제품 리스트</option>
                <option value="request_consult">가맹상담 신청</option>
                <option value="request_paper">용지 무료신청</option>
                <option value="board_suggestions">건의 게시판</option>
                <option value="board_resources">기술 자료실</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <span className="block text-[10px] font-bold text-slate-400">대표 버튼 배경색</span>
            <div className="grid grid-cols-2 gap-1.5">
              {btnBgList.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => handleUpdateField({ buttonBgColor: btn.value })}
                  className={`px-2 py-1 rounded-lg border text-left text-[10.5px] font-semibold transition flex items-center justify-between ${
                    block.buttonBgColor === btn.value
                      ? "border-blue-500 bg-blue-50/10 dark:bg-blue-505/10 text-blue-600 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {btn.label}
                  <div className={`w-3.5 h-3.5 rounded-full border ${btn.value}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <span className="block text-[10px] font-bold text-slate-400">행동 버튼 모서리 곡률</span>
            <div className="grid grid-cols-2 gap-1.5">
              {roundnessPresets.map((round) => (
                <button
                  key={round.value}
                  onClick={() => handleUpdateField({ buttonRoundness: round.value })}
                  className={`px-2 py-1 rounded-lg border text-[10.5px] text-left font-medium transition ${
                    block.buttonRoundness === round.value
                      ? "border-blue-500 bg-blue-50/10 text-blue-600 dark:text-blue-400 font-bold"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {round.label}
                </button>
              ))}
            </div>
          </div>

          {/* 버튼 1 크기 및 텍스트 세부 조절 */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="block text-[10px] font-bold text-slate-400">버튼 1 크기 & 텍스트 크기 조절</span>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div>
                <span className="text-slate-400 block mb-0.5">가로 너비 (Width)</span>
                <input
                  type="text"
                  value={block.buttonWidth || ""}
                  onChange={(e) => handleUpdateField({ buttonWidth: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-850 dark:text-white"
                  placeholder="예: 180px, auto"
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">세로 높이 (Height)</span>
                <input
                  type="text"
                  value={block.buttonHeight || ""}
                  onChange={(e) => handleUpdateField({ buttonHeight: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-850 dark:text-white"
                  placeholder="예: 56px, auto"
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">글꼴 크기 (Font Size)</span>
                <input
                  type="text"
                  value={block.buttonFontSize || ""}
                  onChange={(e) => handleUpdateField({ buttonFontSize: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-850 dark:text-white"
                  placeholder="예: 16px, 11pt, auto"
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">글자 자간 (Letter-spacing)</span>
                <input
                  type="text"
                  value={block.buttonLetterSpacing || ""}
                  onChange={(e) => handleUpdateField({ buttonLetterSpacing: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-850 dark:text-white"
                  placeholder="예: -0.5px"
                />
              </div>
            </div>
          </div>

          {/* 버튼 2 크기 및 텍스트 세부 조절 */}
          {block.button2Text && (
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="block text-[10px] font-bold text-slate-400">버튼 2 크기 & 텍스트 크기 조절</span>
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div>
                  <span className="text-slate-400 block mb-0.5">가로 너비 (Width)</span>
                  <input
                    type="text"
                    value={block.button2Width || ""}
                    onChange={(e) => handleUpdateField({ button2Width: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-850 dark:text-white"
                    placeholder="예: 180px, auto"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">세로 높이 (Height)</span>
                  <input
                    type="text"
                    value={block.button2Height || ""}
                    onChange={(e) => handleUpdateField({ button2Height: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-850 dark:text-white"
                    placeholder="예: 56px, auto"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">글꼴 크기 (Font Size)</span>
                  <input
                    type="text"
                    value={block.button2FontSize || ""}
                    onChange={(e) => handleUpdateField({ button2FontSize: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-850 dark:text-white"
                    placeholder="예: 16px, 11pt, auto"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">글자 자간 (Letter-spacing)</span>
                  <input
                    type="text"
                    value={block.button2LetterSpacing || ""}
                    onChange={(e) => handleUpdateField({ button2LetterSpacing: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-850 dark:text-white"
                    placeholder="예: -0.5px"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 7. ICON DESIGN ACCENT
    if (selectedElement === "icon") {
      return (
        <div className="space-y-3">
          <ImageUploader
            label="🖼️ 삽입 데코레이션 아이콘/이미지 (SVG/PNG/JPG)"
            value={block.iconImageUrl || ""}
            onChange={(val) => handleUpdateField({ iconImageUrl: val })}
            placeholder="예: /1.svg 또는 직접 파일 업로드"
            id="hud-icon-uploader"
          />

          {block.iconImageUrl && (
            <div className="p-2.5 bg-slate-150/30 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl space-y-2 text-[10px]">
              <span className="block font-bold text-slate-400">🛡️ 데코레이션 아이콘 세부 위치/크기 조절</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block mb-0.5">가로 폭 크기</span>
                  <input
                    type="text"
                    value={block.iconWidth || ""}
                    onChange={(e) => handleUpdateField({ iconWidth: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-805 dark:text-white"
                    placeholder="예: 100px"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">세로 높이</span>
                  <input
                    type="text"
                    value={block.iconHeight || ""}
                    onChange={(e) => handleUpdateField({ iconHeight: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-805 dark:text-white"
                    placeholder="예: auto"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">좌우 미세 이동 X (px)</span>
                  <input
                    type="number"
                    value={block.iconPositionX || 0}
                    onChange={(e) => handleUpdateField({ iconPositionX: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-805 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">상하 미세 이동 Y (px)</span>
                  <input
                    type="number"
                    value={block.iconPositionY || 0}
                    onChange={(e) => handleUpdateField({ iconPositionY: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-805 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">상단 여백 마진</span>
                  <input
                    type="number"
                    value={block.iconMarginTop || 0}
                    onChange={(e) => handleUpdateField({ iconMarginTop: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-805 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">하단 여백 마진</span>
                  <input
                    type="number"
                    value={block.iconMarginBottom || 0}
                    onChange={(e) => handleUpdateField({ iconMarginBottom: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-805 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 8. IMAGE PROPERTIES
    if (selectedElement === "image") {
      return (
        <div className="space-y-3">
          <ImageUploader
            label="🌌 대표 사이드/배경 이미지 (URL/PNG/JPG)"
            value={block.imageUrl || ""}
            onChange={(val) => handleUpdateField({ imageUrl: val })}
            placeholder="https://images.unsplash.com/... 또는 직접 파일 업로드"
            id="hud-element-image-uploader"
          />

          {block.imageUrl && (
            <div className="p-2.5 bg-slate-150/40 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
              {block.type === "banner" && (
                <>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 mb-1">📐 배너 내 이미지 배치 스타일</span>
                    <select
                      value={block.bannerLayout || "side-image"}
                      onChange={(e) => handleUpdateField({ bannerLayout: e.target.value as any })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white"
                    >
                      <option value="side-image">사이드 배치 (텍스트와 나란히)</option>
                      <option value="bg-image">전체 배경 이미지로 지정</option>
                      <option value="watermark">우측 구석에 투명 워터마크</option>
                      <option value="inline">본문 텍스트 내에 단순 줄바꿈 삽입</option>
                    </select>
                  </div>

                  {(block.bannerLayout === "side-image" || block.bannerLayout === "inline" || !block.bannerLayout) && (
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-1">🏁 이미지 세부 정렬 위치</span>
                      <select
                        value={block.bannerImagePosition || "right"}
                        onChange={(e) => handleUpdateField({ bannerImagePosition: e.target.value as any })}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white"
                      >
                        <option value="left">왼쪽 배치 (Text on Right)</option>
                        <option value="right">오른쪽 배치 (Text on Left)</option>
                        <option value="top">인라인 상단 (Banner TOP)</option>
                        <option value="bottom">인라인 하단 (Banner BOTTOM)</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {block.type === "image" && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">중앙 오버레이 버튼 문구</label>
                    <input
                      type="text"
                      value={block.buttonText || ""}
                      onChange={(e) => handleUpdateField({ buttonText: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-2.5 py-1.5 text-slate-850 dark:text-white text-xs"
                      placeholder="비워두면 버튼 오버레이 숨김"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">클릭시 링크이동 탭</label>
                    <select
                      value={block.buttonLink || "request_consult"}
                      onChange={(e) => handleUpdateField({ buttonLink: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 text-xs rounded-xl px-2 py-1.5 text-slate-700 dark:text-slate-300"
                    >
                      <option value="home">홈</option>
                      <option value="products">제품 리스트</option>
                      <option value="request_consult">가맹상담 신청</option>
                      <option value="request_paper">용지 무료신청</option>
                    </select>
                  </div>
                </>
              )}

              {/* Layout Dimensions for Image */}
              <div className="border-t border-slate-200/60 dark:border-slate-800/80 pt-2 space-y-2 text-[10px] text-slate-500">
                <span className="block font-bold text-slate-400">🏞️ 미세 크기 및 자유 주소 위치 조절</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[9px] mb-0.5">이미지 폭 (예: 250px, 45%)</span>
                    <input
                      type="text"
                      value={block.imageWidth || ""}
                      onChange={(e) => handleUpdateField({ imageWidth: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                      placeholder="예: 280px"
                    />
                  </div>
                  <div>
                    <span className="block text-[9px] mb-0.5">이미지 높이 (예: 200px, auto)</span>
                    <input
                      type="text"
                      value={block.imageHeight || ""}
                      onChange={(e) => handleUpdateField({ imageHeight: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                      placeholder="예: auto"
                    />
                  </div>
                  <div>
                    <span className="block text-[9px] mb-0.5">X축 미세이동 (px)</span>
                    <input
                      type="number"
                      value={block.imagePositionX || 0}
                      onChange={(e) => handleUpdateField({ imagePositionX: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="block text-[9px] mb-0.5">Y축 미세이동 (px)</span>
                    <input
                      type="number"
                      value={block.imagePositionY || 0}
                      onChange={(e) => handleUpdateField({ imagePositionY: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                  {block.type === "banner" && (
                    <div>
                      <span className="block text-[9px] mb-0.5">미세 회전각도 (도)</span>
                      <input
                        type="number"
                        value={block.imageRotation || 0}
                        onChange={(e) => handleUpdateField({ imageRotation: e.target.value })}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                      />
                    </div>
                  )}
                  <div>
                    <span className="block text-[9px] mb-0.5">모서리 둥글기 (Radius)</span>
                    <input
                      type="text"
                      value={block.imageRoundness || ""}
                      onChange={(e) => handleUpdateField({ imageRoundness: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                      placeholder="예: 1.5rem, 12px"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 9. BULLET CHECKS
    if (selectedElement === "bullet") {
      return (
        <div className="space-y-3 font-sans text-xs">
          <span className="block text-[10px] font-bold text-slate-400">특징 목록 불릿</span>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-2">
            <p className="font-semibold text-slate-750 dark:text-slate-350">💡 편집 도움말</p>
            <p className="text-[11px] leading-relaxed">
              프리뷰 화면 안의 특징 체크박스 설명글을 마우스로 직접 클릭하면, 즉시 문안 변경을 위한 포커스가 활성화됩니다.
            </p>
          </div>
        </div>
      );
    }



    // 11. DIVIDER
    if (selectedElement === "divider") {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">구분선 가로 폭 크기</label>
            <select
              value={block.imageWidth || "w-16"}
              onChange={(e) => handleUpdateField({ imageWidth: e.target.value })}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-815 dark:text-white text-xs"
            >
              <option value="w-16">아주 짧게 (w-16)</option>
              <option value="w-32">짧게 (w-32)</option>
              <option value="w-1/2">절반 너비 (50%)</option>
              <option value="w-3/4">3/4 너비 (75%)</option>
              <option value="w-full">화면 너비 다채움 (100%)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">상하 마진 여백 (px)</label>
            <input
              type="number"
              value={parseInt(block.iconMarginTop || "16")}
              onChange={(e) => handleUpdateField({ iconMarginTop: e.target.value })}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-slate-850 dark:text-white text-xs"
            />
          </div>
        </div>
      );
    }

    // 12. GENERAL BLOCK BACKDROP BACKUP
    return (
      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <span className="block text-[10px] font-bold text-slate-400">배너 구역 전체 배경색</span>
          <div className="grid grid-cols-2 gap-1.5">
            {bgColorsList.map((bg) => (
              <button
                key={bg.value}
                onClick={() => handleUpdateField({ bgColor: bg.value })}
                className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-semibold transition flex items-center justify-between ${
                  block.bgColor === bg.value
                    ? "border-blue-500 bg-blue-50/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {bg.label}
                <div className={`w-3.5 h-3.5 rounded-full border ${bg.value}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="block text-[10px] font-bold text-slate-400">콘텐츠 가로 정렬 방향</span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { align: "left", label: "왼쪽", icon: AlignLeft },
              { align: "center", label: "가운데", icon: AlignCenter },
              { align: "right", label: "오른쪽", icon: AlignRight }
            ].map((alignItem) => {
              const Icon = alignItem.icon;
              const { field, value: currentAlignVal } = getCurrentAlignFieldAndValue();
              return (
                <button
                  key={alignItem.align}
                  onClick={() => handleUpdateField({ [field]: alignItem.align as any })}
                  className={`py-1.5 px-0.5 rounded-xl border flex flex-col items-center gap-1 transition text-[10px] font-semibold ${
                    currentAlignVal === alignItem.align
                      ? "border-blue-500 bg-blue-50/15 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {alignItem.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="block text-[10px] font-bold text-slate-400">콘텐츠 전체 가로 폭 (Width)</span>
          <select
            value={block.blockWidth || "max-w-3xl"}
            onChange={(e) => handleUpdateField({ blockWidth: e.target.value })}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-815 dark:text-white font-medium"
          >
            <option value="max-w-xl">중앙 집중형 좁게 (max-w-xl)</option>
            <option value="max-w-3xl">배너 표준 최적 (max-w-3xl)</option>
            <option value="max-w-5xl">화이드 넓게 확장 (max-w-5xl)</option>
            <option value="max-w-full">화면 너비 꽉 채움 (max-w-full)</option>
          </select>
        </div>

        {block.type === "features" && (
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 mb-1">배치할 그리드 열(Col) 나누기</span>
              <select
                value={block.gridCols || "sm:grid-cols-2"}
                onChange={(e) => handleUpdateField({ gridCols: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1 text-xs text-slate-850 dark:text-white font-medium"
              >
                <option value="grid-cols-1">수직 싱글 리스트 (1열)</option>
                <option value="sm:grid-cols-2">수평 이등분 (2열)</option>
                <option value="sm:grid-cols-3">카드 그리드 최적 (3열)</option>
                <option value="md:grid-cols-4">수평 컴팩트 리스트 (4열)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={async () => {
                const list = block.items || [];
                const updatedList = [...list, { title: "새로운 혜택 추가", desc: "이 카드를 마우스로 클릭하여 실시간으로 내용을 변경해 보세요.", icon: "Sparkles" }];
                const updatedBlocks = activeEditTarget.page.blocks.map(b => b.id === activeEditTarget.blockId ? { ...b, items: updatedList } : b);
                setPages(pages.map(p => p.id === activeEditTarget.page.id ? { ...p, blocks: updatedBlocks } : p));
                setActiveEditTarget({
                  ...activeEditTarget,
                  block: { ...block, items: updatedList } as CMSBlock,
                  itemIndex: updatedList.length - 1,
                  type: "card"
                });
                await updateDoc(doc(db, "cms_pages", activeEditTarget.page.id), { blocks: updatedBlocks });
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> 새 카드 혜택 추가
            </button>
          </div>
        )}

        {block.elementOrder && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-[10px] font-bold text-slate-400">요소 정렬 순서 위/아래 이동</span>
            <div className="space-y-1 mt-1 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
              {block.elementOrder.map((el, idx) => {
                const orderName = el === "badge" ? "🛡️ 배지 라벨"
                                : el === "title" ? "✍️ 메인 대제목"
                                : el === "subtitle" ? "📝 서브 설명"
                                : el === "buttons" ? "🔘 행동 단추 버튼"
                                : "🖼️ 추가 SVG/이미지";
                return (
                  <div key={el} className="flex items-center justify-between bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-150 dark:border-slate-800 text-[10px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{orderName}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={async () => {
                          const order = block.elementOrder || [];
                          const newOrder = [...order];
                          [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
                          await handleUpdateField({ elementOrder: newOrder });
                        }}
                        className="w-4 h-4 flex items-center justify-center bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 hover:dark:bg-slate-700 rounded text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white disabled:opacity-20 text-[9px]"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === (block.elementOrder || []).length - 1}
                        onClick={async () => {
                          const order = block.elementOrder || [];
                          const newOrder = [...order];
                          [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
                          await handleUpdateField({ elementOrder: newOrder });
                        }}
                        className="w-4 h-4 flex items-center justify-center bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 hover:dark:bg-slate-700 rounded text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white disabled:opacity-20 text-[9px]"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Modern background theme swatches
  const bgColorsList = [
    { label: "시크 다크", value: "bg-slate-900" },
    { label: "청량 오션블루", value: "bg-blue-900" },
    { label: "딥 퍼플", value: "bg-indigo-950" },
    { label: "클린 화이트", value: "bg-white" },
    { label: "연회색 모던", value: "bg-slate-50" },
    { label: "가맹 포레스트", value: "bg-emerald-950" }
  ];

  // Button background theme colors
  const btnBgList = [
    { label: "블루 강조", value: "bg-blue-600" },
    { label: "에메랄드 그린", value: "bg-emerald-600" },
    { label: "바이올렛 인디고", value: "bg-indigo-600" },
    { label: "고대비 블랙", value: "bg-slate-900" },
    { label: "다크 그레이", value: "bg-slate-800" },
    { label: "클린 화이트", value: "bg-white" }
  ];

  // Accent primary colors (Title / Badge decoration)
  const fgColorsList = [
    { label: "기본 텍스트", value: "text-slate-900" },
    { label: "화이트 라이트", value: "text-white" },
    { label: "스마트 블루", value: "text-blue-600" },
    { label: "에메랄드 그린", value: "text-teal-600" },
    { label: "경고 로즈", value: "text-rose-500" }
  ];

  // Size Presets
  const sizePresets = [
    { label: "초대형 배너 타이틀", value: "text-5xl" },
    { label: "대형 타이틀", value: "text-4xl" },
    { label: "중형 서브 타이틀", value: "text-2xl" },
    { label: "기본 타이틀", value: "text-xl" },
    { label: "소형 라벨", value: "text-base" }
  ];

  // Roundness Presets
  const roundnessPresets = [
    { label: "직각 사각형", value: "rounded-none" },
    { label: "미디엄 커브", value: "rounded-lg" },
    { label: "모던 라운드", value: "rounded-xl" },
    { label: "풍부한 둥글기", value: "rounded-2xl" },
    { label: "물방울 타원", value: "rounded-full" }
  ];

  const handleUpdateField = async (fields: Partial<CMSBlock>) => {
    await handleHUDChange(fields);
  };

  const switchSelectedElement = (element: string) => {
    if (!activeEditTarget) return;
    setActiveEditTarget({
      ...activeEditTarget,
      selectedElement: element
    });
    setIsPopoverOpen(true);
  };

  const getTextToolbarField = () => {
    if (selectedElement === "badge") return "badgeFontSize";
    if (selectedElement === "subtitle") return "subtitleFontSize";
    if (selectedElement === "content") return "contentFontSize";
    return "titleFontSize";
  };

  const isTextToolbarTarget = ["badge", "title", "subtitle", "content"].includes(selectedElement);
  const textToolbarField = getTextToolbarField();
  const textToolbarValue = block && isTextToolbarTarget ? ((block[textToolbarField as keyof CMSBlock] as string) || "") : "";

  const bodyElementKey = activeEditTarget.type === "text" ? "content" : "subtitle";

  const toolbarTargets = [
    { key: "block", label: "구역", icon: LayoutGrid, enabled: !!block },
    { key: "title", label: "제목", icon: Type, enabled: !!block && activeEditTarget.type !== "image" && activeEditTarget.type !== "text" },
    { key: bodyElementKey, label: activeEditTarget.type === "text" ? "텍스트" : "본문", icon: BookOpen, enabled: !!block && activeEditTarget.type !== "image" },
    { key: "buttons", label: "버튼", icon: Link, enabled: !!block && (activeEditTarget.type === "hero" || activeEditTarget.type === "banner") },
    { key: "image", label: "이미지", icon: ImageIcon, enabled: !!block && (activeEditTarget.type === "image" || activeEditTarget.type === "hero" || activeEditTarget.type === "banner") },
  ];

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none select-none font-sans">

      {/* =========================================================================
          1. Sleek absolute popovers content rendering engine above the toolbar
         ========================================================================= */}
      {isPopoverOpen && activeEditTarget && (
        <aside className="absolute left-3 top-3 bottom-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xl w-[330px] max-w-[calc(100vw_-_1.5rem)] overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-left-3 duration-200 text-slate-800 dark:text-slate-100 text-left">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                  사이트 편집
                </span>
                {isCmsSaving ? (
                  <span className="text-[9px] font-extrabold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                    저장 중...
                  </span>
                ) : (
                  <span className="text-[9px] font-extrabold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full shrink-0">
                    저장 완료
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[245px]">
                {getFriendlyElementName()}
              </p>
            </div>
            <button
              onClick={() => setIsPopoverOpen(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded bg-transparent"
              title="속성창 닫기"
            >
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white" />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/30">
            {toolbarTargets.map((target) => {
              const Icon = target.icon;
              return (
                <button
                  key={target.key}
                  type="button"
                  disabled={!target.enabled}
                  onClick={() => switchSelectedElement(target.key)}
                  className={`h-12 rounded-xl border text-[10px] font-black transition flex flex-col items-center justify-center gap-0.5 ${
                    selectedElement === target.key
                      ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-blue-300 disabled:opacity-35 disabled:hover:border-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{target.label}</span>
                </button>
              );
            })}
          </div>

          <div className="h-[calc(100%-116px)] overflow-y-auto p-4 text-xs space-y-3.5">
            {renderSelectedElementSettings()}
          </div>
        </aside>
      )}

      {/* Bypassed Old Popover Block */}
      {false && activeDropdown && (
        <div className="mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xl p-4 w-80 sm:w-96 max-h-[55vh] overflow-y-auto pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200 space-y-4 text-slate-800 dark:text-slate-100 text-left">

          {/* Header of Popover */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {activeDropdown === "bg" ? "테마 색상 변경" :
               activeDropdown === "align" ? "레이아웃 정렬" :
               activeDropdown === "size" ? "글자 크기 & 모서리" :
               activeDropdown === "color" ? "폰트 강조 색상" :
               activeDropdown === "keyboard" ? "콘텐츠 텍스트 편집기" :
               "상세 레이아웃 & 정렬"}
            </span>
            <button
              onClick={() => setActiveDropdown(null)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded bg-transparent"
              title="닫기"
            >
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white" />
            </button>
          </div>

          <div className="text-xs space-y-3.5">
            {/* Popover content: Background Colors */}
            {activeDropdown === "bg" && block && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400">배너 영역 전체 배경색</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {bgColorsList.map((bg) => (
                      <button
                        key={bg.value}
                        onClick={() => handleUpdateField({ bgColor: bg.value })}
                        className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-semibold transition flex items-center justify-between ${
                          block.bgColor === bg.value
                            ? "border-blue-500 bg-blue-50/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {bg.label}
                        <div className={`w-3.5 h-3.5 rounded-full border ${bg.value}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400">대표 버튼 배경색</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {btnBgList.map((btn) => (
                      <button
                        key={btn.value}
                        onClick={() => handleUpdateField({ buttonBgColor: btn.value })}
                        className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-semibold transition flex items-center justify-between ${
                          block.buttonBgColor === btn.value
                            ? "border-blue-500 bg-blue-50/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {btn.label}
                        <div className={`w-3.5 h-3.5 rounded-full border ${btn.value}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Popover content: Alignment */}
            {activeDropdown === "align" && block && (
              <div className="space-y-3">
                <span className="block text-[10px] font-bold text-slate-400">콘텐츠 가로 정렬 방향</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { align: "left", label: "왼쪽 정렬", icon: AlignLeft },
                    { align: "center", label: "가운데 정렬", icon: AlignCenter },
                    { align: "right", label: "오른쪽 정렬", icon: AlignRight }
                  ].map((alignItem) => {
                    const Icon = alignItem.icon;
                    const { field, value: currentAlignVal } = getCurrentAlignFieldAndValue();
                    return (
                      <button
                        key={alignItem.align}
                        onClick={() => handleUpdateField({ [field]: alignItem.align as any })}
                        className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1.5 transition text-[11px] font-semibold ${
                          currentAlignVal === alignItem.align
                            ? "border-blue-500 bg-blue-50/15 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {alignItem.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Popover content: Font Sizes */}
            {activeDropdown === "size" && block && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400">대제목 글자 크기</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {sizePresets.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => handleUpdateField({ titleSize: size.value })}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11.5px] text-left font-semibold transition ${
                          block.titleSize === size.value
                            ? "border-blue-500 bg-blue-50/10 text-blue-600 dark:text-blue-400 font-bold"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400">행동 버튼 라운드 처리 (둥글기)</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {roundnessPresets.map((round) => (
                      <button
                        key={round.value}
                        onClick={() => handleUpdateField({ buttonRoundness: round.value })}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11.5px] text-left font-medium transition ${
                          block.buttonRoundness === round.value
                            ? "border-blue-500 bg-blue-50/10 text-blue-600 dark:text-blue-400 font-bold"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {round.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Popover content: Accent colors */}
            {activeDropdown === "color" && block && (
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400">대제목 주안색 (Primary Text Color)</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {fgColorsList.map((fg) => (
                    <button
                      key={fg.value}
                      onClick={() => handleUpdateField({ titleColor: fg.value })}
                      className={`px-2.5 py-1.5 rounded-lg border text-left text-[11.5px] font-semibold transition flex items-center justify-between ${
                        block.titleColor === fg.value
                          ? "border-blue-500 bg-blue-50/10 text-blue-600"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>{fg.label}</span>
                      <span className={`w-3 h-3 rounded-full border ${fg.value.replace("text-", "bg-")}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popover content: Layout, column control & elements order */}
            {activeDropdown === "layout" && block && (
              <div className="space-y-3">
                {block.type === "features" && (
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold text-slate-400">배치할 그리드 열(Col) 나누기</span>
                    <select
                      value={block.gridCols || "sm:grid-cols-2"}
                      onChange={(e) => handleUpdateField({ gridCols: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-850 dark:text-white font-medium"
                    >
                      <option value="grid-cols-1">수직 싱글 리스트 (1열)</option>
                      <option value="sm:grid-cols-2">수평 이등분 (2열)</option>
                      <option value="sm:grid-cols-3">카드 그리드 최적 (3열)</option>
                      <option value="md:grid-cols-4">수평 컴팩트 리스트 (4열)</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400">콘텐츠 전체 감싸는 폭 (Width)</span>
                  <select
                    value={block.blockWidth || "max-w-3xl"}
                    onChange={(e) => handleUpdateField({ blockWidth: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-850 dark:text-white font-medium"
                  >
                    <option value="max-w-xl">중앙 집중형 좁게 (max-w-xl)</option>
                    <option value="max-w-3xl">배너 표준 최적 (max-w-3xl)</option>
                    <option value="max-w-5xl">화이드 넓게 확장 (max-w-5xl)</option>
                    <option value="max-w-full">화면 너비 꽉 채움 (max-w-full)</option>
                  </select>
                </div>

                {block.elementOrder && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="block text-[10px] font-bold text-slate-400">요소 정렬 순서 위/아래 이동</span>
                    <div className="space-y-1 mt-1 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
                      {block.elementOrder.map((el, idx) => {
                        const orderName = el === "badge" ? "🛡️ 배지 라벨"
                                        : el === "title" ? "✍️ 메인 대제목"
                                        : el === "subtitle" ? "📝 서브 설명"
                                        : el === "buttons" ? "🔘 행동 단추 버튼"
                                        : "🖼️ 추가 SVG/이미지";
                        return (
                          <div key={el} className="flex items-center justify-between bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-150 dark:border-slate-800 text-[10px]">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{orderName}</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={async () => {
                                  const order = block.elementOrder || [];
                                  const newOrder = [...order];
                                  [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
                                  await handleUpdateField({ elementOrder: newOrder });
                                }}
                                className="w-4 h-4 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 hover:dark:bg-slate-700 rounded text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white disabled:opacity-20 text-[9px]"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === (block.elementOrder || []).length - 1}
                                onClick={async () => {
                                  const order = block.elementOrder || [];
                                  const newOrder = [...order];
                                  [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
                                  await handleUpdateField({ elementOrder: newOrder });
                                }}
                                className="w-4 h-4 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 hover:dark:bg-slate-700 rounded text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white disabled:opacity-20 text-[9px]"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Popover content: Keyboard (Text Content detail inputs) */}
            {activeDropdown === "keyboard" && (
              <div className="space-y-4 font-sans text-left text-xs pointer-events-auto">

                {/* 1. Sub-element Navigation Tab */}
                {activeEditTarget.type === "nav" && (
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-400">선택한 메뉴 탭 표시이름</label>
                    <input
                      type="text"
                      value={activeEditTarget.page?.title || ""}
                      onChange={(e) => handleNavTitleChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-850 dark:text-white text-xs focus:ring-1 focus:ring-blue-500"
                      placeholder="예: 홈, 건의사항 등"
                    />
                  </div>
                )}

                {/* 2. Banner Block Editable Elements */}
                {(activeEditTarget.type === "hero" || activeEditTarget.type === "banner") && block && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">상단 배지 (Badge)</label>
                        <input
                          type="text"
                          value={block.badge || ""}
                          onChange={(e) => handleUpdateField({ badge: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                          placeholder="예: 탑정보통신 2026 비즈니스"
                        />
                      </div>
                      <div className="pt-1">
                        <ImageUploader
                          label="🛡️ 배지 왼쪽 커스텀 아이콘 (SVG/PNG/JPG)"
                          value={block.badgeIconUrl || ""}
                          onChange={(val) => handleUpdateField({ badgeIconUrl: val })}
                          placeholder="배지 글자 왼쪽에 표시될 SVG/PNG"
                          id="hud-badge-icon-uploader"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">메인 대제목 (대중적)</label>
                      <textarea
                        rows={2}
                        value={block.title || ""}
                        onChange={(e) => handleUpdateField({ title: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-850 dark:text-white font-medium focus:outline-none"
                        placeholder="중앙 핵심 메인 타이틀"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">상세 보조 설명문 (Subtitle)</label>
                      <textarea
                        rows={2}
                        value={block.subtitle || ""}
                        onChange={(e) => handleUpdateField({ subtitle: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-850 dark:text-white focus:outline-none"
                        placeholder="상세 정보를 가볍게 요약하는 설명"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1">행동 버튼 1 명칭</label>
                        <input
                          type="text"
                          value={block.buttonText || ""}
                          onChange={(e) => handleUpdateField({ buttonText: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-850 dark:text-white text-xs"
                          placeholder="가맹상담"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1">버튼 1 연결탭</label>
                        <select
                          value={block.buttonLink || "home"}
                          onChange={(e) => handleUpdateField({ buttonLink: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200' text-[11px] rounded-lg px-1.5 py-1 text-slate-600 dark:text-slate-300"
                        >
                          <option value="home">홈</option>
                          <option value="products">제품 리스트</option>
                          <option value="request_consult">가맹상담 신청</option>
                          <option value="request_paper">용지 무료신청</option>
                          <option value="board_suggestions">건의 게시판</option>
                          <option value="board_resources">기술 자료실</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1">➕ 버튼 2 명칭</label>
                        <input
                          type="text"
                          value={block.button2Text || ""}
                          onChange={(e) => handleUpdateField({ button2Text: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-850 dark:text-white text-xs"
                          placeholder="보조 버튼 설명"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1">버튼 2 연결탭</label>
                        <select
                          value={block.button2Link || "home"}
                          onChange={(e) => handleUpdateField({ button2Link: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 text-[11px] rounded-lg px-1.5 py-1 text-slate-600 dark:text-slate-300"
                        >
                          <option value="home">홈</option>
                          <option value="products">제품 리스트</option>
                          <option value="request_consult">가맹상담 신청</option>
                          <option value="request_paper">용지 무료신청</option>
                          <option value="board_suggestions">건의 게시판</option>
                          <option value="board_resources">기술 자료실</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-150 dark:border-slate-800 space-y-3">
                      <ImageUploader
                        label="🖼️ 삽입 데코레이션 아이콘/이미지 (SVG/PNG/JPG)"
                        value={block.iconImageUrl || ""}
                        onChange={(val) => handleUpdateField({ iconImageUrl: val })}
                        placeholder="예: /1.svg 또는 직접 파일 업로드"
                        id="hud-icon-uploader"
                      />

                      {block.iconImageUrl && (
                        <div className="p-2.5 bg-slate-150/30 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl space-y-2 text-[10px]">
                          <span className="block font-bold text-slate-400">🛡️ 데코레이션 아이콘 세부 위치/크기 조절</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400 block mb-0.5">가로 폭 크기 (예: 64px, 15%)</span>
                              <input
                                type="text"
                                value={block.iconWidth || ""}
                                onChange={(e) => handleUpdateField({ iconWidth: e.target.value })}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                                placeholder="예: 100px"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">세로 높이 (예: 64px, auto)</span>
                              <input
                                type="text"
                                value={block.iconHeight || ""}
                                onChange={(e) => handleUpdateField({ iconHeight: e.target.value })}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                                placeholder="예: auto"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">좌우 이동 X (px)</span>
                              <input
                                type="number"
                                value={block.iconPositionX || 0}
                                onChange={(e) => handleUpdateField({ iconPositionX: e.target.value })}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">상하 이동 Y (px)</span>
                              <input
                                type="number"
                                value={block.iconPositionY || 0}
                                onChange={(e) => handleUpdateField({ iconPositionY: e.target.value })}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">상단 마진 여백 (px)</span>
                              <input
                                type="number"
                                value={block.iconMarginTop || 0}
                                onChange={(e) => handleUpdateField({ iconMarginTop: e.target.value })}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">하단 마진 여백 (px)</span>
                              <input
                                type="number"
                                value={block.iconMarginBottom || 0}
                                onChange={(e) => handleUpdateField({ iconMarginBottom: e.target.value })}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === "banner" && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                          <ImageUploader
                            label="🌌 배너 대배경 / 사이드 이미지 (URL/PNG/JPG)"
                            value={block.imageUrl || ""}
                            onChange={(val) => handleUpdateField({ imageUrl: val })}
                            placeholder="https://images.unsplash.com/... 또는 직접 파일 업로드"
                            id="hud-banner-bg-uploader"
                          />

                          {block.imageUrl && (
                            <div className="p-2.5 bg-slate-150/40 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 mb-1">📐 배너 내 이미지 배치 스타일</span>
                                <select
                                  value={block.bannerLayout || "side-image"}
                                  onChange={(e) => handleUpdateField({ bannerLayout: e.target.value as any })}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white"
                                >
                                  <option value="side-image">사이드 배치 (텍스트와 나란히)</option>
                                  <option value="bg-image">전체 배경 이미지로 지정</option>
                                  <option value="watermark">우측 구석에 투명 워터마크</option>
                                  <option value="inline">본문 텍스트 내에 단순 줄바꿈 삽입</option>
                                </select>
                              </div>

                              {(block.bannerLayout === "side-image" || block.bannerLayout === "inline" || !block.bannerLayout) && (
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 mb-1">🏁 이미지 세부 정렬 위치</span>
                                  <select
                                    value={block.bannerImagePosition || "right"}
                                    onChange={(e) => handleUpdateField({ bannerImagePosition: e.target.value as any })}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white"
                                  >
                                    <option value="left">왼쪽 배치 (Text on Right)</option>
                                    <option value="right">오른쪽 배치 (Text on Left)</option>
                                    <option value="top">인라인 상단 (Banner TOP)</option>
                                    <option value="bottom">인라인 하단 (Banner BOTTOM)</option>
                                  </select>
                                </div>
                              )}

                              {/* Size, margins, positioning, rotation controls */}
                              <div className="border-t border-slate-200/60 dark:border-slate-800/80 pt-2 space-y-2 text-[10px] text-slate-500">
                                <span className="block font-bold text-slate-400">🏞️ 배너 이미지 미세 크기 및 자유 주소 위치 조절</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="block text-[9px] mb-0.5">이미지 폭 (예: 250px, 45%)</span>
                                    <input
                                      type="text"
                                      value={block.imageWidth || ""}
                                      onChange={(e) => handleUpdateField({ imageWidth: e.target.value })}
                                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                                      placeholder="예: 280px"
                                    />
                                  </div>
                                  <div>
                                    <span className="block text-[9px] mb-0.5">이미지 높이 (예: 200px, auto)</span>
                                    <input
                                      type="text"
                                      value={block.imageHeight || ""}
                                      onChange={(e) => handleUpdateField({ imageHeight: e.target.value })}
                                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                                      placeholder="예: auto"
                                    />
                                  </div>
                                  <div>
                                    <span className="block text-[9px] mb-0.5">좌우 미세 이동 X (px)</span>
                                    <input
                                      type="number"
                                      value={block.imagePositionX || 0}
                                      onChange={(e) => handleUpdateField({ imagePositionX: e.target.value })}
                                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <span className="block text-[9px] mb-0.5">상하 미세 이동 Y (px)</span>
                                    <input
                                      type="number"
                                      value={block.imagePositionY || 0}
                                      onChange={(e) => handleUpdateField({ imagePositionY: e.target.value })}
                                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <span className="block text-[9px] mb-0.5">미세 회전각도 (도)</span>
                                    <input
                                      type="number"
                                      value={block.imageRotation || 0}
                                      onChange={(e) => handleUpdateField({ imageRotation: e.target.value })}
                                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <span className="block text-[9px] mb-0.5">모서리 곡률 (둥글게)</span>
                                    <input
                                      type="text"
                                      value={block.imageRoundness || ""}
                                      onChange={(e) => handleUpdateField({ imageRoundness: e.target.value })}
                                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                                      placeholder="예: 1rem, 9999px"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Features Block Editable Elements */}
                {activeEditTarget.type === "features" && block && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">혜택 대주제 설명 타이틀</label>
                      <input
                        type="text"
                        value={block.title || ""}
                        onChange={(e) => handleUpdateField({ title: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-850 dark:text-white text-xs font-semibold"
                        placeholder="소개 설명선 타이틀"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">혜택 메인 보조 소개글</label>
                      <textarea
                        rows={2}
                        value={block.subtitle || ""}
                        onChange={(e) => handleUpdateField({ subtitle: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-850 dark:text-white text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const list = block.items || [];
                        const updatedList = [...list, { title: "새로운 혜택 추가", desc: "이 카드를 마우스로 클릭하여 실시간으로 내용을 변경해 보세요.", icon: "Sparkles" }];
                        const updatedBlocks = activeEditTarget.page.blocks.map(b => b.id === activeEditTarget.blockId ? { ...b, items: updatedList } : b);
                        setPages(pages.map(p => p.id === activeEditTarget.page.id ? { ...p, blocks: updatedBlocks } : p));
                        setActiveEditTarget({
                          ...activeEditTarget,
                          block: { ...block, items: updatedList } as CMSBlock,
                          itemIndex: updatedList.length - 1,
                          type: "card"
                        });
                        await updateDoc(doc(db, "cms_pages", activeEditTarget.page.id), { blocks: updatedBlocks });
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> 새 카드 혜택 추가
                    </button>
                  </div>
                )}

                {/* 4. Individual Card Item in Grid Editable Elements */}
                {activeEditTarget.type === "card" && block && activeEditTarget.itemIndex !== undefined && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>카드 #{activeEditTarget.itemIndex + 1} 번 세부 편집</span>
                      <button
                        type="button"
                        onClick={() => setActiveEditTarget({ ...activeEditTarget, type: "features" })}
                        className="text-blue-500 hover:underline font-bold"
                      >
                        ← 전역설정
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">지정한 요약 아이콘</label>
                      <select
                        value={(block.items || [])[activeEditTarget.itemIndex]?.icon || "Sparkles"}
                        onChange={(e) => handleHUDCardChange({ icon: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-850 dark:text-white"
                      >
                        <option value="Sparkles">✨ 반짝이 별 (Sparkles)</option>
                        <option value="CreditCard">💳 신용카드 전산 (CreditCard)</option>
                        <option value="ScrollText">📜 영수증 롤인쇄 (ScrollText)</option>
                        <option value="ShieldCheck">🛡️ 보안 안심결제 (ShieldCheck)</option>
                        <option value="Heart">💖 고객 감동지원 (Heart)</option>
                        <option value="ShoppingBag">🛍️ 가맹 유통지원 (ShoppingBag)</option>
                        <option value="Settings">⚙️ 최신 기술설치 (Settings)</option>
                        <option value="Phone">📞 긴급 장애상담 (Phone)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">카드 항목 타이틀</label>
                      <input
                        type="text"
                        value={(block.items || [])[activeEditTarget.itemIndex]?.title || ""}
                        onChange={(e) => handleHUDCardChange({ title: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl px-2.5 py-1.5 font-bold text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">항목 문안 보조 설명</label>
                      <textarea
                        rows={3}
                        value={(block.items || [])[activeEditTarget.itemIndex]?.desc || ""}
                        onChange={(e) => handleHUDCardChange({ desc: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-850 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handleHUDDeleteCardItem}
                        className="w-full bg-red-650/15 hover:bg-red-650 hover:text-white text-red-500 font-bold py-1.5 rounded-lg text-[10px] transition flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> 이 특정카드만 삭제
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. Pure Text Area Editable Elements */}
                {activeEditTarget.type === "text" && block && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">타이틀 제목</label>
                      <input
                        type="text"
                        value={block.title || ""}
                        onChange={(e) => handleUpdateField({ title: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-850 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">상세 대본문 내용 (Content)</label>
                      <textarea
                        rows={4}
                        value={block.content || ""}
                        onChange={(e) => handleUpdateField({ content: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-850 dark:text-white focus:outline-none font-sans"
                        placeholder="이곳에 들어갈 상세 글 내용을 작성하세요."
                      />
                    </div>
                  </div>
                )}

                {/* 6. Direct Full Image Banner Editable Elements */}
                {activeEditTarget.type === "image" && block && (
                  <div className="space-y-3">
                    <ImageUploader
                      label="🖼️ 대표 풀 이미지 업로드 / 주소 URL"
                      value={block.imageUrl || ""}
                      onChange={(value) => handleUpdateField({ imageUrl: value })}
                      placeholder="https://images.unsplash.com/... 또는 직접 파일 업로드"
                      id="hud-full-image-uploader"
                    />

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">중앙 오버레이 버튼 문구</label>
                      <input
                        type="text"
                        value={block.buttonText || ""}
                        onChange={(e) => handleUpdateField({ buttonText: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-850 dark:text-white"
                        placeholder="비워두면 오버레이 버튼 숨김"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">클릭 시 이동할 탭목록</label>
                      <select
                        value={block.buttonLink || "request_consult"}
                        onChange={(e) => handleUpdateField({ buttonLink: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs rounded-xl px-2 py-1.5 text-slate-700 dark:text-slate-300"
                      >
                        <option value="home">홈</option>
                        <option value="products">제품 리스트</option>
                        <option value="request_consult">가맹상담 신청</option>
                        <option value="request_paper">용지 무료신청</option>
                      </select>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 mb-1">📐 이미지 표시 너비폭 크기 조절</span>
                        <select
                          value={block.blockWidth || "w-full max-w-full"}
                          onChange={(e) => handleUpdateField({ blockWidth: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                        >
                          <option value="max-w-xs">초소형 (320px)</option>
                          <option value="max-w-md">소형 (448px)</option>
                          <option value="max-w-lg">중소형 (512px)</option>
                          <option value="max-w-2xl">중형 (672px)</option>
                          <option value="max-w-3xl">중대형 (768px)</option>
                          <option value="max-w-5xl">대형 (1024px)</option>
                          <option value="w-full max-w-full">화면 너비 꽉 채움 (100%)</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 mb-1">↕️ 이미지 최대 높이 조절</span>
                        <select
                          value={block.titleSize || "640px"}
                          onChange={(e) => handleUpdateField({ titleSize: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                        >
                          <option value="160px">아주 낮게 (160px)</option>
                          <option value="280px">낮게 (280px)</option>
                          <option value="420px">보통 (420px)</option>
                          <option value="640px">길게 (640px)</option>
                          <option value="1000px">아주 길게 (1000px)</option>
                          <option value="none">제한 없음 (원본 비율 100%)</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 mb-1">🏁 이미지 정렬 위치 지정</span>
                        <select
                          value={block.align || "center"}
                          onChange={(e) => handleUpdateField({ align: e.target.value as any })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                        >
                          <option value="left">왼쪽 정렬</option>
                          <option value="center">가운데 정렬</option>
                          <option value="right">오른쪽 정렬</option>
                        </select>
                      </div>

                      {/* Image positioning properties */}
                      <div className="border-t border-slate-200/60 dark:border-slate-800/80 pt-2.5 space-y-2 text-[10px] text-slate-500">
                        <span className="block font-bold text-slate-400">🏞️ 대표 이미지 미세 크기 및 자유 주소 위치 조절</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="block text-[9px] mb-0.5">가로 폭 (예: 50%, 400px)</span>
                            <input
                              type="text"
                              value={block.imageWidth || ""}
                              onChange={(e) => handleUpdateField({ imageWidth: e.target.value })}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                              placeholder="예: 100%"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] mb-0.5">세로 높이 (예: 300px, auto)</span>
                            <input
                              type="text"
                              value={block.imageHeight || ""}
                              onChange={(e) => handleUpdateField({ imageHeight: e.target.value })}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                              placeholder="예: auto"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] mb-0.5">좌우 미세 이동 X (px)</span>
                            <input
                              type="number"
                              value={block.imagePositionX || 0}
                              onChange={(e) => handleUpdateField({ imagePositionX: e.target.value })}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] mb-0.5">상하 미세 이동 Y (px)</span>
                            <input
                              type="number"
                              value={block.imagePositionY || 0}
                              onChange={(e) => handleUpdateField({ imagePositionY: e.target.value })}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] mb-0.5">미세 회전각도 (degrees)</span>
                            <input
                              type="number"
                              value={block.imageRotation || 0}
                              onChange={(e) => handleUpdateField({ imageRotation: e.target.value })}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] mb-0.5">모서리 곡률 (둥글게)</span>
                            <input
                              type="text"
                              value={block.imageRoundness || ""}
                              onChange={(e) => handleUpdateField({ imageRoundness: e.target.value })}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-white"
                              placeholder="예: 1.5rem, 9999px"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          2. Master Horizontal Slick Floating Style Bar (Matches the photo)
         ========================================================================= */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 shadow-[0_16px_40px_rgba(15,23,42,0.18)] pointer-events-auto flex items-center h-12 px-3 rounded-2xl gap-1 sm:gap-1.5 shrink-0 select-none animate-in fade-in duration-250 max-w-[95vw] lg:max-w-[calc(100vw_-_370px)] overflow-x-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Draw Indicator Squiggle / Active Badge */}
        <div className="flex items-center gap-1.5 px-1.5 max-w-[130px] sm:max-w-none truncate shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-blue-500 animate-pulse shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-tight">
            {activeEditTarget.type === "nav" ? "네비 메뉴" :
             activeEditTarget.type === "hero" ? "히어로 배너" :
             activeEditTarget.type === "features" ? "기능 카드" :
             activeEditTarget.type === "card" ? "카드 상세" :
             activeEditTarget.type === "text" ? "텍스트 영역" :
             activeEditTarget.type === "banner" ? "홍보 배너" : "풀 이미지"}
          </span>
        </div>

        {/* Separator */}
        <div className="h-6 w-[1.5px] bg-slate-200 dark:bg-slate-800 mx-1.5" />

        {block && isTextToolbarTarget && (
          <>
            <div className="hidden sm:flex items-center gap-1.5 h-8 px-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const current = parseInt(textToolbarValue || (selectedElement === "title" ? "28" : "14")) || 14;
                  handleUpdateField({ [textToolbarField]: String(Math.max(6, current - 1)) } as Partial<CMSBlock>);
                }}
                className="w-6 h-6 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-black"
                title="글자 크기 줄이기"
              >
                -
              </button>
              <input
                type="number"
                min="6"
                max="100"
                value={textToolbarValue}
                onChange={(e) => handleUpdateField({ [textToolbarField]: e.target.value } as Partial<CMSBlock>)}
                className="w-11 bg-transparent text-center text-[11px] font-black text-slate-800 dark:text-white focus:outline-none"
                placeholder={selectedElement === "title" ? "28" : "14"}
                title="선택 텍스트 글자 크기"
              />
              <button
                type="button"
                onClick={() => {
                  const current = parseInt(textToolbarValue || (selectedElement === "title" ? "28" : "14")) || 14;
                  handleUpdateField({ [textToolbarField]: String(Math.min(100, current + 1)) } as Partial<CMSBlock>);
                }}
                className="w-6 h-6 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-black"
                title="글자 크기 키우기"
              >
                +
              </button>
            </div>

            <div className="hidden md:flex items-center gap-1 shrink-0">
              {[
                { align: "left", icon: AlignLeft, title: "왼쪽 정렬" },
                { align: "center", icon: AlignCenter, title: "가운데 정렬" },
                { align: "right", icon: AlignRight, title: "오른쪽 정렬" },
              ].map((alignItem) => {
                const Icon = alignItem.icon;
                const { field, value } = getCurrentAlignFieldAndValue();
                return (
                  <button
                    key={alignItem.align}
                    type="button"
                    onClick={() => handleUpdateField({ [field]: alignItem.align as any })}
                    className={`p-1.5 rounded-lg transition ${
                      value === alignItem.align
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                    title={alignItem.title}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            <div className="h-6 w-[1.5px] bg-slate-200 dark:bg-slate-800 mx-1.5" />
          </>
        )}

        {/* 🎨 Paintbrush / Theme color button with dropdown */}
        <button
          onClick={() => handleToolbarClick("bg")}
          className={`flex items-center gap-1 p-1.5 rounded-lg transition shrink-0 ${
            selectedElement === "block" && isPopoverOpen
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold scale-103"
              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
          title="🌌 구역 전체 테마 배경 & 배치 정렬"
        >
          <Paintbrush className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {/* ☰ Alignment buttons */}
        <button
          onClick={() => handleToolbarClick("align")}
          className={`flex items-center gap-1 p-1.5 rounded-lg transition shrink-0 ${
            ["block", "title", "subtitle", "content", "buttons"].includes(selectedElement) && isPopoverOpen
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold scale-103"
              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
          title="➖ 분할 구분선 길이/간격 설정"
        >
          <AlignLeft className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {/* Aa Text Size button */}
        <button
          onClick={() => handleToolbarClick("size")}
          className={`flex items-center gap-1 p-1.5 rounded-lg transition shrink-0 ${
            isTextToolbarTarget && isPopoverOpen
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold scale-103"
              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
          title="✍️ 메인 대제목 내용 및 스타일"
        >
          <Type className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {/* A Underline (Highlight Accent Primary color) */}
        <button
          onClick={() => handleToolbarClick("color")}
          className={`flex items-center gap-1 p-1.5 rounded-lg transition shrink-0 ${
            isTextToolbarTarget && isPopoverOpen
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold scale-103"
              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
          title="🏷️ 상단 배지 라벨 및 아이콘"
        >
          <Baseline className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {/* Slider Icon (Layout Width, Column Layout option) */}
        <button
          onClick={() => handleToolbarClick("layout")}
          className={`flex items-center gap-1 p-1.5 rounded-lg transition shrink-0 ${
            (selectedElement === "image" || selectedElement === "icon") && isPopoverOpen
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold scale-103"
              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
          title="🖼️ 대표 이미지 / 삽입 데코레이션 조율"
        >
          <Sliders className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {/* Separator */}
        <div className="h-6 w-[1.5px] bg-slate-200 dark:bg-slate-800 mx-1.5" />

        {/* ⌨️ Keyboard Form Entry Details (Title, Description multi-line) */}
        <button
          onClick={() => handleToolbarClick("keyboard")}
          className={`flex items-center gap-1 p-1.5 rounded-lg transition shrink-0 ${
            (selectedElement === "subtitle" || selectedElement === "content" || selectedElement === "buttons") && isPopoverOpen
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold scale-103"
              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
          title="📝 보조 설명문 & 행동 단추 버튼 편집"
        >
          <Keyboard className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {/* ↶ Revert button */}
        <button
          onClick={async () => {
            if (!block) return;
            const updatedFields: Partial<CMSBlock> = {
              title: block.title || "새 대제목을 채워보세요",
              subtitle: block.subtitle || "",
              content: block.content || "",
              align: "center",
              titleColor: "text-slate-900",
              titleSize: "text-4xl",
              bgColor: "bg-white",
              buttonBgColor: "bg-blue-600"
            };
            await handleUpdateField(updatedFields);
          }}
          className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg transition shrink-0"
          title="스타일 완전 초기화"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Trash/Eraser Button */}
        {block && (
          <button
            onClick={async () => {
              if (window.confirm("정말로 이 구역 블록을 완전히 삭제하시겠습니까?")) {
                const updatedBlocks = activeEditTarget.page.blocks.filter(b => b.id !== block.id);
                setPages(pages.map(p => p.id === activeEditTarget.page.id ? { ...p, blocks: updatedBlocks } : p));
                setActiveEditTarget(null);
                await updateDoc(doc(db, "cms_pages", activeEditTarget.page.id), { blocks: updatedBlocks });
              }
            }}
            className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition shrink-0"
            title="이 블록 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Separator */}
        <div className="h-6 w-[1.5px] bg-slate-200 dark:bg-slate-800 mx-1.5" />

        {/* ✓ Submit button */}
        <button
          onClick={() => setActiveEditTarget(null)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-[10.5px] transition flex items-center gap-1 shadow-md hover:scale-103 shrink-0"
          title="변경사항 적용 완료"
        >
          <Check className="w-3.5 h-3.5" />
          <span>완료</span>
        </button>

      </div>
    </div>
  );
};
