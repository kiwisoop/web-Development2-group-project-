import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMatchSections } from '../api/matchApi';
import { effectiveMatchStatus } from '../utils/matchStatus';
import { SOCCER_MOCK } from '../data/otherSportsMatches';
import './FeaturedMatches.css';

const STATUS_LABEL = {
  SCHEDULED: '예정',
  LIVE: '진행중',
  FINAL: '종료',
  PRE_GAME: '예정',
  CANCELED: '취소',
};

const STATUS_CLASS = {
  SCHEDULED: 'featured-status--scheduled',
  LIVE: 'featured-status--live',
  FINAL: 'featured-status--final',
  PRE_GAME: 'featured-status--scheduled',
  CANCELED: 'featured-status--final',
};

const SPORT_LABEL = { BASEBALL: '야구', SOCCER: '축구', ESPORTS: 'E스포츠' };
const SPORT_ORDER = ['BASEBALL', 'SOCCER', 'ESPORTS'];

const FORM_CLASS = {
  승: 'form-win',
  무: 'form-draw',
  패: 'form-loss',
};

function formatMatchTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d - now;
  const sameDay = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `오늘 ${timeStr}`;
  if (diffMs < 0) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `어제 ${timeStr}`;
  }
  return d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) + ' ' + timeStr;
}

// 야구 카드에서 백엔드 분석값(폼·평균 득실점·연승/연패)이 실제로 채워졌는지 판별한다.
// "최근 경기 데이터 부족"은 분석값이 없는 상태이므로 제외한다.
function hasBaseballAnalysis(m) {
  const hasForm = (m.homeRecentForm?.length > 0) || (m.awayRecentForm?.length > 0);
  const hasMetrics = m.keyMetrics?.length > 0;
  const hasPoint = !!m.mainAnalysisPoint && m.mainAnalysisPoint !== '최근 경기 데이터 부족';
  return hasForm || hasMetrics || hasPoint;
}

// 야구 카드 노출 우선순위:
// LIVE → 분석값 있는 SCHEDULED → 분석값 있는 FINAL → 나머지 SCHEDULED → 나머지 FINAL → 그 외
function baseballPriority(m) {
  if (m.status === 'LIVE') return 0;
  const analyzed = hasBaseballAnalysis(m);
  if (m.status === 'SCHEDULED') return analyzed ? 1 : 3;
  if (m.status === 'FINAL') return analyzed ? 2 : 4;
  return 5;
}

function FormRow({ teamName, results }) {
  return (
    <div className="form-row">
      <span className="form-team-name">{teamName}</span>
      <div className="form-badges">
        {results.map((r, i) => (
          <span key={i} className={`form-badge ${FORM_CLASS[r]}`}>
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function FeaturedMatches() {
  // 야구·E스포츠는 DB/API에서 가져온다. 축구는 기존 mock 표시 방식을 유지한다.
  const [baseballMatches, setBaseballMatches] = useState([]);
  const [esportsMatches, setEsportsMatches] = useState([]);
  const [indexes, setIndexes] = useState({ BASEBALL: 0, SOCCER: 0, ESPORTS: 0 });

  useEffect(() => {
    const controller = new AbortController();
    getMatchSections({}, controller.signal)
      .then(res => {
        const { liveMatches, recentFinishedMatches, upcomingMatches } = res.data;
        const all = [...liveMatches, ...recentFinishedMatches, ...upcomingMatches];

        const baseball = all.filter(m => m.sportType === 'BASEBALL');
        // 분석값이 채워진 경기가 먼저 보이도록 우선순위로 정렬한 뒤 최대 5경기만 노출한다.
        // (Array.prototype.sort는 안정 정렬이므로 동일 우선순위 내에서는 백엔드 정렬 순서를 유지한다.)
        const orderedBaseball = baseball
          .map((m, i) => ({ m, i }))
          .sort((a, b) => baseballPriority(a.m) - baseballPriority(b.m) || a.i - b.i)
          .map(x => x.m);
        setBaseballMatches(orderedBaseball.slice(0, 5));

        // E스포츠는 백엔드 섹션 분류 순서(live → recent → upcoming)를 그대로 유지한다.
        setEsportsMatches(all.filter(m => m.sportType === 'ESPORTS').slice(0, 5));
      })
      .catch(err => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      });
    return () => controller.abort();
  }, []);

  // 종목 순서·레이아웃은 기존과 동일하게 유지한다.
  // 야구·E스포츠는 API 데이터(없으면 빈 배열 → 안내 문구), 축구는 mock.
  const groups = SPORT_ORDER.map(k => ({
    sportKey: k,
    sportName: SPORT_LABEL[k],
    matches: k === 'BASEBALL' ? baseballMatches : k === 'ESPORTS' ? esportsMatches : SOCCER_MOCK,
  }));

  const prev = (sportKey, total) =>
    setIndexes(p => ({ ...p, [sportKey]: (p[sportKey] - 1 + total) % total }));
  const next = (sportKey, total) =>
    setIndexes(p => ({ ...p, [sportKey]: (p[sportKey] + 1) % total }));

  return (
    <section className="featured-matches">
      <div className="featured-head">
        <h2 className="section-title">오늘의 주요 경기</h2>
        <p className="featured-subtitle">야구, 축구, E스포츠의 주요 경기를 한눈에 확인하세요.</p>
      </div>

      <div className="featured-grid">
        {groups.map(({ sportKey, sportName, matches }) => {
          const total = matches.length;

          // 야구 API 데이터가 없을 때만 빈 상태로 안내한다. (mock인 축구·E스포츠는 항상 데이터가 있음)
          if (total === 0) {
            return (
              <article key={sportKey} className="featured-card featured-card--empty">
                <div className="featured-card-top">
                  <span className="featured-sport">{sportName}</span>
                </div>
                <p className="featured-empty">표시할 {sportName} 경기가 없습니다.</p>
              </article>
            );
          }

          const idx = indexes[sportKey] ?? 0;
          const m = matches[idx];
          const hasScores = m.homeScore !== null && m.homeScore !== undefined
            && m.awayScore !== null && m.awayScore !== undefined;
          const homeName = m.homeTeam?.teamName || '홈팀';
          const awayName = m.awayTeam?.teamName || '원정팀';
          const hasForm = m.homeRecentForm?.length > 0 || m.awayRecentForm?.length > 0;

          return (
            <article key={sportKey} className="featured-card">
              <div className="featured-card-top">
                <span className="featured-sport">{sportName}</span>
                <span className="featured-divider">·</span>
                <span className="featured-league">{m.league?.leagueName || ''}</span>
                {(() => {
                  const eff = effectiveMatchStatus(m);
                  return (
                    <span className={`featured-status ${STATUS_CLASS[eff] || 'featured-status--scheduled'}`}>
                      {STATUS_LABEL[eff] || eff}
                    </span>
                  );
                })()}
              </div>

              <div className="featured-teams">
                <span className="featured-team">{homeName}</span>
                {hasScores ? (
                  <span className="featured-score-pair">
                    <span className="featured-score">{m.homeScore}</span>
                    <span className="featured-vs">:</span>
                    <span className="featured-score">{m.awayScore}</span>
                  </span>
                ) : (
                  <span className="featured-vs">vs</span>
                )}
                <span className="featured-team">{awayName}</span>
              </div>

              <div className="featured-time">{formatMatchTime(m.matchDate)}</div>
              {m.venue && <div className="featured-venue">📍 {m.venue}</div>}

              {/* 리치 분석 블록: 백엔드가 해당 필드를 제공할 때만 렌더 (없으면 생략). */}
              {m.mainAnalysisPoint && (
                <div className="featured-analysis-point">{m.mainAnalysisPoint}</div>
              )}
              {m.aiInsight && <p className="featured-insight">{m.aiInsight}</p>}
              {!m.aiInsight && m.analysisSummary && (
                <p className="featured-insight">{m.analysisSummary}</p>
              )}
              {m.keyPoint && (
                <p className="featured-insight featured-insight--keypoint">{m.keyPoint}</p>
              )}
              {Array.isArray(m.keyPoints) && m.keyPoints.length > 0 && (
                <ul className="featured-metrics">
                  {m.keyPoints.map((point, i) => (
                    <li key={`kp-${i}`} className="featured-metric">{point}</li>
                  ))}
                </ul>
              )}
              {m.recentFormSummary && (
                <p className="featured-insight">{m.recentFormSummary}</p>
              )}

              {hasForm && (
                <div className="form-comparison">
                  <div className="form-comparison-title">최근 5경기</div>
                  {m.homeRecentForm?.length > 0 && (
                    <FormRow teamName={homeName} results={m.homeRecentForm} />
                  )}
                  {m.awayRecentForm?.length > 0 && (
                    <FormRow teamName={awayName} results={m.awayRecentForm} />
                  )}
                </div>
              )}

              {m.keyMetrics?.length > 0 && (
                <ul className="featured-metrics">
                  {m.keyMetrics.map((metric) => (
                    <li key={metric} className="featured-metric">{metric}</li>
                  ))}
                </ul>
              )}

              <div className="featured-card-meta">
                {m.analysisAvailable && (
                  <span className="featured-analysis-badge">분석 가능</span>
                )}
                <span className="match-counter">{idx + 1} / {total}</span>
              </div>

              <div className="featured-card-actions">
                <button type="button" className="match-nav-btn"
                  onClick={() => prev(sportKey, total)} aria-label={`이전 ${sportName} 경기`}>←</button>
                {/* mock 경기(축구·E스포츠)는 실제 상세 페이지가 없으므로 링크를 비활성화한다. */}
                {m.isMock ? (
                  <span className="featured-analysis-btn featured-analysis-btn--disabled" aria-disabled="true">경기 상세</span>
                ) : (
                  <Link to={`/matches/${m.id}`} className="featured-analysis-btn">경기 상세</Link>
                )}
                <button type="button" className="match-nav-btn"
                  onClick={() => next(sportKey, total)} aria-label={`다음 ${sportName} 경기`}>→</button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="featured-cta">
        <Link to="/matches" className="btn btn-outline featured-view-all">전체 경기 보기</Link>
      </div>
    </section>
  );
}
