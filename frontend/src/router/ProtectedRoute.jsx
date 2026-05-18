import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingState from '../components/LoadingState';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return <LoadingState />;

  if (!isLoggedIn) {
    return (
      <div className="access-denied-page">
        <div className="card access-denied-card">
          <h2 className="access-denied-msg">로그인이 필요한 페이지입니다.</h2>
          <p className="access-denied-sub">해당 기능을 사용하려면 먼저 로그인해 주세요.</p>
          <div className="error-actions">
            <Link to="/login" className="btn btn-primary">로그인 페이지로 이동</Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
