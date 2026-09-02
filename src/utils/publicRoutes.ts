export interface StandardPublicRoute {
  slug: string;
  path: string;
  title: string;
  description: string;
}

export const PUBLIC_SITE_ORIGIN = "https://topinfo.co.kr";
export const PUBLIC_NOT_FOUND_SLUG = "not_found";

export const STANDARD_PUBLIC_ROUTES = [
  {
    slug: "home",
    path: "/",
    title: "탑정보통신 | LG U+ 인터넷·토스포스 설치 및 AS",
    description: "탑정보통신이 LG U+ 인터넷, 토스포스·토스프론트, 카드가맹, 설치와 AS를 매장 환경에 맞춰 안내합니다.",
  },
  {
    slug: "toss_pos",
    path: "/toss-pos/",
    title: "토스포스 설치·구성 상담 | 탑정보통신",
    description: "토스포스의 주문·결제·배달·재고·매출 기능과 업종별 장비 구성을 확인하고 설치 조건을 상담합니다.",
  },
  {
    slug: "uplus_ai_phone",
    path: "/uplus-ai-phone/",
    title: "U+ AI전화 설치 상담 | 탑정보통신",
    description: "반복 문의 응대와 응대 내역 확인을 돕는 U+ AI전화의 기능, 설치 조건, 인터넷·포스 연결 상담을 안내합니다.",
  },
  {
    slug: "products",
    path: "/products/",
    title: "POS·결제·매장 통신 제품 | 탑정보통신",
    description: "POS, 결제단말기, 키오스크, 프린터와 매장 통신 서비스를 운영 방식과 설치 환경에 맞춰 비교합니다.",
  },
  {
    slug: "industries",
    path: "/industries/",
    title: "업종별 POS·결제 구성 | 탑정보통신",
    description: "카페, 음식점, 주점, 도소매, 뷰티 매장의 주문·결제·출력·관리 흐름에 맞는 POS 구성을 비교합니다.",
  },
  {
    slug: "promotion_pos",
    path: "/promotion/pos/",
    title: "POS 설치 프로모션 조건 확인 | 탑정보통신",
    description: "현재 적용 가능한 POS·인터넷·매장 장비 혜택의 대상, 포함 품목과 별도 조건을 상담 전에 확인합니다.",
  },
  {
    slug: "used_pos",
    path: "/promotion/used-pos/",
    title: "중고 POS·기존 장비 교체 상담 | 탑정보통신",
    description: "중고 POS의 모델·상태·포함 품목·재고와 기존 장비 교체 범위를 확인하는 기준을 안내합니다.",
  },
  {
    slug: "support",
    path: "/support/",
    title: "설치·AS 고객지원 | 탑정보통신",
    description: "설치·AS 전화, 자료실, 영수증 용지 배송과 건의제안 등 기존 고객이 필요한 지원 창구를 안내합니다.",
  },
  {
    slug: "board_resources",
    path: "/support/resources/",
    title: "설치·운영 자료실 | 탑정보통신",
    description: "탑정보통신 설치 제품의 사용 안내, 매뉴얼, 드라이버와 장애 조치 자료를 검색하고 내려받을 수 있습니다.",
  },
  {
    slug: "board_suggestions",
    path: "/support/suggestions/",
    title: "건의제안 | 탑정보통신",
    description: "탑정보통신 제품과 서비스 이용 중 겪은 불편 사항과 개선 의견을 담당자에게 전달합니다.",
  },
  {
    slug: "request_consult",
    path: "/contact/",
    title: "매장 구성 상담 신청 | 탑정보통신",
    description: "매장 업종, 오픈 또는 교체 일정, 설치 지역과 필요한 장비를 남기면 상담에 필요한 내용을 확인합니다.",
  },
  {
    slug: "request_paper",
    path: "/support/paper/",
    title: "영수증 용지 배송 요청 | 탑정보통신",
    description: "탑정보통신 이용 고객이 배송지와 단말기 정보를 입력해 영수증 용지 배송을 요청하는 페이지입니다.",
  },
] as const satisfies readonly StandardPublicRoute[];

export type StandardPublicSlug = (typeof STANDARD_PUBLIC_ROUTES)[number]["slug"];

const ROUTES_BY_SLUG = new Map<string, StandardPublicRoute>(
  STANDARD_PUBLIC_ROUTES.map((route) => [route.slug, route]),
);

const normalizePathname = (pathname: string) => {
  const normalized = `/${pathname}`.replace(/\/{2,}/g, "/");
  return normalized === "/" ? normalized : normalized.replace(/\/$/, "");
};

const ROUTES_BY_PATH = new Map<string, StandardPublicRoute>(
  STANDARD_PUBLIC_ROUTES.map((route) => [normalizePathname(route.path), route]),
);

export function getStandardPublicRoute(slug: string): StandardPublicRoute | undefined {
  return ROUTES_BY_SLUG.get(slug);
}

export function getPublicRoutePath(slug: string): string | null {
  return getStandardPublicRoute(slug)?.path || null;
}

export function getPublicSlugFromLocation(pathname: string, search = ""): string {
  const searchParams = new URLSearchParams(search);
  if (searchParams.has("page")) return searchParams.get("page") || "";
  return ROUTES_BY_PATH.get(normalizePathname(pathname))?.slug || PUBLIC_NOT_FOUND_SLUG;
}

export function buildPublicLocation(slug: string, search = "", hash = ""): string {
  const route = getStandardPublicRoute(slug);
  const searchParams = new URLSearchParams(search);
  searchParams.delete("page");

  if (!route) searchParams.set("page", slug || "home");

  const query = searchParams.toString();
  const normalizedHash = hash && !hash.startsWith("#") ? `#${hash}` : hash;
  return `${route?.path || "/"}${query ? `?${query}` : ""}${normalizedHash || ""}`;
}

export function getPublicTargetHref(target: string): string {
  if (/^(https?:\/\/|tel:|mailto:)/i.test(target)) return target;
  if (target.startsWith("#")) return `/${target}`;

  const [slug = "home", rawQuery = ""] = target.split("?", 2);
  return buildPublicLocation(slug || "home", rawQuery);
}

export function getPublicCanonicalUrl(slug: string): string {
  const route = getStandardPublicRoute(slug);
  if (route) return `${PUBLIC_SITE_ORIGIN}${route.path}`;
  return `${PUBLIC_SITE_ORIGIN}/?page=${encodeURIComponent(slug)}`;
}
