import { effectiveMatchStatus } from '../utils/matchStatus';

const STATUS_MAP = {
  SCHEDULED: { label: '예정', className: 'badge-scheduled' },
  PRE_GAME:  { label: '예정', className: 'badge-scheduled' },
  LIVE:      { label: 'LIVE', className: 'badge-live' },
  FINAL:     { label: '종료', className: 'badge-final' },
  CANCELLED: { label: '취소', className: 'badge-cancelled' },
  CANCELED:  { label: '취소', className: 'badge-cancelled' },
};

export default function StatusBadge({ status, match }) {
  const effective = match ? effectiveMatchStatus(match) : status;
  const config = STATUS_MAP[effective] || { label: effective ?? '알 수 없음', className: 'badge-default' };
  return <span className={`status-badge ${config.className}`}>{config.label}</span>;
}