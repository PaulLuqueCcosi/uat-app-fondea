'use client';

import { useId } from 'react';

interface Props {
  value: number; // 0–1
  ranges: Array<{ code: string; label: string; color: string }>;
}

export default function CreditGauge({ value, ranges }: Props) {
  const rawId = useId();
  const gradientId = `lc-gauge-grad-${rawId.replace(/:/g, '')}`;

  const cx = 100, cy = 100, r = 72, sw = 20;
  const angle = -180 + value * 180;
  const rad = (angle * Math.PI) / 180;
  const nx = cx + 58 * Math.cos(rad);
  const ny = cy + 58 * Math.sin(rad);

  const gradientStops = ranges.map((range, i) => {
    const offset = (i / Math.max(ranges.length - 1, 1)) * 100;
    return (
      <stop key={range.code} offset={`${offset}%`} stopColor={range.color} />
    );
  });

  return (
    <svg viewBox="0 0 200 108" width="180" height="98" aria-hidden="true">
      <defs>
        <linearGradient
          id={gradientId}
          x1="28" y1="100" x2="172" y2="100"
          gradientUnits="userSpaceOnUse"
        >
          {gradientStops}
        </linearGradient>
      </defs>
      {/* Track */}
      <path
        d={arc(cx, cy, r, -180, 0)}
        fill="none"
        stroke="#e5e5e5"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* Color arc */}
      <path
        d={arc(cx, cy, r, -180, 0)}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* Needle */}
      <line
        x1={cx} y1={cy} x2={nx} y2={ny}
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={7} fill="currentColor" />
      <circle cx={cx} cy={cy} r={3} fill="white" />
    </svg>
  );
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, a1: number, a2: number) {
  const s = polar(cx, cy, r, a2);
  const e = polar(cx, cy, r, a1);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 0 0 ${e.x} ${e.y}`;
}
