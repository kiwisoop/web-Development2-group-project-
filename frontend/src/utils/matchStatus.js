// Defensive client-side classification — protects against rows that arrive
// with status=LIVE but a matchDate that's nowhere near the current time
// (stale seeds, half-finished syncs, etc.).
const LIVE_WINDOW_AFTER_START_MS = 4 * 60 * 60 * 1000;
const LIVE_WINDOW_BEFORE_START_MS = 10 * 60 * 1000;

export function effectiveMatchStatus(match, now = Date.now()) {
  if (!match) return null;
  const status = match.status;
  const ts = match.matchDate ? new Date(match.matchDate).getTime() : null;
  const hasScores = match.homeScore != null && match.awayScore != null;

  if (status === 'LIVE') {
    if (ts == null || Number.isNaN(ts)) return hasScores ? 'FINAL' : 'SCHEDULED';
    if (ts >= now - LIVE_WINDOW_AFTER_START_MS && ts <= now + LIVE_WINDOW_BEFORE_START_MS) {
      return 'LIVE';
    }
    if (ts > now + LIVE_WINDOW_BEFORE_START_MS) return 'SCHEDULED';
    return hasScores ? 'FINAL' : 'SCHEDULED';
  }
  return status;
}
