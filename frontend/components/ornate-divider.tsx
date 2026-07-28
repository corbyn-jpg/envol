import Svg, { Circle, Defs, G, Line, Path, Polygon, Use } from 'react-native-svg';

import { Colors } from '@/constants/theme';

type OrnateDividerProps = {
  color?: string;
  width?: number;
};

// Art Nouveau whiplash-curve motif: one hand-built half, mirrored around a
// center axis. Native viewBox is 800x120 — width/height just scale it.
export function OrnateDivider({ color = Colors.accent, width = 360 }: OrnateDividerProps) {
  const height = width * (120 / 800);

  return (
    <Svg width={width} height={height} viewBox="0 0 800 120" fill="none">
      <Defs>
        <G id="nouveau-half">
          {/* Main sweep (overlapping lines create an organic taper) */}
          <Path
            d="M 20 60 C 150 60, 220 30, 300 30"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            opacity={0.8}
          />
          <Path
            d="M 60 60 C 150 60, 220 30, 300 30"
            stroke={color}
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />

          {/* Whiplash knot (overlapping figure-eight) */}
          <Path
            d="M 300 30 C 350 30, 380 75, 340 90 C 295 105, 260 55, 300 40 C 330 30, 370 60, 400 60"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />

          {/* Over-sweep echo */}
          <Path
            d="M 200 45 C 250 45, 270 20, 330 15 C 360 12, 385 25, 400 25"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            opacity={0.9}
          />

          {/* Under-sweep echo */}
          <Path
            d="M 120 75 C 200 75, 300 95, 400 95"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            opacity={0.5}
          />

          {/* Delicate floating hairline */}
          <Path
            d="M 80 48 C 160 48, 210 20, 280 20"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
            opacity={0.7}
          />

          {/* Mucha-style terminal dots & nodes */}
          <Circle cx={200} cy={45} r={1.5} fill={color} />
          <Circle cx={120} cy={75} r={1} fill={color} opacity={0.6} />
          <Circle cx={80} cy={48} r={1} fill={color} opacity={0.8} />
          <Circle cx={280} cy={20} r={1} fill={color} opacity={0.8} />

          {/* Inner knot flourishing drop */}
          <Circle cx={295} cy={50} r={2.5} fill={color} />
          {/* Free-floating speck */}
          <Circle cx={370} cy={40} r={1.5} fill={color} opacity={0.7} />
        </G>
      </Defs>

      {/* Left branch */}
      <Use href="#nouveau-half" />
      {/* Right branch, mirrored */}
      <Use href="#nouveau-half" transform="scale(-1, 1) translate(-800, 0)" />

      {/* Center anchor axis binding the two halves */}
      <G>
        <Line x1={400} y1={10} x2={400} y2={110} stroke={color} strokeWidth={2} opacity={0.8} />

        <Polygon points="400,2 404,10 400,18 396,10" fill={color} />
        <Polygon points="400,102 404,110 400,118 396,110" fill={color} />

        <Circle cx={400} cy={60} r={7} fill="none" stroke={color} strokeWidth={2.5} />
        <Circle cx={400} cy={60} r={2.5} fill={color} />

        <Circle cx={400} cy={25} r={3} fill="none" stroke={color} strokeWidth={1} />
        <Circle cx={400} cy={25} r={1} fill={color} />

        <Circle cx={400} cy={95} r={2.5} fill="none" stroke={color} strokeWidth={1} opacity={0.6} />
      </G>
    </Svg>
  );
}
