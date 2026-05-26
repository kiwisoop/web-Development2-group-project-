import { useEffect, useState, useMemo } from 'react';
import {
  getPlayerSeasonSummary,
  getPlayerGameStats,
  getPlayerCareer,
} from '../api/lckApi';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

const POS_COLOR = {
  TOP: '#ef4444', JGL: '#22c55e', JNG: '#22c55e', JUNGLE: '#22c55e',
  MID: '#3b82f6', BOT: '#f59e0b', ADC: '#f59e0b', SUP: '#a855f7', SUPPORT: '#a855f7',
};

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

function fmtNum(n, digits = 0) {
  if (n == null) return '-';
  return Number(n).toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtPercent(n) {
  if (n == null) return '-';
  return `${Number(n).toFixed(1)}%`;
}

function fmtDuration(sec) {
  if (sec == null) return '-';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function SeasonSummaryCard({ summary }) {
  return (
    <div className="lck-pstat-season-card">
      <div className="lck-pstat-season-head">
        <span className="lck-pstat-season-name">{summary.season}</span>
        <span className="lck-pstat-season-games">{summary.totalGames}경기</span>
      </div>

      <div className="lck-pstat-kda-row">
        <div className="lck-pstat-kda-main">
          <span className="lck-pstat-kda-k">{summary.totalKills}</span>
          <span className="lck-pstat-kda-sep">/</span>
          <span className="lck-pstat-kda-d">{summary.totalDeaths}</span>
          <span className="lck-pstat-kda-sep">/</span>
          <span className="lck-pstat-kda-a">{summary.totalAssists}</span>
        </div>
        <div className="lck-pstat-kda-value">
          KDA <strong>{fmtNum(summary.kda, 2)}</strong>
        </div>
      </div>

      <div className="lck-pstat-stat-grid">
        <div><span>평균 K</span><strong>{fmtNum(summary.avgKills, 1)}</strong></div>
        <div><span>평균 D</span><strong>{fmtNum(summary.avgDeaths, 1)}</strong></div>
        <div><span>평균 A</span><strong>{fmtNum(summary.avgAssists, 1)}</strong></div>
        <div><span>승률</span><strong>{fmtPercent(summary.winRate)}</strong></div>
        <div><span>승</span><strong className="lck-win">{summary.wins}</strong></div>
        <div><span>패</span><strong className="lck-loss">{summary.losses}</strong></div>
      </div>
    </div>
  );
}

function GameStatsTable({ rows }) {
  if (!rows || rows.length === 0)
    return <EmptyState title="기록 없음" description="해당 시즌에 출전한 경기가 없습니다." />;

  return (
    <div className="lck-pstat-table-wrap">
      <table className="lck-pstat-table">
        <thead>
          <tr>
            <th>날짜</th>
            <th>상대</th>
            <th>결과</th>
            <th>챔피언</th>
            <th>K / D / A</th>
            <th>CS</th>
            <th>골드</th>
            <th>DPM</th>
            <th>딜비중</th>
            <th>시야</th>
            <th>시간</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.gameId} className={g.win ? 'lck-row-win' : 'lck-row-loss'}>
              <td>{fmtDate(g.matchDate)}</td>
              <td>
                <span className="lck-opp-code">{g.opponentCode}</span>
                <span className="lck-game-no">G{g.gameNumber}</span>
              </td>
              <td>
                <span className={g.win ? 'lck-badge-win' : 'lck-badge-loss'}>
                  {g.win ? '승' : '패'}
                </span>
              </td>
              <td className="lck-champ">{g.championName || '-'}</td>
              <td className="lck-kda-cell">
                <span className="lck-pstat-kda-k">{g.kills}</span>
                <span> / </span>
                <span className="lck-pstat-kda-d">{g.deaths}</span>
                <span> / </span>
                <span className="lck-pstat-kda-a">{g.assists}</span>
              </td>
              <td>{g.cs}</td>
              <td>{fmtNum(g.gold)}</td>
              <td className="lck-dpm">{fmtNum(g.dpm, 0)}</td>
              <td className="lck-dmg-ratio">{fmtPercent(g.teamDamageRatio)}</td>
              <td>{g.visionScore}</td>
              <td className="lck-duration">{fmtDuration(g.durationSec)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PlayerStatsModal({ player, teamName, onClose }) {
  const [summaries, setSummaries] = useState([]);
  const [games, setGames]         = useState([]);
  const [career, setCareer]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null); // null = 전체

  useEffect(() => {
    if (!player) return;
    const ctrl = new AbortController();
    setLoading(true); setError(null);

    Promise.all([
      getPlayerSeasonSummary(player.id, ctrl.signal),
      getPlayerGameStats(player.id, null, ctrl.signal),
      getPlayerCareer(player.id, ctrl.signal),
    ])
      .then(([sumRes, gameRes, careerRes]) => {
        setSummaries(sumRes.data || []);
        setGames(gameRes.data || []);
        setCareer(careerRes.data || null);
      })
      .catch((e) => {
        if (e?.code !== 'ERR_CANCELED') setError('지표를 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [player]);

  const filteredGames = useMemo(() => {
    if (!selectedSeason) return games;
    return games.filter((g) => g.season === selectedSeason);
  }, [games, selectedSeason]);

  const seasons = useMemo(
    () => Array.from(new Set(games.map((g) => g.season).filter(Boolean))),
    [games]
  );

  if (!player) return null;

  const posColor = POS_COLOR[(player.position || '').toUpperCase()] || '#6b7280';

  return (
    <div className="lck-modal-overlay" onClick={onClose}>
      <div className="lck-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="lck-modal-head">
          <div className="lck-modal-title-row">
            <span className="lck-pos-badge" style={{ backgroundColor: posColor }}>
              {player.position || '?'}
            </span>
            <h2 className="lck-modal-nick">{player.nickname}</h2>
            {player.playerName && <span className="lck-modal-real">{player.playerName}</span>}
            {teamName && <span className="lck-modal-team">{teamName}</span>}
          </div>
          <button className="lck-modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>

        {/* 본문 */}
        <div className="lck-modal-body">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <p className="lck-modal-error">{error}</p>
          ) : (
            <>
              {/* 통산 전적 */}
              {career && career.totalGames > 0 && (
                <div className="lck-career-bar">
                  <span>통산</span>
                  <strong>{career.totalGames}경기</strong>
                  <span className="lck-win">{career.wins}승</span>
                  <span className="lck-loss">{career.losses}패</span>
                  <span>승률 <strong>{career.winRate}%</strong></span>
                </div>
              )}

              {/* 시즌별 통합 KDA */}
              <section className="lck-modal-section">
                <h3 className="lck-modal-section-title">시즌별 통합 KDA</h3>
                {summaries.length === 0 ? (
                  <EmptyState title="시즌 데이터 없음" description="기록된 시즌 통계가 없습니다." />
                ) : (
                  <div className="lck-pstat-season-grid">
                    {summaries.map((s) => (
                      <SeasonSummaryCard key={s.season} summary={s} />
                    ))}
                  </div>
                )}
              </section>

              {/* 경기별 지표 */}
              <section className="lck-modal-section">
                <div className="lck-section-head">
                  <h3 className="lck-modal-section-title">경기별 상세 지표</h3>
                  {seasons.length > 1 && (
                    <div className="lck-season-filter">
                      <button
                        className={`lck-filter-btn${selectedSeason === null ? ' active' : ''}`}
                        onClick={() => setSelectedSeason(null)}
                      >전체</button>
                      {seasons.map((s) => (
                        <button
                          key={s}
                          className={`lck-filter-btn${selectedSeason === s ? ' active' : ''}`}
                          onClick={() => setSelectedSeason(s)}
                        >{s}</button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="lck-table-hint">
                  분당 딜량(DPM) · 골드 총량 · 시야 점수 · 팀 내 데미지 비율
                </p>
                <GameStatsTable rows={filteredGames} />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
