export interface ConsultationRequestInput {
  customerName?: string;
  contact?: string;
  businessName?: string;
  businessType?: string;
  productOfInterest?: string;
  message?: string;
  privacyConsent?: boolean;
  overseasTransferConsent?: boolean;
}

export interface PaperRequestInput {
  customerName?: string;
  contact?: string;
  address?: string;
  deviceModel?: string;
  quantity?: string;
  privacyConsent?: boolean;
  overseasTransferConsent?: boolean;
}

export const PRIVACY_POLICY_VERSION = "2026-07-11";

function trim(value: string | undefined) {
  return value?.trim() || "";
}

function withOptionalString<T extends Record<string, string>>(record: T, key: keyof T, value: string | undefined) {
  const cleanValue = trim(value);
  if (cleanValue) {
    record[key] = cleanValue as T[keyof T];
  }
}

export function getConsultationValidationError(input: ConsultationRequestInput) {
  if (!trim(input.customerName) || !trim(input.contact)) {
    return "담당자 성함과 대표 연락처를 작성해주세요.";
  }
  if (!input.privacyConsent || !input.overseasTransferConsent) {
    return "개인정보 수집·이용 및 국외 처리 동의가 필요합니다.";
  }
  return null;
}

export function getPaperRequestValidationError(input: PaperRequestInput) {
  if (!trim(input.customerName) || !trim(input.contact) || !trim(input.address)) {
    return "가맹점 상호/대표자 성함, 수령 연락처, 배송지 주소를 모두 작성해주세요.";
  }
  if (!input.privacyConsent || !input.overseasTransferConsent) {
    return "개인정보 수집·이용 및 국외 처리 동의가 필요합니다.";
  }
  return null;
}

export function buildConsultationRequest(input: ConsultationRequestInput, createdAt: string) {
  const request: {
    customerName: string;
    contact: string;
    businessName?: string;
    businessType?: string;
    productOfInterest?: string;
    message?: string;
    status: "대기";
    createdAt: string;
    privacyConsentAt: string;
    overseasTransferConsentAt: string;
    privacyPolicyVersion: string;
  } = {
    customerName: trim(input.customerName),
    contact: trim(input.contact),
    status: "대기",
    createdAt,
    privacyConsentAt: createdAt,
    overseasTransferConsentAt: createdAt,
    privacyPolicyVersion: PRIVACY_POLICY_VERSION,
  };

  withOptionalString(request, "businessName", input.businessName);
  withOptionalString(request, "businessType", input.businessType);
  withOptionalString(request, "productOfInterest", input.productOfInterest);
  withOptionalString(request, "message", input.message);
  return request;
}

export function buildPaperRequest(input: PaperRequestInput, createdAt: string) {
  const request: {
    customerName: string;
    contact: string;
    address: string;
    deviceModel?: string;
    quantity?: string;
    status: "대기";
    createdAt: string;
    privacyConsentAt: string;
    overseasTransferConsentAt: string;
    privacyPolicyVersion: string;
  } = {
    customerName: trim(input.customerName),
    contact: trim(input.contact),
    address: trim(input.address),
    status: "대기",
    createdAt,
    privacyConsentAt: createdAt,
    overseasTransferConsentAt: createdAt,
    privacyPolicyVersion: PRIVACY_POLICY_VERSION,
  };

  withOptionalString(request, "deviceModel", input.deviceModel);
  withOptionalString(request, "quantity", input.quantity);
  return request;
}
