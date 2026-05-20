# MLB Match Detail Tab Layout — Design Spec

**Date:** 2026-05-20
**Branch:** BASEBALL
**Phase:** 3C

---

## Goal

MLB 경기 상세 페이지의 세로로 긴 레이아웃을 네이버 스포츠 스타일 탭 레이아웃으로 개편한다. 비-MLB 페이지는 완전히 그대로 유지한다.

---

## Scope

**포함:**
- `TabBar.jsx` 신규 생성
- `MatchDetailPage.jsx` MLB 분기에 탭 적용
- `components.css` 탭 스타일 추가

**제외:**
- `MlbDetailSection.jsx` 수정 없음
- 비-MLB 페이지 변경 없음
- Hot/Cold Zone, 뉴스/기사
- git commit

---

## Architecture

**접근 방식: TabBar.jsx + MatchDetailPage activeTab 상태**

`TabBar.jsx`는 탭 버튼 목록만 렌더링하는 순수 표현 컴포넌트. `MatchDetailPage`에 `activeTab` state를 추가하고, MLB 경기일 때만 탭 레이아웃을 활성화한다. `MlbDetailSection`은 수정하지 않고 `mlbDetail` 데이터를 `MatchDetailPage`에서 직접 서브컴포넌트로 내려준다.

---

## Components

### TabBar.jsx (신규)

**위치:** `frontend/src/components/TabBar.jsx`

**Props:**
| prop | 타입 | 설명 |
|------|------|------|
| tabs | `string[]` | 탭 키 목록 (표시 레이블과 동일) |
| activeTab | `string` | 현재 활성 탭 키 |
| onTabChange | `(key: string) => void` | 탭 클릭 핸들러 |

**동작:** 탭 버튼 목록만 렌더링. 상태 없음. 패널 렌더링 없음.

```jsx
export default function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <button
          key={tab}
          className={`tab-btn${activeTab === tab ? ' active' : ''}`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
```

---

### MatchDetailPage.jsx (수정)

**추가 state:**
```js
const [activeTab, setActiveTab] = useState('경기정보');
```

**추가 import:**
```js
import TabBar from '../components/TabBar';
import MlbLinescoreTable from '../components/MlbLinescoreTable';
import MlbLineupTable from '../components/MlbLineupTable';
import MlbBoxscoreTable from '../components/MlbBoxscoreTable';
```

**MLB 탭 상수:**
```js
const MLB_TABS = ['경기정보', '라인업', '기록', '중계', '채팅'];
```

---

## MLB 경기 페이지 렌더 구조

```
<Scoreboard />                          ← 항상 표시 (변경 없음)

{isMlb && (
  <div className="card mlb-tab-summary">
    선발 투수 (homeProbablePitcher / awayProbablePitcher)
    <MlbLinescoreTable />
  </div>

  <TabBar tabs={MLB_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

  <div className="tab-panel">
    {activeTab === '경기정보' && (
      <MatchActionPanel />
      <AiAnalysisPreview />
      <PredictionPreview />
    )}
    {activeTab === '라인업' && (
      <MlbLineupTable home />
      <MlbLineupTable away />
    )}
    {activeTab === '기록' && (
      <MlbBoxscoreTable />
    )}
    {activeTab === '중계' && (
      <MlbPlayByPlay />
    )}
    {activeTab === '채팅' && (
      <ChatBox />
    )}
  </div>
)}

{!isMlb && (
  /* 기존 레이아웃 그대로 */
  <MatchActionPanel />
  <AiAnalysisPreview />
  <PredictionPreview />
  stats / events / ChatBox
)}
```

**`isMlb` 조건:**
```js
const isMlb = data.match.sportType === 'BASEBALL' && data.match.league?.leagueName === 'MLB';
```

---

## 탭별 콘텐츠 상세

### 경기정보 탭
- `MatchActionPanel` (팀 즐겨찾기, 기존 props 그대로)
- `AiAnalysisPreview` (기존 props 그대로)
- `PredictionPreview` (기존 props 그대로)
- SCHEDULED/CANCELED 상태 안내 문구

### 라인업 탭
- 원정팀 라인업: `<MlbLineupTable lineup={mlbDetail.awayLineup} title={awayShortName} />`
- 홈팀 라인업: `<MlbLineupTable lineup={mlbDetail.homeLineup} title={homeShortName} />`
- `mlbDetail`이 null이면 "데이터를 불러오는 중..." 표시

### 기록 탭
- `<MlbBoxscoreTable homeBatters homePitchers awayBatters awayPitchers homeTeamName awayTeamName />`
- `mlbDetail`이 null이면 로딩 표시

### 중계 탭
- `<MlbPlayByPlay matchId={matchId} isLive={match.status === 'LIVE'} />`

### 채팅 탭
- `<ChatBox mode="match" matchId={matchId} isLoggedIn={isLoggedIn} disabledReason={...} />`
- 기존 disabledReason 로직 그대로

---

## CSS

**추가 클래스 (components.css 끝에 추가):**

```css
/* Tab layout */
.mlb-tab-summary { ... }        /* 탭 위 요약 카드 */
.tab-bar { ... }                /* 탭 버튼 컨테이너, overflow-x: auto */
.tab-btn { ... }                /* 개별 탭 버튼 */
.tab-btn.active { ... }         /* 활성 탭, primary 색상 하단 border */
.tab-panel { ... }              /* 탭 콘텐츠 영역 */
```

**반응형:** 모바일에서 `tab-bar`는 `overflow-x: auto` + `white-space: nowrap`으로 가로 스크롤.

---

## 데이터 흐름

```
MatchDetailPage
├── mlbDetail (기존 useEffect fetch)
├── activeTab state (신규)
│
├── [항상] Scoreboard
├── [MLB] mlb-tab-summary
│     ├── 선발투수 (mlbDetail.home/awayProbablePitcher)
│     └── MlbLinescoreTable (mlbDetail.linescore)
├── [MLB] TabBar
└── [MLB] tab-panel
      ├── 경기정보: MatchActionPanel + AiAnalysisPreview + PredictionPreview
      ├── 라인업: MlbLineupTable ×2
      ├── 기록: MlbBoxscoreTable
      ├── 중계: MlbPlayByPlay
      └── 채팅: ChatBox
```

---

## 비-MLB 페이지 (변경 없음)

Scoreboard → MatchActionPanel → AiAnalysisPreview → PredictionPreview → stats → events → ChatBox

기존 코드 그대로, 조건 분기로 격리.

---

## 검증

```powershell
cd frontend; npm run build
cd ..; .\mvnw.cmd compile
```
