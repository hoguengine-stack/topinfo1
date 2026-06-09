import { Consultation, PaperRequest, Priority, Task, TaskType } from "../types";

export interface RequestTaskOptions {
  assignee: string;
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

export function buildConsultationTask(
  consultation: Consultation,
  options: ConsultationTaskOptions,
): LinkedRequestTask {
  const businessLabel = clean(consultation.businessName, consultation.customerName);
  const productLabel = clean(consultation.productOfInterest, "기기상담");
  const message = clean(consultation.message, "상세 상담 문의 메시지가 없습니다.");

  return {
    title: `[가맹상담] ${businessLabel} - ${productLabel}`,
    status: "예정",
    assignee: options.assignee,
    dueDate: options.dueDate,
    priority: options.priority,
    taskType: options.taskType,
    description: [
      `신청자: ${consultation.customerName}`,
      `연락처: ${consultation.contact}`,
      `상호명: ${clean(consultation.businessName, "미입력")}`,
      `업종: ${clean(consultation.businessType, "미지정")}`,
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
  return {
    title: `[용지배송] ${paperRequest.customerName} - ${paperRequest.quantity}`,
    status: "예정",
    assignee: options.assignee,
    dueDate: options.dueDate,
    priority: options.priority,
    taskType: "용지",
    description: [
      `수령처명: ${paperRequest.customerName}`,
      `수령연락처: ${paperRequest.contact}`,
      `배송주소: ${paperRequest.address}`,
      `사용기종: ${clean(paperRequest.deviceModel, "IC단말기")}`,
      `요청수량: ${paperRequest.quantity}`,
    ].join("\n"),
    memo: clean(options.memo, "감열 용지 무상 지원 배송업무로 작업관리 연동됨."),
    authorId: options.authorId,
    createdAt: options.now,
    updatedAt: options.now,
    showOnCalendar: true,
    sourceCollection: "paper_requests",
    sourceId: paperRequest.id,
    sourceType: "paper_request",
  };
}
