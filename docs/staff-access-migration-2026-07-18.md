# 임직원 권한 마이그레이션

- 작성일: 2026-07-18
- 대상: `settings/security`, `firestore.rules`, 공개 사이트·백오피스 인증 코드
- 상태: **운영 반영 전 HOLD**

## 변경 이유

이전 접속코드 방식은 클라이언트가 검증용 값을 재사용하거나 사용자 문서의 검증 상태를 조작할 여지가 있었다. 새 구조에서는 Google 로그인 제공자와 Firebase UID 허용 목록만 임직원 권한의 근거로 사용한다.

- 최고 관리자: `settings/security.adminUids`
- 임직원: `settings/security.employeeUids`
- 가맹점 이메일 계정과 `users/{uid}.profile.jobTitle`은 백오피스 권한을 부여하지 않는다.
- `access_verifications/*`, `accessCodeHash`, `isAccessCodeVerified`는 권한 판단에 사용하지 않는다.

## 운영 반영 전 필수 확인

1. Firebase Authentication에서 현재 최고 관리자 Google 계정의 UID를 확인한다.
2. Firestore `settings/security` 문서를 별도로 백업한다.
3. 문서가 없으면 Firebase Console 또는 Admin SDK로 먼저 생성한다. 새 Rules를 먼저 배포하면 클라이언트에서는 이 문서를 생성할 수 없다.
4. 문서를 다음 형태로 정리한다. `accessCodeHash`와 기타 접속코드 필드는 제거한다.

```json
{
  "adminUids": ["현재-최고관리자-UID"],
  "employeeUids": ["승인된-임직원-UID"],
  "updatedAt": 0,
  "updatedBy": "현재-최고관리자-UID"
}
```

실제 `updatedAt`에는 작업 시점의 정수 타임스탬프를 사용한다. `adminUids`에는 작업을 수행하는 관리자 UID가 반드시 남아 있어야 한다.

## 배포 순서

1. 운영 `settings/security`의 `adminUids`와 `employeeUids`를 먼저 확정한다.
2. 기존 관리자 Google 계정으로 현재 문서를 읽을 수 있는지 확인한다.
3. 유지보수 시간에 Firestore Rules와 새 웹 클라이언트를 연속해서 반영한다.
4. 최고 관리자 계정으로 로그인해 백오피스 진입, 작업 읽기·쓰기, CMS 읽기·쓰기를 확인한다.
5. 일반 임직원 계정으로 백오피스 진입과 필요한 업무만 확인한다.
6. 허용 목록에 없는 Google 계정과 이메일 계정이 백오피스에 진입하지 못하는지 확인한다.
7. 상담·용지 요청·비공개 건의글의 실제 운영 왕복을 확인한다.

## 실패 시 대응

- 관리자 접근이 막히면 접속코드 방식을 다시 활성화하지 않는다.
- Firebase Console 또는 Admin SDK로 `settings/security.adminUids`를 바로잡은 뒤 재검증한다.
- 클라이언트와 Rules 버전이 서로 다른 상태로 오래 운영하지 않는다.
- 운영 검증이 끝나기 전에는 Git push와 Firebase 배포를 진행하지 않는다.

## 남은 보안 검증

- 운영 프로젝트에서 관리자·임직원·비허용 Google·이메일 로그인 계정의 실제 권한 왕복
- 운영 App Check용 reCAPTCHA Enterprise 키 등록과 Firestore enforcement
- 공개 상담·배송·건의 작성의 CAPTCHA 또는 서버 측 rate limit
- 관리자용 UID 허용 목록 편집 UI 또는 별도 Admin SDK 운영 절차

로컬 Firestore Emulator에서는 관리자·임직원·비허용 Google·이메일 로그인, 보안 문서 수정·생성, 공개 상담, 건의 UID 위조, 레거시 플래그, 공개 설정 범위를 포함한 6개 시나리오가 통과했다. 이 검증은 운영 프로젝트의 실제 UID 데이터와 App Check enforcement 확인을 대체하지 않는다.
