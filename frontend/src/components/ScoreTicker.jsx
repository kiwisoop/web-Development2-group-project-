import { useState, useEffect, useRef } from 'react';
import { getMatchSections } from '../api/matchApi';
import './ScoreTicker.css';

const STATUS_LABEL = {
  FINAL: '종료',
  LIVE: '진행중',
  SCHEDULED: '예정',
  PRE_GAME: '예정',
  CANCELED: '취소',
};

const STATUS_CLASS = {
  FINAL: 'ticker-status--final',
  LIVE: 'ticker-status--live',
  SCHEDULED: 'ticker-status--scheduled',
  PRE_GAME: 'ticker-status--scheduled',
  CANCELED: 'ticker-status--final',
};

const SPORT_LABEL = {
  BASEBALL: '야구',
  SOCCER: '축구',
  ESPORTS: 'E스포츠',
};

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function ScoreTicker() {
  const [matches, setMatches] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    getMatchSections({}, controller.signal)
      .then(res => {
        const { liveMatches, recentFinishedMatches, upcomingMatches } = res.data;
        setMatches([...liveMatches, ...recentFinishedMatches, ...upcomingMatches]);
      })
      .catch(err => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      });
    return () => controller.abort();
  }, []);

  const getStep = (el) => {
    const first = el.querySelector('.ticker-card');
    return first ? first.getBoundingClientRect().width + 1 : 240;
  };

  const scrollRight = () => {
    const el = scrollRef.current;
    if (!el) return;
    const step = getStep(el);
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: el.scrollLeft + step >= max - 4 ? 0 : el.scrollLeft + step, behavior: 'smooth' });
  };

  const scrollLeft = () => {
    const el = scrollRef.current;
    if (!el) return;
    const step = getStep(el);
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: el.scrollLeft <= 4 ? max : Math.max(0, el.scrollLeft - step), behavior: 'smooth' });
  };

  if (matches.length === 0) return null;

  return (
    <section className="score-ticker">
      <div className="ticker-track" ref={scrollRef}>
        {matches.map((m) => {
          const hasScores = m.homeScore !== null && m.homeScore !== undefined
            && m.awayScore !== null && m.awayScore !== undefined;
          const awayLost = hasScores && m.awayScore < m.homeScore;
          const homeLost = hasScores && m.homeScore < m.awayScore;

          return (
            <article key={m.id} className="ticker-card">
              <div className="ticker-card-top">
                <span className={`ticker-status ${STATUS_CLASS[m.status] || 'ticker-status--scheduled'}`}>
                  {STATUS_LABEL[m.status] || m.status}
                </span>
                <span className="ticker-league">
                  {SPORT_LABEL[m.sportType]} · {m.league?.leagueName || ''}
                </span>
              </div>

              <div className="ticker-team-row">
                <span className="ticker-team-name">{m.awayTeam?.teamName || '원정팀'}</span>
                <span className={`ticker-team-score${awayLost ? ' ticker-team-score--lost' : ''}`}>
                  {hasScores ? m.awayScore : '-'}
                </span>
              </div>

              <div className="ticker-team-row">
                <span className="ticker-team-name">
                  {m.homeTeam?.teamName || '홈팀'}
                  <span className="ticker-home-badge">홈</span>
                </span>
                <span className={`ticker-team-score${homeLost ? ' ticker-team-score--lost' : ''}`}>
                  {hasScores ? m.homeScore : '-'}
                </span>
              </div>

              {m.status === 'SCHEDULED' && m.matchDate && (
                <div className="ticker-scheduled-time">{formatTime(m.matchDate)}</div>
              )}
            </article>
          );
        })}
      </div>

      <button type="button" className="ticker-arrow ticker-arrow--left" onClick={scrollLeft} aria-label="이전 경기 보기">←</button>
      <button type="button" className="ticker-arrow ticker-arrow--right" onClick={scrollRight} aria-label="다음 경기 보기">→</button>
    </section>
  );
}
