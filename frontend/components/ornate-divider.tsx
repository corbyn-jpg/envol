import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

type OrnateDividerProps = {
  color?: string;
  width?: number;
};

// A symmetric double-wave with a center dot, evoking Art Nouveau whiplash curves.
export function OrnateDivider({ color = Colors.accent, width = 200 }: OrnateDividerProps) {
  const midY = 14;
  const d = `M4 ${midY} C ${width * 0.28} 2, ${width * 0.38} 26, ${width * 0.5} ${midY} C ${width * 0.62} 2, ${width * 0.72} 26, ${width - 4} ${midY}`;

  return (
    <Svg width={width} height={28} viewBox={`0 0 ${width} 28`} fill="none">
      <Path d={d} stroke={color} strokeWidth={1.25} fill="none" />
      <Circle cx={width / 2} cy={midY} r={3.5} fill={color} />
    </Svg>
  );
}
