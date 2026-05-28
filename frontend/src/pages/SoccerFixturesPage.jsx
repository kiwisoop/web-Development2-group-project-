import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFixtures } from '../api/soccerApi';
import MatchCard from '../components/MatchCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorBox from '../components/ErrorBox';

const DEFAULT_SEASON = '2026';

function paramsToFilters(searchParams) {
  return {
    season: searchParams.get('season') || DEFAULT_SEASON,
    status: searchParams.get('status') || '',
    keyword: searchParams.get('keyword') || '',
    sort: searchParams.get('sort') || 'latest',
    page: parseInt(searchParams.get('page') || '0', 10),
    size: parseInt(searchParams.get('size') || '20', 10),
  };
}

function filtersToUrlParams(filters) {
  const obj = {};
  if (filters.season && filters.season !== DEFAULT_SEASON) obj.season = filters.season;
  if (filters.status) obj.status = filters.status;
  if (filters.keyword) obj.keyword = filters.keyword;
  if (filters.sort && filters.sort !== 'latest') obj.sort = filters.sort;
  if (filters.page > 0) obj.page = filters.page;
  if (filters.size && filters.size !== 20) obj.size = filters.size;
  return obj;
}

function filtersToApiParams(filters) {
  const obj = { season: filters.season, sort: filters.sort, page: filters.page, size: filters.size };
  if (filters.status) obj.status = filters.status;
  if (filters.keyword) obj.keyword = filters.keyword;
  return obj;
}

export default function SoccerFixturesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState(() => paramsToFilters(searchParams));
  const [fixtures, setFixtures] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const filters = paramsToFilters(searchParams);
    setForm(filters);

    setLoading(true);
    setError(null);
    getFixtures(filtersToApiParams(filters), controller.signal)
      .then((res) => {
        const page = res.data.data;
        setFixtures(page.content || []);
        setPagination({
          page: page.page,
          size: page.size,
          totalElements: page.totalElements,
          totalPages: page.totalPages,
          hasNext: page.hasNext,
          hasPrevious: page.hasPrevious,
        });
      })
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('K리그 경기 목록을 불러오지 못했습니다.');
        setFixtures([]);
        setPagination(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [searchParams]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(filtersToUrlParams({ ...form, page: 0 }));
  };

  const handleReset = () => {
    setForm({ season: DEFAULT_SEASON, status: '', keyword: '', sort: 'latest', page: 0, size: 20 });
    setSearchParams({});
  };

  const handlePage = (newPage) => {
    const current = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...current, page: newPage });
  };

  const currentPage = pagination?.page ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <div className="match-list-page">
      <div className="page-head">
        <h1 className="page-title">⚽ K리그 경기</h1>
        <p className="page-desc">시즌·상태·키워드로 K리그 1 경기를 찾아보세요.</p>
      </div>

      <form className="filter-bar card" onSubmit={handleSearch}>
        <div className="filter-group">
          <label>시즌</label>
          <select name="season" value={form.season} onChange={handleChange}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>

        <div className="filter-group">
          <label>상태</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="">전체</option>
            <option value="NS">예정</option>
            <option value="FT">종료</option>
          </select>
        </div>

        <div className="filter-group">
          <label>키워드</label>
          <input
            name="keyword"
            type="text"
            value={form.keyword}
            onChange={handleChange}
            placeholder="팀명, 구장명..."
          />
        </div>

        <div className="filter-group">
          <label>정렬</label>
          <select name="sort" value={form.sort} onChange={handleChange}>
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </div>

        <div className="filter-actions">
          <button type="submit" className="btn btn-primary">검색</button>
          <button type="button" className="btn btn-outline" onClick={handleReset}>초기화</button>
        </div>
      </form>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <LoadingState />
      ) : fixtures.length === 0 ? (
        <EmptyState title="경기가 없습니다" description="다른 조건으로 검색해 보세요." />
      ) : (
        <>
          <div className="match-grid">
            {fixtures.map((f) => (
              <MatchCard key={f.id} match={f} detailPath={`/soccer/fixtures/${f.id}`} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={!pagination?.hasPrevious}
                onClick={() => handlePage(currentPage - 1)}
              >
                이전
              </button>
              <span className="page-info">{currentPage + 1} / {totalPages}</span>
              <button
                className="btn btn-outline"
                disabled={!pagination?.hasNext}
                onClick={() => handlePage(currentPage + 1)}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
