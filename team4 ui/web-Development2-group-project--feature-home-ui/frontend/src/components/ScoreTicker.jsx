import { useRef } from 'react';
import './ScoreTicker.css';

const STATUS_LABEL = {
  FINAL: '종료',
  LIVE: '진행중',
  SCHEDULED: '예정',
};

const STATUS_CLASS = {
  FINAL: 'ticker-status--final',
  LIVE: 'ticker-status--live',
  SCHEDULED: 'ticker-status--scheduled',
};

const SPORT_LABEL = {
  baseball: '야구',
  soccer: '축구',
  esports: 'E스포츠',
};

const matches = [
  {
    id: 1,
    sport: 'baseball',
    league: 'KBO',
    status: 'FINAL',
    awayTeam: 'LG 트윈스',
    homeTeam: '두산 베어스',
    awayScore: 5,
    homeScore: 3,
  },
  {
    id: 2,
    sport: 'baseball',
    league: 'MLB',
    status: 'FINAL',
    awayTeam: 'LA 다저스',
    homeTeam: '샌디에이고 파드리스',
    awayScore: 4,
    homeScore: 2,
  },
  {
    id: 3,
    sport: 'soccer',
    league: 'EPL',
    status: 'FINAL',
    awayTeam: '토트넘',
    homeTeam: '아스널',
    awayScore: 2,
    homeScore: 2,
  },
  {
    id: 4,
    sport: 'soccer',
    league: 'La Liga',
    status: 'FINAL',
    awayTeam: '바르셀로나',
    homeTeam: '레알 마드리드',
    awayScore: 3,
    homeScore: 1,
  },
  {
    id: 5,
    sport: 'esports',
    league: 'LCK',
    status: 'FINAL',
    awayTeam: 'T1',
    homeTeam: 'Gen.G',
    awayScore: 2,
    homeScore: 1,
  },
  {
    id: 6,
    sport: 'esports',
    league: 'Worlds',
    status: 'SCHEDULED',
    awayTeam: 'Hanwha Life Esports',
    homeTeam: 'G2 Esports',
    scheduledTime: '19:00',
  },
];

export default function ScoreTicker() {
  const scrollRef = useRef(null);

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

  return (
    <section className="score-ticker">
      <div className="ticker-track" ref={scrollRef}>
        {matches.map((m) => {
          const hasScores = m.status !== 'SCHEDULED';
          const awayLost = hasScores && m.awayScore < m.homeScore;
          const homeLost = hasScores && m.homeScore < m.awayScore;

          return (
            <article key={m.id} className="ticker-card">
              <div className="ticker-card-top">
                <span className={`ticker-status ${STATUS_CLASS[m.status]}`}>
                  {STATUS_LABEL[m.status]}
                </span>
                <span className="ticker-league">
                  {SPORT_LABEL[m.sport]} · {m.league}
                </span>
              </div>

              <div className="ticker-team-row">
                <span className="ticker-team-name">{m.awayTeam}</span>
                <span
                  className={`ticker-team-score${awayLost ? ' ticker-team-score--lost' : ''}`}
                >
                  {hasScores ? m.awayScore : '-'}
                </span>
              </div>

              <div className="ticker-team-row">
                <span className="ticker-team-name">
                  {m.homeTeam}
                  <span className="ticker-home-badge">홈</span>
                </span>
                <span
                  className={`ticker-team-score${homeLost ? ' ticker-team-score--lost' : ''}`}
                >
                  {hasScores ? m.homeScore : '-'}
                </span>
              </div>

              {m.status === 'SCHEDULED' && (
                <div className="ticker-scheduled-time">{m.scheduledTime}</div>
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
