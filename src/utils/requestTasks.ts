import { Consultation, PaperRequest, Priority, Task, TaskType } from "../types";

export interface RequestTaskOptions {
  assignee: string;
  assigneeId?: string;
  dueDate: string;
  priority: Priority;
  authorId: string;
  now: string;
  memo?: string;
}

export interface ConsultationTaskOptions extends RequestTaskOptions {
  taskType: TaskType;
}

export type LinkedRequestTask = Omit<Task, "id"> & {
  sourceCollection: "consultations" | "paper_requests";
  sourceId: string;
  sourceType: "consultation" | "paper_request";
};

function clean(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function isValidCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function getRequestTaskValidationError(options: RequestTaskOptions) {
  if (!options.assignee.trim()) return "담당자를 선택해주세요.";
  if (!isValidCalendarDate(options.dueDate)) return "처리 예정일을 선택해주세요.";
  if (!options.authorId.trim()) return "로그인 사용자 정보를 확인할 수 없습니다.";
  return null;
}

function assertRequestTaskInput(sourceId: string, options: RequestTaskOptions) {
  if (!sourceId.trim()) throw new Error("요청 문서 ID가 없습니다.");
  const validationError = getRequestTaskValidationError(options);
  if (validationError) throw new Error(validationError);
}

export function buildConsultationTask(
  consultation: Consultation,
  options: ConsultationTaskOptions,
): LinkedRequestTask {
  assertRequestTaskInput(consultation.id, options);
  const businessLabel = clean(consultation.businessName, consultation.customerName);
  const productLabel = clean(consultation.productOfInterest, "기기상담");
  const message = clean(consultation.message, "상세 상담 문의 메시지가 없습니다.");

  return {
    title: `[매장상담] ${businessLabel} - ${productLabel}`,
    status: "예정",
    assignee: options.assignee,
    ...(options.assigneeId ? { assigneeId: options.assigneeId } : {}),
    dueDate: options.dueDate,
    priority: options.priority,
    taskType: options.taskType,
    description: [
      `신청자: ${consultation.customerName}`,
      `연락처: ${consultation.contact}`,
      `상호명: ${clean(consultation.businessName, "미입력")}`,
      `업종: ${clean(consultation.businessType, "미지정")}`,
      ...(consultation.projectType ? [`준비 유형: ${consultation.projectType.trim()}`] : []),
      ...(consultation.installRegion ? [`설치 지역: ${consultation.installRegion.trim()}`] : []),
      ...(consultation.preferredTiming ? [`희망 시기: ${consultation.preferredTiming.trim()}`] : []),
      `문의제품: ${productLabel}`,
      "",
      "[고객문의 내용]",
      message,
    ].join("\n"),
    memo: clean(options.memo, "홈페이지 상담 신청 건에서 작업관리로 연동 등록됨."),
    authorId: options.authorId,
    createdAt: options.now,
    updatedAt: options.now,
    showOnCalendar: true,
    sourceCollection: "consultations",
    sourceId: consultation.id,
    sourceType: "consultation",
  };
}

export function buildPaperRequestTask(
  paperRequest: PaperRequest,
  options: RequestTaskOptions,
): LinkedRequestTask {
  assertRequestTaskInput(paperRequest.id, options);
  const quantity = clean(paperRequest.quantity, "수량 확인 필요");

  return {
    title: `[용지배송] ${paperRequest.customerName} - ${quantity}`,
    status: "예정",
    assignee: options.assignee,
    ...(options.assigneeId ? { assigneeId: options.assigneeId } : {}),
    dueDate: options.dueDate,
    priority: options.priority,
    taskType: "용지",
    description: [
      `수령처명: ${paperRequest.customerName}`,
      `수령연락처: ${paperRequest.contact}`,
      `배송주소: ${paperRequest.address}`,
      `사용기종: ${clean(paperRequest.deviceModel, "모델 확인 필요")}`,
      `요청수량: ${quantity}`,
    ].join("\n"),
    memo: clean(options.memo, "홈페이지 용지 배송 요청에서 작업관리로 연동 등록됨."),
    authorId: options.authorId,
    createdAt: options.now,
    updatedAt: options.now,
    showOnCalendar: true,
    sourceCollection: "paper_requests",
    sourceId: paperRequest.id,
    sourceType: "paper_request",
  };
}
