import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { getCurrentSeason } from '@/lib/season';
import { SeasonPrimaries, type Season } from '@/constants/theme';

type ThemePreference = 'auto' | Season;

//Context values of theme like the preference the user has
type ThemeContextValue = {
    primary: string;
    themePreference: ThemePreference;
    setThemePreference: (preference: ThemePreference) => Promise<void>;
};

//Creates a context using ThemeContextValue values or leaving it undefined
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>('auto');

    useEffect(() => {
        if(!user) return;
        //Unsubscribes user
        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
            const preference = snapshot.data()?.themePreference;
            if (preference) setThemePreferenceState(preference);
        });

        return unsubscribe;
    }, [user]);

    //Writes to Firestore then has the listener pick up and change the state
    async function setThemePreference(preference: ThemePreference) {
        if (!user) return;
        await updateDoc(doc(db, 'users', user.uid), { themePreference: preference});
    }

    const activeSeason = themePreference === 'auto' ? getCurrentSeason() : themePreference;
    const primary = SeasonPrimaries[activeSeason];

  return (
    <ThemeContext.Provider value={{ primary, themePreference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}