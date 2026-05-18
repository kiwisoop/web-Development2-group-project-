export default function EmptyState({ title = '데이터가 없습니다', description = '' }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {description && <p className="empty-desc">{description}</p>}
    </div>
  );
}
