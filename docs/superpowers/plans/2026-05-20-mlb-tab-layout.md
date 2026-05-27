# MLB Match Detail Tab Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MLB 경기 상세 페이지를 5개 탭(경기정보·라인업·기록·중계·채팅) 레이아웃으로 개편하고, 비-MLB 페이지는 완전히 그대로 유지한다.

**Architecture:** 순수 표현 컴포넌트 `TabBar.jsx`를 신규 생성하고, `MatchDetailPage.jsx`에 `activeTab` state를 추가해 MLB 분기에서 탭 레이아웃을 렌더링한다. `MlbDetailSection`은 더 이상 사용하지 않고 서브컴포넌트(`MlbLinescoreTable`, `MlbLineupTable`, `MlbBoxscoreTable`)를 직접 호출한다. CSS만 추가하며 기존 스타일 변경 없음.

**Tech Stack:** React 18, CSS custom properties, Vite

> ⚠️ git commit 금지

---

## File Map

| 작업 | 경로 |
|------|------|
| Create | `frontend/src/components/TabBar.jsx` |
| Modify | `frontend/src/pages/MatchDetailPage.jsx` |
| Modify | `frontend/src/styles/components.css` |

---

## Task 1: TabBar 컴포넌트

**Files:**
- Create: `frontend/src/components/TabBar.jsx`

- [ ] **Step 1: TabBar.jsx 생성**

파일: `frontend/src/components/TabBar.jsx`

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

## Task 2: MatchDetailPage — 탭 레이아웃 적용

**Files:**
- Modify: `frontend/src/pages/MatchDetailPage.jsx`

현재 파일은 275줄. import 섹션 수정 + state 1개 추가 + JSX return 전체 교체.

- [ ] **Step 1: import 수정**

파일 상단 import 블록을 아래로 교체한다 (기존 import를 이것으로 완전 대체):

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMatchDetailFull } from '../api/matchApi';
import { getFavoriteTeams, addFavoriteTeam, removeFavoriteTeam } from '../api/favoriteApi';
import { generateMatchAnalysis, regenerateMatchAnalysis } from '../api/analysisApi';
import { getPredictionResult, votePrediction } from '../api/predictionApi';
import { useAuth } from '../hooks/useAuth';
import Scoreboard from '../components/Scoreboard';
import StatCard from '../components/StatCard';
import TimelineItem from '../components/TimelineItem';
import MatchActionPanel from '../components/MatchActionPanel';
import AiAnalysisPreview from '../components/AiAnalysisPreview';
import PredictionPreview from '../components/PredictionPreview';
import ChatBox from '../components/ChatBox';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';
import { getMlbGameDetail } from '../api/mlbApi';
import MlbPlayByPlay from '../components/MlbPlayByPlay';
import TabBar from '../components/TabBar';
import MlbLinescoreTable from '../components/MlbLinescoreTable';
import MlbLineupTable from '../components/MlbLineupTable';
import MlbBoxscoreTable from '../components/MlbBoxscoreTable';
```

변경 내용: `MlbDetailSection` import 제거, `TabBar` / `MlbLinescoreTable` / `MlbLineupTable` / `MlbBoxscoreTable` import 추가.

- [ ] **Step 2: activeTab state 추가**

기존 state 선언부 (mlbDetail 관련 state 아래) 에 한 줄 추가:

```js
const [activeTab, setActiveTab] = useState('경기정보');
```

`const [mlbDetailError, setMlbDetailError] = useState(null);` 바로 다음 줄에 삽입.

- [ ] **Step 3: JSX return 전체 교체**

`const { match, stats, events } = data;` 이후 return문을 아래 코드로 완전 교체한다:

```jsx
  const { match, stats, events } = data;
  const showData = match.status === 'LIVE' || match.status === 'FINAL';
  const favoriteTeamIds = new Set(favoriteTeams.map((f) => f.teamId));
  const isMlb = match.sportType === 'BASEBALL' && match.league?.leagueName === 'MLB';
  const MLB_TABS = ['경기정보', '라인업', '기록', '중계', '채팅'];

  const chatDisabledReason =
    match.status === 'LIVE' ? null
    : match.status === 'FINAL' ? '경기 종료 후에는 채팅을 작성할 수 없습니다.'
    : match.status === 'CANCELED' ? '취소된 경기에서는 채팅을 작성할 수 없습니다.'
    : '경기 시작 전에는 채팅을 작성할 수 없습니다.';

  return (
    <div className="match-detail-page">
      <Link to="/matches" className="back-link">← 경기 목록으로</Link>

      <Scoreboard match={match} />

      {isMlb ? (
        <>
          <div className="card mlb-tab-summary">
            {mlbDetailLoading && (
              <div style={{ color: 'var(--color-text-muted)' }}>MLB 데이터 불러오는 중...</div>
            )}
            {mlbDetailError && (
              <div style={{ color: 'var(--color-error)' }}>{mlbDetailError}</div>
            )}
            {mlbDetail && (
              <>
                {(mlbDetail.homeProbablePitcher !== '-' || mlbDetail.awayProbablePitcher !== '-') && (
                  <div className="mlb-pitchers-row">
                    <div className="mlb-pitcher-item">
                      {mlbDetail.homeTeamLogoUrl && (
                        <img className="mlb-pitcher-logo" src={mlbDetail.homeTeamLogoUrl} alt={mlbDetail.homeTeamShortName} />
                      )}
                      <div>
                        <div className="mlb-pitcher-team">{mlbDetail.homeTeamShortName || mlbDetail.homeTeamName}</div>
                        <div className="mlb-pitcher-name">{mlbDetail.homeProbablePitcher}</div>
                      </div>
                    </div>
                    <div className="mlb-pitcher-vs">VS</div>
                    <div className="mlb-pitcher-item mlb-pitcher-item--away">
                      <div>
                        <div className="mlb-pitcher-team mlb-pitcher-team--right">{mlbDetail.awayTeamShortName || mlbDetail.awayTeamName}</div>
                        <div className="mlb-pitcher-name mlb-pitcher-name--right">{mlbDetail.awayProbablePitcher}</div>
                      </div>
                      {mlbDetail.awayTeamLogoUrl && (
                        <img className="mlb-pitcher-logo" src={mlbDetail.awayTeamLogoUrl} alt={mlbDetail.awayTeamShortName} />
                      )}
                    </div>
                  </div>
                )}
                {mlbDetail.linescore && (
                  <MlbLinescoreTable
                    linescore={mlbDetail.linescore}
                    homeShortName={mlbDetail.homeTeamShortName || mlbDetail.homeTeamName}
                    awayShortName={mlbDetail.awayTeamShortName || mlbDetail.awayTeamName}
                  />
                )}
              </>
            )}
          </div>

          <TabBar tabs={MLB_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="tab-panel">
            {activeTab === '경기정보' && (
              <>
                {match.status === 'SCHEDULED' && (
                  <div className="status-notice card">경기 시작 전입니다.</div>
                )}
                {match.status === 'CANCELED' && (
                  <div className="status-notice card">이 경기는 취소되었습니다.</div>
                )}
                <MatchActionPanel
                  match={match}
                  isLoggedIn={isLoggedIn}
                  favoriteTeamIds={favoriteTeamIds}
                  onToggleFavorite={handleToggleFavorite}
                  loadingTeamId={loadingTeamId}
                />
                {analysisError && <ErrorBox message={analysisError} />}
                <AiAnalysisPreview
                  matchStatus={match.status}
                  analysis={analysis}
                  onGenerate={handleGenerate}
                  onRegenerate={handleRegenerate}
                  generating={analysisGenerating}
                />
                <PredictionPreview
                  matchStatus={match.status}
                  prediction={prediction}
                  isLoggedIn={isLoggedIn}
                  onVote={handleVote}
                  voting={predictionVoting}
                />
              </>
            )}

            {activeTab === '라인업' && (
              <div className="card">
                <h3 className="detail-section-title">라인업</h3>
                {!mlbDetail ? (
                  <div style={{ color: 'var(--color-text-muted)', padding: '1rem' }}>MLB 데이터를 불러오는 중...</div>
                ) : (
                  <div className="mlb-lineup-grid">
                    <MlbLineupTable
                      lineup={mlbDetail.awayLineup}
                      title={mlbDetail.awayTeamShortName || mlbDetail.awayTeamName}
                    />
                    <MlbLineupTable
                      lineup={mlbDetail.homeLineup}
                      title={mlbDetail.homeTeamShortName || mlbDetail.homeTeamName}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === '기록' && (
              <div className="card">
                <h3 className="detail-section-title">박스스코어</h3>
                {!mlbDetail ? (
                  <div style={{ color: 'var(--color-text-muted)', padding: '1rem' }}>MLB 데이터를 불러오는 중...</div>
                ) : (
                  <MlbBoxscoreTable
                    homeBatters={mlbDetail.homeBatters}
                    awayBatters={mlbDetail.awayBatters}
                    homePitchers={mlbDetail.homePitchers}
                    awayPitchers={mlbDetail.awayPitchers}
                    homeTeamName={mlbDetail.homeTeamShortName || mlbDetail.homeTeamName}
                    awayTeamName={mlbDetail.awayTeamShortName || mlbDetail.awayTeamName}
                  />
                )}
              </div>
            )}

            {activeTab === '중계' && (
              <MlbPlayByPlay matchId={matchId} isLive={match.status === 'LIVE'} />
            )}

            {activeTab === '채팅' && (
              <div className="detail-section">
                <h2 className="detail-section-title">경기 채팅방</h2>
                <ChatBox
                  mode="match"
                  matchId={matchId}
                  isLoggedIn={isLoggedIn}
                  disabledReason={chatDisabledReason}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {match.status === 'SCHEDULED' && (
            <div className="status-notice card">경기 시작 전입니다.</div>
          )}
          {match.status === 'CANCELED' && (
            <div className="status-notice card">이 경기는 취소되었습니다.</div>
          )}

          <MatchActionPanel
            match={match}
            isLoggedIn={isLoggedIn}
            favoriteTeamIds={favoriteTeamIds}
            onToggleFavorite={handleToggleFavorite}
            loadingTeamId={loadingTeamId}
          />

          {analysisError && <ErrorBox message={analysisError} />}

          <AiAnalysisPreview
            matchStatus={match.status}
            analysis={analysis}
            onGenerate={handleGenerate}
            onRegenerate={handleRegenerate}
            generating={analysisGenerating}
          />

          <PredictionPreview
            matchStatus={match.status}
            prediction={prediction}
            isLoggedIn={isLoggedIn}
            onVote={handleVote}
            voting={predictionVoting}
          />

          {showData && stats && stats.length > 0 && (
            <div className="detail-section">
              <h2 className="detail-section-title">경기 통계</h2>
              <div className="stats-grid">
                {stats.map((stat) => (
                  <StatCard key={stat.id} stat={stat} />
                ))}
              </div>
            </div>
          )}

          {showData && events && events.length > 0 && (
            <div className="detail-section">
              <h2 className="detail-section-title">이벤트 타임라인</h2>
              <div className="timeline">
                {events.map((event) => (
                  <TimelineItem key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h2 className="detail-section-title">경기 채팅방</h2>
            <ChatBox
              mode="match"
              matchId={matchId}
              isLoggedIn={isLoggedIn}
              disabledReason={chatDisabledReason}
            />
          </div>
        </>
      )}
    </div>
  );
```

---

## Task 3: CSS 스타일 + 빌드 검증

**Files:**
- Modify: `frontend/src/styles/components.css`

- [ ] **Step 1: 탭 스타일 추가**

`frontend/src/styles/components.css` 맨 끝에 추가:

```css
/* MLB Tab Layout */
.mlb-tab-summary {
  padding: 1.25rem;
  margin-bottom: 0.25rem;
}

.tab-bar {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: 1rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.tab-bar::-webkit-scrollbar { display: none; }

.tab-btn {
  flex-shrink: 0;
  padding: 0.65rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -2px;
}

.tab-btn:hover { color: var(--color-primary); }

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-panel { min-height: 200px; }
```

- [ ] **Step 2: 프론트엔드 빌드 확인**

```powershell
cd E:\web3\web-sport-react-rebuild\frontend
npm run build
```

예상 출력:
```
✓ built in ...s
```

에러 발생 시 메시지를 확인하고 수정 후 재시도.

- [ ] **Step 3: 백엔드 컴파일 확인**

```powershell
cd E:\web3\web-sport-react-rebuild
.\mvnw.cmd compile
```

예상 출력:
```
[INFO] BUILD SUCCESS
```

---

## 수동 테스트 방법

1. `.\mvnw.cmd spring-boot:run`으로 서버 시작
2. MLB 경기 상세 페이지 접속
3. Scoreboard 아래 선발투수 + 라인스코어 요약 카드 확인
4. 5개 탭 버튼 확인 (경기정보 / 라인업 / 기록 / 중계 / 채팅)
5. 각 탭 클릭 시 해당 콘텐츠 표시 확인
6. 비-MLB 경기 상세 페이지에서 탭 미표시, 기존 레이아웃 유지 확인
7. 모바일 폭(375px)에서 탭 가로 스크롤 확인

---

## 의도적으로 변경하지 않은 것

- `MlbDetailSection.jsx` 파일 (수정 없음, import만 제거)
- 비-MLB 경기 레이아웃 (기존 그대로)
- 백엔드 코드 전체
- Hot/Cold Zone, 뉴스/기사
- git commit
