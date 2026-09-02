export interface ConsultationRequestInput {
  customerName?: string;
  contact?: string;
  businessName?: string;
  businessType?: string;
  requestKind?: string;
  projectType?: string;
  installRegion?: string;
  preferredTiming?: string;
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
export const PUBLIC_REQUEST_COLLECTIONS = {
  consultations: "consultations",
  paperRequests: "paper_requests",
} as const;

export const PUBLIC_REQUEST_LIMITS = {
  customerName: 100,
  contact: 50,
  businessName: 150,
  businessType: 100,
  requestKind: 100,
  projectType: 100,
  installRegion: 150,
  preferredTiming: 100,
  productOfInterest: 100,
  message: 2000,
  address: 500,
  deviceModel: 120,
  quantity: 30,
} as const;

function trim(value: string | undefined) {
  return value?.trim() || "";
}

function withOptionalString<T extends Record<string, string>>(record: T, key: keyof T, value: string | undefined) {
  const cleanValue = trim(value);
  if (cleanValue) {
    record[key] = cleanValue as T[keyof T];
  }
}

function exceedsLimit(value: string | undefined, limit: number) {
  return trim(value).length > limit;
}

function hasValidPhoneNumber(value: string | undefined) {
  const contact = trim(value);
  const digits = contact.replace(/\D/g, "");
  return /^[+\d][\d\s().-]*$/.test(contact) && digits.length >= 9 && digits.length <= 11;
}

export function buildConsultationMessage(input: ConsultationRequestInput) {
  return trim(input.message);
}

export function getConsultationValidationError(input: ConsultationRequestInput) {
  if (!trim(input.customerName) || !trim(input.contact)) {
    return "담당자 성함과 대표 연락처를 작성해주세요.";
  }
  if (!hasValidPhoneNumber(input.contact)) {
    return "연락처를 지역번호 또는 휴대전화 번호 형식으로 작성해주세요.";
  }
  if (
    exceedsLimit(input.customerName, PUBLIC_REQUEST_LIMITS.customerName) ||
    exceedsLimit(input.contact, PUBLIC_REQUEST_LIMITS.contact) ||
    exceedsLimit(input.businessName, PUBLIC_REQUEST_LIMITS.businessName) ||
    exceedsLimit(input.businessType, PUBLIC_REQUEST_LIMITS.businessType) ||
    exceedsLimit(input.requestKind, PUBLIC_REQUEST_LIMITS.requestKind) ||
    exceedsLimit(input.projectType, PUBLIC_REQUEST_LIMITS.projectType) ||
    exceedsLimit(input.installRegion, PUBLIC_REQUEST_LIMITS.installRegion) ||
    exceedsLimit(input.preferredTiming, PUBLIC_REQUEST_LIMITS.preferredTiming) ||
    exceedsLimit(input.productOfInterest, PUBLIC_REQUEST_LIMITS.productOfInterest)
  ) {
    return "입력 가능한 글자 수를 초과한 항목이 있습니다.";
  }
  if (buildConsultationMessage(input).length > PUBLIC_REQUEST_LIMITS.message) {
    return "문의 내용은 2,000자 이내로 작성해주세요.";
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
  if (!hasValidPhoneNumber(input.contact)) {
    return "수령 연락처를 지역번호 또는 휴대전화 번호 형식으로 작성해주세요.";
  }
  if (
    exceedsLimit(input.customerName, PUBLIC_REQUEST_LIMITS.customerName) ||
    exceedsLimit(input.contact, PUBLIC_REQUEST_LIMITS.contact) ||
    exceedsLimit(input.address, PUBLIC_REQUEST_LIMITS.address) ||
    exceedsLimit(input.deviceModel, PUBLIC_REQUEST_LIMITS.deviceModel) ||
    exceedsLimit(input.quantity, PUBLIC_REQUEST_LIMITS.quantity)
  ) {
    return "입력 가능한 글자 수를 초과한 항목이 있습니다.";
  }
  if (!input.privacyConsent || !input.overseasTransferConsent) {
    return "개인정보 수집·이용 및 국외 처리 동의가 필요합니다.";
  }
  return null;
}

export function buildConsultationRequest(input: ConsultationRequestInput, createdAt: string) {
  const validationError = getConsultationValidationError(input);
  if (validationError) throw new Error(validationError);

  const request: {
    customerName: string;
    contact: string;
    businessName?: string;
    businessType?: string;
    requestKind?: string;
    projectType?: string;
    installRegion?: string;
    preferredTiming?: string;
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
  withOptionalString(request, "requestKind", input.requestKind);
  withOptionalString(request, "projectType", input.projectType);
  withOptionalString(request, "installRegion", input.installRegion);
  withOptionalString(request, "preferredTiming", input.preferredTiming);
  withOptionalString(request, "productOfInterest", input.productOfInterest);
  withOptionalString(request, "message", buildConsultationMessage(input));
  return request;
}

export function buildPaperRequest(input: PaperRequestInput, createdAt: string) {
  const validationError = getPaperRequestValidationError(input);
  if (validationError) throw new Error(validationError);

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
