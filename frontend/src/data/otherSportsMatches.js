// 축구(SOCCER)·E스포츠(ESPORTS)는 DB/API로 옮기지 않고 기존 표시 방식(mock)을 유지한다.
// 야구만 /api/matches/sections 기반으로 동작하므로, 다른 종목은 여기서 정적으로 제공한다.
// 형태는 match API 응답과 동일하게 맞춰 두 컴포넌트의 기존 렌더 로직을 그대로 재사용한다.
// isMock 플래그로 실제 경기 상세(/matches/:id)가 없는 항목임을 표시한다.

export const SOCCER_MOCK = [
  {
    id: 'mock-soccer-1',
    isMock: true,
    sportType: 'SOCCER',
    status: 'FINAL',
    league: { leagueName: 'EPL' },
    homeTeam: { teamName: '아스널' },
    awayTeam: { teamName: '토트넘' },
    homeScore: 2,
    awayScore: 2,
    matchDate: '2026-05-21T04:00:00',
    venue: '에미레이츠 스타디움',
  },
  {
    id: 'mock-soccer-2',
    isMock: true,
    sportType: 'SOCCER',
    status: 'FINAL',
    league: { leagueName: 'La Liga' },
    homeTeam: { teamName: '레알 마드리드' },
    awayTeam: { teamName: '바르셀로나' },
    homeScore: 1,
    awayScore: 3,
    matchDate: '2026-05-20T05:00:00',
    venue: '산티아고 베르나베우',
  },
];

export const ESPORTS_MOCK = [
  {
    id: 'mock-esports-1',
    isMock: true,
    sportType: 'ESPORTS',
    status: 'FINAL',
    league: { leagueName: 'LCK' },
    homeTeam: { teamName: 'Gen.G' },
    awayTeam: { teamName: 'T1' },
    homeScore: 1,
    awayScore: 2,
    matchDate: '2026-05-21T10:00:00',
    venue: 'LoL Park',
  },
  {
    id: 'mock-esports-2',
    isMock: true,
    sportType: 'ESPORTS',
    status: 'SCHEDULED',
    league: { leagueName: 'Worlds' },
    homeTeam: { teamName: 'G2 Esports' },
    awayTeam: { teamName: 'Hanwha Life Esports' },
    homeScore: null,
    awayScore: null,
    matchDate: '2026-05-22T19:00:00',
    venue: null,
  },
];
