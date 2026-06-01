import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import Layout from '../components/Layout';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import MatchListPage from '../pages/MatchListPage';
import MatchDetailPage from '../pages/MatchDetailPage';
import AnalysisPage from '../pages/AnalysisPage';
import FavoritesPage from '../pages/FavoritesPage';
import SettingsPage from '../pages/SettingsPage';
import SportsPage from '../pages/SportsPage';
import BaseballPage from '../pages/BaseballPage';
import EsportsPage from '../pages/EsportsPage';
import RankingsPage from '../pages/RankingsPage';
import SoccerOverviewPage from '../pages/SoccerOverviewPage';
import SoccerFixturesPage from '../pages/SoccerFixturesPage';
import SoccerFixtureDetailPage from '../pages/SoccerFixtureDetailPage';
import SoccerStandingsPage from '../pages/SoccerStandingsPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import ErrorPage from '../pages/ErrorPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 인증 페이지 — 사이드바 없는 풀스크린 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 메인 앱 — 사이드바 + 토픽바 */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="matches" element={<MatchListPage />} />
            <Route path="matches/:matchId" element={<MatchDetailPage />} />
            <Route path="analysis" element={<AnalysisPage />} />
            <Route path="favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="sports" element={<SportsPage />} />
            <Route path="sports/baseball" element={<BaseballPage />} />
            <Route path="sports/esports" element={<EsportsPage />} />
            <Route path="sports/soccer" element={<SoccerOverviewPage />} />
            <Route path="sports/:sportType" element={<SportsPage />} />
            <Route path="rankings" element={<Navigate to="/rankings/soccer" replace />} />
            <Route path="rankings/:sportType" element={<RankingsPage />} />
            <Route path="soccer" element={<Navigate to="/soccer/fixtures" replace />} />
            <Route path="soccer/fixtures" element={<SoccerFixturesPage />} />
            <Route path="soccer/fixtures/:fixtureId" element={<SoccerFixtureDetailPage />} />
            <Route path="soccer/standings" element={<SoccerStandingsPage />} />
            <Route path="admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="*" element={<ErrorPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
