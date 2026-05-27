export default function LoadingState({ message = '불러오는 중...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}
