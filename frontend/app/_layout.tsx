import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Amarante_400Regular } from '@expo-google-fonts/amarante';
import { Arizonia_400Regular } from '@expo-google-fonts/arizonia';
import { Tinos_400Regular_Italic } from '@expo-google-fonts/tinos';
import { useFonts } from 'expo-font';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';

//Makes sure the splash screen doesn't auto hide
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

//Watches auth loading AND font loading — splash stays up until both are ready
function SplashScreenController() {
  const { loading: authLoading } = useAuth();
  const [fontsLoaded] = useFonts({
    Amarante_400Regular,
    Arizonia_400Regular,
    Tinos_400Regular_Italic,
  });

  if (!authLoading && fontsLoaded) {
    SplashScreen.hide();
  }

  return null;
}

//Ensures the user is authenticated before rooting
function RootNavigator() {
  const { user } = useAuth();
  const { primary } = useTheme();

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.background,
      card: Colors.background,
      text: Colors.text,
      primary,
      border: Colors.accent,
    },
  };

  return (
    //Wraps navigation theme in a component so that it can use the seasonal themes
    <NavigationThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Settings' }} />
          <Stack.Screen name="arena/entry-screen" options={{ headerShown: false }} />
          <Stack.Screen name="arena/active-screen" options={{ headerShown: false }} /><Stack.Screen name="species/detail-screen" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  //Ensures that screen orientation is portrait but only on set pages
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  return (
    //Wrapped in AuthProvider to use useAuth()
    <AuthProvider>
      <ThemeProvider>
        <SplashScreenController />
        <RootNavigator />
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}