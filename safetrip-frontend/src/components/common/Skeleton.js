import React from 'react';
import './Skeleton.css';

/**
 * Skeleton placeholder for loading states - modern alternative to spinners.
 */
const Skeleton = ({ width, height, borderRadius = 'var(--radius)', className = '' }) => (
  <div
    className={`skeleton ${className}`}
    style={{
      width: width || '100%',
      height: height || '1rem',
      borderRadius,
    }}
    aria-hidden
  />
);

export default Skeleton;
