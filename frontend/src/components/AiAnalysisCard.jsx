function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AiAnalysisCard({ matchStatus, analysis, onGenerate, onRegenerate, generating }) {
  const status = analysis?.status || 'NOT_CREATED';
  const isFinal = matchStatus === 'FINAL';

  if (!isFinal) {
    return (
      <div className="analysis-card card">
        <h3 className="preview-card-title">경기 결과 분석</h3>
        <p className="analysis-placeholder">경기 결과 분석은 경기 종료 후 사용할 수 있습니다.</p>
        <button className="btn btn-outline" disabled>AI 분석 생성</button>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="analysis-card card">
        <h3 className="preview-card-title">경기 결과 분석</h3>
        <div className="analysis-loading">
          Groq AI가 분석 중입니다... (최대 45초 소요)
        </div>
      </div>
    );
  }

  if (status === 'DONE') {
    return (
      <div className="analysis-card card">
        <h3 className="preview-card-title">경기 결과 분석</h3>
        <span className="analysis-status-badge badge-done">분석 완료</span>
        {analysis.summaryText && (
          <div className="analysis-content-block">
            <strong>요약</strong>
            <p>{analysis.summaryText}</p>
          </div>
        )}
        {analysis.tacticalAnalysis && (
          <div className="analysis-content-block">
            <strong>전술 분석</strong>
            <p>{analysis.tacticalAnalysis}</p>
          </div>
        )}
        {analysis.keyPoint && (
          <div className="analysis-content-block">
            <strong>핵심 포인트</strong>
            <p>{analysis.keyPoint}</p>
          </div>
        )}
        {analysis.updatedAt && (
          <p className="analysis-meta">{formatDate(analysis.updatedAt)}</p>
        )}
        <div className="analysis-actions">
          <button className="btn btn-outline" onClick={onRegenerate} disabled={generating}>
            AI 분석 재생성
          </button>
        </div>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="analysis-card card">
        <h3 className="preview-card-title">경기 결과 분석</h3>
        <span className="analysis-status-badge badge-failed">분석 실패</span>
        {analysis.errorMessage && (
          <div className="analysis-error">{analysis.errorMessage}</div>
        )}
        <div className="analysis-actions">
          <button className="btn btn-outline" onClick={onGenerate} disabled={generating}>
            다시 생성
          </button>
        </div>
      </div>
    );
  }

  // NOT_CREATED + FINAL
  return (
    <div className="analysis-card card">
      <h3 className="preview-card-title">경기 결과 분석</h3>
      <p className="analysis-placeholder">이 경기에 대한 AI 분석이 아직 생성되지 않았습니다.</p>
      <div className="analysis-actions">
        <button className="btn btn-primary" onClick={onGenerate} disabled={generating}>
          AI 분석 생성
        </button>
      </div>
    </div>
  );
}
