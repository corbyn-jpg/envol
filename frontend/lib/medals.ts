export type MedalId =
  | 'early-bird'
  | 'night-owl'
  | 'weekend-warrior'
  | 'speed-demon'
  | 'first-blood'
  | 'explorer'
  | 'comeback'
  | 'marathoner';

export type ArenaProgress = {
  arenaId: string;
  startedAt: Date | null;
  foundAt: Record<string, Date>;
};

export type RaceResultSummary = {
  arenaId: string;
  totalSeconds: number;
  completedAt: Date;
};

export type MedalContext = {
  raceResults: RaceResultSummary[];
  progressByArena: ArenaProgress[];
  // Arenas this user was the first person to fully complete.
  firstBloodArenaIds: Set<string>;
};

export type Medal = {
  id: MedalId;
  name: string;
  description: string;
  image: number;
  isEarned: (ctx: MedalContext) => boolean;
};

// 3 hours
const SPEED_DEMON_SECONDS = 3 * 60 * 60;
// 8 hours
const MARATHONER_SECONDS = 8 * 60 * 60;
const COMEBACK_GAP_DAYS = 7;

export const MEDALS: Medal[] = [
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Find a bird before 7am',
    image: require('@/assets/badges/Early Bird.png'),
    isEarned: (ctx) =>
      ctx.progressByArena.some((progress) =>
        Object.values(progress.foundAt).some((foundAt) => foundAt.getHours() < 7)
      ),
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Find a bird after 9pm',
    image: require('@/assets/badges/Night Owl.png'),
    isEarned: (ctx) =>
      ctx.progressByArena.some((progress) =>
        Object.values(progress.foundAt).some((foundAt) => foundAt.getHours() >= 21)
      ),
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Complete a race on a Saturday or Sunday',
    image: require('@/assets/badges/Weekend Warrior.png'),
    isEarned: (ctx) =>
      ctx.raceResults.some((result) => [0, 6].includes(result.completedAt.getDay())),
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete an arena in under 3 hours',
    image: require('@/assets/badges/Speed Demon.png'),
    isEarned: (ctx) => ctx.raceResults.some((result) => result.totalSeconds < SPEED_DEMON_SECONDS),
  },
  {
    id: 'first-blood',
    name: 'First Blood',
    description: 'Be the first person to complete an arena',
    image: require('@/assets/badges/First Blood.png'),
    isEarned: (ctx) => ctx.firstBloodArenaIds.size > 0,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Complete races in 3 or more different arenas',
    image: require('@/assets/badges/Explorer.png'),
    isEarned: (ctx) => new Set(ctx.raceResults.map((result) => result.arenaId)).size >= 3,
  },
  {
    id: 'comeback',
    name: 'Comeback',
    description: "Finish a race you'd left at partial progress for a week or more",
    image: require('@/assets/badges/Comeback.png'),
    isEarned: (ctx) =>
      ctx.raceResults.some((result) => {
        const progress = ctx.progressByArena.find((p) => p.arenaId === result.arenaId);
        if (!progress?.startedAt) return false;
        const gapDays =
          (result.completedAt.getTime() - progress.startedAt.getTime()) / (1000 * 60 * 60 * 24);
        return gapDays >= COMEBACK_GAP_DAYS;
      }),
  },
  {
    id: 'marathoner',
    name: 'Marathoner',
    description: 'Rack up 8+ cumulative hours of birding',
    image: require('@/assets/badges/Marathoner.png'),
    isEarned: (ctx) =>
      ctx.raceResults.reduce((sum, result) => sum + result.totalSeconds, 0) >= MARATHONER_SECONDS,
  },
];

export function getMedal(id: string | null | undefined): Medal | undefined {
  return MEDALS.find((medal) => medal.id === id);
}
