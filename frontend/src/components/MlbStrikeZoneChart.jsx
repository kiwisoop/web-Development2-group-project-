import { useState, useEffect, useRef } from 'react';
import { getMlbPitchZone } from '../api/mlbApi';

const SVG_W = 300;
const SVG_H = 350;
const PAD = 20;

function svgX(px) {
  return PAD + (px - (-2.0)) / 4.0 * (SVG_W - PAD * 2);
}

function svgY(pz) {
  return PAD + (5.0 - pz) / 4.5 * (SVG_H - PAD * 2);
}

function pitchDotClass(pitch) {
  if (pitch.inPlay) return 'pitch-dot pitch-dot-inplay';
  if (pitch.strike) return 'pitch-dot pitch-dot-strike';
  return 'pitch-dot pitch-dot-ball';
}

function inningLabel(pitch) {
  return `${pitch.inning}회 ${pitch.halfInning === 'top' ? '초' : '말'}`;
}

export default function MlbStrikeZoneChart({ matchId }) {
  const [pitches, setPitches] = useState([]);
  const [filterPitcher, setFilterPitcher] = useState('전체');
  const [filterBatter, setFilterBatter] = useState('전체');
  const [filterInning, setFilterInning] = useState('전체');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [hoveredPitch, setHoveredPitch] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    getMlbPitchZone(matchId, controller.signal)
      .then(res => setPitches(res.data.pitches ?? []))
      .catch(err => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      });
    return () => controller.abort();
  }, [matchId]);

  const filteredPitches = pitches.filter(p => {
    if (filterPitcher !== '전체' && p.pitcherName !== filterPitcher) return false;
    if (filterBatter !== '전체' && p.batterName !== filterBatter) return false;
    if (filterInning !== '전체' && inningLabel(p) !== filterInning) return false;
    return true;
  });

  const avgZoneTop = filteredPitches.length
    ? filteredPitches.reduce((s, p) => s + (p.strikeZoneTop ?? 3.5), 0) / filteredPitches.length
    : 3.5;
  const avgZoneBottom = filteredPitches.length
    ? filteredPitches.reduce((s, p) => s + (p.strikeZoneBottom ?? 1.5), 0) / filteredPitches.length
    : 1.5;

  const pitchers = ['전체', ...new Set(pitches.map(p => p.pitcherName))];
  const batters = ['전체', ...new Set(pitches.map(p => p.batterName))];
  const innings = ['전체', ...new Set(pitches.map(p => inningLabel(p)))];

  const zoneLeft = svgX(-0.83);
  const zoneRight = svgX(0.83);
  const zoneTop = svgY(avgZoneTop);
  const zoneBottom = svgY(avgZoneBottom);

  function handleFilterChange(setter) {
    return e => {
      setter(e.target.value);
      setSelectedPitch(null);
    };
  }

  function handleMouseEnter(pitch, e) {
    if (!containerRef.current) return;
    setHoveredPitch(pitch);
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 10 });
  }

  function handleClick(pitch) {
    setSelectedPitch(prev => prev === pitch ? null : pitch);
  }

  if (pitches.length === 0) {
    return (
      <div className="card strike-zone-section">
        <h3 className="detail-section-title">존 차트</h3>
        <div style={{ color: 'var(--color-text-muted)', padding: '1rem' }}>
          투구 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="card strike-zone-section">
      <h3 className="detail-section-title">존 차트</h3>

      <div className="strike-zone-filters">
        <select value={filterPitcher} onChange={handleFilterChange(setFilterPitcher)}>
          {pitchers.map(p => (
            <option key={p} value={p}>{p === '전체' ? '투수: 전체' : p}</option>
          ))}
        </select>
        <select value={filterBatter} onChange={handleFilterChange(setFilterBatter)}>
          {batters.map(b => (
            <option key={b} value={b}>{b === '전체' ? '타자: 전체' : b}</option>
          ))}
        </select>
        <select value={filterInning} onChange={handleFilterChange(setFilterInning)}>
          {innings.map(i => (
            <option key={i} value={i}>{i === '전체' ? '이닝: 전체' : i}</option>
          ))}
        </select>
      </div>

      {filteredPitches.length === 0 && (
        <div style={{ color: 'var(--color-text-muted)', padding: '0.5rem 0 1rem' }}>
          선택한 조건에 해당하는 투구가 없습니다.
        </div>
      )}

      <div className="strike-zone-chart" ref={containerRef}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          style={{ display: 'block', background: '#1e293b', borderRadius: '8px' }}
        >
          {/* Centre line (home plate reference) */}
          <line
            x1={svgX(0)} y1={svgY(0.5) - 6}
            x2={svgX(0)} y2={svgY(0.5) + 6}
            stroke="#475569" strokeWidth="1"
          />

          {/* Strike zone box */}
          <rect
            x={zoneLeft}
            y={zoneTop}
            width={zoneRight - zoneLeft}
            height={zoneBottom - zoneTop}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="2"
            strokeDasharray="6 3"
          />

          {/* Pitch dots */}
          {filteredPitches.map((pitch, i) => (
            <circle
              key={`${pitch.inning}-${pitch.halfInning}-${pitch.pitcherName}-${i}`}
              cx={svgX(pitch.plateX)}
              cy={svgY(pitch.plateZ)}
              r={selectedPitch === pitch ? 7 : 5}
              className={`${pitchDotClass(pitch)}${selectedPitch === pitch ? ' pitch-dot--selected' : ''}`}
              onMouseEnter={e => handleMouseEnter(pitch, e)}
              onMouseLeave={() => setHoveredPitch(null)}
              onClick={() => handleClick(pitch)}
            />
          ))}
        </svg>

        {hoveredPitch && (
          <div
            className="pitch-tooltip"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="pitch-tooltip-type">{hoveredPitch.pitchType ?? '-'}</div>
            <div>{hoveredPitch.callDescription ?? '-'}</div>
            {hoveredPitch.startSpeed && <div>{hoveredPitch.startSpeed} mph</div>}
            <div className="pitch-tooltip-matchup">
              {hoveredPitch.batterName} vs {hoveredPitch.pitcherName}
            </div>
            <div>{inningLabel(hoveredPitch)}</div>
          </div>
        )}
      </div>

      <div className="strike-zone-legend">
        <span><span className="legend-dot legend-dot-ball" />볼</span>
        <span><span className="legend-dot legend-dot-strike" />스트라이크</span>
        <span><span className="legend-dot legend-dot-inplay" />인플레이</span>
      </div>

      {selectedPitch && (
        <div className="pitch-detail-panel">
          <button className="pitch-detail-close" onClick={() => setSelectedPitch(null)}>×</button>
          <div className="pitch-detail-grid">
            <div><span className="pitch-detail-label">구종</span>{selectedPitch.pitchType ?? '-'}</div>
            <div><span className="pitch-detail-label">판정</span>{selectedPitch.callDescription ?? '-'}</div>
            <div><span className="pitch-detail-label">구속</span>{selectedPitch.startSpeed ? `${selectedPitch.startSpeed} mph` : '-'}</div>
            <div><span className="pitch-detail-label">종속</span>{selectedPitch.endSpeed ? `${selectedPitch.endSpeed} mph` : '-'}</div>
            <div><span className="pitch-detail-label">타자</span>{selectedPitch.batterName}</div>
            <div><span className="pitch-detail-label">투수</span>{selectedPitch.pitcherName}</div>
            <div><span className="pitch-detail-label">이닝</span>{inningLabel(selectedPitch)}</div>
            <div><span className="pitch-detail-label">존</span>{selectedPitch.zone ?? '-'}</div>
            <div>
              <span className="pitch-detail-label">결과</span>
              {selectedPitch.inPlay ? '인플레이' : selectedPitch.strike ? '스트라이크' : '볼'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
