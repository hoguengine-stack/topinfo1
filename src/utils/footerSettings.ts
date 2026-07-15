export interface FooterInfo {
  settingsVersion: string;
  companyName: string;
  tagline: string;
  ceo: string;
  address: string;
  phone: string;
  email: string;
  businessRegistrationNumber: string;
  privacyOfficer: string;
  privacyContact: string;
  copyright: string;
}

export const FOOTER_SETTINGS_VERSION = "2026-07-12-editable-tagline";

export const DEFAULT_FOOTER_INFO: FooterInfo = {
  settingsVersion: FOOTER_SETTINGS_VERSION,
  companyName: "탑정보통신",
  tagline: "매장 오픈부터 운영 이후까지, 결제와 통신을 한 흐름으로 연결합니다.",
  ceo: "김다미",
  address: "경기도 안산시 상록구 천문로17 일영빌딩2층",
  phone: "031-487-4401",
  email: "kicckmk@naver.com",
  businessRegistrationNumber: "217-30-00018",
  privacyOfficer: "김다미",
  privacyContact: "kicckmk@naver.com",
  copyright: "Copyright © 2026 탑정보통신. All Rights Reserved.",
};

const LEGACY_SAMPLE_VALUES: Partial<FooterInfo> = {
  companyName: "(주)탑정보통신",
  ceo: "탑정보통신전담",
  address: "서울특별시 구로구 신도림동",
  phone: "24시간 장애접수 1544-0000",
  email: "support@topinfo.com",
};

export function mergeFooterInfo(value: unknown): FooterInfo {
  if (!value || typeof value !== "object") {
    return DEFAULT_FOOTER_INFO;
  }

  const data = value as Partial<FooterInfo>;
  const merged = {
    ...DEFAULT_FOOTER_INFO,
    ...Object.fromEntries(
      Object.entries(data).filter(([, fieldValue]) => typeof fieldValue === "string"),
    ),
  } as FooterInfo;

  if (data.settingsVersion !== FOOTER_SETTINGS_VERSION) {
    for (const [field, legacyValue] of Object.entries(LEGACY_SAMPLE_VALUES)) {
      const key = field as keyof FooterInfo;
      if (merged[key] === legacyValue) {
        merged[key] = DEFAULT_FOOTER_INFO[key];
      }
    }

    for (const field of ["businessRegistrationNumber", "privacyOfficer", "privacyContact"] as const) {
      if (!merged[field].trim()) {
        merged[field] = DEFAULT_FOOTER_INFO[field];
      }
    }

    merged.settingsVersion = FOOTER_SETTINGS_VERSION;
  }

  return merged;
}

export function footerInfoNeedsMigration(value: unknown) {
  if (!value || typeof value !== "object") return true;
  return (value as Partial<FooterInfo>).settingsVersion !== FOOTER_SETTINGS_VERSION;
}
