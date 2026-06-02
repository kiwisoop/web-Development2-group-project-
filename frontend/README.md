# Frontend

Sport Analysis Dashboard의 React/Vite 프론트엔드입니다.

## 실행

```powershell
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다. `vite.config.js`의 `strictPort`가 켜져 있어 다른 포트로 조용히 바뀌지 않습니다.

## 환경 설정

`frontend/.env.example`을 참고해 `.env`를 만들 수 있습니다.

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

값을 지정하지 않으면 현재 호스트의 `8080` 포트를 백엔드 API로 사용합니다.

## 주요 폴더

```text
src/
├─ api/         # REST API 클라이언트
├─ assets/      # 번들 이미지
├─ components/  # 재사용 UI
├─ data/        # 프론트 보조 데이터
├─ hooks/       # 인증 및 데이터 훅
├─ pages/       # 라우트 페이지
├─ router/      # 라우터, 보호 라우트
└─ styles/      # 전역/레이아웃/컴포넌트 스타일
```

## 검증

```powershell
npm.cmd run lint
npm.cmd run build
```

## UI 정리 기준

- 팀 로고는 `TeamLogo` 컴포넌트를 우선 사용합니다.
- 종목별 페이지는 `/sports`, `/sports/baseball`, `/sports/esports`, `/sports/soccer` 경로를 기준으로 분리합니다.
- 경기 상세와 분석 화면은 예정 경기와 완료 경기의 동작을 분리합니다.
- 실제 LIVE 상태가 아닌 경기는 LIVE 배지와 진행 경기 카운트에 포함하지 않습니다.
