import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type RaceContextValue = {
  arenaId: string | null;
  totalElapsedSeconds: number;
  startRace: (arenaId: string, accumulatedSeconds: number) => void;
  stopRace: () => void;
};

const RaceContext = createContext<RaceContextValue | undefined>(undefined);

export function RaceProvider({ children }: { children: ReactNode }) {
  const [arenaId, setArenaId] = useState<string | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);

  //Starts the race
  function startRace(newArenaId: string, startingAccumulatedSeconds: number) {
    setArenaId(newArenaId);
    setAccumulatedSeconds(startingAccumulatedSeconds);
    setSessionStartTime(Date.now());
    setSessionElapsedSeconds(0);
  }

  function stopRace() {
    setArenaId(null);
    setSessionStartTime(null);
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

  return (
    <RaceContext.Provider value={{ arenaId, totalElapsedSeconds, startRace, stopRace }}>
      {children}
    </RaceContext.Provider>
  );
}

export function useRace() {
  const context = useContext(RaceContext);
  if (!context) throw new Error('useRace must be used inside RaceProvider');
  return context;
}