# 평가 기준 대응 로그

이 문서는 웹프로그래밍2 팀프로젝트 평가 기준과 보고서 양식에 맞춰, GitHub 저장소에서 확인할 수 있는 증거 자료를 정리한 문서입니다. 보고서 작성 전 누락된 항목을 점검하고, 발표 시 질문 대응 자료로 사용할 수 있습니다.

## 1. 참고한 제출/평가 기준

| 문서 | 반영 내용 |
|---|---|
| `웹 프로그래밍 2 프로젝트(계획서).hwp` | 제목, 목적, 범위, 사용자/이해관계자, 유저 플로우/와이어프레임 항목 필요 |
| `웹프로그래밍2설계안내서.hwp` | 타겟 사용자, 목적, 목표, 사용 시나리오, 제약사항, GitHub 사용, LLM 활용 가능 |
| `팀프로젝트_보고서_양식.docx` | 문제정의, 현실적 제한조건, AI 투명성, 프롬프트 전략, 아키텍처, 구현/검증, 팀협업, 윤리, 결과, 성찰 |
| `웹프로그래밍2_팀프로젝트_평가기준.docx` | 산출물 30%, 과정 45%, 성찰/발표 25% 기준 반영 |

## 2. 평가 항목별 저장소 증거

| 평가 항목 | 요구 포인트 | 현재 증거 파일 |
|---|---|---|
| 시스템 완성도 및 기능 구현 | 요구사항 구현률, 안정성, 엣지 케이스, 보안/성능 고려 | `README.md`, `docs/FINAL_TEST_CHECKLIST.md`, `frontend/src/pages/*`, `src/main/java/com/sport/web_sport/*` |
| 아키텍처 및 설계 판단 | 기술 스택 선택 근거, 현실적 제한조건, 트레이드오프 | `README.md`, `docs/REACT_REST_MIGRATION_PLAN.md`, `docs/MLB_DESIGN_DOCS.md`, `README-soccer.md` |
| AI 활용 전략 및 프롬프트 엔지니어링 | 단계별 프롬프트, 맥락/제한조건 제공, 성장 흔적 | `docs/PROMPT_LOG.md`, `docs/COMMON_FEATURES_PROMPT_LOG.md`, `docs/BASEBALL_PROMPT_LOG.md`, `docs/ESPORTS_PROMPT_LOG.md`, `PROMPT_LOG-soccer.md` |
| 코드 검증 및 비판적 사고 | AI 생성 코드 리뷰, 버그 수정, 테스트 전략 | `docs/FINAL_TEST_CHECKLIST.md`, 프롬프트 로그의 `실제 결과`/`후속 조치` 항목 |
| 팀워크 및 의사소통 | 역할 분담, 기여도, Git 이력, 협업 기록 | `README.md` 팀 역할 표, Git commit history, 팀 보고서 6장 |
| AI 사용 투명성 및 학술적 정직성 | AI 사용 범위, 직접 수행 범위, 로그 조작 금지 | 프롬프트 로그 전체, `docs/REPORT_AI_PROMPT_SECTION.md` |
| 학습 성찰 보고서 | 개인 경험, 실패 교훈, 윤리 성찰 | 보고서 9장에 팀원이 직접 작성해야 함 |
| 발표 및 시연 | 기능 시연, 설계 의사결정 방어, 질문 대응 | `README.md` 실행 방법, 테스트 계정, API 표, `docs/FINAL_TEST_CHECKLIST.md` |

## 3. 팀원별 담당 범위

| 팀원 | 담당 | 구현/문서 증거 |
|---|---|---|
| 조우성 | 축구(K리그) | `src/main/java/com/sport/web_sport/soccer/`, `frontend/src/pages/Soccer*.jsx`, `README-soccer.md`, `PROMPT_LOG-soccer.md`, `docs/superpowers/specs/2026-05-27-soccer-real-db-design.md` |
| 김우림 | E스포츠(LCK) | `src/main/java/com/sport/web_sport/esports/`, `frontend/src/pages/EsportsPage.jsx`, `frontend/src/api/lckApi.js`, `docs/ESPORTS_PROMPT_LOG.md` |
| 최수인 | 야구(MLB) | `src/main/java/com/sport/web_sport/baseball/`, `frontend/src/components/Mlb*.jsx`, `frontend/src/api/mlbApi.js`, `docs/BASEBALL_PROMPT_LOG.md`, `docs/MLB_DESIGN_DOCS.md` |
| 공통/통합 | 인증, 경기, 투표, 채팅, 관리자, React 전환 | `src/main/java/com/sport/web_sport/user/`, `sports/`, `prediction/`, `chat/`, `admin/`, `frontend/src/router/`, `docs/COMMON_FEATURES_PROMPT_LOG.md`, `docs/PROMPT_LOG.md` |

## 4. 설계 판단 기록 요약

| 결정 | 채택 이유 | 트레이드오프/제한 |
|---|---|---|
| React SPA + Spring Boot REST API | 화면과 API를 분리해 종목별 화면 확장과 API 테스트가 쉬움 | 초기 마이그레이션 비용 증가 |
| Oracle DB 유지 | 교과/기존 프로젝트 환경과 맞고 JPA 연동 가능 | 로컬 DB 설정이 필요해 실행 준비 부담 존재 |
| HttpSession 인증 | 팀 프로젝트 기간 내 구현/디버깅이 단순하고 쿠키 기반으로 React 연동 가능 | 모바일/외부 클라이언트 확장성은 JWT보다 낮음 |
| 종목별 패키지 분리 | 축구, E스포츠, 야구의 외부 API와 응답 구조가 달라 독립 구현이 안전 | 공통화가 과하면 오히려 복잡해져 중복 DTO 일부 허용 |
| Groq 중심 분석은 요약 중심 | AI 예측을 실제 확률처럼 오해하지 않도록 경기 흐름/결과 분석에 집중 | 경기 전 승률 예측 기능은 향후 과제로 분리 |
| 팬 투표는 사용자 의견 집계 | AI 분석과 사용자 여론을 명확히 구분 | 표본 수가 적으면 결과 대표성이 낮을 수 있음 |

## 5. AI 활용 투명성 기록

| 단계 | AI 활용 방식 | 사람이 검토/수정한 부분 |
|---|---|---|
| 목표/기준 설정 | 기능 범위, React 전환 계획, 종목별 모듈 분리 방향 정리 | 팀별 담당 범위와 구현 우선순위 결정 |
| 분석/설계 | API 구조, DTO, 컴포넌트 분리, DB 매핑 오류 원인 분석 | 실제 Oracle 컬럼명, 외부 API 응답, 화면 요구사항에 맞게 수정 |
| 제작/구현 | Controller/Service/DTO/React 컴포넌트 초안 작성 | 컴파일 오류 수정, 응답 형식 통일, 상태별 UI 조건 조정 |
| 시험/검증 | 체크리스트와 오류 재현/해결 방법 정리 | 로컬 실행, API 응답 확인, 기능별 수동 테스트 |
| 평가/개선 | README, 프롬프트 로그, 보고서용 요약 초안 정리 | 개인 성찰과 최종 판단은 팀원이 직접 작성 |

## 6. 코드 검증 체크포인트

- Backend: `.\mvnw.cmd compile` 또는 `.\mvnw.cmd test`
- Frontend: `cd frontend && npm run build`
- 기능 검증: `docs/FINAL_TEST_CHECKLIST.md`
- 관리자 검증: `admin/admin123` 로그인 후 `/admin`, `/admin/api-test`
- AI 검증: `GROQ_API_KEY` 설정 후 축구/K리그, LCK, MLB 분석 생성 확인. 공통 레거시 분석을 시연할 경우에만 `GEMINI_API_KEY`도 확인
- 데이터 검증: 축구/K리그, LCK, MLB 화면에서 외부 API 실패 시 에러 상태가 섹션 단위로 표시되는지 확인

## 7. 보고서 작성 시 그대로 쓰면 안 되는 항목

- 개인별 성찰(보고서 9장)은 평가 기준상 AI로 작성하면 안 되므로 각 팀원이 직접 작성해야 합니다.
- Git 커밋 이력, 실제 실행 결과, 발표 시연 성공 여부는 제출 직전에 직접 확인해야 합니다.
- 프롬프트 로그는 조작하면 학술적 부정행위로 처리될 수 있으므로 실제 작업 흐름에 맞는 내용만 사용해야 합니다.

## 8. 제출 전 보강 권장 사항

- E스포츠 전용 프롬프트 로그(`docs/ESPORTS_PROMPT_LOG.md`)는 추가했으므로, 실제 팀 작업 흐름과 다른 부분이 있으면 김우림 담당자가 직접 사실관계만 보정합니다.
- GitHub에 올리기 전 실행 로그(`*.log`), 빌드 결과(`target/`, `frontend/dist/`), 개인 설정(`.claude/`)이 커밋에 포함되지 않았는지 확인합니다.
- 보고서에는 `README.md`의 설계 판단 표와 이 문서의 평가 항목별 증거 표를 요약해 넣으면 평가 기준과 연결하기 쉽습니다.
