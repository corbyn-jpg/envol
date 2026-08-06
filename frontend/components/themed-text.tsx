import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  color?: string;
  type?: 'default' | 'display' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'scientific';
};

export function ThemedText({
  style,
  color: colorOverride,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor(colorOverride, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'display' ? styles.display : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'scientific' ? styles.scientific : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

// Type scale, tallest to shortest — three heading tiers built from Cinzel
// Decorative's three real weights (900/700/400), each roughly 1.4x lineHeight
// for its fontSize. That ratio is tighter than the one this project used for
// earlier script fonts (Arizonia/Tangerine) on purpose: Cinzel Decorative's
// letterforms don't have their tall connecting loops, so it needs far less
// vertical headroom to avoid clipping.
const styles = StyleSheet.create({
  display: {
    fontSize: 42,
    lineHeight: 58,
    fontFamily: Fonts.display,
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    lineHeight: 36,
    fontFamily: Fonts.heading,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: Fonts.headingRegular,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.body,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.bodySemiBold,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    fontFamily: Fonts.body,
    color: '#0a7ea4',
  },
  scientific: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.scientific,
  },
});
