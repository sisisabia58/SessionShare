import React from 'react';
interface LogoProps {
  className?: string;
  /** Size of the monogram mark in pixels */
  size?: number;
  /** Show the "Session Share" wordmark next to the mark */
  showWordmark?: boolean;
  /** Tailwind classes for the wordmark text */
  wordmarkClassName?: string;
  /** Whether the mark should react to a parent `group` hover */
  interactive?: boolean;
}
/**
 * Session Share brand mark — an artistic interlocking double-"S" monogram.
 * Two mirrored S strokes weave together inside a rounded-square badge.
 */
export function Logo({
  className = '',
  size = 36,
  showWordmark = true,
  wordmarkClassName = 'font-extrabold text-xl tracking-tight',
  interactive = true
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        role="img"
        aria-label="Session Share logo"
        className={
        interactive ?
        'transition-transform duration-300 group-hover:scale-105' :
        ''
        }>
        
        <rect
          x="1.5"
          y="1.5"
          width="45"
          height="45"
          rx="13"
          stroke="currentColor"
          strokeWidth="3"
          className={
          interactive ?
          'transition-colors duration-300 group-hover:stroke-lime-400' :
          ''
          } />
        
        {/* Back S — accent */}
        <path
          d="M31 16.5c-1.6-1.8-4-2.9-6.7-2.9-3.7 0-6.6 2.1-6.6 5.2 0 3 2.4 4.2 6 4.9"
          stroke="#D4FF00"
          strokeWidth="3.4"
          strokeLinecap="round" />
        
        {/* Front S — white, mirrored to interlock */}
        <path
          d="M17 31.5c1.6 1.8 4 2.9 6.7 2.9 3.7 0 6.6-2.1 6.6-5.2 0-3-2.4-4.2-6-4.9"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          className={interactive ? 'transition-colors duration-300' : ''} />
        
      </svg>
      {showWordmark && <span className={wordmarkClassName}>Session Share</span>}
    </span>);

}