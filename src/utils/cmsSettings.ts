import { CMSBlock, CMSPage, NavigationSettings } from "../types";

export const STANDARD_NAV_SLUGS = [
  "home",
  "products",
  "board_suggestions",
  "board_resources",
  "request_consult",
  "request_paper",
];

export const DEFAULT_NAVIGATION_SETTINGS: NavigationSettings = {
  home: { label: "홈", visible: true, order: 0 },
  products: { label: "제품군소개", visible: true, order: 1 },
  board_suggestions: { label: "건의제안", visible: true, order: 2 },
  board_resources: { label: "자료실자료", visible: true, order: 3 },
  request_consult: { label: "무상 가맹/상담신청", visible: true, order: 4 },
  request_paper: { label: "용지 배송요청", visible: true, order: 5 },
};

export function createDefaultCMSPages(createdAt = new Date().toISOString()): CMSPage[] {
  return [
    {
      id: "home",
      title: "홈",
      slug: "home",
      isCustom: false,
      createdAt,
      blocks: [
        {
          id: "b1",
          type: "banner",
          layoutStyle: "column_center",
          title: "결제의 새로운 표준,\n탑정보통신이 주도합니다",
          badge: "탑정보통신 2026 비즈니스 패밀리쉽",
          subtitle: "대표님의 성공적인 오프라인 비즈니스를 지원하는 스마트 슬림 포스기, 고속 애플페이 단말기 무상 지원 솔루션.",
          align: "center",
          buttonText: "무상 가맹 상담 신청",
          buttonLink: "request_consult",
        },
        {
          id: "b2",
          type: "features",
          title: "탑정보통신만이 드릴 수 있는 압도적인 기술 혜택",
          subtitle: "기다림 없는 빠른 신용 결제 승인 속도와 롤 전산용지 평생 무상 제공 혜택을 직접 확인해 보세요.",
          items: [
            { title: "0.5초 초고속 카드 승인", desc: "고객 대기 시간을 혁신적으로 낮춘 하드웨어 탑재", icon: "zap" },
            { title: "평생 보증 수리 약정", desc: "영업 정지가 일어나지 않도록 상시 무상 부상 수리", icon: "clock" },
            { title: "인쇄용지 무제한 무상 배송", desc: "탑정보통신 단말 제휴 시, 용지를 완전 무료 배송", icon: "card" },
            { title: "전용 실시간 정산 서비스", desc: "매장 매출 확인과 세무 국세청 대조 작업을 한 화면에", icon: "chart" },
          ],
        },
        {
          id: "b3",
          type: "banner",
          title: "매장 용지가 똑 떨어지셨나요?\n대기 없이 10초 만에 무료 배송을 신청하세요.",
          subtitle: "탑정보통신 패밀리 가맹점이라면 전 기종 인쇄 용지를 100% 무상으로 오늘 발송해 드립니다.",
          buttonText: "용지 무료 배송 요청하기",
          buttonLink: "request_paper",
        },
      ],
    },
    {
      id: "products",
      title: "제품군소개",
      slug: "products",
      isCustom: false,
      createdAt,
      blocks: [
        {
          id: "p1",
          type: "banner",
          layoutStyle: "column_center",
          title: "탑정보통신 프리미엄 결제 하드웨어",
          badge: "최우수 기술 장비 공급 라인업",
          subtitle: "신규 매장에 가장 잘 어울리는 화이트 슬림 디자인과 다채로운 결제 연동 리스트입니다.",
          align: "center",
          buttonText: "기기 무상 임대 상담",
          buttonLink: "request_consult",
        },
        {
          id: "custom_board_products",
          type: "custom_board",
        },
      ],
    },
    {
      id: "board_suggestions",
      title: "건의제안",
      slug: "board_suggestions",
      isCustom: false,
      createdAt,
      blocks: [
        {
          id: "s1",
          type: "banner",
          layoutStyle: "column_center",
          title: "고객 가맹점 소통 건의제판",
          badge: "실시간 열린 마음 피드백",
          subtitle: "탑정보통신은 대표님들의 사소한 소리도 귀 기울여 듣고 현장에 반영하도록 최선을 다합니다.",
          align: "center",
        },
        {
          id: "custom_board_board_suggestions_header",
          type: "custom_board",
          boardPart: "header",
        },
        {
          id: "custom_board_board_suggestions_search",
          type: "custom_board",
          boardPart: "search",
        },
        {
          id: "custom_board_board_suggestions_body",
          type: "custom_board",
          boardPart: "body",
        },
      ],
    },
    {
      id: "board_resources",
      title: "자료실자료",
      slug: "board_resources",
      isCustom: false,
      createdAt,
      blocks: [
        {
          id: "r1",
          type: "banner",
          layoutStyle: "column_center",
          title: "기술 및 매뉴얼 통합 자료실",
          badge: "자가 장애 조치 및 사용성 다운로드",
          subtitle: "용지 교체부터 애플페이 오류 처리, 정산 전산 대조 가이드 매뉴얼을 무료 다운로드하세요.",
          align: "center",
        },
        {
          id: "custom_board_board_resources_header",
          type: "custom_board",
          boardPart: "header",
        },
        {
          id: "custom_board_board_resources_search",
          type: "custom_board",
          boardPart: "search",
        },
        {
          id: "custom_board_board_resources_body",
          type: "custom_board",
          boardPart: "body",
        },
      ],
    },
    {
      id: "request_consult",
      title: "가맹상담",
      slug: "request_consult",
      isCustom: false,
      createdAt,
      blocks: [
        {
          id: "c1",
          type: "banner",
          layoutStyle: "column_center",
          title: "탑정보통신 무료 가맹 상담",
          badge: "가장 빠른 24시간 가입 지원",
          subtitle: "카드 결제 단말기, 슬림 포스(POS), 세로형 키오스크까지 한번에 연동 상담받으세요.",
          align: "center",
        },
        {
          id: "custom_board_request_consult",
          type: "custom_board",
        },
      ],
    },
    {
      id: "request_paper",
      title: "영수증 용지신청",
      slug: "request_paper",
      isCustom: false,
      createdAt,
      blocks: [
        {
          id: "pa1",
          type: "banner",
          layoutStyle: "column_center",
          title: "무상 롤 전산 용지 특별배송",
          badge: "초고속 로젠택배 특별 지원",
          subtitle: "탑정보통신 단말 거래처 패밀리라면 평생 전액 영수증 인쇄 롤 용지를 전 기종 무상 지원해 드립니다.",
          align: "center",
        },
        {
          id: "custom_board_request_paper",
          type: "custom_board",
        },
      ],
    },
  ];
}

export function restoreStandardCMSPages(pages: CMSPage[], defaultPages = createDefaultCMSPages()): CMSPage[] {
  const defaultsById = new Map(defaultPages.map((page) => [page.id, page]));
  const seenIds = new Set<string>();
  const restored = pages.map((page) => {
    seenIds.add(page.id);
    const fallback = defaultsById.get(page.id);
    if (!fallback) return page;

    const currentBlocks = Array.isArray(page.blocks) ? page.blocks : [];
    if (currentBlocks.length > 0) {
      return { ...page, blocks: currentBlocks };
    }

    return {
      ...fallback,
      ...page,
      blocks: fallback.blocks,
      customBoardInitialized: page.customBoardInitialized ?? fallback.customBoardInitialized,
    };
  });

  for (const defaultPage of defaultPages) {
    if (!seenIds.has(defaultPage.id)) {
      restored.push(defaultPage);
    }
  }

  return restored;
}

export function mergeNavigationSettings(settings?: NavigationSettings | null): NavigationSettings {
  return {
    ...DEFAULT_NAVIGATION_SETTINGS,
    ...(settings || {}),
  };
}

export function getNavigationLabel(page: CMSPage, settings?: NavigationSettings | null): string {
  return settings?.[page.slug]?.label || page.title;
}

export function isNavigationVisible(page: CMSPage, settings?: NavigationSettings | null): boolean {
  return settings?.[page.slug]?.visible !== false;
}

export function getOrderedVisiblePages(
  pages: CMSPage[],
  settings?: NavigationSettings | null,
  slugs?: string[]
): CMSPage[] {
  const mergedSettings = mergeNavigationSettings(settings);
  const allowed = slugs ? new Set(slugs) : null;

  return pages
    .filter((page) => (!allowed || allowed.has(page.slug)) && isNavigationVisible(page, mergedSettings))
    .sort((a, b) => {
      const aOrder = mergedSettings[a.slug]?.order ?? Number.MAX_SAFE_INTEGER;
      const bOrder = mergedSettings[b.slug]?.order ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.title.localeCompare(b.title, "ko");
    });
}

export function mergeBlockFields(blocks: CMSBlock[], blockId: string, fields: Partial<CMSBlock>): CMSBlock[] {
  return blocks.map((block) => (block.id === blockId ? { ...block, ...fields } : block));
}
