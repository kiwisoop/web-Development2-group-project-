# Final Test Checklist

Sport Analysis Dashboard 최종 점검용 체크리스트입니다.

## 1. 실행 환경

- [ ] Backend: `.\mvnw.cmd spring-boot:run`
- [ ] Frontend: `cd frontend && npm run dev`
- [ ] Frontend URL: `http://localhost:5173`
- [ ] Backend API URL: `http://localhost:8080/api`
- [ ] `frontend/.env`의 `VITE_API_BASE_URL`이 실제 백엔드 주소와 일치
- [ ] Oracle DB 접속 정보 확인
- [ ] `GROQ_API_KEY`, `CITO_API_KEY`가 필요한 기능에서 설정됨

## 2. 빌드 검증

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build

cd ..
.\mvnw.cmd -q -DskipTests compile
```

- [ ] Frontend lint PASS
- [ ] Frontend build PASS
- [ ] Backend compile PASS

## 3. 인증

- [ ] `/login` 로그인 성공
- [ ] `/register` 회원가입 성공
- [ ] 로그인 후 상단 사용자 정보 표시
- [ ] 로그아웃 후 보호 페이지 접근 시 로그인 안내 표시
- [ ] 일반 사용자는 `/admin` 접근 제한
- [ ] 관리자 계정은 `/admin` 접근 가능
- [ ] 설정 화면에서 비밀번호 변경 동작 확인
- [ ] 설정 화면에서 회원 탈퇴 UI 확인

## 4. 홈

- [ ] 진행 경기 카운트는 실제 LIVE 상태만 포함
- [ ] 예정 경기는 3일 내 경기만 표시
- [ ] AI 분석 수는 `/analysis`의 기준과 일치
- [ ] 인기 순위는 축구/야구/e스포츠가 순환 표시
- [ ] 경기 카드의 팀 로고가 통일된 방식으로 표시

## 5. 경기센터

- [ ] `/matches` 진입 시 오늘 날짜 기준 목록 표시
- [ ] 이전/오늘/다음 날짜 버튼 동작
- [ ] 종목 필터: 전체, 야구, 축구, e스포츠
- [ ] 상태 필터: 전체, 예정, 진행중, 종료
- [ ] LIVE 필터는 실제 LIVE 경기만 표시
- [ ] 날짜와 필터 변경 후 목록과 총 경기 수 일치
- [ ] 경기 상세 링크가 올바른 상세 페이지로 이동

## 6. 경기 상세

- [ ] 예정 경기는 예정 상태와 일정 정보만 표시
- [ ] 진행중 경기는 실시간 스코어와 채팅 입력 가능
- [ ] 종료 경기는 채팅 입력 비활성화
- [ ] 야구 상세에서 라인스코어, 선발 투수, 핵심 타자 정보가 잘 보임
- [ ] 팬 투표 UI가 로그인 상태에 맞게 동작
- [ ] AI 분석 영역은 완료 경기에서만 의미 있게 표시

## 7. AI 분석

- [ ] `/analysis`에서 분석 가능한 경기만 표시
- [ ] 예정 경기는 분석 가능 목록에 포함되지 않음
- [ ] 종목별 필터가 동작
- [ ] 화면 상단 불필요한 숫자 카드가 없음
- [ ] 빈 상태와 오류 상태 메시지가 깨지지 않음

## 8. 스포츠 허브

- [ ] `/sports`에서 축구, 야구, e스포츠 카드 표시
- [ ] 카드 배경/이미지와 버튼 시인성 확인
- [ ] `/sports/baseball`은 오늘 MLB 경기만 표시
- [ ] `/sports/esports`의 오늘 LCK 경기는 오늘 날짜와 확정 팀만 표시
- [ ] `/sports/soccer` 축구 홈 진입 확인

## 9. 순위

- [ ] `/rankings`는 `/rankings/soccer`로 이동
- [ ] `/rankings/soccer` 축구 순위 표시
- [ ] `/rankings/baseball` 야구 순위 표시
- [ ] `/rankings/esports` e스포츠 순위 표시
- [ ] 스포츠 탭의 순위와 순위 페이지의 기준이 일치

## 10. 즐겨찾기

- [ ] 비로그인 상태 `/favorites`는 로그인 안내 표시
- [ ] 로그인 후 즐겨찾기 팀 목록 표시
- [ ] 축구/야구/e스포츠 팀 로고 표시
- [ ] 즐겨찾기 추가/해제 후 목록 갱신
- [ ] 팀별 경기 일정 링크 동작

## 11. 관리자

- [ ] `/admin` 대시보드 접근 권한 확인
- [ ] 축구 데이터 동기화 버튼 동작
- [ ] MLB 일정 가져오기 버튼 동작
- [ ] e스포츠 일정 동기화 버튼 동작
- [ ] 날짜 범위 선택값이 API 요청에 반영
- [ ] 데이터가 DB에 저장되고 경기센터/분석 화면에 반영
- [ ] 오류 메시지는 흰색 배경에 묻히지 않고 읽을 수 있음

## 12. 문서/정리

- [ ] `README.md` 실행 방법 최신화
- [ ] `frontend/README.md` 프론트 환경 변수 최신화
- [ ] `.gitignore`가 `target/`, `frontend/node_modules/`, `frontend/dist/` 제외
- [ ] 로컬 절대 경로가 문서나 코드에 남아 있지 않음
- [ ] 최종 확인 결과를 `docs/PROJECT_STATUS_2026-06-01.md`에 기록
