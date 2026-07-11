export interface FooterInfo {
  companyName: string;
  ceo: string;
  address: string;
  phone: string;
  email: string;
  businessRegistrationNumber: string;
  privacyOfficer: string;
  privacyContact: string;
  copyright: string;
}

export const DEFAULT_FOOTER_INFO: FooterInfo = {
  companyName: "(주)탑정보통신",
  ceo: "탑정보통신전담",
  address: "서울특별시 구로구 신도림동",
  phone: "24시간 장애접수 1544-0000",
  email: "support@topinfo.com",
  businessRegistrationNumber: "",
  privacyOfficer: "",
  privacyContact: "",
  copyright: "Copyright © 2026 TOP Information & Communication. All Rights Reserved.",
};

export function mergeFooterInfo(value: unknown): FooterInfo {
  if (!value || typeof value !== "object") {
    return DEFAULT_FOOTER_INFO;
  }

  const data = value as Partial<FooterInfo>;
  return {
    ...DEFAULT_FOOTER_INFO,
    ...Object.fromEntries(
      Object.entries(data).filter(([, fieldValue]) => typeof fieldValue === "string"),
    ),
  } as FooterInfo;
}
