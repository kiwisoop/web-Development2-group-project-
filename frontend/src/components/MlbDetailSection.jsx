import MlbLinescoreTable from './MlbLinescoreTable';
import MlbLineupTable from './MlbLineupTable';
import MlbBoxscoreTable from './MlbBoxscoreTable';

export default function MlbDetailSection({ detail }) {
  if (!detail) return null;

  const {
    homeTeamName, awayTeamName,
    homeTeamShortName, awayTeamShortName,
    homeTeamLogoUrl, awayTeamLogoUrl,
    homeProbablePitcher, awayProbablePitcher,
    linescore,
    homeLineup, awayLineup,
    homeBatters, awayBatters,
    homePitchers, awayPitchers,
  } = detail;

  const showPitchers = homeProbablePitcher !== '-' || awayProbablePitcher !== '-';
  const showLineup = homeLineup?.length > 0 || awayLineup?.length > 0;
  const showBoxscore = homeBatters?.length > 0 || awayBatters?.length > 0;

  return (
    <div className="mlb-detail-section">

      {showPitchers && (
        <div className="card mlb-pitchers-card">
          <h3 className="detail-section-title">선발 투수</h3>
          <div className="mlb-pitchers-row">
            <div className="mlb-pitcher-item">
              {homeTeamLogoUrl && (
                <img className="mlb-pitcher-logo" src={homeTeamLogoUrl} alt={homeTeamShortName} />
              )}
              <div>
                <div className="mlb-pitcher-team">{homeTeamShortName || homeTeamName}</div>
                <div className="mlb-pitcher-name">{homeProbablePitcher}</div>
              </div>
            </div>
            <div className="mlb-pitcher-vs">VS</div>
            <div className="mlb-pitcher-item mlb-pitcher-item--away">
              <div>
                <div className="mlb-pitcher-team mlb-pitcher-team--right">{awayTeamShortName || awayTeamName}</div>
                <div className="mlb-pitcher-name mlb-pitcher-name--right">{awayProbablePitcher}</div>
              </div>
              {awayTeamLogoUrl && (
                <img className="mlb-pitcher-logo" src={awayTeamLogoUrl} alt={awayTeamShortName} />
              )}
            </div>
          </div>
        </div>
      )}

      {linescore && (
        <div className="card">
          <h3 className="detail-section-title">이닝 스코어</h3>
          <MlbLinescoreTable
            linescore={linescore}
            homeShortName={homeTeamShortName || homeTeamName}
            awayShortName={awayTeamShortName || awayTeamName}
          />
        </div>
      )}

      {showLineup && (
        <div className="card">
          <h3 className="detail-section-title">라인업</h3>
          <div className="mlb-lineup-grid">
            <MlbLineupTable
              lineup={awayLineup}
              title={awayTeamShortName || awayTeamName}
            />
            <MlbLineupTable
              lineup={homeLineup}
              title={homeTeamShortName || homeTeamName}
            />
          </div>
        </div>
      )}

      {showBoxscore && (
        <div className="card">
          <h3 className="detail-section-title">박스스코어</h3>
          <MlbBoxscoreTable
            homeBatters={homeBatters}
            awayBatters={awayBatters}
            homePitchers={homePitchers}
            awayPitchers={awayPitchers}
            homeTeamName={homeTeamShortName || homeTeamName}
            awayTeamName={awayTeamShortName || awayTeamName}
          />
        </div>
      )}

    </div>
  );
}
