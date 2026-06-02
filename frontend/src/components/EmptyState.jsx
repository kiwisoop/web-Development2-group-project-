export default function EmptyState({ title = '표시할 내용이 없습니다', description = '' }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {description && <p className="empty-desc">{description}</p>}
    </div>
  );
}
