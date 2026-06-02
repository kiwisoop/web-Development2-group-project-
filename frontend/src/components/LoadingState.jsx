export default function LoadingState({ message = '잠시만 기다려 주세요.' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}
