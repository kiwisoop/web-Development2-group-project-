import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, isLoggedIn, isAdmin, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">Sport Analysis Dashboard</Link>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/matches">Matches</Link>
          <Link to="/rankings/soccer">Rankings</Link>
          <Link to="/sports/soccer">Sports</Link>
          <Link to="/favorites">Favorites</Link>
          {isAdmin && <Link to="/admin">Admin</Link>}
          {isAdmin && <Link to="/admin/api-test">API 테스트</Link>}
        </nav>
        <div className="auth-section">
          {isLoggedIn ? (
            <>
              <span className="username">{user?.nickname || user?.username}</span>
              <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
