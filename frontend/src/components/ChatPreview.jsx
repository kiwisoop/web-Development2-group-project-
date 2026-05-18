export default function ChatPreview() {
  return (
    <div className="detail-section">
      <h2 className="detail-section-title">경기 채팅방</h2>
      <div className="preview-card card">
        <p className="preview-card-desc">
          팬들과 경기별로 대화할 수 있는 채팅방 기능은 추후 제공 예정입니다.
        </p>
        <button className="btn btn-outline" disabled>채팅방 준비 중</button>
      </div>
    </div>
  );
}
