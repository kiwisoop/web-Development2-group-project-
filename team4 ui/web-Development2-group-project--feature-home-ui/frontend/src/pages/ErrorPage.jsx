import { Link } from 'react-router-dom';

export default function ErrorPage() {
  return (
    <div className="access-denied-page">
      <div className="card access-denied-card error-page">
        <div className="error-page-code">404</div>
        <h2 className="access-denied-msg">페이지를 찾을 수 없습니다.</h2>
        <p className="access-denied-sub">
          요청한 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="error-actions">
          <Link to="/" className="btn btn-primary">홈으로 이동</Link>
          <Link to="/matches" className="btn btn-outline">경기 목록으로 이동</Link>
        </div>
      </div>
    </div>
  );
}
