export interface ConsultationRequestInput {
  customerName?: string;
  contact?: string;
  businessName?: string;
  businessType?: string;
  productOfInterest?: string;
  message?: string;
}

export interface PaperRequestInput {
  customerName?: string;
  contact?: string;
  address?: string;
  deviceModel?: string;
  quantity?: string;
}

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
  return null;
}

export function getPaperRequestValidationError(input: PaperRequestInput) {
  if (!trim(input.customerName) || !trim(input.contact) || !trim(input.address)) {
    return "가맹점 상호/대표자 성함, 수령 연락처, 배송지 주소를 모두 작성해주세요.";
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
  } = {
    customerName: trim(input.customerName),
    contact: trim(input.contact),
    status: "대기",
    createdAt,
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
  } = {
    customerName: trim(input.customerName),
    contact: trim(input.contact),
    address: trim(input.address),
    status: "대기",
    createdAt,
  };

  withOptionalString(request, "deviceModel", input.deviceModel);
  withOptionalString(request, "quantity", input.quantity);
  return request;
}
