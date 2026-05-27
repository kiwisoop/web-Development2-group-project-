import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMatchSections } from '../api/matchApi';
import { SOCCER_MOCK, ESPORTS_MOCK } from '../data/otherSportsMatches';
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
  // 야구(BASEBALL)는 DB/API에서 가져오고, 축구·E스포츠는 mock을 fallback으로 표시한다.
  const [baseballMatches, setBaseballMatches] = useState([]);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    getMatchSections({ sportType: 'BASEBALL' }, controller.signal)
      .then(res => {
        const { liveMatches, recentFinishedMatches, upcomingMatches } = res.data;
        const all = [...liveMatches, ...recentFinishedMatches, ...upcomingMatches];
        // 응답에 다른 종목이 섞여 오더라도 야구만 사용한다.
        setBaseballMatches(all.filter(m => m.sportType === 'BASEBALL'));
      })
      .catch(err => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      });
    return () => controller.abort();
  }, []);

  // 야구는 API 데이터(라이브 우선), 그 외 종목은 mock fallback.
  const matches = [...baseballMatches, ...SOCCER_MOCK, ...ESPORTS_MOCK];

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
                <span className={`ticker-status ${STATUS_CLASS[m.status] || 'ticker-status--scheduled'}`}>
                  {STATUS_LABEL[m.status] || m.status}
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

              {m.status === 'SCHEDULED' && m.matchDate && (
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
