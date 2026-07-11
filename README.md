# 탑정보통신 작업관리

탑정보통신 공개 홈페이지, CMS, 상담/용지 신청, 내부 작업관리를 하나로 운영하는 React + Firebase 프로젝트입니다.

## 로컬 실행

```powershell
npm install
npm run dev
```

기본 주소는 `http://localhost:3000`입니다. 포트를 바꾸려면 `.env`에 `PORT`를 지정합니다.

## Firebase 구성

- 프로젝트: `imagebuilder-485006`
- Firestore 데이터베이스: `ai-studio-07e7f11b-9034-4c94-8392-c28f5c842f62`
- 인증: Firebase Authentication의 Google 및 이메일 로그인
- 호스팅: Firebase Hosting의 `dist` 디렉터리

Firestore Rules 배포:

```powershell
npx firebase-tools deploy --only firestore --project imagebuilder-485006
```

## 자료실 파일 등록

1. 배포할 파일을 `public/downloads`에 넣습니다.
2. `npm run downloads:manifest`를 실행합니다.
3. 변경 파일을 GitHub에 커밋하고 푸시합니다.
4. 관리자 자료실에서 `/downloads/파일명` 경로를 등록합니다.

자료 파일은 GitHub/Firebase Hosting 정적 파일로 배포되며 Firebase Storage를 사용하지 않습니다.

## 배포 전 확인

변경 범위에 맞는 확인만 실행합니다. 타입 영향이 크면 `npm run lint`, 빌드 설정이나 배포 구성이 바뀌면 `npm run build`를 사용합니다.
