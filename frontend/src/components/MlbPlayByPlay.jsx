import { useState, useEffect, useRef } from 'react';
import { getMlbPlayByPlay } from '../api/mlbApi';

export default function MlbPlayByPlay({ matchId, isLive }) {
  const [plays, setPlays] = useState([]);
  const controllerRef = useRef(null);

  useEffect(() => {
    const fetchPlays = () => {
      if (controllerRef.current) controllerRef.current.abort();
      controllerRef.current = new AbortController();
      getMlbPlayByPlay(matchId, controllerRef.current.signal)
        .then(res => setPlays(res.data.plays ?? []))
        .catch(err => {
          if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
          console.error('문자중계 로드 실패', err);
        });
    };

    fetchPlays();
    const timer = isLive ? setInterval(fetchPlays, 30000) : null;
    return () => {
      clearInterval(timer);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [matchId, isLive]);

  if (!plays || plays.length === 0) return null;

  const groups = [];
  let currentKey = null;
  for (const play of plays) {
    const key = `${play.inning}-${play.halfInning}`;
    if (key !== currentKey) {
      groups.push({ inning: play.inning, halfInning: play.halfInning, plays: [] });
      currentKey = key;
    }
    groups[groups.length - 1].plays.push(play);
  }

  return (
    <div className="card mlb-pbp-section">
      <h3 className="detail-section-title">문자중계</h3>
      {groups.map(group => (
        <div key={`${group.inning}-${group.halfInning}`}>
          <div className="mlb-pbp-inning-header">
            {group.inning}회 {group.halfInning === 'top' ? '초' : '말'}
          </div>
          {group.plays.map((play, i) => (
            <div key={i} className="mlb-pbp-play-card">
              <div className="mlb-pbp-matchup">
                <span className="mlb-pbp-batter">{play.batterName}</span>
                <span className="mlb-pbp-vs"> vs </span>
                <span className="mlb-pbp-pitcher">{play.pitcherName}</span>
              </div>
              {play.event && (
                <div className="mlb-pbp-event">{play.event}</div>
              )}
              {play.description && (
                <div className="mlb-pbp-description">{play.description}</div>
              )}
              <div className="mlb-pbp-footer">
                <span className="mlb-pbp-score-badge">
                  원정 {play.awayScore} - 홈 {play.homeScore}
                </span>
                <span className="mlb-pbp-count">
                  B{play.balls} S{play.strikes} O{play.outs}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
