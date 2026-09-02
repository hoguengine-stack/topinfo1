import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  runTransaction,
  updateDoc,
} from "firebase/firestore";

const projectId = "demo-topinfo-rules";
const databaseId = "(default)";
const rulesPath = fileURLToPath(new URL("../firestore.rules", import.meta.url));
const firestorePort = Number(process.env.FIRESTORE_EMULATOR_PORT || 8089);

let testEnv;

function googleContext(uid) {
  return testEnv.authenticatedContext(uid, {
    firebase: { sign_in_provider: "google.com" },
  });
}

function passwordContext(uid) {
  return testEnv.authenticatedContext(uid, {
    firebase: { sign_in_provider: "password" },
  });
}

async function seedSecurity() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "settings/security"), {
      updatedAt: 1,
      updatedBy: "admin-1",
      adminUids: ["admin-1"],
      employeeUids: ["employee-1"],
    });
  });
}

function validConsultation() {
  const createdAt = "2026-07-18T10:00:00.000Z";
  return {
    customerName: "테스트 점주",
    contact: "010-0000-0000",
    requestKind: "중고 POS 상담",
    projectType: "기존 POS 교체",
    installRegion: "경기 안산시",
    preferredTiming: "2주 이내",
    status: "대기",
    createdAt,
    privacyConsentAt: createdAt,
    overseasTransferConsentAt: createdAt,
    privacyPolicyVersion: "2026-07-11",
  };
}

function validTask(overrides = {}) {
  return {
    title: "상담 후속 작업",
    status: "예정",
    assignee: "담당자",
    assigneeId: "employee-1",
    dueDate: "2026-07-20",
    priority: "보통",
    taskType: "설치",
    description: "상담 후속 조치",
    authorId: "employee-1",
    createdAt: "2026-07-18T10:00:00.000Z",
    updatedAt: "2026-07-18T10:00:00.000Z",
    ...overrides,
  };
}

function validSuggestion() {
  const createdAt = "2026-07-18T10:00:00.000Z";
  return {
    title: "건의 제목",
    content: "건의 내용",
    authorName: "작성자",
    isSecret: false,
    createdAt,
    privacyConsentAt: createdAt,
    overseasTransferConsentAt: createdAt,
    privacyPolicyVersion: "2026-07-11",
  };
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: "127.0.0.1",
      port: firestorePort,
      rules: await readFile(rulesPath, "utf8"),
    },
  });
  assert.equal(testEnv.projectId, projectId);
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedSecurity();
});

after(async () => {
  await testEnv?.cleanup();
});

test("Google UID allowlist만 직원 데이터에 접근한다", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "tasks/task-1"), {
      title: "테스트 작업",
      status: "대기",
      priority: "보통",
      createdAt: "2026-07-18",
      updatedAt: "2026-07-18",
    });
  });

  await assertSucceeds(getDoc(doc(googleContext("admin-1").firestore(), "tasks/task-1")));
  await assertSucceeds(getDoc(doc(googleContext("employee-1").firestore(), "tasks/task-1")));
  await assertFails(getDoc(doc(googleContext("unlisted-1").firestore(), "tasks/task-1")));
  await assertFails(getDoc(doc(passwordContext("admin-1").firestore(), "tasks/task-1")));
});

test("security 문서는 관리자만 수정하며 자기 UID를 제거할 수 없다", async () => {
  const adminRef = doc(googleContext("admin-1").firestore(), "settings/security");
  const employeeRef = doc(googleContext("employee-1").firestore(), "settings/security");

  await assertSucceeds(getDoc(employeeRef));
  await assertFails(updateDoc(employeeRef, { employeeUids: [] }));
  await assertSucceeds(updateDoc(adminRef, {
    updatedAt: 2,
    updatedBy: "admin-1",
    employeeUids: ["employee-1", "employee-2"],
  }));
  await assertFails(updateDoc(adminRef, {
    updatedAt: 3,
    updatedBy: "admin-1",
    adminUids: ["admin-2"],
  }));

  await testEnv.clearFirestore();
  await assertFails(setDoc(doc(googleContext("admin-1").firestore(), "settings/security"), {
    updatedAt: 1,
    updatedBy: "admin-1",
    adminUids: ["admin-1"],
  }));
});

test("공개 상담 생성은 현재 개인정보 동의 형식만 허용한다", async () => {
  const publicDb = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(addDoc(collection(publicDb, "consultations"), validConsultation()));
  await assertFails(addDoc(collection(publicDb, "consultations"), {
    ...validConsultation(),
    privacyPolicyVersion: "old-version",
  }));
  await assertFails(getDoc(doc(publicDb, "consultations/private")));
});

test("연결 작업과 상담 원본은 상태를 함께 변경하며 연결 작업 삭제를 막는다", async () => {
  const employeeDb = googleContext("employee-1").firestore();
  const consultationRef = doc(employeeDb, "consultations/linked-consultation");
  const taskRef = doc(employeeDb, "tasks/linked-task");

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "consultations/linked-consultation"), validConsultation());
  });

  await assertSucceeds(runTransaction(employeeDb, async (transaction) => {
    transaction.set(taskRef, validTask({
      sourceCollection: "consultations",
      sourceId: "linked-consultation",
      sourceType: "consultation",
    }));
    transaction.update(consultationRef, {
      status: "작업등록",
      linkedTaskId: "linked-task",
      taskLinkedAt: "2026-07-18T10:00:00.000Z",
      taskLinkedBy: "employee-1",
    });
  }));

  await assertFails(deleteDoc(taskRef));
  await assertFails(updateDoc(taskRef, { status: "완료" }));
  await assertFails(updateDoc(consultationRef, { status: "완료" }));
  await assertFails(updateDoc(consultationRef, { customerName: "변조된 신청자" }));
  await assertSucceeds(runTransaction(employeeDb, async (transaction) => {
    transaction.update(taskRef, {
      status: "완료",
      updatedAt: "2026-07-18T11:00:00.000Z",
    });
    transaction.update(consultationRef, { status: "완료" });
  }));
});

test("작업 문서는 현재 애플리케이션 계약 밖의 필드를 거부한다", async () => {
  const employeeDb = googleContext("employee-1").firestore();
  await assertSucceeds(setDoc(doc(employeeDb, "tasks/standalone"), validTask()));
  await assertFails(setDoc(doc(employeeDb, "tasks/legacy-shape"), {
    ...validTask(),
    dueTime: "10:00",
  }));
});

test("임직원 디렉터리는 직원만 읽고 본인 프로필만 갱신한다", async () => {
  const employeeDb = googleContext("employee-1").firestore();
  const adminDb = googleContext("admin-1").firestore();
  const publicDb = testEnv.unauthenticatedContext().firestore();
  const profile = {
    uid: "employee-1",
    nickname: "김팀장",
    jobTitle: "팀장",
    updatedAt: "2026-07-18T10:00:00.000Z",
  };

  await assertSucceeds(setDoc(doc(employeeDb, "staff_profiles/employee-1"), profile));
  await assertSucceeds(getDoc(doc(adminDb, "staff_profiles/employee-1")));
  await assertFails(getDoc(doc(publicDb, "staff_profiles/employee-1")));
  await assertFails(setDoc(doc(employeeDb, "staff_profiles/admin-1"), {
    ...profile,
    uid: "admin-1",
  }));
  await assertFails(updateDoc(doc(employeeDb, "staff_profiles/employee-1"), {
    uid: "admin-1",
  }));
});

test("CMS 공개본과 직원 전용 초안을 분리한다", async () => {
  const employeeDb = googleContext("employee-1").firestore();
  const publicDb = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(setDoc(doc(employeeDb, "cms_pages/home"), {
    title: "홈",
    slug: "home",
    blocks: [],
  }));
  await assertSucceeds(setDoc(doc(employeeDb, "cms_page_drafts/home"), {
    blocks: [{ id: "draft", type: "text", content: "비공개 초안" }],
    updatedAt: "2026-07-18T10:00:00.000Z",
  }));
  await assertSucceeds(getDoc(doc(publicDb, "cms_pages/home")));
  await assertFails(getDoc(doc(publicDb, "cms_page_drafts/home")));
  await assertFails(updateDoc(doc(employeeDb, "cms_pages/home"), {
    draftBlocks: [{ id: "leak", type: "text" }],
  }));
});

test("건의글 작성자 UID와 replies는 클라이언트에서 위조할 수 없다", async () => {
  const publicDb = testEnv.unauthenticatedContext().firestore();
  const authorDb = googleContext("author-1").firestore();

  await assertFails(addDoc(collection(publicDb, "suggestions"), {
    ...validSuggestion(),
    authorId: "author-1",
  }));
  await assertFails(addDoc(collection(authorDb, "suggestions"), {
    ...validSuggestion(),
    authorId: "other-user",
  }));
  await assertFails(addDoc(collection(authorDb, "suggestions"), {
    ...validSuggestion(),
    authorId: "author-1",
    replies: [],
  }));
  await assertSucceeds(addDoc(collection(authorDb, "suggestions"), {
    ...validSuggestion(),
    authorId: "author-1",
    isSecret: true,
  }));
});

test("레거시 인증 플래그는 직원 권한을 부여하지 않는다", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users/legacy-1"), {
      uid: "legacy-1",
      isAccessCodeVerified: true,
    });
    await setDoc(doc(context.firestore(), "tasks/task-legacy"), {
      title: "비공개 작업",
      status: "대기",
      priority: "보통",
      createdAt: "2026-07-18",
      updatedAt: "2026-07-18",
    });
  });

  const legacyDb = googleContext("legacy-1").firestore();
  await assertSucceeds(getDoc(doc(legacyDb, "users/legacy-1")));
  await assertFails(getDoc(doc(legacyDb, "tasks/task-legacy")));
  await assertFails(deleteDoc(doc(legacyDb, "settings/security")));
});

test("공개 설정 읽기는 navigation과 footer로 제한한다", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "settings/navigation"), { home: { visible: true } });
    await setDoc(doc(context.firestore(), "settings/footer"), { companyName: "탑정보통신" });
    await setDoc(doc(context.firestore(), "settings/internal_only"), { secret: true });
    await setDoc(doc(context.firestore(), "system/version"), { updatedAt: 1 });
  });

  const publicDb = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(publicDb, "settings/navigation")));
  await assertSucceeds(getDoc(doc(publicDb, "settings/footer")));
  await assertFails(getDoc(doc(publicDb, "settings/internal_only")));
  await assertFails(getDoc(doc(publicDb, "system/version")));
  await assertSucceeds(getDoc(doc(googleContext("employee-1").firestore(), "system/version")));
});
