import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getMatches } from '../api/matchApi';
import TeamLogo from '../components/TeamLogo';

const PAGE_SIZE = 12;
const SPORT_FILTERS = [
  { key: 'all', label: '전체', apiValue: null },
  { key: 'BASEBALL', label: '야구', apiValue: 'BASEBALL' },
  { key: 'SOCCER', label: '축구', apiValue: 'SOCCER' },
  { key: 'ESPORTS', label: 'e스포츠', apiValue: 'ESPORTS' },
];

const STATUS_FILTERS = [
  { key: 'all', label: '전체', apiValue: null },
  { key: 'SCHEDULED', label: '예정', apiValue: 'SCHEDULED' },
  { key: 'LIVE', label: '진행중', apiValue: 'LIVE' },
  { key: 'FINAL', label: '종료', apiValue: 'FINAL' },
];

function toDateKey(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return toDateKey();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function moveDate(dateKey, amount) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function formatDateTitle(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatMatchTime(value) {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function teamName(team) {
  return team?.teamName || team?.shortName || team?.name || '팀 정보 준비 중';
}

function statusLabel(status) {
  if (status === 'LIVE') return '진행중';
  if (status === 'FINAL') return '종료';
  return '예정';
}

function statusClass(status) {
  if (status === 'LIVE') return 'live';
  if (status === 'FINAL') return 'end';
  return 'upc';
}

function hasScore(match) {
  return match?.status === 'LIVE' || match?.status === 'FINAL';
}

function readPage(data) {
  return {
    content: Array.isArray(data?.content) ? data.content : [],
    page: Number(data?.page ?? 0),
    totalPages: Math.max(1, Number(data?.totalPages ?? 1)),
    totalElements: Number(data?.totalElements ?? 0),
    hasNext: Boolean(data?.hasNext),
    hasPrevious: Boolean(data?.hasPrevious),
  };
}

function setParam(next, key, value) {
  if (!value || value === 'all') next.delete(key);
  else next.set(key, value);
}

export default function MatchListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageData, setPageData] = useState(() => readPage(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const selectedSport = searchParams.get('sportType') || 'BASEBALL';
  const selectedStatus = searchParams.get('status') || 'all';
  const selectedDate = searchParams.get('date') || toDateKey();
  const page = Math.max(0, Number(searchParams.get('page') || 0));

  const sportLabel = SPORT_FILTERS.find((item) => item.key === selectedSport)?.label || '전체';
  const statusText = STATUS_FILTERS.find((item) => item.key === selectedStatus)?.label || '전체';

  const queryParams = useMemo(() => {
    const selectedSportOption = SPORT_FILTERS.find((item) => item.key === selectedSport);
    const selectedStatusOption = STATUS_FILTERS.find((item) => item.key === selectedStatus);
    return {
      sportType: selectedSportOption?.apiValue || undefined,
      status: selectedStatusOption?.apiValue || undefined,
      date: selectedDate,
      page,
      size: PAGE_SIZE,
      sort: selectedStatus === 'FINAL' ? 'latest' : 'oldest',
    };
  }, [page, selectedDate, selectedSport, selectedStatus]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getMatches(queryParams, controller.signal)
      .then((response) => {
        setPageData(readPage(response.data));
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        setPageData(readPage(null));
        setError('경기 일정을 가져오지 못했습니다. 잠시 후 다시 확인해 주세요.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [queryParams]);

  const updateFilters = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => setParam(next, key, value));
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const updatePage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 0) next.delete('page');
    else next.set('page', String(nextPage));
    setSearchParams(next, { replace: true });
  };

  const resetToBaseballToday = () => {
    setSearchParams({ sportType: 'BASEBALL', date: toDateKey() }, { replace: true });
  };

  return (
    <div className="match-list-page">
      <header className="sl-page-head">
        <div>
          <h1 className="sl-page-title">경기 일정</h1>
          <p className="sl-page-sub">
            {formatDateTitle(selectedDate)} · {sportLabel} · {statusText}
          </p>
        </div>
        <div className="sl-date-range">
          <button type="button" onClick={() => updateFilters({ date: moveDate(selectedDate, -1) })}>
            이전
          </button>
          <label>
            <span>날짜</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => updateFilters({ date: event.target.value })}
            />
          </label>
          <button type="button" onClick={() => updateFilters({ date: toDateKey() })}>
            오늘
          </button>
          <button type="button" onClick={() => updateFilters({ date: moveDate(selectedDate, 1) })}>
            다음
          </button>
        </div>
      </header>

      <section className="sl-card">
        <div className="sl-filter-row">
          <span className="sl-filter-label">종목</span>
          {SPORT_FILTERS.map((option) => (
            <button
              type="button"
              key={option.key}
              className={`sl-chip ${selectedSport === option.key ? 'active' : ''}`}
              onClick={() => updateFilters({ sportType: option.key })}
            >
              {option.label}
            </button>
          ))}

          <span className="sl-filter-divider" />
          <span className="sl-filter-label">상태</span>
          {STATUS_FILTERS.map((option) => (
            <button
              type="button"
              key={option.key}
              className={`sl-chip ${selectedStatus === option.key ? 'active' : ''}`}
              onClick={() => updateFilters({ status: option.key })}
            >
              {option.label}
            </button>
          ))}

          <span className="sl-filter-count">총 {pageData.totalElements.toLocaleString('ko-KR')}경기</span>
        </div>

        {loading ? (
          <div className="sl-empty" style={{ padding: 60 }}>일정을 확인하고 있습니다.</div>
        ) : error ? (
          <div className="sl-empty" style={{ padding: 60, color: '#ff8aa3' }}>{error}</div>
        ) : pageData.content.length === 0 ? (
          <div className="sl-empty" style={{ padding: 60 }}>
            <h4 style={{ fontSize: 15, color: 'var(--color-text)', marginBottom: 6 }}>
              표시할 경기가 없습니다
            </h4>
            <p style={{ marginBottom: 18 }}>
              날짜나 필터를 바꾸면 다른 경기 일정을 확인할 수 있습니다.
            </p>
            <button className="btn btn-primary" type="button" onClick={resetToBaseballToday}>
              오늘 야구 일정 보기
            </button>
          </div>
        ) : (
          pageData.content.map((match) => (
            <Link
              key={match.externalId || `${match.sportType}-${match.id}`}
              to={`/matches/${match.id}`}
              className={`sl-match-row ${match.status === 'LIVE' ? 'live' : ''}`}
            >
              <div className="sl-match-time">
                <b>{formatMatchTime(match.matchDate)}</b>
                <span className={`sl-status-badge ${statusClass(match.status)}`}>
                  {statusLabel(match.status)}
                </span>
              </div>

              <div className="sl-mini-team">
                <TeamLogo team={match.homeTeam} size={38} />
                <div>
                  <div className="name">{teamName(match.homeTeam)}</div>
                  <div className="sub">{match.venue || match.league?.leagueName || ''}</div>
                </div>
              </div>

              {hasScore(match) ? (
                <div className="sl-match-score">
                  <b>{match.homeScore ?? 0}</b>
                  <span>:</span>
                  <b>{match.awayScore ?? 0}</b>
                </div>
              ) : (
                <div className="sl-match-score upcoming">VS</div>
              )}

              <div className="sl-mini-team away">
                <TeamLogo team={match.awayTeam} size={38} />
                <div>
                  <div className="name">{teamName(match.awayTeam)}</div>
                  <div className="sub">{match.league?.leagueName || match.sportType || ''}</div>
                </div>
              </div>

              <div className="sl-match-action">
                <span className="sl-detail-link">자세히 보기</span>
              </div>
            </Link>
          ))
        )}
      </section>

      {pageData.totalPages > 1 && (
        <nav className="sl-pagination" aria-label="경기 일정 페이지">
          <button
            type="button"
            className="sl-pg-btn"
            disabled={!pageData.hasPrevious}
            onClick={() => updatePage(page - 1)}
          >
            이전
          </button>
          <span className="sl-pg-btn active">
            {pageData.page + 1} / {pageData.totalPages}
          </span>
          <button
            type="button"
            className="sl-pg-btn"
            disabled={!pageData.hasNext}
            onClick={() => updatePage(page + 1)}
          >
            다음
          </button>
        </nav>
      )}
    </div>
  );
}
