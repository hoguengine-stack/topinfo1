export const PUBLIC_MEDIA = {
  homeHero: {
    tossPos: "/assets/product/posbank-apexa-x-white-toss.png",
    tossFront: "/assets/product/toss-front.webp",
    receiptPrinter: "/assets/product/ahapos-white-printer.png",
    cashDrawer: "/assets/product/white-cash-drawer.png",
  },
  homePackage: {
    overview: "/assets/generated/topinfo-package-owner-v2.webp",
  },
  homeTelecom: {
    internet: "/assets/uplus/uplus-internet-pos-network.png",
    internetDevice: "/assets/uplus/uplus-internet-router.png",
    cctvIndoor: "/assets/uplus/uplus-cctv-indoor.png",
    cctvOutdoor: "/assets/uplus/uplus-cctv-outdoor.png",
    cctvPtz: "/assets/uplus/uplus-cctv-ptz.png",
    cctvArchitecture: "/assets/uplus/uplus-cctv-architecture.png",
    phoneWireless: "/assets/uplus/uplus-phone-wireless.png",
    phoneDesk: "/assets/uplus/uplus-phone-desk.png",
    aiPhoneDevice: "/assets/uplus/uplus-ip520ga-white.png",
    aiPhoneHero: "/assets/uplus/uplus-ip520ga-hero.png",
  },
  homeServices: {
    kiosk: "/assets/product/toss-kiosk.webp",
    delivery: "/assets/product/toss-delivery.webp",
  },
} as const;

export const DEPRECATED_PUBLIC_MEDIA = {
  aiPhonePortrait: "/assets/uplus/uplus-ai-phone-store.jpg",
  aiPhoneLegacy: "/assets/uplus/uplus-ai-phone.jpg",
  tossLineupBakedBackground: "/assets/product/toss-lineup.webp",
  tossLineupCompactBakedBackground: "/assets/product/toss-lineup-compact.webp",
  apexaGeneratedComposite: "/assets/product/posbank-apexa-x-toss-pos.webp",
} as const;

const deprecatedMediaPaths = new Set<string>(Object.values(DEPRECATED_PUBLIC_MEDIA));

export function isDeprecatedPublicMedia(path?: string) {
  return Boolean(path && deprecatedMediaPaths.has(path));
}
