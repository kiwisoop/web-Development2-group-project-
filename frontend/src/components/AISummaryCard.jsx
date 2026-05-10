export default function AISummaryCard({ analysis, onGenerate, loading }) {
  return (
    <div className="card">
      <h3>AI Match Summary</h3>
      {!analysis && <p className="muted">No summary yet.</p>}
      {analysis && (
        <>
          <p>{analysis.summaryText}</p>
          <p><strong>Tactical:</strong> {analysis.tacticalAnalysis}</p>
          <p><strong>Key point:</strong> {analysis.keyPoint}</p>
        </>
      )}
      <button className="btn primary" onClick={onGenerate} disabled={loading}>
        {loading ? 'Generating...' : (analysis ? 'Regenerate' : 'Generate Summary')}
      </button>
      <p className="muted" style={{ marginTop: 8 }}>Mock generator (no real LLM yet).</p>
    </div>
  )
}
