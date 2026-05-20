/**
 * 추천팀 맞춤 분석용 mock 데이터.
 *
 * 현재는 프론트엔드 mock 으로만 사용하지만, 추후 백엔드 API
 *   GET /api/users/me/recommended-teams
 * 의 응답(`ApiResponse<RecommendedTeam[]>`의 data 필드)으로 그대로 교체할 수 있도록
 * 실제 DB/API 응답과 비슷한 형태로 구조화했습니다.
 *
 * 필드 설명:
 * - id              : 추천팀 식별자 (DB PK 가정)
 * - teamName        : 팀 이름
 * - sport           : 종목 (SOCCER | BASEBALL | ESPORTS)
 * - sportLabel      : 화면 표시용 종목명
 * - league          : 리그 이름
 * - ranking         : 현재 순위/위치 (예: "리그 2위")
 * - nextMatch       : 다음 경기 정보 { opponent, dateTime }
 * - analysisStatus  : 분석 상태 (READY | IN_PROGRESS | PENDING)
 * - recentForm      : 최근 5경기 결과 배열 ('승' | '무' | '패')
 * - aiInsight       : AI 인사이트 요약
 * - keyPoint        : 핵심 관전 포인트
 * - riskFactor      : 리스크 요인
 * - alerts          : 알림/업데이트 메시지 배열
 */
export const recommendedTeamsMock = [
  {
    id: 1,
    teamName: 'LG 트윈스',
    sport: 'BASEBALL',
    sportLabel: '야구',
    league: 'KBO',
    ranking: '리그 2위',
    nextMatch: {
      opponent: '두산 베어스',
      dateTime: '오늘 18:30',
    },
    analysisStatus: 'READY',
    recentForm: ['승', '승', '패', '승', '승'],
    aiInsight:
      '최근 중심 타선의 출루율이 상승세이며, 선발 투수의 평균자책점도 안정적으로 유지되고 있습니다.',
    keyPoint: '득점권 타율과 선발 투수의 초반 이닝 안정성',
    riskFactor: '불펜진의 연투 누적으로 후반 실점 가능성 존재',
    alerts: ['새 분석이 업데이트되었습니다.', '다음 경기까지 2시간 남았습니다.'],
  },
  {
    id: 2,
    teamName: '토트넘',
    sport: 'SOCCER',
    sportLabel: '축구',
    league: 'EPL',
    ranking: '리그 4위',
    nextMatch: {
      opponent: '아스널',
      dateTime: '오늘 21:00',
    },
    analysisStatus: 'IN_PROGRESS',
    recentForm: ['승', '승', '무', '패', '승'],
    aiInsight:
      '측면 전개를 통한 득점 기대값이 높은 편이며, 최근 세트피스 상황에서의 결정력이 좋아졌습니다.',
    keyPoint: '빠른 역습 전환과 측면 크로스 정확도',
    riskFactor: '주전 수비수 결장 시 중앙 수비 조직력 약화',
    alerts: ['분석 생성이 진행 중입니다.'],
  },
  {
    id: 3,
    teamName: 'T1',
    sport: 'ESPORTS',
    sportLabel: 'E스포츠',
    league: 'LCK',
    ranking: '정규시즌 1위',
    nextMatch: {
      opponent: 'Gen.G',
      dateTime: '오늘 20:00',
    },
    analysisStatus: 'PENDING',
    recentForm: ['승', '승', '승', '패', '승'],
    aiInsight:
      '초반 라인전 주도권 확보 후 오브젝트 운영으로 이어지는 패턴이 안정적으로 자리잡았습니다.',
    keyPoint: '15분 골드 격차와 첫 오브젝트 획득률',
    riskFactor: '밴픽 단계에서 메타 외 픽 선택 시 변수 발생',
    alerts: ['경기 시작 전 분석이 곧 제공됩니다.'],
  },
];
