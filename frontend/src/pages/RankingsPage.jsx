import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRankings } from '../api/rankingApi';
import { getCitoSeasons, getCitoStandings } from '../api/lckApi';
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

// ─── 팀 로고 ──────────────────────────────────────────────────────────────────
function TeamLogo({ url, name, size = 22 }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <span className="lck-rank-logo-fb" style={{ width: size, height: size, fontSize: size * 0.42 }}>
        {(name || '?').slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img src={url} alt={name} width={size} height={size}
      className="esports-team-logo" onError={() => setErr(true)} />
  );
}

// ─── LCK 순위표 ───────────────────────────────────────────────────────────────
function LckStandingsTable({ standings }) {
  if (!standings || standings.length === 0) {
    return <p className="empty-text">순위 데이터가 없습니다.</p>;
  }
  return (
    <div className="ranking-table-wrap">
      <table className="ranking-table lck-rank-table">
        <thead>
          <tr>
            <th>순위</th>
            <th className="team-name-cell">팀</th>
            <th>승</th>
            <th>패</th>
            <th>승률</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const winRate = row.winRate != null
              ? `${(row.winRate * 100).toFixed(0)}%`
              : row.wins != null && row.losses != null
                ? `${Math.round(row.wins / Math.max(row.wins + row.losses, 1) * 100)}%`
                : '-';
            return (
              <tr key={i} className={row.rank === 1 ? 'lck-rank-top-row' : ''}>
                <td>
                  <span className="rank-badge">{row.rank ?? i + 1}</span>
                </td>
                <td className="team-name-cell lck-rank-team-cell">
                  <TeamLogo url={row.logoUrl} name={row.teamName} size={22} />
                  <span className="lck-rank-team-name">{row.teamName}</span>
                  {row.orgSlug && (
                    <span className="lck-rank-team-code">{row.orgSlug.toUpperCase()}</span>
                  )}
                </td>
                <td className="esports-rank-wins">{row.wins ?? '-'}</td>
                <td className="esports-rank-losses">{row.losses ?? '-'}</td>
                <td>{winRate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── e스포츠 탭 (Cito API 기반) ───────────────────────────────────────────────
function EsportsRankingsView() {
  const [seasons, setSeasons]           = useState([]);
  const [selectedSeason, setSelected]   = useState(null);
  const [standings, setStandings]       = useState([]);   // Cito 라이브 순위
  const [dbRankings, setDbRankings]     = useState([]);   // Cito 불가 시 DB 집계 순위(폴백)
  const [source, setSource]             = useState(null); // 'cito' | 'db'
  const [loadingSeasons, setLS]         = useState(true);
  const [loadingStandings, setLSt]      = useState(false);
  const [error, setError]               = useState(null);

  // 시즌 목록 로드
  useEffect(() => {
    const ctrl = new AbortController();
    getCitoSeasons(ctrl.signal)
      .then((res) => {
        const list = res.data || [];
        setSeasons(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => setError('시즌 데이터를 불러오지 못했습니다.'))
      .finally(() => setLS(false));
    return () => ctrl.abort();
  }, []);

  // 선택 시즌 변경 시 순위 로드.
  // Cito 라이브 순위를 우선 시도하고, 503/에러/빈 응답이면 DB 집계 순위로 폴백한다(가짜 데이터 아님).
  useEffect(() => {
    if (!selectedSeason) return;
    const ctrl = new AbortController();
    setLSt(true);
    setError(null);
    setStandings([]);
    setDbRankings([]);
    setSource(null);

    const loadDbFallback = () =>
      getRankings('ESPORTS', ctrl.signal)
        .then((res) => {
          setDbRankings(res.data.data || []);
          setSource('db');
        })
        .catch((err) => {
          if (err?.code === 'ERR_CANCELED') return;
          setError('순위 데이터를 불러오지 못했습니다.');
        });

    getCitoStandings(selectedSeason.id, ctrl.signal)
      .then((res) => {
        const data = res?.data || [];
        if (data.length > 0) {
          setStandings(data);
          setSource('cito');
          return undefined;
        }
        return loadDbFallback(); // 빈 응답 → DB 폴백
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return undefined;
        return loadDbFallback(); // 503(키 없음)·네트워크 등 → DB 폴백
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLSt(false);
      });
    return () => ctrl.abort();
  }, [selectedSeason]);

  if (loadingSeasons) return <LoadingState />;

  return (
    <div className="lck-rankings-view">
      {/* 시즌 탭 */}
      <div className="esports-season-tabs lck-rank-season-tabs">
        {seasons.map((s) => (
          <button
            key={s.id}
            className={`btn${selectedSeason?.id === s.id ? ' btn-primary' : ' btn-outline'}`}
            onClick={() => setSelected(s)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {error && <ErrorBox message={error} />}

      {loadingStandings ? (
        <LoadingState />
      ) : (
        <div className="lck-rank-container">
          <div className="lck-rank-header-bar">
            <span className="lck-rank-season-label">
              {source === 'db' ? 'LCK 팀 순위 (DB 기준)' : `${selectedSeason?.name} 순위표`}
            </span>
            <span className="lck-rank-source-tag">{source === 'db' ? 'DB 기준' : 'Cito API'}</span>
          </div>
          {source === 'db' ? (
            <>
              <p className="ranking-note">
                Cito 라이브 순위를 불러올 수 없어, DB에 저장된 종료 경기로 계산한 순위를 표시합니다.
              </p>
              <RankingTable rankings={dbRankings} sportType="ESPORTS" />
            </>
          ) : (
            <LckStandingsTable standings={standings} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function RankingsPage() {
  const { sportType } = useParams();
  const navigate = useNavigate();

  const current = SPORT_TABS.find((t) => t.key === sportType) || SPORT_TABS[0];
  const isBaseball = current.key === 'baseball';
  const isEsports = current.key === 'esports';
  const isSoccer = current.key === 'soccer';

  const [rankings, setRankings] = useState([]);
  const [leagueFilter, setLeagueFilter] = useState('MLB');
  const [mlbLeague, setMlbLeague] = useState('ALL'); // 2차: ALL / AL / NL
  const [mlbDivision, setMlbDivision] = useState('ALL'); // 3차: ALL / EAST / CENTRAL / WEST
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // e스포츠 탭은 EsportsRankingsView 가 자체 fetch 하므로 메인 페이지의 일반 랭킹 API 호출은 건너뛴다.
    if (isEsports) {
      setLoading(false);
      setError(null);
      return;
    }
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
  }, [current.apiKey, isEsports]);

  const kboTeams = isBaseball ? rankings.filter(isKbo) : [];
  const mlbTeams = isBaseball ? rankings.filter(isMlb) : [];
  const kboDisplayed = renumber(kboTeams);

  // KBO 데이터 부족 안내: 종료 경기 수(= 총 경기수/2)가 적을 때
  const kboPlayed = Math.round(kboTeams.reduce((s, r) => s + (r.gamesPlayed || 0), 0) / 2);
  const kboLimited = kboTeams.length > 0 && kboPlayed < 5;
  const showKboTable = leagueFilter === 'KBO' || leagueFilter === 'ALL';
  const showMlbSections = leagueFilter === 'MLB' || leagueFilter === 'ALL';

  // 축구: 종료 경기 기록이 있는 팀만 메인 순위표에 노출하고, 0경기 팀은 별도 섹션으로 분리한다.
  const soccerPlayedTeams = isSoccer ? rankings.filter((r) => (r.gamesPlayed || 0) > 0) : [];
  const soccerNoRecord    = isSoccer ? rankings.filter((r) => !((r.gamesPlayed || 0) > 0)) : [];
  const soccerRanked      = renumber(soccerPlayedTeams); // 0경기 제외 후 1위부터 재부여
  const soccerScarce      = isSoccer && rankings.length > 0 && rankings.length < 3;

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
      <h1 className="page-title">{(isBaseball || isSoccer) ? 'DB 기준 팀 순위' : '팀 순위'}</h1>
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

      {isEsports ? (
        <EsportsRankingsView />
      ) : (
        <>
          {loading && <LoadingState />}
          {error && <ErrorBox message={error} />}
          {!loading && !error && (
            isBaseball
              ? renderBaseballBody()
              : (
                <>
                  {isSoccer && (
                    <div className="ranking-notes">
                      <p className="ranking-note">
                        현재 DB에 저장된 종료 경기만 기준으로 계산한 순위입니다. 경기 데이터가 적어 공식 리그 순위와 다를 수 있습니다.
                        {soccerScarce && (
                          <span className="ranking-badge ranking-badge--warn">데이터 부족</span>
                        )}
                      </p>
                    </div>
                  )}

                  {soccerRanked.length > 0 ? (
                    <RankingTable rankings={soccerRanked} sportType={current.apiKey} formEmptyText="-" />
                  ) : (
                    rankings.length === 0 && (
                      <p className="empty-text">등록된 팀 데이터가 없습니다.</p>
                    )
                  )}

                  {soccerNoRecord.length > 0 && (
                    <div className="ranking-block ranking-no-record">
                      <h3 className="ranking-no-record-title">경기 기록이 아직 없는 팀</h3>
                      <ul className="ranking-no-record-list">
                        {soccerNoRecord.map((t) => (
                          <li key={t.teamId} className="ranking-no-record-item">{t.teamName}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )
          )}
        </>
      )}
    </div>
  );
}
