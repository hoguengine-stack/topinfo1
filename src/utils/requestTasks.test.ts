import assert from "node:assert/strict";
import test from "node:test";
import { buildConsultationTask, buildPaperRequestTask, getRequestTaskValidationError } from "./requestTasks";
import { Consultation, PaperRequest } from "../types";

const baseOptions = {
  assignee: "김팀장",
  assigneeId: "employee-1",
  dueDate: "2026-06-10",
  priority: "높음" as const,
  authorId: "admin-uid",
  now: "2026-06-09T10:00:00.000Z",
};

test("buildConsultationTask maps public consultation into a tracked internal task", () => {
  const consultation: Consultation = {
    id: "consult-1",
    customerName: "홍길동",
    contact: "010-1234-5678",
    businessName: "탑카페",
    businessType: "일반음식점",
    productOfInterest: "포스",
    message: "신규 포스 상담 요청",
    status: "대기",
    createdAt: "2026-06-09T09:00:00.000Z",
  };

  const task = buildConsultationTask(consultation, {
    ...baseOptions,
    taskType: "설치",
    memo: "",
  });

  assert.equal(task.title, "[매장상담] 탑카페 - 포스");
  assert.equal(task.assignee, "김팀장");
  assert.equal(task.assigneeId, "employee-1");
  assert.equal(task.taskType, "설치");
  assert.equal(task.sourceCollection, "consultations");
  assert.equal(task.sourceId, "consult-1");
  assert.equal(task.showOnCalendar, true);
  assert.match(task.description, /연락처: 010-1234-5678/);
  assert.match(task.description, /고객문의 내용/);
  assert.equal(task.memo, "홈페이지 상담 신청 건에서 작업관리로 연동 등록됨.");
});

test("buildPaperRequestTask maps public paper request into a delivery task", () => {
  const paper: PaperRequest = {
    id: "paper-1",
    customerName: "탑식당 김대표",
    contact: "010-2222-3333",
    address: "서울 구로구 1층",
    deviceModel: "K-30",
    quantity: "2박스 (100롤)",
    status: "대기",
    createdAt: "2026-06-09T09:10:00.000Z",
  };

  const task = buildPaperRequestTask(paper, baseOptions);

  assert.equal(task.title, "[용지배송] 탑식당 김대표 - 2박스 (100롤)");
  assert.equal(task.taskType, "용지");
  assert.equal(task.assigneeId, "employee-1");
  assert.equal(task.priority, "높음");
  assert.equal(task.sourceCollection, "paper_requests");
  assert.equal(task.sourceId, "paper-1");
  assert.match(task.description, /배송주소: 서울 구로구 1층/);
  assert.match(task.description, /사용기종: K-30/);
  assert.equal(task.memo, "홈페이지 용지 배송 요청에서 작업관리로 연동 등록됨.");
});

test("request task validation blocks missing assignee, invalid date, and missing author", () => {
  assert.equal(getRequestTaskValidationError({ ...baseOptions, assignee: " " }), "담당자를 선택해주세요.");
  assert.equal(getRequestTaskValidationError({ ...baseOptions, dueDate: "2026-02-30" }), "처리 예정일을 선택해주세요.");
  assert.equal(getRequestTaskValidationError({ ...baseOptions, authorId: "" }), "로그인 사용자 정보를 확인할 수 없습니다.");
});
