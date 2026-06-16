import React from 'react';

// variant: '20' or '64' appends suffix before .png
// e.g. name="cat-eat" variant="64" → /icons/cat-eat-64.png
// without variant → /icons/cat-eat.png
export default function PixelIcon({ name, size = 20, variant }) {
  if (!name) return null;
  const file = variant ? `${name}-${variant}.png` : `${name}.png`;
  return (
    <img src={`/icons/${file}`} alt={name}
      style={{ width: size, height: size, verticalAlign: 'middle' }} />
  );
}
