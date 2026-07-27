/**
 * Envol has one fixed brand theme (Art Nouveau palette) — no light/dark split.
 */

export const Colors = {
  text: '#361A07', // Rich Brown
  background: '#D1D0C1', // Bone Cream
  primary: '#387A3F', // Firn Green
  accent: '#DABA51', // Old Gold
  tint: '#387A3F',
  icon: '#361A07',
  tabIconDefault: '#361A07',
  tabIconSelected: '#387A3F',
};

// Custom fonts loaded via useFonts in app/_layout.tsx — see @expo-google-fonts packages.
// Tinos stands in for Times New Roman: TNR is a Monotype-licensed font that can't be
// redistributed in an app bundle, and Tinos is Google's free, metric-compatible match for it.
export const Fonts = {
  heading: 'CinzelDecorative_700Bold',
  headingRegular: 'CinzelDecorative_400Regular',
  body: 'Cinzel_400Regular',
  bodySemiBold: 'Cinzel_600SemiBold',
  scientific: 'Tinos_400Regular_Italic',
};
