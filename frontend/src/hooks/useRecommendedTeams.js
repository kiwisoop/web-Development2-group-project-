import { useState, useEffect } from 'react';
import { getRecommendedTeams } from '../api/recommendApi';

/**
 * 추천팀(맞춤 분석) 목록을 불러오는 훅.
 *
 * 백엔드 GET /api/users/me/recommended-teams 를 호출하여 mock 대신 실제 데이터를 반환한다.
 * 반환 형태({ teams, loading })는 기존과 동일하게 유지한다.
 *
 * @param {boolean} enabled 조회 가능 여부(예: 로그인 상태). false 면 빈 목록을 반환한다.
 * @returns {{ teams: Array, loading: boolean }}
 */
export function useRecommendedTeams(enabled = true) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setTeams([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    getRecommendedTeams(controller.signal)
      .then((res) => {
        // ApiResponse<RecommendedTeam[]> → data 필드가 실제 배열
        setTeams(res.data?.data ?? []);
      })
      .catch((err) => {
        // 요청 취소(언마운트/재실행)는 무시
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        setTeams([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [enabled]);

  return { teams, loading };
}
