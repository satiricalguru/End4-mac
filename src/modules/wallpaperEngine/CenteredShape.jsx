import React from 'react';

/**
 * Generates an SVG path for Material 3 Expressive Scallop / Cookie Shapes.
 * @param {number} sides - Number of scallops (e.g. 7, 9, 12, 16)
 * @param {number} radius - Base radius
 * @param {number} depth - Amplitude of the scalloped curves
 */
export function getScallopCookiePath(sides = 7, radius = 100, depth = 16) {
  const points = [];
  const totalSteps = sides * 2;

  for (let i = 0; i < totalSteps; i++) {
    const angle = (i * Math.PI * 2) / totalSteps - Math.PI / 2;
    const r = i % 2 === 0 ? radius + depth : radius - depth;
    points.push({
      x: radius + depth + r * Math.cos(angle),
      y: radius + depth + r * Math.sin(angle),
    });
  }

  // Generate smooth cubic bezier curves between points
  const center = radius + depth;
  const size = center * 2;

  let d = '';
  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length];
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const p3 = points[(i + 2) % points.length];

    const cp1x = p1.x + (p2.x - p0.x) * 0.18;
    const cp1y = p1.y + (p2.y - p0.y) * 0.18;
    const cp2x = p2.x - (p3.x - p1.x) * 0.18;
    const cp2y = p2.y - (p3.y - p1.y) * 0.18;

    if (i === 0) {
      d += `M ${p1.x},${p1.y} `;
    }
    d += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y} `;
  }
  d += 'Z';

  return { path: d, size };
}

/**
 * Centered Material 3 Shape Cutout / Backdrop.
 * Supports Cookie (7, 9, 12-sided), Clover, Flower, Circle, Diamond, Heart.
 */
export default function CenteredShape({
  shape = 'Cookie7Sided',
  size = 380,
  color = 'var(--md-primary-container)',
  opacity = 0.85,
  rotate = false,
}) {
  let sides = 7;
  if (shape === 'Cookie4Sided') sides = 4;
  else if (shape === 'Cookie6Sided') sides = 6;
  else if (shape === 'Cookie7Sided') sides = 7;
  else if (shape === 'Cookie9Sided') sides = 9;
  else if (shape === 'Cookie12Sided') sides = 12;
  else if (shape === 'Cookie16Sided') sides = 16;
  else if (shape === 'Flower') sides = 8;
  else if (shape === 'Clover4Leaf') sides = 4;

  const baseRadius = size / 2.6;
  const depth = shape === 'Flower' ? size * 0.12 : size * 0.06;
  const { path, size: svgSize } = getScallopCookiePath(sides, baseRadius, depth);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0px 12px 32px rgba(0, 0, 0, 0.25))',
      }}
    >
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        width={size}
        height={size}
        style={{
          animation: rotate ? 'spin 60s linear infinite' : 'none',
          transformOrigin: 'center',
        }}
      >
        <path d={path} fill={color} fillOpacity={opacity} />
      </svg>
    </div>
  );
}
