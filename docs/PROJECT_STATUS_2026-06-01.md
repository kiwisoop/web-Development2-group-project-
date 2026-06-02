# Project Status - 2026-06-01

## 정리 목적

UI 개선 이후 남아 있던 데이터 기준 불일치, 표시 오류, 문서 노후화, 로컬 경로 고정 문제를 정리했다.

## 수정 요약

- LCK 오늘 경기 조회 기준을 서울 시간 오늘 날짜로 고정했다.
- `/sports/esports`에서 오늘 경기에 `TBD` placeholder 팀이 표시되지 않게 했다.
- `/api/lck/cito/today`도 오늘 날짜 범위 조회를 사용하도록 백엔드 기준을 맞췄다.
- 프론트 API 주소를 `VITE_API_BASE_URL`로 설정 가능하게 변경했다.
- Vite 개발 서버가 지정 포트 외 다른 포트로 자동 변경되지 않도록 `strictPort`를 켰다.
- CORS 허용 개발 주소를 현재 프론트 표준 포트인 `5173` 기준으로 정리했다.
- 앱 최상단에 ErrorBoundary를 연결해 런타임 오류 시 빈 화면 대신 안내 화면을 보여주도록 했다.
- 깨진 라우터 주석과 README 문서를 정리했다.
- 최종 테스트 체크리스트를 현재 라우트와 기능 기준으로 업데이트했다.

## 주요 경로

| 영역 | 경로 |
|---|---|
| 홈 | `/` |
| 경기센터 | `/matches` |
| 경기 상세 | `/matches/:matchId` |
| AI 분석 | `/analysis` |
| 스포츠 허브 | `/sports` |
| 야구 허브 | `/sports/baseball` |
| e스포츠 허브 | `/sports/esports` |
| 축구 허브 | `/sports/soccer` |
| 순위 | `/rankings/:sportType` |
| 즐겨찾기 | `/favorites` |
| 설정 | `/settings` |
| 관리자 | `/admin` |

## 검증 결과

2026-06-01 기준 다음 명령을 확인했다.

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build

cd ..
.\mvnw.cmd -q -DskipTests compile
```

결과:

- Frontend lint: PASS
- Frontend build: PASS
- Backend compile: PASS
- 주요 화면 콘솔 오류: 확인 당시 없음
- 주요 화면 깨진 이미지: 확인 당시 없음

## 남은 주의점

- 실제 데이터 동기화는 외부 API 키와 DB 연결 상태에 따라 달라진다.
- Groq/Cito API 키가 없으면 조회 화면은 동작해도 AI 생성 또는 Cito 실시간 조회는 실패할 수 있다.
- `target/`, `frontend/dist/`, `frontend/node_modules/`는 빌드 산출물이므로 Git 추적 대상에서 제외한다.
