import { useState } from 'react';
import { Link } from 'react-router-dom';
import './FeaturedMatches.css';

const STATUS_LABEL = {
  SCHEDULED: '예정',
  LIVE: '진행중',
  FINAL: '종료',
};

const STATUS_CLASS = {
  SCHEDULED: 'featured-status--scheduled',
  LIVE: 'featured-status--live',
  FINAL: 'featured-status--final',
};

const matchAnalysisGroups = [
  {
    sportKey: 'baseball',
    sportName: '야구',
    matches: [
      {
        id: 'b1',
        league: 'KBO',
        status: 'SCHEDULED',
        homeTeam: 'LG 트윈스',
        awayTeam: '두산 베어스',
        matchTime: '오늘 18:30',
        mainAnalysisPoint: '선발 투수와 타선 컨디션 분석',
        aiInsight:
          '선발 투수 기록과 중심 타선의 최근 출루율을 함께 비교하기 좋은 경기입니다.',
        homeRecentForm: ['승', '승', '패', '승', '승'],
        awayRecentForm: ['패', '승', '패', '승', '패'],
        keyMetrics: ['선발 ERA', '팀 타율', '최근 5경기 득점'],
        analysisAvailable: true,
      },
      {
        id: 'b2',
        league: 'MLB',
        status: 'FINAL',
        homeTeam: 'LA 다저스',
        awayTeam: '샌디에이고 파드리스',
        matchTime: '오늘 10:40',
        mainAnalysisPoint: '장타율과 불펜 안정성 비교',
        aiInsight:
          '양 팀의 후반 불펜 운영과 중심 타선의 장타 생산력이 승부를 갈랐습니다.',
        homeRecentForm: ['승', '패', '승', '승', '승'],
        awayRecentForm: ['패', '승', '패', '패', '승'],
        keyMetrics: ['장타율', '불펜 ERA', '득점권 타율'],
        analysisAvailable: true,
      },
      {
        id: 'b3',
        league: 'KBO',
        status: 'SCHEDULED',
        homeTeam: 'KIA 타이거즈',
        awayTeam: '삼성 라이온즈',
        matchTime: '오늘 19:00',
        mainAnalysisPoint: '최근 타선 흐름과 수비 안정성',
        aiInsight:
          '최근 득점 흐름과 실책 수를 함께 보면 경기 주도권을 예측하기 좋은 경기입니다.',
        homeRecentForm: ['승', '무', '승', '패', '승'],
        awayRecentForm: ['패', '패', '승', '승', '패'],
        keyMetrics: ['팀 OPS', '실책 수', '최근 5경기 득점'],
        analysisAvailable: true,
      },
    ],
  },
  {
    sportKey: 'football',
    sportName: '축구',
    matches: [
      {
        id: 'f1',
        league: 'EPL',
        status: 'SCHEDULED',
        homeTeam: '토트넘',
        awayTeam: '아스널',
        matchTime: '오늘 21:00',
        mainAnalysisPoint: '공격 전개와 득점 기대값 비교',
        aiInsight:
          '양 팀 모두 최근 득점 흐름이 좋아 공격 지표와 수비 전환 속도 비교가 중요한 경기입니다.',
        homeRecentForm: ['승', '승', '무', '패', '승'],
        awayRecentForm: ['승', '패', '승', '승', '무'],
        keyMetrics: ['최근 5경기 득점', '유효 슈팅 비율', '점유율 흐름'],
        analysisAvailable: true,
      },
      {
        id: 'f2',
        league: 'La Liga',
        status: 'FINAL',
        homeTeam: '바르셀로나',
        awayTeam: '레알 마드리드',
        matchTime: '어제 23:00',
        mainAnalysisPoint: '점유율과 공격 효율 분석',
        aiInsight:
          '점유율 대비 슈팅 전환율과 결정력 차이를 비교하기 좋은 경기입니다.',
        homeRecentForm: ['승', '승', '승', '무', '패'],
        awayRecentForm: ['승', '패', '승', '승', '승'],
        keyMetrics: ['점유율', '슈팅 전환율', '패스 성공률'],
        analysisAvailable: true,
      },
      {
        id: 'f3',
        league: 'UCL',
        status: 'SCHEDULED',
        homeTeam: '맨체스터 시티',
        awayTeam: 'PSG',
        matchTime: '내일 04:00',
        mainAnalysisPoint: '압박 강도와 전환 공격 비교',
        aiInsight:
          '중원 압박 이후 빠른 전환 공격이 승부의 핵심 포인트가 될 수 있습니다.',
        homeRecentForm: ['승', '승', '승', '승', '무'],
        awayRecentForm: ['패', '승', '승', '무', '승'],
        keyMetrics: ['압박 성공률', '역습 횟수', '기대 득점'],
        analysisAvailable: true,
      },
    ],
  },
  {
    sportKey: 'esports',
    sportName: 'E스포츠',
    matches: [
      {
        id: 'e1',
        league: 'Worlds',
        status: 'SCHEDULED',
        homeTeam: 'Hanwha Life Esports',
        awayTeam: 'G2 Esports',
        matchTime: '오늘 19:00',
        mainAnalysisPoint: '메타 챔피언 활용과 후반 운영',
        aiInsight:
          '대회 메타 챔피언 숙련도와 후반 한타 집중력이 승부의 핵심이 될 매치업입니다.',
        homeRecentForm: ['승', '승', '패', '승', '승'],
        awayRecentForm: ['패', '승', '패', '승', '승'],
        keyMetrics: ['평균 게임 시간', '바론 획득률', '한타 승률'],
        analysisAvailable: true,
      },
      {
        id: 'e2',
        league: 'LCK',
        status: 'LIVE',
        homeTeam: 'T1',
        awayTeam: 'Gen.G',
        matchTime: '현재 진행중',
        mainAnalysisPoint: '초반 주도권과 오브젝트 운영',
        aiInsight:
          '양 팀의 라인전 주도권과 드래곤, 전령 운영 차이를 분석하기 좋은 경기입니다.',
        homeRecentForm: ['승', '승', '승', '패', '승'],
        awayRecentForm: ['승', '패', '승', '승', '패'],
        keyMetrics: ['15분 골드 차이', '첫 오브젝트 획득률', '교전 승률'],
        analysisAvailable: true,
      },
      {
        id: 'e3',
        league: 'LCK',
        status: 'SCHEDULED',
        homeTeam: 'DK',
        awayTeam: 'KT Rolster',
        matchTime: '오늘 20:30',
        mainAnalysisPoint: '정글 동선과 라인 주도권 분석',
        aiInsight:
          '초반 정글 개입과 라인 주도권 확보 여부가 경기 흐름을 크게 좌우할 수 있습니다.',
        homeRecentForm: ['패', '승', '승', '패', '승'],
        awayRecentForm: ['승', '패', '승', '승', '패'],
        keyMetrics: ['첫 킬 획득률', '정글 관여율', '15분 포탑 골드'],
        analysisAvailable: true,
      },
    ],
  },
];

const FORM_CLASS = {
  승: 'form-win',
  무: 'form-draw',
  패: 'form-loss',
};

function FormRow({ teamName, results }) {
  return (
    <div className="form-row">
      <span className="form-team-name">{teamName}</span>
      <div className="form-badges">
        {results.map((r, i) => (
          <span key={i} className={`form-badge ${FORM_CLASS[r]}`}>
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function FeaturedMatches() {
  const [currentIndexes, setCurrentIndexes] = useState({
    baseball: 0,
    football: 0,
    esports: 0,
  });

  const handlePrev = (sportKey, total) => {
    setCurrentIndexes((prev) => ({
      ...prev,
      [sportKey]: (prev[sportKey] - 1 + total) % total,
    }));
  };

  const handleNext = (sportKey, total) => {
    setCurrentIndexes((prev) => ({
      ...prev,
      [sportKey]: (prev[sportKey] + 1) % total,
    }));
  };

  return (
    <section className="featured-matches">
      <div className="featured-head">
        <h2 className="section-title">오늘의 주요 경기</h2>
        <p className="featured-subtitle">
          야구, 축구, E스포츠의 주요 경기를 한눈에 확인하세요.
        </p>
      </div>

      <div className="featured-grid">
        {matchAnalysisGroups.map(({ sportKey, sportName, matches }) => {
          const total = matches.length;
          const idx = currentIndexes[sportKey] % total;
          const m = matches[idx];
          return (
            <article key={sportKey} className="featured-card">
              <div className="featured-card-top">
                <span className="featured-sport">{sportName}</span>
                <span className="featured-divider">·</span>
                <span className="featured-league">{m.league}</span>
                <span className={`featured-status ${STATUS_CLASS[m.status]}`}>
                  {STATUS_LABEL[m.status]}
                </span>
              </div>

              <div className="featured-teams">
                <span className="featured-team">{m.homeTeam}</span>
                <span className="featured-vs">vs</span>
                <span className="featured-team">{m.awayTeam}</span>
              </div>

              <div className="featured-time">{m.matchTime}</div>

              <div className="featured-analysis-point">{m.mainAnalysisPoint}</div>
              <p className="featured-insight">{m.aiInsight}</p>

              <div className="form-comparison">
                <div className="form-comparison-title">최근 5경기</div>
                <FormRow teamName={m.homeTeam} results={m.homeRecentForm} />
                <FormRow teamName={m.awayTeam} results={m.awayRecentForm} />
              </div>

              <ul className="featured-metrics">
                {m.keyMetrics.map((metric) => (
                  <li key={metric} className="featured-metric">
                    {metric}
                  </li>
                ))}
              </ul>

              <div className="featured-card-meta">
                {m.analysisAvailable && (
                  <span className="featured-analysis-badge">분석 가능</span>
                )}
                <span className="match-counter">
                  {idx + 1} / {total}
                </span>
              </div>

              <div className="featured-card-actions">
                <button
                  type="button"
                  className="match-nav-btn"
                  onClick={() => handlePrev(sportKey, total)}
                  aria-label={`이전 ${sportName} 경기 보기`}
                >
                  ←
                </button>
                <button type="button" className="featured-analysis-btn">
                  분석 보기
                </button>
                <button
                  type="button"
                  className="match-nav-btn"
                  onClick={() => handleNext(sportKey, total)}
                  aria-label={`다음 ${sportName} 경기 보기`}
                >
                  →
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="featured-cta">
        <Link
          to="/matches"
          className="btn btn-outline featured-view-all"
          aria-label="전체 경기 보기"
        >
          전체 경기 보기
        </Link>
      </div>
    </section>
  );
}
