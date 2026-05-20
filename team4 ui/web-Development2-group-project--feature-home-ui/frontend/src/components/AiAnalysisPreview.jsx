import AiAnalysisCard from './AiAnalysisCard';

export default function AiAnalysisPreview({ matchStatus, analysis, onGenerate, onRegenerate, generating }) {
  return (
    <div className="detail-section">
      <h2 className="detail-section-title">AI 경기 분석</h2>
      <div className="preview-grid">
        <AiAnalysisCard
          matchStatus={matchStatus}
          analysis={analysis}
          onGenerate={onGenerate}
          onRegenerate={onRegenerate}
          generating={generating}
        />
        <div className="preview-card card">
          <h3 className="preview-card-title">경기 전 승패 전망</h3>
          <p className="preview-card-desc">
            경기 전 승패 전망은 다음 단계에서 구현 예정입니다. 승률은 Gemini가 임의로 만들지 않고, 백엔드가 계산한 지표를 바탕으로 설명만 생성합니다.
          </p>
          <button className="btn btn-outline" disabled>승패 전망 준비 중</button>
        </div>
      </div>
    </div>
  );
}
