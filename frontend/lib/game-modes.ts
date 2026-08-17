export type GameMode = 'sprint' | 'countdown';

export const COUNTDOWN_PRESETS = [
  { label: '30 minutes', seconds: 1800 },
  { label: '1 hour', seconds: 3600 },
  { label: '2 hours', seconds: 7200 },
];

// Sprint deliberately keeps the plain arena id as its key, so progress players have already saved still loads. Countdown gets its own key per duration
export function progressKey(
  arenaId: string,
  mode: GameMode,
  limitSeconds?: number | null,
): string {
  if (mode === 'sprint') return arenaId;
  return `${arenaId}_countdown_${limitSeconds}`;
}

export function formatTime(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}