import { Link } from 'react-router-dom';

export default function NotificationsPage() {
  return (
    <div className="sl-card" style={{ padding: 48, textAlign: 'center' }}>
      <h1 className="sl-page-title" style={{ marginBottom: 10 }}>알림</h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 520, margin: '0 auto 22px' }}>
        현재 프로젝트에는 알림 저장/조회 API가 없어서 더미 알림 목록을 표시하지 않습니다.
        실제 알림 기능이 추가되면 이 화면을 다시 연결하면 됩니다.
      </p>
      <Link to="/matches" className="btn btn-primary" style={{ display: 'inline-flex' }}>
        경기 일정 보기
      </Link>
    </div>
  );
}
