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
// Amarante and Arizonia only ship one weight each (400 Regular) — there's no bold/semibold
// variant, so both roles below point at the same weight.
export const Fonts = {
  heading: 'Arizonia_400Regular',
  headingRegular: 'Arizonia_400Regular',
  body: 'Amarante_400Regular',
  bodySemiBold: 'Amarante_400Regular',
  scientific: 'Tinos_400Regular_Italic',
};
