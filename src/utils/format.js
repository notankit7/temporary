// "10 mins ago", "2 hours ago", "3 days ago"
export function timeAgo(date) {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(date)) / 1000));
  if (secs < 60) return 'just now';
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['min', 60],
  ];
  for (const [unit, size] of units) {
    const n = Math.floor(secs / size);
    if (n >= 1) return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  }
  return 'just now';
}

// "14:00"
export const clockTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
