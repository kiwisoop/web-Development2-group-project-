import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getStandings } from '../api/soccerApi';
import RankingTable from '../components/RankingTable';
import LoadingState from '../components/LoadingState';
import ErrorBox from '../components/ErrorBox';

const SEASONS = ['2026', '2025'];
const DEFAULT_SEASON = '2026';

export default function SoccerStandingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const season = searchParams.get('season') || DEFAULT_SEASON;

  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getStandings(season, controller.signal)
      .then((res) => setStandings(res.data.data || []))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('순위표를 불러오지 못했습니다.');
        setStandings([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [season]);

  const handleSeason = (s) => {
    if (s === DEFAULT_SEASON) {
      setSearchParams({});
    } else {
      setSearchParams({ season: s });
    }
  };

  return (
    <div className="rankings-page">
      <h1 className="page-title">⚽ K리그 1 순위표</h1>

      <div className="ranking-tabs">
        {SEASONS.map((s) => (
          <button
            key={s}
            className={`btn${season === s ? ' btn-primary' : ' btn-outline'}`}
            onClick={() => handleSeason(s)}
          >
            {s} 시즌
          </button>
        ))}
      </div>

      {loading && <LoadingState />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        <RankingTable rankings={standings} sportType="SOCCER" />
      )}
    </div>
  );
}
