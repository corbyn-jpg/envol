import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Cinzel_400Regular, Cinzel_600SemiBold } from '@expo-google-fonts/cinzel';
import {
  CinzelDecorative_400Regular,
  CinzelDecorative_700Bold,
} from '@expo-google-fonts/cinzel-decorative';
import { Tinos_400Regular_Italic } from '@expo-google-fonts/tinos';
import { useFonts } from 'expo-font';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

//Makes sure the splash screen doesn't auto hide
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

const EnvolNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    primary: Colors.primary,
    border: Colors.accent,
  },
};

//Watches auth loading AND font loading — splash stays up until both are ready
function SplashScreenController() {
  const { loading: authLoading } = useAuth();
  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_600SemiBold,
    CinzelDecorative_400Regular,
    CinzelDecorative_700Bold,
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

  return (
    <Stack>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack.Protected>

      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    //Wrapped in AuthProvider to use useAuth()
    <AuthProvider>
      <ThemeProvider value={EnvolNavigationTheme}>
        <SplashScreenController />
        <RootNavigator />
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}
