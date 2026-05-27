import { useState, useEffect, useRef, useCallback } from 'react';
import { getMatchSections } from '../api/matchApi';
import MatchCard from './MatchCard';
import LoadingState from './LoadingState';
import ErrorBox from './ErrorBox';

function CarouselRow({ title, matches, emptyTitle, emptyMessage }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [matches]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el || !el.firstChild) return;
    const gap = parseInt(getComputedStyle(el).gap) || 0;
    el.scrollBy({ left: dir * (el.firstChild.offsetWidth + gap), behavior: 'smooth' });
  };

  const renderEmpty = () => {
    if (emptyTitle || emptyMessage) {
      return (
        <div className="carousel-empty-card" role="status">
          {emptyTitle && <p className="carousel-empty-card-title">{emptyTitle}</p>}
          {emptyMessage && <p className="carousel-empty-card-sub">{emptyMessage}</p>}
        </div>
      );
    }
    return <p className="carousel-empty">경기 없음</p>;
  };

  return (
    <div className="match-section-block">
      <h3 className="match-section-block-title">{title}</h3>
      {matches.length === 0 ? (
        renderEmpty()
      ) : (
        <div className="match-carousel-wrap">
          <button
            className="match-carousel-arrow"
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            aria-label="이전"
          >◀</button>
          <div className="match-carousel" ref={scrollRef}>
            {matches.map(match => (
              <MatchCard key={match.id} match={match} compact />
            ))}
          </div>
          <button
            className="match-carousel-arrow"
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            aria-label="다음"
          >▶</button>
        </div>
      )}
    </div>
  );
}

export default function MatchSections({ sportType, leagueName }) {
  const [sections, setSections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = {};
    if (sportType) params.sportType = sportType;
    if (leagueName) params.leagueName = leagueName;
    getMatchSections(params, controller.signal)
      .then(res => setSections(res.data))
      .catch(err => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('경기 현황을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [sportType, leagueName]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorBox message={error} />;
  if (!sections) return null;

  return (
    <div>
      <CarouselRow
        title="진행 중인 경기"
        matches={sections.liveMatches}
        emptyTitle="현재 진행 중인 경기가 없어요"
        emptyMessage="최근 종료 경기와 다가오는 경기를 확인해보세요."
      />
      <CarouselRow title="최근 종료 경기" matches={sections.recentFinishedMatches} />
      <CarouselRow title="다가오는 경기" matches={sections.upcomingMatches} />
    </div>
  );
}
