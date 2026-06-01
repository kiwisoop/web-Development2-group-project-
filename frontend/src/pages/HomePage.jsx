import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getMatches, getMatchSections } from '../api/matchApi';
import { getLckMatches } from '../api/lckApi';
import { getRankings } from '../api/rankingApi';
import { addFavoriteTeam } from '../api/favoriteApi';
import { useAuth } from '../hooks/useAuth';
import TeamLogo from '../components/TeamLogo';

const SPORTS = ['SOCCER', 'BASEBALL', 'ESPORTS'];

const SPORT_LABEL = {
  BASEBALL: '야구',
  SOCCER: '축구',
  ESPORTS: 'e스포츠',
};

const SPORT_EMOJI = {
  BASEBALL: '⚾',
  SOCCER: '⚽',
  ESPORTS: '🎮',
};

const LIVE_DURATION_HOURS = {
  SOCCER: 2.25,
  BASEBALL: 4,
  ESPORTS: 4,
};

const ICON = {
  play: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
  star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  cal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  ai: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.1 6.4L21 10l-5 4.5L17.2 21 12 17.7 6.8 21 8 14.5 3 10l6.9-1.6L12 2z" /></svg>,
  trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>,
  zap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
};

function dateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function rawStatus(status) {
  if (['FINAL', 'FINISHED', 'ENDED', 'FT', 'completed'].includes(status)) return 'FINAL';
  if (['LIVE', 'IN_PROGRESS', 'inProgress'].includes(status)) return 'LIVE';
  return 'SCHEDULED';
}

function isActuallyLive(match) {
  if (rawStatus(match?.status) !== 'LIVE') return false;
  const matchTime = new Date(match?.matchDate || '').getTime();
  if (Number.isNaN(matchTime)) return false;
  const durationMs = (LIVE_DURATION_HOURS[match?.sportType] || 3) * 60 * 60 * 1000;
  const now = Date.now();
  return matchTime <= now && now <= matchTime + durationMs;
}

function effectiveStatus(match) {
  const normalized = rawStatus(match?.status);
  if (normalized !== 'LIVE') return normalized;
  if (isActuallyLive(match)) return 'LIVE';
  const matchTime = new Date(match?.matchDate || '').getTime();
  if (Number.isNaN(matchTime)) return 'SCHEDULED';
  return matchTime > Date.now() ? 'SCHEDULED' : 'FINAL';
}

function teamName(team) {
  return team?.teamName || team?.shortName || team?.name || '팀 정보 없음';
}

function leagueLabel(match) {
  return match?.league?.leagueName || SPORT_LABEL[match?.sportType] || '';
}

function statusLabel(match) {
  const normalized = effectiveStatus(match);
  if (normalized === 'LIVE') return 'LIVE';
  if (normalized === 'FINAL') return '종료';
  return '예정';
}

function statusClass(match) {
  const normalized = effectiveStatus(match);
  if (normalized === 'LIVE') return 'live';
  if (normalized === 'FINAL') return 'end';
  return 'upc';
}

function hasScore(match) {
  return ['LIVE', 'FINAL'].includes(effectiveStatus(match));
}

function formatTime(dateStr) {
  if (!dateStr) return '--:--';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractList(response) {
  const data = response?.data?.data || response?.data?.content || response?.data || [];
  return Array.isArray(data) ? data : [];
}

function readPageContent(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function dedupeMatches(list) {
  const seen = new Set();
  return list.filter((match) => {
    const key = match?.externalId || `${match?.sportType || 'UNKNOWN'}-${match?.id || match?.matchId}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isBetween(match, startKey, endKey) {
  const key = dateKey(new Date(match?.matchDate || ''));
  return key >= startKey && key <= endKey;
}

function detailPath(match) {
  if (match?.sportType === 'SOCCER' && match?.externalId?.startsWith('KLEAGUE-')) {
    return `/soccer/fixtures/${match.externalId.replace('KLEAGUE-', '')}`;
  }
  if (match?.sportType === 'ESPORTS') return '/sports/esports';
  return `/matches/${match?.id}`;
}

export default function HomePage() {
  const { user, isLoggedIn } = useAuth();
  const [sections, setSections] = useState(null);
  const [scheduleMatches, setScheduleMatches] = useState([]);
  const [lckMatches, setLckMatches] = useState([]);
  const [rankings, setRankings] = useState({});
  const [rankingIndex, setRankingIndex] = useState(0);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const today = dateKey();
    const tomorrow = dateKey(addDays(new Date(), 1));
    setLoading(true);
    setLoadErr(null);

    const scheduleRequests = SPORTS.flatMap((sportType) => [
      getMatches({ sportType, date: today, page: 0, size: 30, sort: 'oldest' }, controller.signal),
      getMatches({ sportType, date: tomorrow, page: 0, size: 30, sort: 'oldest' }, controller.signal),
    ]);

    Promise.allSettled([
      getMatchSections({}, controller.signal),
      getLckMatches(controller.signal),
      ...scheduleRequests,
    ])
      .then(([sectionRes, lckRes, ...scheduleResults]) => {
        if (controller.signal.aborted) return;

        if (sectionRes.status === 'fulfilled') {
          setSections(sectionRes.value.data || {});
        } else if (sectionRes.reason?.code !== 'ERR_CANCELED') {
          setLoadErr(sectionRes.reason);
        }

        if (lckRes.status === 'fulfilled') {
          setLckMatches(extractList(lckRes.value));
        }

        const fetched = scheduleResults.flatMap((result) => (
          result.status === 'fulfilled' ? readPageContent(result.value) : []
        ));
        setScheduleMatches(dedupeMatches(fetched));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    Promise.allSettled(SPORTS.map((sport) => getRankings(sport, undefined, controller.signal)))
      .then((results) => {
        if (controller.signal.aborted) return;
        const next = {};
        results.forEach((result, index) => {
          if (result.status !== 'fulfilled') return;
          const rows = extractList(result.value).slice(0, 5);
          if (rows.length > 0) next[SPORTS[index]] = rows;
        });
        setRankings(next);
      });

    return () => controller.abort();
  }, []);

  const rankingSports = useMemo(() => (
    SPORTS.filter((sport) => rankings[sport]?.length > 0)
  ), [rankings]);

  useEffect(() => {
    if (rankingSports.length <= 1) return undefined;
    const timer = setInterval(() => {
      setRankingIndex((value) => (value + 1) % rankingSports.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [rankingSports.length]);

  const allMatches = useMemo(() => {
    const sectionLive = Array.isArray(sections?.liveMatches) ? sections.liveMatches : [];
    const sectionUpcoming = Array.isArray(sections?.upcomingMatches) ? sections.upcomingMatches : [];
    const sectionRecent = Array.isArray(sections?.recentFinishedMatches) ? sections.recentFinishedMatches : [];
    return dedupeMatches([...sectionLive, ...sectionUpcoming, ...sectionRecent, ...scheduleMatches, ...lckMatches]);
  }, [sections, scheduleMatches, lckMatches]);

  const todayKey = dateKey();
  const tomorrowKey = dateKey(addDays(new Date(), 1));

  const liveMatches = useMemo(() => (
    allMatches
      .filter((match) => effectiveStatus(match) === 'LIVE')
      .sort((a, b) => new Date(a?.matchDate || 0) - new Date(b?.matchDate || 0))
  ), [allMatches]);

  const upcomingMatches = useMemo(() => (
    allMatches
      .filter((match) => effectiveStatus(match) === 'SCHEDULED' && isBetween(match, todayKey, tomorrowKey))
      .sort((a, b) => new Date(a?.matchDate || 0) - new Date(b?.matchDate || 0))
  ), [allMatches, todayKey, tomorrowKey]);

  const recentMatches = useMemo(() => (
    allMatches.filter((match) => effectiveStatus(match) === 'FINAL')
  ), [allMatches]);

  const spotlightMatches = useMemo(() => [...liveMatches, ...upcomingMatches], [liveMatches, upcomingMatches]);
  const listMatches = spotlightMatches.slice(0, 6);

  useEffect(() => {
    setFeatureIndex(0);
  }, [spotlightMatches.length]);

  useEffect(() => {
    if (spotlightMatches.length <= 1) return undefined;
    const timer = setInterval(() => {
      setFeatureIndex((value) => (value + 1) % spotlightMatches.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [spotlightMatches.length]);

  const analysisCount = useMemo(() => (
    recentMatches.filter((match) => match?.analysisAvailable).length
  ), [recentMatches]);

  const feature = spotlightMatches[featureIndex % Math.max(spotlightMatches.length, 1)];
  const rankingSport = rankingSports[rankingIndex % Math.max(rankingSports.length, 1)] || 'SOCCER';
  const ranking = rankings[rankingSport] || [];

  const handleFavorite = async () => {
    if (!feature?.homeTeam?.id) return;
    try {
      await addFavoriteTeam(feature.homeTeam.id);
      alert(`${teamName(feature.homeTeam)} 팀을 즐겨찾기에 추가했습니다.`);
    } catch (error) {
      const message = error.response?.data?.message || error.message || '즐겨찾기 추가에 실패했습니다.';
      alert(message);
    }
  };

  return (
    <>
      {feature ? (
        <section className="sl-hero">
          <div className="sl-hero-top">
            <div className="sl-live-chip">
              {effectiveStatus(feature) === 'LIVE' && <span className="sl-live-dot" />}
              {statusLabel(feature)} · {SPORT_EMOJI[feature.sportType] || ''} {SPORT_LABEL[feature.sportType] || feature.sportType}
            </div>
            <div className="sl-hero-meta">
              {[feature.venue, leagueLabel(feature), formatDateTime(feature.matchDate)].filter(Boolean).join(' · ')}
            </div>
          </div>

          <div className="sl-matchup">
            <div className="sl-team">
              <TeamLogo team={feature.homeTeam} size={88} radius={22} />
              <div className="sl-team-info">
                <h2>{teamName(feature.homeTeam)}</h2>
                <div className="meta">홈</div>
              </div>
            </div>

            <div className="sl-score">
              <div className="sl-score-nums">
                <span>{hasScore(feature) ? feature.homeScore ?? 0 : '-'}</span>
                <span className="sl-score-dash">:</span>
                <span>{hasScore(feature) ? feature.awayScore ?? 0 : '-'}</span>
              </div>
              <div className="sl-score-status">
                {effectiveStatus(feature) === 'LIVE' ? <b>진행 중 · LIVE</b> : <b>{statusLabel(feature)} 경기</b>}
              </div>
            </div>

            <div className="sl-team right">
              <TeamLogo team={feature.awayTeam} size={88} radius={22} />
              <div className="sl-team-info">
                <h2>{teamName(feature.awayTeam)}</h2>
                <div className="meta">원정</div>
              </div>
            </div>
          </div>

          <div className="sl-hero-actions">
            <Link to={detailPath(feature)} className="btn btn-primary">{ICON.play} 상세 보기</Link>
            <Link to="/matches" className="btn btn-outline">{ICON.cal} 전체 경기</Link>
            {isLoggedIn && feature?.homeTeam?.id && (
              <button className="btn btn-outline" type="button" onClick={handleFavorite}>
                {ICON.star} 홈팀 즐겨찾기
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="sl-hero">
          <div className="sl-hero-top">
            <div className="sl-live-chip">경기 정보</div>
          </div>
          <div className="sl-empty">
            {loading ? '경기 정보를 불러오는 중입니다.' : loadErr ? '서버에서 경기 정보를 불러오지 못했습니다.' : '오늘 또는 내일 표시할 경기가 없습니다.'}
          </div>
        </section>
      )}

      <section className="sl-stat-tiles">
        <Link to="/matches?status=LIVE" className="sl-stat-tile t-v">
          <div className="label">{ICON.check} 진행 경기</div>
          <div className="value">{liveMatches.length}</div>
          <div className="delta">실제 LIVE 상태만</div>
        </Link>
        <Link to="/analysis" className="sl-stat-tile t-c">
          <div className="label">{ICON.ai} AI 분석</div>
          <div className="value">{analysisCount}</div>
          <div className="delta">종료 경기 기준</div>
        </Link>
        <Link to="/matches?status=SCHEDULED" className="sl-stat-tile t-m">
          <div className="label">{ICON.clock} 예정 경기</div>
          <div className="value">{upcomingMatches.length}</div>
          <div className="delta">오늘 · 내일 경기</div>
        </Link>
        <Link to={isLoggedIn ? '/favorites' : '/login'} className="sl-stat-tile t-l">
          <div className="label">{ICON.star} 내 팀</div>
          <div className="value">{isLoggedIn ? 'MY' : '-'}</div>
          <div className="delta">{isLoggedIn ? '맞춤 분석' : '로그인 필요'}</div>
        </Link>
      </section>

      <div className="sl-content-grid">
        <div className="sl-col-main">
          <div className="sl-card">
            <div className="sl-card-head">
              <h3><span className="ic">{ICON.cal}</span> 진행 중 · 오늘/내일 예정 경기</h3>
              <Link to="/matches" className="link">전체 보기 →</Link>
            </div>

            {listMatches.length === 0 ? (
              <div className="sl-empty">{loading ? '불러오는 중입니다.' : '실시간 또는 오늘/내일 예정 경기가 없습니다.'}</div>
            ) : (
              listMatches.map((match, index) => (
                <Link key={`${match?.sportType}-${match?.id || match?.externalId || index}`} to={detailPath(match)} className={`sl-match-row ${effectiveStatus(match) === 'LIVE' ? 'live' : ''}`}>
                  <div className="sl-match-time">
                    <b>{formatTime(match?.matchDate)}</b>
                    <span className={`sl-status-badge ${statusClass(match)}`}>{statusLabel(match)}</span>
                  </div>
                  <div className="sl-mini-team">
                    <TeamLogo team={match?.homeTeam} size={38} />
                    <div>
                      <div className="name">{teamName(match?.homeTeam)}</div>
                      <div className="sub">{SPORT_EMOJI[match?.sportType] || ''} {leagueLabel(match)}</div>
                    </div>
                  </div>
                  {hasScore(match) ? (
                    <div className="sl-match-score"><b>{match.homeScore ?? 0}</b><span>:</span><b>{match.awayScore ?? 0}</b></div>
                  ) : (
                    <div className="sl-match-score upcoming">VS</div>
                  )}
                  <div className="sl-mini-team away">
                    <TeamLogo team={match?.awayTeam} size={38} />
                    <div>
                      <div className="name">{teamName(match?.awayTeam)}</div>
                      <div className="sub">{match?.venue || ''}</div>
                    </div>
                  </div>
                  <div className="sl-match-action"><span className="sl-detail-link">상세 →</span></div>
                </Link>
              ))
            )}
          </div>

          <div className="sl-card sl-ai-card">
            <div className="sl-card-head">
              <h3><span className="ic">{ICON.ai}</span> AI 경기 요약</h3>
              <Link to="/analysis" className="link">분석 보기 →</Link>
            </div>
            <div className="sl-ai-body">
              <p>
                현재 <mark>{analysisCount}개 경기</mark>에서 결과 요약과 전술 분석을 확인할 수 있습니다.
                분석 화면에서는 축구, 야구, e스포츠를 한 번에 필터링할 수 있습니다.
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>
                AI 분석은 종료 경기의 기록을 기반으로 정리되며, 승부 예측이 아닌 참고용 요약입니다.
              </p>
              <Link to="/analysis" className="btn btn-primary" style={{ marginTop: 12 }}>{ICON.ai} 분석 화면으로</Link>
            </div>
          </div>
        </div>

        <aside className="sl-col-side">
          <div className="sl-card">
            <div className="sl-card-head">
              <h3>
                <span className="ic" style={{ background: 'rgba(182,255,58,.15)', color: 'var(--accent-lime)' }}>{ICON.trophy}</span>
                인기 순위
                <small style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, marginLeft: 6 }}>
                  · {SPORT_LABEL[rankingSport]}
                </small>
              </h3>
              <Link to={`/rankings/${rankingSport.toLowerCase()}`} className="link">전체 →</Link>
            </div>

            {ranking.length === 0 ? (
              <div className="sl-empty">순위 정보 없음</div>
            ) : (
              ranking.map((row, index) => (
                <Link
                  key={row?.teamId || row?.id || `${row?.teamName}-${index}`}
                  to={`/rankings/${rankingSport.toLowerCase()}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 36px 1fr auto',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 22px',
                    borderBottom: index < ranking.length - 1 ? '1px solid var(--glass-border)' : 'none',
                  }}
                >
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 800,
                    textAlign: 'center',
                    color: index === 0 ? 'var(--accent-lime)' : index === 1 ? 'var(--accent-cyan)' : index === 2 ? 'var(--accent-orange)' : 'var(--color-text-muted)',
                  }}>
                    {index + 1}
                  </div>
                  <TeamLogo team={row} size={32} radius={8} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{teamName(row)}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                      {row?.wins ?? row?.win ?? 0}승 {row?.draws ?? row?.draw ?? 0}무 {row?.losses ?? row?.loss ?? 0}패
                    </div>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
                    {typeof row?.winRate === 'number' ? `${(row.winRate > 1 ? row.winRate : row.winRate * 100).toFixed(1)}%` : '-'}
                  </div>
                </Link>
              ))
            )}
            <div style={{ height: 14 }} />
          </div>

          <div className="sl-card">
            <div className="sl-card-head">
              <h3>
                <span className="ic" style={{ background: 'rgba(24,214,255,.15)', color: 'var(--accent-cyan)' }}>{ICON.zap}</span>
                {isLoggedIn ? `${user?.nickname || user?.username || '사용자'}님` : '환영합니다'}
              </h3>
            </div>
            <div style={{ padding: '18px 22px' }}>
              {isLoggedIn ? (
                <>
                  <p style={{ fontSize: 13.5, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
                    즐겨찾기 팀과 경기 분석을 빠르게 확인하세요.
                  </p>
                  <Link to="/favorites" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    {ICON.star} 내 팀 보기
                  </Link>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13.5, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
                    로그인하면 즐겨찾기 팀, 내 투표, 맞춤 분석을 사용할 수 있습니다.
                  </p>
                  <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>로그인</Link>
                  <Link to="/register" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>회원가입</Link>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
