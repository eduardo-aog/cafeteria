// Bloqueo por rechazos seguidos (8.6): al llegar a `limit` rechazos se bloquea el reenvío durante
// `blockMinutes` y el contador vuelve a cero.
export function nextRejectionState(
  currentStreak: number,
  limit: number,
  blockMinutes: number,
  now: Date,
): { rejectionStreak: number; blockedUntil: Date | null } {
  const streak = currentStreak + 1
  if (streak >= limit) {
    return { rejectionStreak: 0, blockedUntil: new Date(now.getTime() + blockMinutes * 60_000) }
  }
  return { rejectionStreak: streak, blockedUntil: null }
}
