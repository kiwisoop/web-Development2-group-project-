import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import SoccerPage from '../pages/SoccerPage'
import VolleyballPage from '../pages/VolleyballPage'
import BasketballPage from '../pages/BasketballPage'
import EsportsPage from '../pages/EsportsPage'
import MatchDetailPage from '../pages/MatchDetailPage'
import FavoriteTeamsPage from '../pages/FavoriteTeamsPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/soccer" element={<SoccerPage />} />
          <Route path="/volleyball" element={<VolleyballPage />} />
          <Route path="/basketball" element={<BasketballPage />} />
          <Route path="/esports" element={<EsportsPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
          <Route path="/favorites" element={<FavoriteTeamsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
