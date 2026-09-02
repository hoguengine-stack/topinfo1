function readErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code?: unknown }).code || "");
  }
  return "";
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message || "");
  }
  return String(error || "");
}

export function isFirestoreQuotaError(error: unknown) {
  const code = readErrorCode(error).toLowerCase();
  const message = readErrorMessage(error).toLowerCase();

  return code.includes("resource-exhausted") ||
    message.includes("quota") ||
    message.includes("resource-exhausted");
}

export function getBoardLoadErrorMessage(error: unknown) {
  if (isFirestoreQuotaError(error)) {
    return "Firestore 일일 읽기 한도가 초과되어 게시판 목록을 불러오지 못했습니다. 한도가 리셋되면 자동으로 다시 조회됩니다.";
  }

  return "게시판 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
