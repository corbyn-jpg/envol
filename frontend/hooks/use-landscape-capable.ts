import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';

// Lets the screen that calls this rotate freely while it's on screen, then restores the app's portrait-only default the moment you navigate away.

export function useLandscapeCapable() {
  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.unlockAsync();

      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
    }, [])
  );
}
