import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMatchSections } from '../api/matchApi';
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
  const [groups, setGroups] = useState([]);
  const [indexes, setIndexes] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    getMatchSections({}, controller.signal)
      .then(res => {
        const { liveMatches, recentFinishedMatches, upcomingMatches } = res.data;
        const all = [...liveMatches, ...recentFinishedMatches, ...upcomingMatches];

        const map = {};
        for (const m of all) {
          if (!map[m.sportType]) map[m.sportType] = [];
          if (map[m.sportType].length < 5) map[m.sportType].push(m);
        }

        const result = SPORT_ORDER
          .filter(k => map[k]?.length > 0)
          .map(k => ({ sportKey: k, sportName: SPORT_LABEL[k], matches: map[k] }));

        setGroups(result);
        const init = {};
        result.forEach(g => { init[g.sportKey] = 0; });
        setIndexes(init);
      })
      .catch(err => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      });
    return () => controller.abort();
  }, []);

  if (groups.length === 0) return null;

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
                <span className={`featured-status ${STATUS_CLASS[m.status] || 'featured-status--scheduled'}`}>
                  {STATUS_LABEL[m.status] || m.status}
                </span>
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

              {m.mainAnalysisPoint && (
                <div className="featured-analysis-point">{m.mainAnalysisPoint}</div>
              )}
              {m.aiInsight && <p className="featured-insight">{m.aiInsight}</p>}

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
                <Link to={`/matches/${m.id}`} className="featured-analysis-btn">경기 상세</Link>
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
