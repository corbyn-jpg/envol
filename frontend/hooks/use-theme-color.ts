import { Colors } from '@/constants/theme';

export function useThemeColor(colorOverride: string | undefined, colorName: keyof typeof Colors) {
  return colorOverride ?? Colors[colorName];
}
