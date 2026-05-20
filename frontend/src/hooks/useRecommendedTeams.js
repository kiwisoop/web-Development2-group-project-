import { useState, useEffect } from 'react';
import { recommendedTeamsMock } from '../data/recommendedTeamsMock';

/**
 * 추천팀(맞춤 분석) 목록을 불러오는 훅.
 *
 * 현재는 mock 데이터를 반환하지만, 추후 백엔드 연동 시 아래 TODO 위치에서
 *   GET /api/users/me/recommended-teams
 * 를 호출하도록 교체하면 됩니다. 반환 형태(teams 배열)는 그대로 유지합니다.
 *
 * @param {boolean} enabled 조회 가능 여부(예: 로그인 상태). false 면 빈 목록을 반환합니다.
 * @returns {{ teams: Array, loading: boolean }}
 */
export function useRecommendedTeams(enabled = true) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    let active = true;

    async function load() {
      // TODO: 실제 API 연동 시 아래 mock 대신 axios 호출로 교체
      //   const res = await getRecommendedTeams();
      //   const data = res.data.data;
      const data = await Promise.resolve(enabled ? recommendedTeamsMock : []);
      if (!active) return;
      setTeams(data);
      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [enabled]);

  return { teams, loading };
}
