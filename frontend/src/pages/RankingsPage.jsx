import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getRankings } from '../api/rankingApi';
import { getStandings } from '../api/soccerApi';
import RankingTable from '../components/RankingTable';
import LoadingState from '../components/LoadingState';
import ErrorBox from '../components/ErrorBox';

const SPORT_TABS = [
  { key: 'soccer', label: '축구', apiKey: 'SOCCER', title: 'K리그 1 순위표' },
  { key: 'baseball', label: '야구', apiKey: 'BASEBALL', title: 'MLB 팀 순위' },
  { key: 'esports', label: 'e스포츠', apiKey: 'ESPORTS', title: 'LCK 팀 순위' },
];

const SEASONS = ['2026', '2025'];
const DEFAULT_SEASON = '2026';

function extractList(response) {
  const data = response?.data?.data || response?.data || [];
  return Array.isArray(data) ? data : [];
}

export default function RankingsPage() {
  const { sportType } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const current = useMemo(
    () => SPORT_TABS.find((tab) => tab.key === sportType) || SPORT_TABS[0],
    [sportType],
  );
  const season = searchParams.get('season') || DEFAULT_SEASON;

  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const request = current.apiKey === 'SOCCER'
      ? getStandings(season, controller.signal)
      : getRankings(current.apiKey, undefined, controller.signal);

    request
      .then((res) => setRankings(extractList(res)))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('순위표를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [current.apiKey, season]);

  const handleSport = (tab) => {
    setSearchParams({});
    navigate(`/rankings/${tab.key}`);
  };

  const handleSeason = (nextSeason) => {
    if (nextSeason === DEFAULT_SEASON) setSearchParams({});
    else setSearchParams({ season: nextSeason });
  };

  return (
    <div className="rankings-page">
      <h1 className="page-title">{current.title}</h1>

      <div className="ranking-tabs">
        {SPORT_TABS.map((tab) => (
          <button
            type="button"
            key={tab.key}
            className={`btn${current.key === tab.key ? ' btn-primary' : ' btn-outline'}`}
            onClick={() => handleSport(tab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {current.apiKey === 'SOCCER' && (
        <div className="ranking-tabs" style={{ marginTop: 12 }}>
          {SEASONS.map((item) => (
            <button
              type="button"
              key={item}
              className={`btn${season === item ? ' btn-primary' : ' btn-outline'}`}
              onClick={() => handleSeason(item)}
            >
              {item} 시즌
            </button>
          ))}
        </div>
      )}

      {loading && <LoadingState />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && <RankingTable rankings={rankings} sportType={current.apiKey} />}
    </div>
  );
}
