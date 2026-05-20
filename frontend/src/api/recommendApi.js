import axiosInstance from './axiosInstance';

/**
 * 로그인 사용자의 추천팀(맞춤 분석) 목록 조회.
 *   GET /api/users/me/recommended-teams
 * 응답: ApiResponse<RecommendedTeam[]> (res.data.data 에 배열)
 */
export const getRecommendedTeams = (signal) =>
  axiosInstance.get('/users/me/recommended-teams', { signal });
