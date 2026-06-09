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
