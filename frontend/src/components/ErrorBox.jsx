export default function ErrorBox({ message }) {
  const text = message || '요청 처리 중 오류가 발생했습니다.';
  return (
    <div className="error-box">
      <p>{text}</p>
    </div>
  );
}
