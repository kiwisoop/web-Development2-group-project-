# 보고서 2장 · 3장 작성 자료
# AI 도구 사용 투명성 & 프롬프트 엔지니어링

> 이 문서는 팀프로젝트_보고서_양식.docx의 **2장**과 **3장**에 기입할 내용을 정리한 초안입니다.  
> 팀원이 직접 작성해야 하는 **9장(성찰)** 항목은 포함하지 않습니다.

---

## 2장. AI 도구 사용 투명성 보고

### 2.1 사용 도구 명세

| 도구명 | 모델/버전 | 사용 기간 | 사용 범위 | 비용 |
|---|---|---|---|---|
| Claude Code | claude-sonnet-4-6 | 2025년 ~ 2026년 5월 | 전체 백엔드/프론트엔드 코드 생성, 버그 수정, 문서 작성 | Claude.ai Pro 구독 |

---

### 2.2 AI 기여도 명세

| 모듈 / 기능 | AI 기여도 | 팀원 기여도 | 비고 |
|---|---|---|---|
| 프로젝트 구조 전환 (Thymeleaf → React) | 60% | 40% | AI가 전환 계획서 및 코드 초안 생성, 팀원이 실현 가능성 판단 및 Phase 순서 조정 |
| 백엔드 인증 API (login/register/me) | 70% | 30% | AI가 Controller·DTO 코드 생성, 팀원이 HttpSession 세션 정책 결정 |
| React 기반 구조 (Router·useAuth·Layout) | 70% | 30% | AI가 초기 스캐폴딩, 팀원이 라우팅 정책 및 접근 제어 설계 |
| 관리자 권한 (ProtectedRoute·AdminRoute) | 65% | 35% | AI가 구현, 팀원이 ADMIN/USER 역할 정책 결정 |
| 경기 목록·상세 페이지 | 65% | 35% | AI가 컴포넌트 코드 생성, 팀원이 UI 흐름 및 API 연결 검증 |
| Gemini AI 분석 연동 | 60% | 40% | AI가 API 호출 코드 생성, 팀원이 분석 항목(summary/tactical/keyPoint) 설계 |
| 팬 예측 투표 기능 | 65% | 35% | AI가 Entity·Service·React 컴포넌트 구현 |
| 경기 채팅 기능 | 70% | 30% | AI가 ChatRoom·ChatMessage·ChatBox 전체 구현, 팀원이 LIVE 제한 정책 결정 |
| 관리자 대시보드·API 테스트 페이지 | 60% | 40% | AI가 UI·API 구현, 팀원이 표시 항목 및 권한 정책 결정 |
| MLB 일정 동기화 (자동·수동) | 65% | 35% | AI가 MlbSyncService·스케줄러 구현, 팀원이 동기화 주기 및 externalId 구조 설계 |
| 경기 목록 캐러셀·팀 로고 표시 | 55% | 45% | 팀원이 UX 문제 발견 후 캐러셀 방식 요구, AI가 구현 |
| MLB 경기 상세 (라인업·박스스코어·이닝) | 65% | 35% | AI가 6개 컴포넌트 구현, 팀원이 탭 구조 기획 및 UI 검증 |
| MLB 문자중계 (Play-by-Play) | 65% | 35% | AI가 구현, 팀원이 LIVE/FINAL 갱신 정책 결정 |
| MLB 스트라이크존 차트 | 60% | 40% | 팀원이 pitchData 사전 검사 후 사용 가능 필드 확인, AI가 SVG 구현 |
| 버그 수정 (채팅 중복·관리자 빈화면) | 40% | 60% | 팀원이 오류 재현 및 원인 분석, AI가 코드 수정 |
| 문서화 (README·PROMPT_LOG·체크리스트) | 50% | 50% | AI가 초안 작성, 팀원이 내용 검토·수정 |

---

### 2.3 세션 로그 요약 (핵심 프롬프트–응답 사례)

#### 사례 1 — 프로젝트 구조 전환 (목표/기준 설정 단계)

**프롬프트:**
```
현재 스포츠 분석 웹사이트 프로젝트를 React + Spring Boot REST API 구조로 정리하려고 한다.

프로젝트 구조:
- Frontend: React + Vite
- Backend: Spring Boot
- DB: Oracle
- AI: Gemini API
- Auth: HttpSession
- 기존 Thymeleaf 화면은 제거하고 React에서 화면을 담당하게 한다.

목표:
1. Spring Boot는 REST API 서버 역할만 하도록 정리한다.
2. Thymeleaf 의존성과 templates 기반 화면을 제거한다.
3. React 프론트엔드에서 로그인, 경기 목록, 경기 상세, 관리자 페이지 등을 제공한다.
4. 기존 백엔드 Entity, Repository, Service 구조는 최대한 유지한다.
5. Spring Security는 추가하지 않고 기존 HttpSession 인증 방식을 유지한다.
6. API 응답은 JSON 형태로 통일한다.

주의:
- 기존 공통 기능을 깨뜨리지 말 것
- 불필요한 구조 변경은 하지 말 것
- 코드 수정 후 frontend build와 backend compile을 확인할 것
- git commit은 하지 말고 결과만 요약할 것
```

**AI 응답 요약:**  
마이그레이션 계획서 생성 (Phase 1: REST API 정비 → Phase 2: React 기반 구조 → Phase 3: 기능 연결 → Phase 4: Thymeleaf 제거).  
`pom.xml` Thymeleaf 의존성 제거, `templates/` 디렉토리 삭제, page controller 5개 삭제, `GlobalExceptionHandler` REST 전용 단순화 수행.

**평가 및 채택 여부:** 채택  
**후속 조치:** Phase 순서를 팀 일정에 맞게 일부 조정하여 단계별 구현 착수.

---

#### 사례 2 — 관리자 권한 및 보호 라우트 (분석/설계 단계)

**프롬프트:**
```
현재 프로젝트에 로그인/회원가입은 구현되어 있지만,
관리자 권한과 프론트엔드 접근 제어를 더 명확하게 만들고 싶다.

목표:
1. User 엔티티에 role 필드를 추가한다.
2. 기본 사용자는 USER, 관리자 계정은 ADMIN 역할을 갖게 한다.
3. AuthService에 requireAdmin(session) 메서드를 추가한다.
4. 관리자 API는 로그인 여부와 ADMIN 권한을 검사한다.
5. 프론트엔드에는 ProtectedRoute와 AdminRoute를 만든다.
6. /favorites는 로그인 사용자만 접근 가능하게 한다.
7. /admin은 ADMIN 사용자만 접근 가능하게 한다.
8. Header에서 관리자 계정에게만 Admin 링크가 보이게 한다.

주의:
- Spring Security는 추가하지 않는다.
- 기존 HttpSession 로그인 흐름은 유지한다.
- 권한이 없을 때는 401 또는 403을 명확히 반환한다.
- 프론트엔드에서는 접근 불가 안내 카드를 보여준다.
```

**AI 응답 요약:**  
`User.role` 컬럼 추가, `ProtectedRoute.jsx`, `AdminRoute.jsx` 생성.  
비로그인 → `/login` 리다이렉트, 일반 사용자 → 권한 없음 안내 카드 표시.

**평가 및 채택 여부:** 채택  
**후속 조치:** 실제로 admin/admin123 로그인 후 관리자 메뉴 표시, 일반 사용자 접근 차단 직접 확인.

---

#### 사례 3 — MLB 스트라이크존 차트 (제작/구현 단계)

**프롬프트:**
```
BASEBALL Phase 3D를 구현한다.
MLB feed/live의 pitchData를 이용해 스트라이크존 위에 투구 위치를 시각화한다.

사전 확인:
pitchData 검사 결과:
- totalPitches: 271
- pitchesWithCoordinates: 271
- plateX 존재 / plateZ 존재 / strikeZoneTop 존재 / strikeZoneBottom 존재

목표:
1. MLB 상세 페이지에 "존 차트" 탭을 추가한다.
2. SVG로 스트라이크존 박스를 그린다.
3. plateX, plateZ를 사용해 투구 위치를 점으로 표시한다.
4. 볼, 스트라이크, 인플레이를 서로 다른 스타일로 구분한다.
5. 투수, 타자, 이닝 필터를 제공한다.
6. 점 hover 시 tooltip을 표시한다.

백엔드: GET /api/matches/{matchId}/mlb-pitch-zone
프론트엔드: MlbStrikeZoneChart.jsx, SVG 사용 (x: plateX, y: plateZ)
pitch classification priority: inPlay > strike > ball
```

**AI 응답 요약:**  
`svgX(px)`, `svgY(pz)` 좌표 변환 함수, 필터 드롭다운, SVG 300×350 스트라이크존 렌더링 구현.  
필터 상태에 따라 `filteredPitches` 실시간 계산. hover tooltip 및 클릭 상세 패널 구현.

**평가 및 채택 여부:** 채택  
**후속 조치:** `MatchDetailPage`의 "존 차트" 탭에 연결. hot/cold zone은 구현 범위 제외로 확정.

---

#### 사례 4 — 버그 재현 및 수정 (시험/테스트 단계)

**프롬프트:**
```
관리자 로그인 후 /admin 페이지가 완전히 비어있음.
개발자 도구 콘솔에서 TypeError: Cannot read properties of undefined (reading 'map') 발생.
AdminDashboardPage.jsx에서 data.analysisCountByStatus.map() 호출하는데
백엔드 응답에 analysisCountByStatus 필드 자체가 없음.
AI 분析 기능이 미구현이라 필드가 없는 것. 방어 코드로 수정해줘.
```

**AI 응답 요약:**  
`data.analysisCountByStatus || []` 및 `data.totalAnalyses ?? '-'` 방어 코드 적용.  
미구현 필드가 있어도 페이지 정상 렌더링 가능하도록 처리.

**평가 및 채택 여부:** 채택  
**후속 조치:** 동일 패턴으로 `totalAnalyses`, `doneAnalyses`, `failedAnalyses` 필드도 선제 처리.

---

#### 사례 5 — UI 개선 반복 수정 (평가/개선 단계)

**탭 UI 전환 프롬프트:**
```
BASEBALL Phase 3C를 구현한다.
MLB 상세 페이지에 정보가 너무 세로로 길게 쌓이므로, 네이버 스포츠처럼 탭 UI로 정리한다.

탭 구성:
- 경기정보: 관심 팀, AI 분析, 팬 승부 예측
- 라인업: MlbLineupTable
- 기록: MlbBoxscoreTable
- 중계: MlbPlayByPlay
- 채팅: 기존 ChatBox

구현 방식:
- TabBar.jsx 생성
- MatchDetailPage에 activeTab 상태 추가
- MLB 경기에서만 탭 UI 적용

주의:
- 기존 AI 분析, 예측, 채팅 기능 제거하지 않음
- 비 MLB 경기 상세 페이지는 기존 레이아웃을 유지한다.
```

**AI 응답 요약:**  
`TabBar.jsx` 생성, `MatchDetailPage`에 `isMlb` 분기 로직 추가. MLB/비MLB 레이아웃 분리 구현.

**평가 및 채택 여부:** 채택  
**후속 조치:** 탭 구조 확인 후 "분석" 탭(`MlbAnalysisTab`) 추가 요청으로 이어짐.

---

## 3장. 프롬프트 엔지니어링 및 AI 협업 전략

### 3.1 프롬프트 전략의 진화

본 프로젝트에서 초기에는 단순한 명령 위주로 프롬프트를 작성하였으나, 개발이 진행될수록 **목표 → 제한조건 → 구현 파일 명세 → 검증 명령어**를 포함하는 구조화된 방식으로 발전하였다.

| 구분 | 프로젝트 초기 | 프로젝트 후기 |
|---|---|---|
| **구체성** | "MLB API 연동해줘" | gamePk 기반 externalId 구조, 중복 저장 방지 로직, 구현 파일 목록까지 명시 |
| **맥락 제공** | 없음 | 사전 pitchData 검사 결과, 기존 Entity 구조, 사용 중인 패턴 명시 |
| **제한조건 반영** | 없음 | "Spring Security 추가하지 않음", "외부 라이브러리 사용하지 않음", "전체 MLB JSON 반환하지 않음" 등 명시 |
| **검증 요청** | 없음 | 매 프롬프트 끝에 `npm run build` / `.\mvnw.cmd compile` 검증 명령어 포함 |
| **구현 범위 제외** | 없음 | "뉴스 기능은 아직 구현하지 않음", "hot/cold zone은 구현 범위 제외" 등 명시 |

**효과적이었던 패턴:**
- 매 프롬프트 끝에 검증 명령어를 포함하여 AI가 빌드 실패를 즉시 인지하고 수정하도록 유도
- 구현하지 않을 범위를 명시하여 불필요한 코드 생성 방지
- 사전에 MLB API 응답 필드를 직접 확인한 후 사용 가능한 필드만 프롬프트에 명시

**실패했던 패턴:**
- 시각적 요구사항을 텍스트로만 설명하여 레이아웃 수정을 4~5회 반복
- 여러 기능을 한 번에 요청하여 의도하지 않은 파일이 수정되는 부작용 발생

---

### 3.2 설계 단계별 프롬프트 기록

#### 3.2.1 목표/기준 설정 단계

**핵심 프롬프트:**
```
현재 스포츠 분석 웹사이트 프로젝트를 React + Spring Boot REST API 구조로 정리하려고 한다.

프로젝트 구조: Frontend(React + Vite), Backend(Spring Boot), DB(Oracle), AI(Gemini API), Auth(HttpSession)
기존 Thymeleaf 화면은 제거하고 React에서 화면을 담당하게 한다.

목표:
1. Spring Boot는 REST API 서버 역할만 하도록 정리한다.
2. Thymeleaf 의존성과 templates 기반 화면을 제거한다.
4. 기존 백엔드 Entity, Repository, Service 구조는 최대한 유지한다.
5. Spring Security는 추가하지 않고 기존 HttpSession 인증 방식을 유지한다.

주의: 기존 공통 기능을 깨뜨리지 말 것, 불필요한 구조 변경은 하지 말 것, git commit은 하지 말 것

검증:
cd frontend && npm run build
.\mvnw.cmd compile
```

**AI 응답 평가:** 채택  
단계별 전환 계획서가 논리적이었으며, 기존 Entity 재사용 원칙을 정확히 반영하였다.  
Phase 순서를 팀 일정에 맞게 일부 조정하였다.

**후속 조치:**  
`docs/REACT_REST_MIGRATION_PLAN.md`를 기반으로 Phase 1부터 단계별 구현 착수.

---

#### 3.2.2 분석/설계 단계

**핵심 프롬프트:**
```
현재 프로젝트에 로그인/회원가입은 구현되어 있지만,
관리자 권한과 프론트엔드 접근 제어를 더 명확하게 만들고 싶다.

목표:
1. User 엔티티에 role 필드를 추가한다.
2. 기본 사용자는 USER, 관리자 계정은 ADMIN 역할을 갖게 한다.
3. AuthService에 requireAdmin(session) 메서드를 추가한다.
5. 프론트엔드에는 ProtectedRoute와 AdminRoute를 만든다.
6. /favorites는 로그인 사용자만 접근 가능하게 한다.
7. /admin은 ADMIN 사용자만 접근 가능하게 한다.

주의:
- Spring Security는 추가하지 않는다.
- 기존 HttpSession 로그인 흐름은 유지한다.
- 권한이 없을 때는 401 또는 403을 명확히 반환한다.
```

**AI 응답 평가:** 채택  
`withCredentials: true` 기반 세션 쿠키 전달 구조가 정확히 구현되었다.  
role 필드를 DB 컬럼으로 추가하는 방식이 기존 Entity 구조를 유지하면서 적용되었다.

**후속 조치:**  
admin/admin123, 일반 사용자 계정으로 직접 접근 테스트 수행 후 이상 없음 확인.

---

#### 3.2.3 제작/구현 단계

**핵심 프롬프트 (MLB 일정 동기화):**
```
BASEBALL 브랜치에서 MLB 일정/결과 동기화 기능을 구현하려고 한다.

목표:
1. MLB Stats API에서 경기 일정과 결과를 가져온다.
2. MLB API 응답의 gamePk를 사용해 externalId를 만든다.
3. externalId = "MLB-" + gamePk 형태로 Match에 저장한다.
4. 이미 같은 externalId가 있으면 새로 생성하지 않고 기존 경기 정보를 업데이트한다.
5. 관리자 전용 수동 동기화 API를 만든다.

사용 API: https://statsapi.mlb.com/api/v1/schedule
엔드포인트: POST /api/admin/mlb/sync/schedule

주의: 관리자만 실행 가능, 기존 sample 데이터와 충돌하지 않게 nullable externalId 사용
```

**AI 응답 평가:** 채택  
`externalId` 기반 중복 방지 구조가 기존 `Match` Entity를 변경하지 않고 필드를 추가하는 방식으로 구현되었다.

**후속 조치:**  
수동 동기화만으로는 운영이 불편하다고 판단하여 자동 스케줄러 추가 요청(MLB 프롬프트 2)으로 이어짐.

---

#### 3.2.4 시험/테스트 단계

**핵심 프롬프트 (버그 재현 및 수정):**
```
관리자 로그인 후 /admin 페이지가 완전히 비어있음.
개발자 도구 콘솔에서
TypeError: Cannot read properties of undefined (reading 'map') 발생.

AdminDashboardPage.jsx에서 data.analysisCountByStatus.map() 호출하는데
백엔드 응답에 analysisCountByStatus 필드 자체가 없음.
AI 分析 기능이 미구현이라 필드가 없는 것.

data.analysisCountByStatus || [] 와 ?? '-' 방어 코드로 수정해줘.
```

**AI 응답 평가:** 채택  
`?? '-'`와 `|| []` 방어 코드 적용으로 미구현 필드가 있어도 페이지 정상 렌더링.  
콘솔 오류 완전히 제거되었고 관리자 대시보드 전체 카드 정상 표시 확인.

**후속 조치:**  
동일 패턴으로 `totalAnalyses`, `doneAnalyses`, `failedAnalyses` 필드도 선제 처리.  
AI 분析 기능 구현 시 백엔드 DTO에 해당 필드 추가 필요 사항으로 기록.

---

#### 3.2.5 평가/개선 단계

**핵심 프롬프트 (경기 목록 UX 개선):**
```
BASEBALL Phase 2B를 구현한다.
현재 MatchSections가 세로로 길게 표시되므로, KBO 사이트처럼 가로 캐러셀 형태로 개선한다.
또한 MLB 섹션에서는 KBO/sample 야구 경기가 섞이지 않도록 MLB만 표시한다.

목표:
1. 진행 중, 최근 종료, 다가오는 경기 섹션을 가로 캐러셀로 표시한다.
2. 좌우 화살표를 추가한다.
3. BASEBALL 필터 선택 시 상단 섹션은 leagueName=MLB만 표시한다.

주의:
- 외부 carousel 라이브러리 사용하지 않음
- CSS와 React ref 기반 scrollBy 사용
- 기존 전체 경기 목록은 유지
```

**AI 응답 평가:** 채택  
외부 라이브러리 없이 `scrollRef`와 `scrollBy`로 구현하여 번들 크기 증가 없음.  
`leagueName=MLB` 필터 파라미터가 정확히 작동하여 KBO 샘플 경기가 섹션에서 제외됨.

**후속 조치:**  
캐러셀 화살표 비활성화 조건(스크롤 끝 도달 시)을 `scroll` 이벤트 리스너로 추가 구현.

---

### 3.3 프롬프트 전후 비교 분석

| 구분 | 프로젝트 초기 프롬프트 | 프로젝트 후기 프롬프트 |
|---|---|---|
| **구체성** | "MLB API 가져와볼까?" | gamePk → externalId 구조, 중복 방지 조건, 구현 파일 5개 명시 |
| **맥락 제공** | 없음 | "기존 League, Team, Match 엔티티 존재", "작업 브랜치: BASEBALL", 사전 API 검사 결과 포함 |
| **제한조건 반영** | 없음 | "Spring Security 추가하지 않음", "외부 라이브러리 사용하지 않음", "전체 MLB JSON 반환하지 않음" |
| **검증 요청** | 없음 | 매 프롬프트 끝에 `npm run build` / `.\mvnw.cmd compile` 명시 |
| **구현 제외 범위** | 없음 | "뉴스 기능은 아직 구현하지 않음", "hot/cold zone은 구현 범위 제외" 명시 |

---

### 3.4 워크플로 설계

본 프로젝트에서 적용한 AI 협업 워크플로:

```
요구사항 정의 (팀원)
    ↓
MLB API 사전 검사 — 사용 가능한 필드 직접 확인 (팀원)
    ↓
구조화된 프롬프트 작성 (목표·제한조건·구현 범위·검증 명령어 포함)
    ↓
AI 코드 생성
    ↓
빌드 검증 (npm run build / .\mvnw.cmd compile)
    ↓
화면 직접 확인 — 경기 목록, 상세, 중계, 존 차트, 채팅 등 직접 테스트 (팀원)
    ↓
오류 발견 시 오류 메시지 + 재현 조건 제공 → AI 수정
    ↓
git 브랜치 커밋·푸시
```

**방어적 프롬프팅(Defensive Prompting) 사례:**  
매 프롬프트에 다음 제약 조건을 반복 명시하여 AI가 이전 문맥을 잊더라도 일관된 코드 생성 유지:
- "Spring Security는 추가하지 않는다"
- "기존 Entity, Repository, Service 구조는 최대한 유지한다"
- "외부 라이브러리 사용하지 않음"
- "git commit은 하지 않음"
- "기존 공통 기능을 깨뜨리지 말 것"

**AI 제안 채택/거부 사례:**
- **채택:** 자동 동기화 스케줄러 주기(매일 새벽 3시 + 5분마다)는 AI 제안 그대로 채택
- **거부:** AI가 처음 제안한 WebSocket 기반 실시간 채팅 → REST API 기반 폴링 방식으로 팀원이 변경 결정 (서버 자원 및 구현 복잡도 고려)

**컨텍스트 문서 활용:**  
`PROMPT_LOG.md`를 프로젝트 중반부터 유지하여 이전 단계의 결정 사항을 AI가 참조할 수 있도록 함.

---

## 부록 B 참고 — 전체 프롬프트 로그 위치

| 파일 | 내용 |
|---|---|
| `common_mlb_prompts_summary.txt` | 실제 사용한 공통 기능 5개·MLB 기능 8개 원본 프롬프트 전문 |
| `PROMPT_LOG.md` | 전체 21개 구현 단계 프롬프트 로그 (목적·기대결과·실제결과·채택여부) |
| `docs/COMMON_FEATURES_PROMPT_LOG.md` | 공통 기능 9개 항목 상세 기록 |
| `docs/BASEBALL_PROMPT_LOG.md` | MLB 전용 기능 9개 항목 상세 기록 |
