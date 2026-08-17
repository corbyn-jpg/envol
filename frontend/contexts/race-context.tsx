import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { GameMode } from '@/lib/game-modes';

type RaceContextValue = {
  arenaId: string | null;
  mode: GameMode;
  limitSeconds: number | null;
  totalElapsedSeconds: number;
  remainingSeconds: number | null;
  isPaused: boolean;
  startRace: (
    arenaId: string,
    mode: GameMode,
    limitSeconds: number | null,
    accumulatedSeconds: number,
  ) => void;
  pauseRace: () => void;
  resumeRace: () => void;
  stopRace: () => void;
};

const RaceContext = createContext<RaceContextValue | undefined>(undefined);

export function RaceProvider({ children }: { children: ReactNode }) {
  const [arenaId, setArenaId] = useState<string | null>(null);
  const [mode, setMode] = useState<GameMode>('sprint');
  const [limitSeconds, setLimitSeconds] = useState<number | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);

  //Starts the race
  function startRace(
    newArenaId: string,
    newMode: GameMode,
    newLimitSeconds: number | null,
    startingAccumulatedSeconds: number,
  ) {
    setArenaId(newArenaId);
    setMode(newMode);
    setLimitSeconds(newLimitSeconds);
    setAccumulatedSeconds(startingAccumulatedSeconds);
    setSessionStartTime(Date.now());
    setSessionElapsedSeconds(0);
  }

  //Banks the time run so far, then clears the start time so the ticker stops
  function pauseRace() {
    setAccumulatedSeconds(accumulatedSeconds + sessionElapsedSeconds);
    setSessionElapsedSeconds(0);
    setSessionStartTime(null);
  }

  //Starts a fresh session on top of the banked time
  function resumeRace() {
    setSessionElapsedSeconds(0);
    setSessionStartTime(Date.now());
  }

  function stopRace() {
    setArenaId(null);
    setSessionStartTime(null);
    setMode('sprint');
    setLimitSeconds(null);
  }

  useEffect(() => {
    if (!sessionStartTime) return;

    //Works out how much time passed
    const interval = setInterval(() => {
      setSessionElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const totalElapsedSeconds = accumulatedSeconds + sessionElapsedSeconds;

  //Null in Sprint — there's nothing to count down to
  const remainingSeconds =
    limitSeconds === null ? null : Math.max(0, limitSeconds - totalElapsedSeconds);

  //A race is in progress but the ticker isn't running — no extra state needed
  const isPaused = arenaId !== null && sessionStartTime === null;

  return (
    <RaceContext.Provider
      value={{
        arenaId,
        mode,
        limitSeconds,
        totalElapsedSeconds,
        remainingSeconds,
        isPaused,
        startRace,
        pauseRace,
        resumeRace,
        stopRace,
      }}
    >
      {children}
    </RaceContext.Provider>
  );
}

export function useRace() {
  const context = useContext(RaceContext);
  if (!context) throw new Error('useRace must be used inside RaceProvider');
  return context;
}