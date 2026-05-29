import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMatchSections } from '../api/matchApi';
import { effectiveMatchStatus } from '../utils/matchStatus';
import { SOCCER_MOCK } from '../data/otherSportsMatches';
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
  // 야구·E스포츠는 DB/API에서 가져오고, 축구만 mock 으로 표시한다.
  const [apiMatches, setApiMatches] = useState([]);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    getMatchSections({}, controller.signal)
      .then(res => {
        const { liveMatches, recentFinishedMatches, upcomingMatches } = res.data;
        const all = [...liveMatches, ...recentFinishedMatches, ...upcomingMatches];
        // 야구·E스포츠만 실제 API 데이터를 사용하고, 축구는 mock 으로 둔다.
        setApiMatches(all.filter(m => m.sportType === 'BASEBALL' || m.sportType === 'ESPORTS'));
      })
      .catch(err => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      });
    return () => controller.abort();
  }, []);

  const matches = [...apiMatches, ...SOCCER_MOCK];

  const getStep = (el) => {
    const firstCard = el.querySelector('.ticker-card');
    return firstCard ? firstCard.getBoundingClientRect().width + 1 : 240;
  };

  const handleScrollRight = () => {
    const el = scrollRef.current;
    if (!el) return;
    const step = getStep(el);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const nextLeft = el.scrollLeft + step >= maxScroll - 4 ? 0 : el.scrollLeft + step;
    el.scrollTo({ left: nextLeft, behavior: 'smooth' });
  };

  const handleScrollLeft = () => {
    const el = scrollRef.current;
    if (!el) return;
    const step = getStep(el);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const nextLeft = el.scrollLeft <= 4 ? maxScroll : Math.max(0, el.scrollLeft - step);
    el.scrollTo({ left: nextLeft, behavior: 'smooth' });
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

          const goToDetail = () => {
            // mock 경기(축구·E스포츠)는 실제 상세 페이지가 없으므로 이동을 막는다.
            if (m.isMock) return;
            navigate(`/matches/${m.id}`);
          };

          const effStatus = effectiveMatchStatus(m);
          return (
            <article
              key={m.id}
              className="ticker-card"
              role="button"
              tabIndex={0}
              onClick={goToDetail}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  goToDetail();
                }
              }}
            >
              <div className="ticker-card-top">
                <span className={`ticker-status ${STATUS_CLASS[effStatus] || 'ticker-status--scheduled'}`}>
                  {STATUS_LABEL[effStatus] || effStatus}
                </span>
                <span className="ticker-league">
                  {SPORT_LABEL[m.sportType]} · {m.league?.leagueName || ''}
                </span>
              </div>

              <div className="ticker-team-row">
                <span className="ticker-team-name">{m.awayTeam?.teamName || '원정팀'}</span>
                <span
                  className={`ticker-team-score${awayLost ? ' ticker-team-score--lost' : ''}`}
                >
                  {hasScores ? m.awayScore : '-'}
                </span>
              </div>

              <div className="ticker-team-row">
                <span className="ticker-team-name">
                  {m.homeTeam?.teamName || '홈팀'}
                  <span className="ticker-home-badge">홈</span>
                </span>
                <span
                  className={`ticker-team-score${homeLost ? ' ticker-team-score--lost' : ''}`}
                >
                  {hasScores ? m.homeScore : '-'}
                </span>
              </div>

              {effStatus === 'SCHEDULED' && m.matchDate && (
                <div className="ticker-scheduled-time">{formatTime(m.matchDate)}</div>
              )}
            </article>
          );
        })}
      </div>

      <button
        type="button"
        className="ticker-arrow ticker-arrow--left"
        onClick={handleScrollLeft}
        aria-label="이전 경기 보기"
      >
        ←
      </button>

      <button
        type="button"
        className="ticker-arrow ticker-arrow--right"
        onClick={handleScrollRight}
        aria-label="다음 경기 보기"
      >
        →
      </button>
    </section>
  );
}
