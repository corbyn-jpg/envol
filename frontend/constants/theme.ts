
export type Season = 'summer' | 'winter' | 'autumn' | 'spring';

export const SeasonPrimaries: Record<Season, string> = {
  summer: '#407700',
  winter: '#3A5987',
  autumn: '#680303',
  spring: '#F15D73',
};


// Caps how wide page content grows. Without it, landscape and tablet layouts
// stretch rows and cards across the whole viewport and read as broken.
export const Layout = {
  contentMaxWidth: 560,
};

export const Colors = {
  text: '#361A07',
  background: '#f0ebd4',
  accent: '#FBCE3D',
  icon: '#361A07',
  tabIconDefault: '#361A07',
};

// Custom fonts loaded via useFonts in app/_layout.tsx — see @expo-google-fonts packages.
// Cinzel Decorative has three real weights, used deliberately to build a
// heading hierarchy: 900 for the wordmark, 700 for prominent headings,
// 400 for secondary ones — rather than one weight doing every job.
export const Fonts = {
  display: 'CinzelDecorative_900Black',
  heading: 'CinzelDecorative_700Bold',
  headingRegular: 'CinzelDecorative_400Regular',
  body: 'Amarante_400Regular',
  bodySemiBold: 'Amarante_400Regular',
  scientific: 'Tinos_400Regular_Italic',
};
