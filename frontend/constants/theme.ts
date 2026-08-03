export type Season = 'summer' | 'winter' | 'autumn' | 'spring';

export const SeasonPrimaries: Record<Season, string> = {
  summer: '#387A3F',
  winter: '#1A1D67',
  autumn: '#660202',
  spring: '#dd2e80',
};


export const Colors = {
  text: '#361A07', // Rich Brown
  background: '#f0ebd4', // Bone Cream
  primary: '#387A3F', // Firn Green
  accent: '#c9a11f', // Old Gold
  tint: '#387A3F',
  icon: '#361A07',
  tabIconDefault: '#361A07',
  tabIconSelected: '#387A3F',
};

// Custom fonts loaded via useFonts in app/_layout.tsx — see @expo-google-fonts packages.
export const Fonts = {
  heading: 'Arizonia_400Regular',
  headingRegular: 'Arizonia_400Regular',
  body: 'Amarante_400Regular',
  bodySemiBold: 'Amarante_400Regular',
  scientific: 'Tinos_400Regular_Italic',
};
