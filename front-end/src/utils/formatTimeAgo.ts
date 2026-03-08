/**
 * Formats an ISO date string as a human-readable relative time.
 * e.g. "just now", "5m ago", "3h ago", "2d ago"
 */
export function formatTimeAgo(isoString: string): string {
  if (!isoString) return 'unknown';
  const ms = Date.now() - new Date(isoString).getTime();
  if (isNaN(ms)) return 'unknown';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
