import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  color?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'scientific';
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

const styles = StyleSheet.create({
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
  title: {
    fontSize: 40,
    lineHeight: 74,
    fontFamily: Fonts.heading,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: Fonts.headingRegular,
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
