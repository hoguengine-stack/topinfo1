import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
const authContext = readFileSync(new URL("../src/contexts/AuthContext.tsx", import.meta.url), "utf8");
const legacyBoards = readFileSync(new URL("../src/components/WebBoards.tsx", import.meta.url), "utf8");

function between(source, start, end) {
  const startIndex = source.indexOf(start);
  assert.notEqual(startIndex, -1, `missing start marker: ${start}`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(endIndex, -1, `missing end marker: ${end}`);
  return source.slice(startIndex, endIndex);
}

test("staff roles use Google UID allowlists, not client access-code state", () => {
  assert.match(rules, /function isEmployee\(uid\)[\s\S]*employeeUids/);
  assert.match(rules, /function isAdmin\(uid\)[\s\S]*adminUids/);
  assert.match(authContext, /loadStaffAccess[\s\S]*adminUids[\s\S]*employeeUids/);
  assert.doesNotMatch(rules, /accessCodeHash/);
  assert.doesNotMatch(authContext, /hashAccessCode|verifyAccessCode|updateAccessCode|access_verifications/);
});

test("legacy verification documents are permanently denied", () => {
  const block = between(rules, "match /access_verifications/{userId}", "match /tasks/{taskId}");
  assert.match(block, /allow read, write:\s*if false;/);
  assert.doesNotMatch(block, /allow create|allow update|allow delete/);
});

test("security settings cannot be bootstrapped by a client", () => {
  const block = between(rules, "match /settings/security", "match /settings/{id}");
  assert.match(block, /allow create:\s*if false;/);
  assert.match(block, /allow update:\s*if isAuthenticated\(\) && isAdmin\(request\.auth\.uid\)/);
  assert.match(block, /allow read:\s*if isAuthenticated\(\) && isEmployee\(request\.auth\.uid\)/);
  assert.match(block, /allow delete:\s*if false;/);
});

test("public suggestion creation cannot inject replies or spoof an author UID", () => {
  const validator = between(rules, "function isValidSuggestionCreate()", "function isValidResourceCreate()");
  const matchBlock = between(rules, "match /suggestions/{id}", "match /resources/{id}");

  assert.doesNotMatch(validator, /'replies'/);
  assert.match(validator, /request\.resource\.data\.authorId == request\.auth\.uid/);
  assert.match(matchBlock, /!request\.resource\.data\.keys\(\)\.hasAny\(\['replies'\]\)/);

  const clientCreate = between(legacyBoards, "const postData:", "const createdPost = await addDoc");
  assert.doesNotMatch(clientCreate, /replies\s*:/);
  assert.doesNotMatch(clientCreate, /anonymous/);
  assert.match(clientCreate, /if \(user\?\.sub\) postData\.authorId = user\.sub/);
});
