import React, { useMemo, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  ChevronRight,
  Image,
  LayoutPanelLeft,
  ListPlus,
  Palette,
  Settings2,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { CMSBlock, CMSMediaPlaylistItem, CMSPage, CMSSectorFeature, NavigationSettings, Product, PublicMediaRightsStatus } from "../types";
import { cloneSectorDetailGroups, getSectorDetailGroups } from "../utils/sectorContent";

export interface WebsiteHUDPanelProps {
  isEditModeActive: boolean;
  activeEditTarget: any;
  setActiveEditTarget: (target: any) => void;
  pages: CMSPage[];
  setPages: React.Dispatch<React.SetStateAction<CMSPage[]>>;
  handleHUDChange: (updatedFields: Partial<CMSBlock>) => Promise<void>;
  handleHUDCardChange: (updatedFields: Partial<NonNullable<CMSBlock["items"]>[number]>) => Promise<void>;
  handleHUDDeleteCardItem: () => Promise<void>;
  handleNavTitleChange: (newTitle: string) => Promise<void>;
  handleNavVisibilityChange: (visible: boolean) => Promise<void>;
  navigationSettings: NavigationSettings;
  db: any;
  isCmsSaving?: boolean;
  products?: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  scheduleProductWrite?: (productId: string, fields: Partial<Product>) => void;
}

type InspectorTab = "content" | "style" | "items";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="public-inspector__field"><span>{label}</span>{children}</label>;
}

function MediaRightsFields({
  sourceUrl,
  rightsStatus,
  onChange,
}: {
  sourceUrl?: string;
  rightsStatus?: PublicMediaRightsStatus;
  onChange: (fields: { imageSourceUrl?: string; imageRightsStatus?: PublicMediaRightsStatus }) => void;
}) {
  return (
    <>
      <Field label="이미지 원본 출처"><input value={sourceUrl || ""} onChange={(event) => onChange({ imageSourceUrl: event.target.value })} placeholder="공식 URL 또는 파트너 원본 식별자" /></Field>
      <Field label="공개 사용권"><select value={rightsStatus || "pending"} onChange={(event) => onChange({ imageRightsStatus: event.target.value as PublicMediaRightsStatus })}><option value="pending">확인 필요</option><option value="verified">확인 완료</option><option value="internal_only">내부 미리보기 전용</option></select></Field>
    </>
  );
}

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  const color = /^#[0-9a-f]{6}$/i.test(value || "") ? value! : "#ffffff";
  return <Field label={label}><div className="public-inspector__color"><input type="color" value={color} onChange={(event) => onChange(event.target.value)} /><input value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="#ffffff" /></div></Field>;
}

function AlignControl({ value, onChange }: { value?: string; onChange: (value: "left" | "center" | "right") => void }) {
  const options = [{ value: "left" as const, icon: AlignLeft, label: "왼쪽" }, { value: "center" as const, icon: AlignCenter, label: "가운데" }, { value: "right" as const, icon: AlignRight, label: "오른쪽" }];
  return <div className="public-inspector__segments">{options.map((option) => { const Icon = option.icon; return <button type="button" key={option.value} className={(value || "left") === option.value ? "is-active" : ""} onClick={() => onChange(option.value)} title={option.label}><Icon /></button>; })}</div>;
}

export const WebsiteHUDPanel: React.FC<WebsiteHUDPanelProps> = ({
  isEditModeActive,
  activeEditTarget,
  setActiveEditTarget,
  pages,
  handleHUDChange,
  handleHUDCardChange,
  handleHUDDeleteCardItem,
  handleNavTitleChange,
  handleNavVisibilityChange,
  navigationSettings,
  isCmsSaving = false,
  products = [],
  setProducts,
  scheduleProductWrite,
}) => {
  const [tab, setTab] = useState<InspectorTab>("content");
  const currentPage = useMemo(() => pages.find((page) => page.id === activeEditTarget?.page?.id || page.id === activeEditTarget?.pageId), [pages, activeEditTarget]);
  const currentBlock = useMemo(() => currentPage?.blocks.find((block) => block.id === activeEditTarget?.blockId), [currentPage, activeEditTarget]);
  const currentItem = activeEditTarget?.itemIndex !== undefined ? currentBlock?.items?.[activeEditTarget.itemIndex] : undefined;
  const currentItemIndex = activeEditTarget?.itemIndex ?? 0;
  const currentProduct = products.find((product) => product.id === activeEditTarget?.productId) || activeEditTarget?.product;

  if (!isEditModeActive) return null;

  const updateProduct = (fields: Partial<Product>) => {
    if (!currentProduct || !setProducts || !scheduleProductWrite) return;
    setProducts((items) => items.map((item) => item.id === currentProduct.id ? { ...item, ...fields } : item));
    scheduleProductWrite(currentProduct.id, fields);
    setActiveEditTarget({ ...activeEditTarget, product: { ...currentProduct, ...fields } });
  };

  const updateSectorGroup = (groupIndex: number, fields: { title?: string; subtitle?: string }) => {
    if (!currentItem) return;
    const groups = cloneSectorDetailGroups(getSectorDetailGroups(currentItem, currentItemIndex));
    groups[groupIndex] = { ...groups[groupIndex], ...fields };
    handleHUDCardChange({ detailGroups: groups });
  };

  const updateSectorFeature = (groupIndex: number, featureIndex: number, fields: Partial<CMSSectorFeature>) => {
    if (!currentItem) return;
    const groups = cloneSectorDetailGroups(getSectorDetailGroups(currentItem, currentItemIndex));
    groups[groupIndex].features[featureIndex] = { ...groups[groupIndex].features[featureIndex], ...fields };
    handleHUDCardChange({ detailGroups: groups });
  };

  const addSectorFeature = (groupIndex: number) => {
    if (!currentItem) return;
    const groups = cloneSectorDetailGroups(getSectorDetailGroups(currentItem, currentItemIndex));
    groups[groupIndex].features.push({ id: `feature-${Date.now()}`, title: "새 기능", description: "기능 설명을 입력하세요.", icon: "check", tone: "neutral", size: "standard" });
    handleHUDCardChange({ detailGroups: groups });
  };

  const deleteSectorFeature = (groupIndex: number, featureIndex: number) => {
    if (!currentItem) return;
    const groups = cloneSectorDetailGroups(getSectorDetailGroups(currentItem, currentItemIndex));
    groups[groupIndex].features.splice(featureIndex, 1);
    handleHUDCardChange({ detailGroups: groups });
  };

  const selectItem = (index: number) => {
    if (!currentPage || !currentBlock) return;
    setActiveEditTarget({ type: "features_card", pageId: currentPage.id, page: currentPage, blockId: currentBlock.id, block: currentBlock, itemIndex: index });
    setTab("content");
  };

  const addItem = () => {
    if (!currentBlock) return;
    handleHUDChange({ items: [...(currentBlock.items || []), { title: "새 항목", desc: "설명을 입력하세요.", icon: "check" }] });
    setTab("items");
  };

  const updateMediaPlaylistField = (field: "imageUrl" | "staticImageUrl" | "caption" | "imageSourceUrl" | "imageRightsStatus", value: string) => {
    if (!currentItem) return;
    const lines = value.split("\n").map((line) => line.trim());
    const values = field === "imageUrl" ? lines.filter(Boolean) : lines;
    const existing = currentItem.mediaPlaylist?.length
      ? currentItem.mediaPlaylist
      : currentItem.imageUrl ? [{ imageUrl: currentItem.imageUrl, staticImageUrl: currentItem.staticImageUrl, imageAlt: currentItem.imageAlt, caption: currentItem.title }] : [];
    const length = field === "imageUrl" ? values.length : Math.max(existing.length, values.length);
    const playlist = Array.from({ length }, (_, index) => {
      const previous = existing[index] || { imageUrl: "" };
      const nextValue = values[index] || undefined;
      const normalizedValue = field === "imageRightsStatus"
        ? (["verified", "pending", "internal_only"].includes(nextValue || "") ? nextValue : "pending")
        : nextValue;
      return { ...previous, [field]: normalizedValue } as CMSMediaPlaylistItem;
    }).filter((media) => Boolean(media.imageUrl));
    handleHUDCardChange({ mediaPlaylist: playlist });
  };

  const typeLabel = activeEditTarget?.type === "nav" ? "메뉴" : activeEditTarget?.type === "product" ? "제품" : activeEditTarget?.type === "features_card" ? "반복 항목" : "섹션";

  return (
    <aside className="public-inspector" aria-label="홈페이지 편집 패널">
      <header className="public-inspector__head">
        <div><span>{typeLabel}</span><strong>{currentItem?.title || currentProduct?.name || currentBlock?.title || currentPage?.title || "요소를 선택하세요"}</strong></div>
        <div>{isCmsSaving && <small>초안 저장 중</small>}<button type="button" onClick={() => setActiveEditTarget(null)} aria-label="편집 패널 닫기"><X /></button></div>
      </header>

      {!activeEditTarget ? (
        <div className="public-inspector__empty"><LayoutPanelLeft /><h2>편집할 섹션을 선택하세요</h2><p>화면의 섹션 상단 편집 바를 누르면 콘텐츠와 배치를 변경할 수 있습니다.</p></div>
      ) : activeEditTarget.type === "nav" && currentPage ? (
        <div className="public-inspector__body">
          <Field label="메뉴 이름"><input value={navigationSettings[currentPage.slug]?.label || currentPage.title} onChange={(event) => handleNavTitleChange(event.target.value)} /></Field>
          <label className="public-inspector__toggle"><span><strong>메뉴 표시</strong><small>공개 헤더와 모바일 메뉴에 표시</small></span><input type="checkbox" checked={navigationSettings[currentPage.slug]?.visible !== false} onChange={(event) => handleNavVisibilityChange(event.target.checked)} /></label>
          <p className="public-inspector__locked"><Check /> 원본 로고는 브랜드 보호를 위해 편집 대상에서 제외됩니다.</p>
        </div>
      ) : activeEditTarget.type === "product" && currentProduct ? (
        <div className="public-inspector__body">
          <Field label="제품명"><input value={currentProduct.name} onChange={(event) => updateProduct({ name: event.target.value })} /></Field>
          <Field label="분류"><select value={currentProduct.category} onChange={(event) => updateProduct({ category: event.target.value as Product["category"] })}><option>포스</option><option>단말기</option><option>키오스크</option><option>주변기기</option><option>통신</option><option>보안</option><option>기타</option></select></Field>
          <Field label="설명"><textarea rows={5} value={currentProduct.description} onChange={(event) => updateProduct({ description: event.target.value })} /></Field>
          <Field label="가격 문구"><input value={currentProduct.price || ""} onChange={(event) => updateProduct({ price: event.target.value })} /></Field>
          <Field label="이미지 URL"><input value={currentProduct.imageUrl} onChange={(event) => updateProduct({ imageUrl: event.target.value })} /></Field>
          <MediaRightsFields sourceUrl={currentProduct.imageSourceUrl} rightsStatus={currentProduct.imageRightsStatus} onChange={updateProduct} />
          <Field label="기능 목록 (줄바꿈)"><textarea rows={6} value={(currentProduct.features || []).join("\n")} onChange={(event) => updateProduct({ features: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} /></Field>
        </div>
      ) : currentBlock ? (
        <>
          <nav className="public-inspector__tabs" aria-label="편집 범주">
            <button type="button" className={tab === "content" ? "is-active" : ""} onClick={() => setTab("content")}><Type /> 콘텐츠</button>
            <button type="button" className={tab === "style" ? "is-active" : ""} onClick={() => setTab("style")}><Palette /> 스타일</button>
            <button type="button" className={tab === "items" ? "is-active" : ""} onClick={() => setTab("items")}><ListPlus /> 항목</button>
          </nav>

          <div className="public-inspector__body">
            {tab === "content" && currentItem ? (
              <>
                <button type="button" className="public-inspector__back" onClick={() => { setActiveEditTarget({ type: currentBlock.type, pageId: currentPage?.id, page: currentPage, blockId: currentBlock.id, block: currentBlock }); setTab("items"); }}><ChevronRight /> 섹션 항목 목록</button>
                <Field label="항목 제목"><input value={currentItem.title || ""} onChange={(event) => handleHUDCardChange({ title: event.target.value })} /></Field>
                <Field label="항목 설명"><textarea rows={5} value={currentItem.desc || ""} onChange={(event) => handleHUDCardChange({ desc: event.target.value })} /></Field>
                <Field label="항목 보조문구"><input value={currentItem.badge || ""} onChange={(event) => handleHUDCardChange({ badge: event.target.value })} /></Field>
                <Field label="항목 이미지 URL"><input value={currentItem.imageUrl || ""} onChange={(event) => handleHUDCardChange({ imageUrl: event.target.value })} /></Field>
                <MediaRightsFields sourceUrl={currentItem.imageSourceUrl} rightsStatus={currentItem.imageRightsStatus} onChange={handleHUDCardChange} />
                {currentBlock.id === "home-sector" && <Field label="자동 순환 이미지 URL (한 줄에 하나)"><textarea rows={6} value={(currentItem.mediaPlaylist || []).map((media) => media.imageUrl).join("\n")} onChange={(event) => updateMediaPlaylistField("imageUrl", event.target.value)} /></Field>}
                {currentBlock.id === "home-sector" && <Field label="장면 제목 (같은 순서)"><textarea rows={5} value={(currentItem.mediaPlaylist || []).map((media) => media.caption || "").join("\n")} onChange={(event) => updateMediaPlaylistField("caption", event.target.value)} /></Field>}
                {currentBlock.id === "home-sector" && <Field label="정지 이미지 URL (선택)"><textarea rows={5} value={(currentItem.mediaPlaylist || []).map((media) => media.staticImageUrl || "").join("\n")} onChange={(event) => updateMediaPlaylistField("staticImageUrl", event.target.value)} /></Field>}
                {currentBlock.id === "home-sector" && <Field label="장면 원본 출처 (같은 순서)"><textarea rows={5} value={(currentItem.mediaPlaylist || []).map((media) => media.imageSourceUrl || "").join("\n")} onChange={(event) => updateMediaPlaylistField("imageSourceUrl", event.target.value)} /></Field>}
                {currentBlock.id === "home-sector" && <Field label="장면 사용권 상태 (verified / pending / internal_only)"><textarea rows={5} value={(currentItem.mediaPlaylist || []).map((media) => media.imageRightsStatus || "pending").join("\n")} onChange={(event) => updateMediaPlaylistField("imageRightsStatus", event.target.value)} /></Field>}
                {currentBlock.id === "home-internet" && <Field label="이미지 설명"><input value={currentItem.imageAlt || ""} onChange={(event) => handleHUDCardChange({ imageAlt: event.target.value })} /></Field>}
                {currentBlock.id === "home-internet" && <Field label="장면 종류"><select value={currentItem.mediaKind || "other"} onChange={(event) => handleHUDCardChange({ mediaKind: event.target.value as NonNullable<CMSBlock["items"]>[number]["mediaKind"] })}><option value="pos">주문·결제</option><option value="internet">매장 인터넷</option><option value="ai">AI전화</option><option value="cctv">CCTV</option><option value="phone">인터넷전화</option><option value="other">기타</option></select></Field>}
                <Field label="아이콘"><select value={currentItem.icon || "check"} onChange={(event) => handleHUDCardChange({ icon: event.target.value })}><option value="check">체크</option><option value="phone">전화</option><option value="wifi">인터넷</option><option value="monitor">포스</option><option value="credit-card">결제</option><option value="chart">매출</option><option value="shield">안전</option><option value="wrench">AS</option><option value="layers">자료</option><option value="heart">고객지원</option><option value="coffee">카페</option><option value="utensils">음식점</option><option value="bar">술집·바</option><option value="shop">소매점</option><option value="beauty">뷰티</option></select></Field>
                <Field label="버튼 문구"><input value={currentItem.buttonText || ""} onChange={(event) => handleHUDCardChange({ buttonText: event.target.value })} /></Field>
                <Field label="버튼 연결"><input list="public-link-targets" value={currentItem.buttonLink || ""} onChange={(event) => handleHUDCardChange({ buttonLink: event.target.value })} /></Field>
                {currentBlock.itemLayout === "store-configurator" && (
                  <div className="public-inspector__sector-editor">
                    <header><strong>업종 상세 기능</strong><small>공개 화면의 상세 기능 모자이크를 편집합니다.</small></header>
                    {getSectorDetailGroups(currentItem, currentItemIndex).map((group, groupIndex) => (
                      <details key={group.id}>
                        <summary><span>{group.title}</span><ChevronRight /></summary>
                        <div className="public-inspector__sector-group">
                          <Field label="그룹 제목"><textarea rows={3} value={group.title} onChange={(event) => updateSectorGroup(groupIndex, { title: event.target.value })} /></Field>
                          <Field label="그룹 설명"><textarea rows={3} value={group.subtitle || ""} onChange={(event) => updateSectorGroup(groupIndex, { subtitle: event.target.value })} /></Field>
                          {group.features.map((feature, featureIndex) => (
                            <details className="public-inspector__sector-feature" key={feature.id}>
                              <summary><span>{feature.title}</span><ChevronRight /></summary>
                              <div>
                                <Field label="작은 문구"><input value={feature.eyebrow || ""} onChange={(event) => updateSectorFeature(groupIndex, featureIndex, { eyebrow: event.target.value })} /></Field>
                                <Field label="기능 제목"><input value={feature.title} onChange={(event) => updateSectorFeature(groupIndex, featureIndex, { title: event.target.value })} /></Field>
                                <Field label="기능 설명"><textarea rows={4} value={feature.description || ""} onChange={(event) => updateSectorFeature(groupIndex, featureIndex, { description: event.target.value })} /></Field>
                                <Field label="이미지 URL"><input value={feature.imageUrl || ""} onChange={(event) => updateSectorFeature(groupIndex, featureIndex, { imageUrl: event.target.value })} /></Field>
                                <MediaRightsFields sourceUrl={feature.imageSourceUrl} rightsStatus={feature.imageRightsStatus} onChange={(fields) => updateSectorFeature(groupIndex, featureIndex, fields)} />
                                <Field label="아이콘"><select value={feature.icon || "check"} onChange={(event) => updateSectorFeature(groupIndex, featureIndex, { icon: event.target.value })}><option value="check">체크</option><option value="delivery">배달</option><option value="smartphone">모바일</option><option value="monitor">화면</option><option value="credit-card">결제</option><option value="package">재고</option><option value="coupon">쿠폰</option><option value="customer">고객</option><option value="chart">분석</option><option value="receipt">영수증</option><option value="layout">배치</option><option value="tablet">태블릿</option><option value="scan">신분증 확인</option><option value="upload">대량 등록</option><option value="barcode">바코드</option><option value="search">검색</option><option value="calendar">일정</option><option value="bell">알림</option></select></Field>
                                <Field label="카드 색상"><select value={feature.tone || "neutral"} onChange={(event) => updateSectorFeature(groupIndex, featureIndex, { tone: event.target.value as CMSSectorFeature["tone"] })}><option value="neutral">중립</option><option value="blue">파랑</option><option value="mint">민트</option><option value="coral">코랄</option><option value="violet">보라</option><option value="amber">노랑</option></select></Field>
                                <Field label="카드 크기"><select value={feature.size || "standard"} onChange={(event) => updateSectorFeature(groupIndex, featureIndex, { size: event.target.value as CMSSectorFeature["size"] })}><option value="standard">기본</option><option value="wide">넓게</option></select></Field>
                                <button type="button" className="public-inspector__delete" onClick={() => deleteSectorFeature(groupIndex, featureIndex)}><Trash2 /> 기능 삭제</button>
                              </div>
                            </details>
                          ))}
                          <button type="button" className="public-inspector__add" onClick={() => addSectorFeature(groupIndex)}><ListPlus /> 기능 추가</button>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
                <button type="button" className="public-inspector__delete" onClick={handleHUDDeleteCardItem}><Trash2 /> 이 항목 삭제</button>
              </>
            ) : tab === "content" ? (
              <>
                <Field label="작은 제목 / 배지"><input value={currentBlock.badge || ""} onChange={(event) => handleHUDChange({ badge: event.target.value })} /></Field>
                <Field label="제목"><textarea rows={4} value={currentBlock.title || ""} onChange={(event) => handleHUDChange({ title: event.target.value })} /></Field>
                <Field label="설명"><textarea rows={5} value={currentBlock.subtitle || ""} onChange={(event) => handleHUDChange({ subtitle: event.target.value })} /></Field>
                {currentBlock.type === "hero" && <Field label="하단 안내 문구"><input value={currentBlock.note || ""} onChange={(event) => handleHUDChange({ note: event.target.value })} /></Field>}
                {["process", "platform-stage", "customer-loop"].includes(currentBlock.itemLayout || "") && (
                  <>
                    <Field label="장면 작은 문구"><input value={currentBlock.note || ""} onChange={(event) => handleHUDChange({ note: event.target.value })} /></Field>
                    <Field label="장면 주요 문구"><textarea rows={3} value={currentBlock.content || ""} onChange={(event) => handleHUDChange({ content: event.target.value })} /></Field>
                    {currentBlock.itemLayout === "platform-stage" && <Field label="지원 범위 안내"><input value={currentBlock.imageCaption || ""} onChange={(event) => handleHUDChange({ imageCaption: event.target.value })} /></Field>}
                  </>
                )}
                {currentBlock.type === "banner" && (currentBlock.bannerLayout === "offer" || (!currentBlock.bannerLayout && (currentBlock.items || []).length > 0)) && (
                  <>
                    <Field label="가격 영역 제목"><input value={currentBlock.priceLabel || ""} onChange={(event) => handleHUDChange({ priceLabel: event.target.value })} /></Field>
                    <Field label="가격 표시"><div className="public-inspector__inline-fields"><input value={currentBlock.priceValue || ""} onChange={(event) => handleHUDChange({ priceValue: event.target.value })} placeholder="0" /><input value={currentBlock.priceUnit || ""} onChange={(event) => handleHUDChange({ priceUnit: event.target.value })} placeholder="원" /></div></Field>
                    <Field label="가격 조건"><textarea rows={4} value={currentBlock.priceDetails || ""} onChange={(event) => handleHUDChange({ priceDetails: event.target.value })} /></Field>
                    <Field label="포함 항목 제목"><input value={currentBlock.listLabel || ""} onChange={(event) => handleHUDChange({ listLabel: event.target.value })} /></Field>
                    <Field label="이미지 하단 문구"><input value={currentBlock.imageCaption || ""} onChange={(event) => handleHUDChange({ imageCaption: event.target.value })} /></Field>
                  </>
                )}
                {(currentBlock.type === "text" || currentBlock.itemLayout === "store-configurator") && <Field label={currentBlock.itemLayout === "store-configurator" ? "조건 안내" : "본문"}><textarea rows={8} value={currentBlock.content || ""} onChange={(event) => handleHUDChange({ content: event.target.value })} /></Field>}
                <Field label="기본 버튼 문구"><input value={currentBlock.buttonText || ""} onChange={(event) => handleHUDChange({ buttonText: event.target.value })} /></Field>
                <Field label="기본 버튼 연결"><input list="public-link-targets" value={currentBlock.buttonLink || ""} onChange={(event) => handleHUDChange({ buttonLink: event.target.value })} /></Field>
                <Field label="보조 버튼 문구"><input value={currentBlock.button2Text || ""} onChange={(event) => handleHUDChange({ button2Text: event.target.value })} /></Field>
                <Field label="보조 버튼 연결"><input list="public-link-targets" value={currentBlock.button2Link || ""} onChange={(event) => handleHUDChange({ button2Link: event.target.value })} /></Field>
                <datalist id="public-link-targets"><option value="home" /><option value="products" /><option value="toss_pos" /><option value="industries" /><option value="promotion_pos" /><option value="used_pos" /><option value="support" /><option value="request_consult" /><option value="request_paper" /><option value="board_resources" /><option value="board_suggestions" /></datalist>
              </>
            ) : tab === "style" ? (
              <>
                <Field label="텍스트 정렬"><AlignControl value={currentBlock.align} onChange={(align) => handleHUDChange({ align })} /></Field>
                <Field label="섹션 배치"><select value={currentBlock.itemLayout || "service-rows"} onChange={(event) => handleHUDChange({ itemLayout: event.target.value })}><option value="service-rows">일반 서비스 목록</option><option value="opening-console">오픈 콘솔</option><option value="service-stories">이미지형 서비스 선택</option><option value="store-configurator">업종별 구성 체험</option><option value="platform-stage">지원 기기 스테이지</option><option value="customer-loop">고객 재방문 흐름</option><option value="operations-console">운영 기능 콘솔</option><option value="process">진행 단계</option><option value="action-grid">바로가기</option><option value="faq">질문 답변</option></select></Field>
                {currentBlock.type === "banner" && <Field label="배너 배치"><select value={currentBlock.bannerLayout || "text-only"} onChange={(event) => handleHUDChange({ bannerLayout: event.target.value as CMSBlock["bannerLayout"] })}><option value="text-only">텍스트 중심</option><option value="side-image">텍스트 + 이미지</option><option value="offer">가격·구성 패키지</option></select></Field>}
                {currentBlock.type === "banner" && currentBlock.bannerLayout === "side-image" && <Field label="이미지 위치"><select value={currentBlock.bannerImagePosition || "right"} onChange={(event) => handleHUDChange({ bannerImagePosition: event.target.value as CMSBlock["bannerImagePosition"] })}><option value="right">오른쪽</option><option value="left">왼쪽</option></select></Field>}
                <ColorField label="섹션 배경색" value={currentBlock.bgColor} onChange={(bgColor) => handleHUDChange({ bgColor })} />
                <ColorField label="제목 색상" value={currentBlock.titleColor} onChange={(titleColor) => handleHUDChange({ titleColor })} />
                <ColorField label="설명 색상" value={currentBlock.subtitleColor} onChange={(subtitleColor) => handleHUDChange({ subtitleColor })} />
                <Field label="이미지 URL"><div className="public-inspector__image-field"><Image /><input value={currentBlock.imageUrl || ""} onChange={(event) => handleHUDChange({ imageUrl: event.target.value })} /></div></Field>
                <MediaRightsFields sourceUrl={currentBlock.imageSourceUrl} rightsStatus={currentBlock.imageRightsStatus} onChange={handleHUDChange} />
              </>
            ) : (
              <>
                <div className="public-inspector__item-list">
                  {(currentBlock.items || []).map((item, index) => <button type="button" key={`${item.title}-${index}`} onClick={() => selectItem(index)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title || "제목 없음"}</strong><ChevronRight /></button>)}
                </div>
                <button type="button" className="public-inspector__add" onClick={addItem}><ListPlus /> 항목 추가</button>
                {(currentBlock.items || []).length === 0 && <p className="public-inspector__hint">이 섹션에는 반복 항목이 없습니다. 항목을 추가하면 현재 배치에 맞춰 자동 정렬됩니다.</p>}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="public-inspector__empty"><Settings2 /><h2>요소를 찾을 수 없습니다</h2><p>화면에서 다른 섹션을 선택해주세요.</p></div>
      )}
    </aside>
  );
};
