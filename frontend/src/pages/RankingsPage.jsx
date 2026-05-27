import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRankings } from '../api/rankingApi';
import RankingTable from '../components/RankingTable';
import MlbStandings from '../components/MlbStandings';
import LoadingState from '../components/LoadingState';
import ErrorBox from '../components/ErrorBox';

const SPORT_TABS = [
  { key: 'soccer',   label: '축구',    apiKey: 'SOCCER' },
  { key: 'baseball', label: '야구',    apiKey: 'BASEBALL' },
  { key: 'esports',  label: 'e스포츠', apiKey: 'ESPORTS' },
];

// 야구 1차 필터: 전체 / KBO 리그 / MLB. (MLB 선택 시 지구 섹션형으로 표시)
const BASEBALL_FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'KBO', label: 'KBO 리그' },
  { key: 'MLB', label: 'MLB' },
];

// 야구 2차 필터(MLB 선택 시): 전체 / 아메리칸 리그 / 내셔널 리그
const MLB_LEAGUE_FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'AL', label: '아메리칸 리그' },
  { key: 'NL', label: '내셔널 리그' },
];

const isMlb = (r) => (r.leagueName || '').toUpperCase().includes('MLB');
const isKbo = (r) => (r.leagueName || '').toUpperCase().includes('KBO');

// 필터된 목록을 1위부터 순번 재부여 (서버 전역 정렬 순서 유지)
const renumber = (list) => list.map((r, i) => ({ ...r, rank: i + 1 }));

export default function RankingsPage() {
  const { sportType } = useParams();
  const navigate = useNavigate();

  const current = SPORT_TABS.find((t) => t.key === sportType) || SPORT_TABS[0];
  const isBaseball = current.key === 'baseball';

  const [rankings, setRankings] = useState([]);
  const [leagueFilter, setLeagueFilter] = useState('MLB');
  const [mlbLeague, setMlbLeague] = useState('ALL'); // 2차: ALL / AL / NL
  const [mlbDivision, setMlbDivision] = useState('ALL'); // 3차: ALL / EAST / CENTRAL / WEST
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

  const kboTeams = isBaseball ? rankings.filter(isKbo) : [];
  const mlbTeams = isBaseball ? rankings.filter(isMlb) : [];
  const kboDisplayed = renumber(kboTeams);

  // KBO 데이터 부족 안내: 종료 경기 수(= 총 경기수/2)가 적을 때
  const kboPlayed = Math.round(kboTeams.reduce((s, r) => s + (r.gamesPlayed || 0), 0) / 2);
  const kboLimited = kboTeams.length > 0 && kboPlayed < 5;
  const showKboTable = leagueFilter === 'KBO' || leagueFilter === 'ALL';
  const showMlbSections = leagueFilter === 'MLB' || leagueFilter === 'ALL';

  const renderBaseballBody = () => (
    <>
      {showKboTable && (
        <div className="ranking-block">
          {leagueFilter === 'ALL' && <h3 className="mlb-league-title">KBO 리그</h3>}
          {kboLimited && (
            <p className="ranking-note ranking-note--warn">
              등록된 경기 데이터가 적어 순위가 제한적으로 표시됩니다.
            </p>
          )}
          <RankingTable rankings={kboDisplayed} sportType="BASEBALL" />
        </div>
      )}

      {showMlbSections && (
        <div className="ranking-block">
          {leagueFilter === 'ALL' && <h3 className="mlb-section-heading">MLB</h3>}
          <MlbStandings
            teams={mlbTeams}
            leagueFilter={leagueFilter === 'MLB' ? mlbLeague : 'ALL'}
            divisionFilter={leagueFilter === 'MLB' ? mlbDivision : 'ALL'}
            onDivisionChange={setMlbDivision}
          />
        </div>
      )}
    </>
  );

  return (
    <div className="rankings-page">
      <h1 className="page-title">{isBaseball ? 'DB 기준 팀 순위' : '팀 순위'}</h1>
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

      {/* 야구 1차 리그 필터 */}
      {isBaseball && !loading && !error && (
        <div className="ranking-league-filter" role="group" aria-label="야구 리그 필터">
          {BASEBALL_FILTERS.map((lg) => (
            <button
              key={lg.key}
              type="button"
              className={`league-pill${leagueFilter === lg.key ? ' league-pill--active' : ''}`}
              onClick={() => setLeagueFilter(lg.key)}
            >
              {lg.label}
            </button>
          ))}
        </div>
      )}

      {/* 안내 문구 (야구) */}
      {isBaseball && !loading && !error && (
        <div className="ranking-notes">
          <p className="ranking-note">
            현재 DB에 저장된 종료 경기만 기준으로 계산한 순위입니다. 공식 리그 순위와 다를 수 있습니다.
          </p>
        </div>
      )}

      {/* 야구 2차 필터: MLB 선택 시에만, 안내 문구 아래 / 리그 섹션 위 (1차와 다른 줄) */}
      {isBaseball && !loading && !error && leagueFilter === 'MLB' && (
        <div className="ranking-league-filter mlb-league-filter" role="group" aria-label="MLB 리그 필터">
          {MLB_LEAGUE_FILTERS.map((lg) => (
            <button
              key={lg.key}
              type="button"
              className={`league-pill${mlbLeague === lg.key ? ' league-pill--active' : ''}`}
              onClick={() => {
                setMlbLeague(lg.key);
                setMlbDivision('ALL'); // 리그 변경 시 지구 필터 초기화
              }}
            >
              {lg.label}
            </button>
          ))}
        </div>
      )}

      {loading && <LoadingState />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        isBaseball
          ? renderBaseballBody()
          : <RankingTable rankings={rankings} sportType={current.apiKey} />
      )}
    </div>
  );
}
