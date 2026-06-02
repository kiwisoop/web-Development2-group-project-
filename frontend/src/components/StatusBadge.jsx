const STATUS_MAP = {
  SCHEDULED: { label: '예정', className: 'badge-scheduled' },
  LIVE: { label: 'LIVE', className: 'badge-live' },
  FINAL: { label: '종료', className: 'badge-final' },
  CANCELLED: { label: '취소', className: 'badge-cancelled' },
  CANCELED: { label: '취소', className: 'badge-cancelled' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || { label: '상태 확인 중', className: 'badge-default' };
  return <span className={`status-badge ${config.className}`}>{config.label}</span>;
}
