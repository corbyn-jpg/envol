import Svg, { Circle, Defs, G, Path, Use } from 'react-native-svg';

import { Colors } from '@/constants/theme';

type OrnateDividerProps = {
  color?: string;
  width?: number;
};

// Art Nouveau whiplash-curve motif: one hand-built half, mirrored around a
// center axis. Native viewBox is 800x140 — width/height just scale it.
export function OrnateDivider({ color = Colors.accent, width = 240}: OrnateDividerProps) {
  const height = width * (140 / 800);

  return (
    <Svg width={width} height={height} viewBox="0 0 800 140" fill="none">
      <Defs>
        <G id="nouveau-half">
          {/* Faintest echo, just a whisper near the start */}
          <Path
            d="M 40 95 C 80 85, 105 62, 145 66"
            stroke={color}
            strokeWidth={1}
            strokeLinecap="round"
            fill="none"
            opacity={0.35}
          />

          {/* Softer companion sweep, tracing near the main line */}
          <Path
            d="M 25 75 C 95 108, 148 35, 235 62 C 275 74, 295 50, 320 55"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
            opacity={0.55}
          />

          {/* Small base flourish, a gentle loop near the outer edge */}
          <Path
            d="M 50 100 C 28 118, 25 140, 48 132"
            stroke={color}
            strokeWidth={1.25}
            strokeLinecap="round"
            fill="none"
            opacity={0.6}
          />

          {/* Small offshoot hook, branching off mid-sweep for whimsy */}
          <Path
            d="M 185 42 C 198 18, 226 15, 232 36 C 235 50, 218 55, 207 43"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
            opacity={0.75}
          />

          {/* Main whiplash sweep, easing into a small spiral curl */}
          <Path
            d="M 15 90 C 90 130, 150 20, 250 55 C 300 72, 320 40, 350 48 C 368 53, 375 68, 360 68 C 348 68, 348 55, 362 52"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />

          {/* Terminal dots & nodes */}
          <Circle cx={15} cy={90} r={2.5} fill={color} />
          <Circle cx={207} cy={43} r={1.5} fill={color} opacity={0.7} />
          <Circle cx={48} cy={132} r={1} fill={color} opacity={0.6} />
          <Circle cx={360} cy={68} r={2} fill={color} opacity={0.9} />
          {/* Inner curl flourishing drop */}
          <Circle cx={348} cy={55} r={3} fill={color} />
        </G>
      </Defs>

      {/* Left branch */}
      <Use href="#nouveau-half" />
      {/* Right branch, mirrored */}
      <Use href="#nouveau-half" transform="scale(-1, 1) translate(-800, 0)" />

      {/* Soft center jewel where the two curls meet */}
      <Circle cx={400} cy={58} r={6} fill="none" stroke={color} strokeWidth={1.25} opacity={0.8} />
      <Circle cx={400} cy={58} r={2.5} fill={color} />
    </Svg>
  );
}
