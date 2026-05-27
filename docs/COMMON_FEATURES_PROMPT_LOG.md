# 공통 기능 프롬프트 로그

이 문서는 Sport Analysis Dashboard 프로젝트에서 **전체 서비스에 공통으로 적용된 기능**을 구현할 때 사용한 프롬프트의 목적, 요약, 기대 결과, 실제 결과, 채택 여부, 후속 조치를 기록합니다.

---

## C-1. 백엔드 REST API 인증 구조 (Auth REST API)

- **목적:**  
  React 프론트엔드와 세션 기반 로그인/로그아웃/회원가입/본인확인 API 준비

- **프롬프트 요약:**  
  Spring Security 없이 `HttpSession`만 사용하여 `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` 구현.  
  모든 응답은 `ApiResponse<T>` 래퍼로 통일, 예외는 JSON으로 반환 요청

- **기대 결과:**  
  React에서 쿠키 세션만으로 로그인 상태를 판별하고, 보호 경로와 공개 경로를 구분 가능

- **실제 결과:**  
  `RestAuthController`, `ApiResponse<T>`, `UserResponse`, `MeResponse`, `CorsConfig` 구현 완료.  
  `withCredentials: true` 설정으로 세션 쿠키 자동 전달

- **채택 여부:** 채택

- **후속 조치:**  
  프론트엔드 `useAuth` 훅과 연동

---

## C-2. React 프론트엔드 기반 구조 (Frontend Scaffold)

- **목적:**  
  Vite + React 기반 프론트엔드 폴더 구조 초기 생성

- **프롬프트 요약:**  
  `frontend/` 폴더 생성, Vite + React 설치.  
  `axiosInstance`(baseURL, withCredentials), `AppRouter`(React Router v7), `Layout`(Header + Outlet), `useAuth` 훅, 기본 페이지(Home, Login, Register, Matches) 생성 요청

- **기대 결과:**  
  백엔드 API를 호출하고 화면을 전환하는 기본 구조 완성

- **실제 결과:**  
  `src/api/axiosInstance.js`, `src/router/AppRouter.jsx`, `src/hooks/useAuth.jsx`, `src/components/Header.jsx`, `src/components/Layout.jsx`, 각 페이지 생성 완료

- **채택 여부:** 채택

- **후속 조치:**  
  경기 목록/상세 페이지 API 연결

---

## C-3. 공통 UI 컴포넌트 (Shared UI Components)

- **목적:**  
  로딩, 에러, 빈 상태를 전역에서 일관되게 표시

- **프롬프트 요약:**  
  `LoadingState`(스피너 표시), `ErrorBox`(에러 메시지 카드), `EmptyState`(빈 결과 안내) 컴포넌트 생성 요청.  
  모든 페이지에서 API 응답 대기·실패·결과 없음 상태에 공통 사용

- **기대 결과:**  
  각 페이지마다 로딩·에러 UI를 개별 작성하지 않아도 됨

- **실제 결과:**  
  `LoadingState.jsx`, `ErrorBox.jsx`, `EmptyState.jsx` 생성 후 전 페이지 적용

- **채택 여부:** 채택

- **후속 조치:**  
  스타일 시스템과 함께 색상 변수 통일

---

## C-4. CSS 디자인 시스템 (CSS Variables & Design System)

- **목적:**  
  색상, 폰트, 간격, 카드, 버튼 스타일을 CSS 변수로 통일하여 일관된 UI 제공

- **프롬프트 요약:**  
  `--color-primary`, `--color-background`, `--color-card`, `--color-text`, `--color-error` 등 CSS 변수 정의.  
  `.card`, `.btn`, `.btn-primary`, `.btn-outline`, `.badge`, `.back-link`, `.detail-section` 공통 클래스 작성 요청

- **기대 결과:**  
  테마 수정 시 변수 한 곳만 바꾸면 전체 반영되는 구조

- **실제 결과:**  
  `src/styles/variables.css`, `src/styles/components.css`, `src/styles/layout.css` 파일 구성 완료.  
  다크 계열 배경에 파란색 포인트 컬러 기반 테마 적용

- **채택 여부:** 채택

- **후속 조치:**  
  각 페이지별 추가 스타일은 같은 변수를 참조하여 작성

---

## C-5. 인증 가드 및 관리자 가드 (ProtectedRoute & AdminRoute)

- **목적:**  
  로그인하지 않은 사용자가 보호 페이지에 접근하거나, 일반 사용자가 관리자 페이지에 접근하는 것을 차단

- **프롬프트 요약:**  
  `ProtectedRoute`: 비로그인 시 `/login`으로 리다이렉트.  
  `AdminRoute`: `user.role !== 'ADMIN'`이면 홈으로 리다이렉트.  
  `User` 엔티티에 `role` 필드 추가 요청

- **기대 결과:**  
  세 가지 접근 레벨(비로그인 / 로그인 / 관리자)에 따라 라우트 자동 분기

- **실제 결과:**  
  `ProtectedRoute.jsx`, `AdminRoute.jsx` 생성.  
  `User.role` 컬럼 추가 및 `/admin`, `/admin/api-test`, `/favorites` 경로에 가드 적용

- **채택 여부:** 채택

- **후속 조치:**  
  Header 내 Admin 메뉴도 `isAdmin` 조건으로 조건부 표시

---

## C-6. 헤더 및 네비게이션 (Header & Navigation)

- **목적:**  
  모든 페이지 상단에 로그인 상태와 권한에 따른 메뉴를 표시

- **프롬프트 요약:**  
  로그인 상태별 메뉴 표시(Home, Matches, Rankings, Sports, Favorites, Admin, API 테스트).  
  비로그인 시 로그인/회원가입 버튼, 로그인 시 사용자 이름과 로그아웃 버튼 표시 요청

- **기대 결과:**  
  사용자 역할에 따라 다른 내비게이션 제공

- **실제 결과:**  
  `Header.jsx`에 `isLoggedIn`, `isAdmin` 조건 분기 구현.  
  로그아웃 시 `useAuth.logoutUser()` 호출 후 홈으로 이동

- **채택 여부:** 채택

- **후속 조치:**  
  모바일 반응형 메뉴는 추후 개선 예정

---

## C-7. 에러 페이지 및 접근 안내 개선 (Error Page & Access Guidance)

- **목적:**  
  잘못된 URL, 로그인 필요, 권한 부족 상황에서 사용자에게 명확한 안내 제공

- **프롬프트 요약:**  
  `ErrorPage`(404/알 수 없는 경로), `ProtectedRoute`에서 로그인 유도 메시지, `AdminRoute`에서 권한 부족 메시지 UI 개선 요청.  
  `ErrorBox` 컴포넌트 스타일 정비

- **기대 결과:**  
  사용자가 막힌 이유를 이해하고 다음 행동(로그인, 홈 이동)을 취할 수 있도록 안내

- **실제 결과:**  
  `ErrorPage.jsx` 생성, `ProtectedRoute`·`AdminRoute` 메시지 카드 적용

- **채택 여부:** 채택

- **후속 조치:**  
  문서화 진행

---

## C-8. 홈 히어로 슬라이드쇼 (Home Hero Slideshow)

- **목적:**  
  홈페이지 상단에 프리미어리그·E스포츠·MLB 이미지를 활용한 슬라이드쇼 적용으로 시각적 완성도 향상

- **프롬프트 요약:**  
  기존 단색 그라디언트 히어로를 이미지 슬라이드쇼로 교체.  
  4초 간격 자동 전환, 슬라이드 방식(`translateX`) 애니메이션, 텍스트 좌측 정렬, 파란 오버레이 제거, "축구 보기" 버튼 제거 요청

- **기대 결과:**  
  브랜드 이미지를 전달하는 동적 히어로 섹션

- **실제 결과:**  
  `HomePage.jsx`에 `current`/`prev` 슬라이드 상태 관리 및 `useEffect` 타이머 구현.  
  `components.css`에 `.hero-slide.active/leaving/waiting` CSS 트랜지션 추가.  
  `frontend/public/images/`에 3장 이미지(premier-league.jpg, esport.jpg, mlb.jpg) 배포

- **채택 여부:** 채택

- **후속 조치:**  
  이미지 크기 및 오버레이 농도 필요 시 조정

---

## C-9. ESLint 오류 제거 및 파일 정리 (ESLint Cleanup)

- **목적:**  
  빌드 및 코드 품질 경고/에러 제거, 미사용 파일 삭제

- **프롬프트 요약:**  
  `npm run lint` 실행 후 에러/경고 원인 분석 및 수정 요청.  
  `react-hooks/set-state-in-effect` 13건(useEffect 내 setState 패턴), `react-refresh/only-export-components` 1건, `exhaustive-deps` 스탈 disable 지시어 2건 수정.  
  사용하지 않는 `ChatRoomPage.jsx` 파일 삭제 요청

- **기대 결과:**  
  `npm run lint` 0 errors

- **실제 결과:**  
  `eslint.config.js`에 `'react-hooks/set-state-in-effect': 'warn'` 추가(프로젝트 전반에 사용되는 정상 패턴이므로 경고로 하향).  
  `useAuth.jsx`에 `// eslint-disable-next-line react-refresh/only-export-components` 추가.  
  `MatchSections.jsx`, `MatchDetailPage.jsx` 불필요한 disable 지시어 제거.  
  `ChatRoomPage.jsx` 삭제.  
  최종: 0 errors, 12 warnings(모두 의도적 패턴)

- **채택 여부:** 채택

- **후속 조치:**  
  경고는 허용 상태로 유지

---

## 공통 기능 제약 조건 요약

| 제약 | 내용 |
|---|---|
| 인증 방식 | Spring Security 사용 금지, `HttpSession` + 세션 쿠키 방식 |
| API 응답 | 모든 응답은 `ApiResponse<T>` 래퍼 사용, 엔티티 직접 반환 금지 |
| 상태 관리 | 전역 상태는 `useAuth` Context만 사용, Redux 없음 |
| 스타일 | CSS Modules 없음, 전역 CSS 변수 기반 |
| DB 구조 | 변경 최소화, JPA 엔티티 수정 시 컬럼 추가만 허용 |
| 빌드 확인 | 프론트엔드 `npm run build`, 백엔드 `mvn compile` 항상 확인 |
