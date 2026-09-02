import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { auditCMSMediaForPublication } from "../src/utils/cmsMediaAudit";
import { createDefaultCMSPages } from "../src/utils/cmsSettings";
import { createDefaultPublicProducts } from "../src/utils/publicProducts";

interface ReleaseFinding {
  code: string;
  message: string;
  evidence?: string;
}

const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, "output", "audits");
const outputPath = path.join(outputDirectory, "release-readiness-current.json");

async function readDownloadManifest() {
  try {
    const raw = await readFile(path.join(projectRoot, "public", "downloads", "manifest.json"), "utf8");
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function requireAttestation(name: string, code: string, message: string): ReleaseFinding | undefined {
  return process.env[name] === "1" ? undefined : { code, message, evidence: `${name}=1` };
}

const pages = createDefaultCMSPages("release-check");
const products = createDefaultPublicProducts("release-check");
const mediaIssues = auditCMSMediaForPublication(pages, products);
const uniqueMediaIssues = [...new Map(
  mediaIssues.map((issue) => [`${issue.imageUrl}|${issue.reason}`, issue]),
).values()];

const blockers: ReleaseFinding[] = uniqueMediaIssues.map((issue, index) => ({
  code: `MEDIA-${String(index + 1).padStart(3, "0")}`,
  message: `${issue.location}: ${issue.reason}`,
  evidence: issue.imageUrl,
}));

const externalAttestations = [
  requireAttestation("TOPINFO_RELEASE_STAFF_UIDS_VERIFIED", "AUTH-001", "운영 settings/security의 관리자·임직원 UID 허용 목록 확인이 필요합니다."),
  requireAttestation("TOPINFO_RELEASE_RULES_DEPLOYED", "FIREBASE-001", "현재 firestore.rules가 운영 Firebase에 배포됐다는 확인이 필요합니다."),
  requireAttestation("TOPINFO_RELEASE_PRODUCTION_FLOW_VERIFIED", "FLOW-001", "상담·용지 접수부터 작업 전환까지 운영 프로젝트 왕복 확인이 필요합니다."),
  requireAttestation("TOPINFO_RELEASE_APP_CHECK_ENFORCED", "APPCHECK-001", "Firebase App Check 운영 키와 Firestore enforcement 확인이 필요합니다."),
  requireAttestation("TOPINFO_RELEASE_VISUAL_QA_VERIFIED", "VISUAL-001", "현재 변경본의 모바일·데스크톱·초광폭 시각 검수 승인이 필요합니다."),
].filter((finding): finding is ReleaseFinding => Boolean(finding));

blockers.push(...externalAttestations);

if (!process.env.VITE_FIREBASE_APP_CHECK_SITE_KEY?.trim()) {
  blockers.push({
    code: "APPCHECK-002",
    message: "프로덕션 빌드용 VITE_FIREBASE_APP_CHECK_SITE_KEY가 비어 있습니다.",
    evidence: ".env 또는 배포 빌드 환경",
  });
}

const downloadManifest = await readDownloadManifest();
const warnings: ReleaseFinding[] = [];
if (downloadManifest.length === 0) {
  warnings.push({
    code: "DOWNLOADS-001",
    message: "자료실 정적 다운로드 manifest가 비어 있습니다. 실제 배포 파일이 생기면 npm run downloads:manifest를 실행해야 합니다.",
    evidence: "public/downloads/manifest.json",
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  ready: blockers.length === 0,
  blockerCount: blockers.length,
  warningCount: warnings.length,
  blockers,
  warnings,
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`TOPINFO release readiness: ${report.ready ? "PASS" : "HOLD"}`);
console.log(`Blockers: ${report.blockerCount}, warnings: ${report.warningCount}`);
console.log(`Report: ${outputPath}`);

if (!report.ready) process.exitCode = 1;
