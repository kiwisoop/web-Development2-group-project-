import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRankings } from '../api/rankingApi';
import RankingTable from '../components/RankingTable';
import LoadingState from '../components/LoadingState';
import ErrorBox from '../components/ErrorBox';

const SPORT_TABS = [
  { key: 'soccer',   label: '축구',    apiKey: 'SOCCER' },
  { key: 'baseball', label: '야구',    apiKey: 'BASEBALL' },
  { key: 'esports',  label: 'e스포츠', apiKey: 'ESPORTS' },
];

export default function RankingsPage() {
  const { sportType } = useParams();
  const navigate = useNavigate();

  const current = SPORT_TABS.find((t) => t.key === sportType) || SPORT_TABS[0];

  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getRankings(current.apiKey, controller.signal)
      .then((res) => setRankings(res.data.data))
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        setError('랭킹을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [current.apiKey]);

  return (
    <div className="rankings-page">
      <h1 className="page-title">팀 순위</h1>
      <div className="ranking-tabs">
        {SPORT_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`btn${current.key === tab.key ? ' btn-primary' : ' btn-outline'}`}
            onClick={() => navigate(`/rankings/${tab.key}`)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {loading && <LoadingState />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        <RankingTable rankings={rankings} sportType={current.apiKey} />
      )}
    </div>
  );
}
