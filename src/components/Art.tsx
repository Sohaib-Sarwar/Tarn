import type { Glyph } from '../lib/badges'

/**
 * Tarn's original art, drawn in SVG so it stays crisp, light and on palette. No generated images:
 * the project's Higgsfield budget was already used (docs/assets-v1.md).
 */

/** The mark: a sun rising over two peaks, mirrored in a still lake. */
export function TarnMark({ size = 28, className = '', tone = 'light' }: { size?: number; className?: string; tone?: 'light' | 'dark' }) {
  const water = tone === 'dark' ? '#faf8f2' : '#244b3a'
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
      <circle cx="16" cy="13.2" r="3.9" fill="#c6a66b" />
      <path d="M2.5 21.8 L10 9.6 L16 18.2 L21.6 12.6 L29.5 21.8 Z" fill={tone === 'dark' ? '#a7b99a' : '#788b68'} />
      <path d="M5 24.6 H27" stroke={water} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9.5 28 H22.5" stroke={water} strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.55" />
    </svg>
  )
}

export function Wordmark({ className = '', tone = 'light', size = 26 }: { className?: string; tone?: 'light' | 'dark'; size?: number }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <TarnMark size={size} tone={tone} />
      <span className={`serif text-[1.35rem] leading-none tracking-[0.01em] ${tone === 'dark' ? 'text-cream' : 'text-ink'}`}>Tarn</span>
    </span>
  )
}

/**
 * A mountain lake at dawn: layered ridges, mist, and the peaks mirrored in still water.
 * `dusk` is the low light version used by the Calm screen.
 */
export function Landscape({ className = '', variant = 'dawn' }: { className?: string; variant?: 'dawn' | 'dusk' }) {
  const dusk = variant === 'dusk'
  const sky = dusk ? ['#1c2b25', '#2c3f36', '#4a5a49'] : ['#efe2c6', '#f3ead6', '#f7f3ea']
  const ridge = dusk ? ['#3a4c41', '#2f4137', '#24352d', '#1c2b25'] : ['#cfd5c2', '#a7b99a', '#788b68', '#244b3a']
  const water = dusk ? '#22332b' : '#dfe6d6'
  const id = `tarn-${variant}`
  return (
    <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="0.55" stopColor={sky[1]} />
          <stop offset="1" stopColor={sky[2]} />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={dusk ? '#c6a66b' : '#efd6a0'} stopOpacity={dusk ? 0.55 : 1} />
          <stop offset="1" stopColor={dusk ? '#c6a66b' : '#efd6a0'} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-mist`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dusk ? '#2c3f36' : '#faf8f2'} stopOpacity="0" />
          <stop offset="1" stopColor={dusk ? '#2c3f36' : '#faf8f2'} stopOpacity={dusk ? 0.6 : 0.9} />
        </linearGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={water} />
          <stop offset="1" stopColor={dusk ? '#1c2b25' : '#c9d3bf'} />
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill={`url(#${id}-sky)`} />
      <circle cx="600" cy="250" r="190" fill={`url(#${id}-sun)`} />
      <circle cx="600" cy="262" r="46" fill={dusk ? '#c6a66b' : '#e4c88f'} opacity={dusk ? 0.35 : 0.85} />
      {/* far ridge */}
      <path d="M0 300 L120 250 L210 276 L330 200 L450 262 L540 232 L600 268 L660 226 L770 256 L880 196 L1000 262 L1100 238 L1200 270 V400 H0 Z" fill={ridge[0]} opacity="0.75" />
      <rect y="250" width="1200" height="110" fill={`url(#${id}-mist)`} />
      {/* the two peaks around the lake */}
      <path d="M0 360 L160 300 L300 330 L440 214 L560 318 L600 300 L640 318 L760 214 L900 330 L1040 300 L1200 352 V420 H0 Z" fill={ridge[1]} />
      <rect y="320" width="1200" height="70" fill={`url(#${id}-mist)`} opacity="0.7" />
      <path d="M0 392 Q300 352 600 384 T1200 378 V430 H0 Z" fill={ridge[2]} />
      {/* the tarn */}
      <rect y="410" width="1200" height="190" fill={`url(#${id}-water)`} />
      <g opacity={dusk ? 0.35 : 0.28}>
        <path d="M160 410 L300 440 L440 506 L560 446 L600 456 L640 446 L760 506 L900 440 L1040 410 Z" fill={ridge[1]} />
      </g>
      <circle cx="600" cy="520" r="30" fill={dusk ? '#c6a66b' : '#e4c88f'} opacity={dusk ? 0.12 : 0.35} />
      <g stroke={dusk ? '#a7b99a' : '#faf8f2'} strokeLinecap="round" strokeOpacity={dusk ? 0.25 : 0.7}>
        <path d="M420 470 H560" strokeWidth="2" />
        <path d="M640 492 H820" strokeWidth="2" />
        <path d="M300 530 H420" strokeWidth="1.5" />
        <path d="M760 552 H880" strokeWidth="1.5" />
      </g>
      {/* near shore with a path */}
      <path d="M0 560 Q240 528 520 552 T1200 540 V600 H0 Z" fill={ridge[3]} />
      <path d="M560 600 C 570 584, 640 578, 620 566" fill="none" stroke={dusk ? '#a7b99a' : '#efe2c6'} strokeWidth="8" strokeLinecap="round" opacity={dusk ? 0.25 : 0.8} />
    </svg>
  )
}

/** Quiet botanical line art for empty states. */
export function Sprig({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" className={className} aria-hidden focusable="false" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M60 156 C 58 120, 64 80, 60 20" />
      <path d="M60 120 C 40 112, 30 98, 28 84 C 44 88, 56 100, 60 120 Z" />
      <path d="M61 96 C 80 90, 90 76, 92 62 C 76 66, 64 78, 61 96 Z" />
      <path d="M60 70 C 46 64, 40 52, 40 40 C 52 44, 58 56, 60 70 Z" />
      <path d="M60 46 C 70 40, 76 30, 76 20 C 66 24, 61 34, 60 46 Z" />
    </svg>
  )
}

const GLYPHS: Record<Glyph, string> = {
  step: 'M7 17.5c0-1.7 1.6-2.5 3-2.5s3 .8 3 2.5-1.3 2.5-3 2.5-3-.8-3-2.5Z M12.5 10c0-1.4 1.3-2 2.5-2s2.5.6 2.5 2-1.1 2-2.5 2-2.5-.6-2.5-2Z M16 6.5V4 M16 4c1-1 2.2-1.3 3-1',
  sun: 'M4 17h16 M7.5 17a4.5 4.5 0 0 1 9 0 M12 8.5V7 M7.4 10.4 6.3 9.3 M16.6 10.4l1.1-1.1 M5 13.6H3.6 M19 13.6h1.4',
  anchor: 'M12 7.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z M12 7.5V20 M8 11h8 M5 14.5c.6 3.4 3.4 5.5 7 5.5s6.4-2.1 7-5.5',
  root: 'M12 4v9 M12 8c-2.2-.2-3.6-1.5-4-3.5 2.2 0 3.6 1.2 4 3.5Z M12 7c2-.2 3.3-1.3 3.7-3 M4 13h16 M12 13c0 2.5-1.6 3.6-3.5 4.5 M12 13c0 3 1.2 4.4 3.3 5.5 M12 13v7',
  stones: 'M6 19.5h12c.8 0 1.2-.9.7-1.5C17.5 16.8 15 16 12 16s-5.5.8-6.7 2c-.5.6-.1 1.5.7 1.5Z M8.2 15.7c.3-1.7 1.9-2.7 3.8-2.7s3.5 1 3.8 2.7 M9.7 12.8c.2-1.3 1.1-2 2.3-2s2.1.7 2.3 2 M12 10.8V9.5',
  ripple: 'M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
  peak: 'M3 19l6.5-10 3.5 5 2.5-3.5L21 19Z M9.5 9l1.6 2.4 M15.5 10.5V5 M15.5 5l3 1.2-3 1.2',
  path: 'M9 20c0-2.5 6-2.8 6-5.5S9 11.5 9 9s3-3 3-5 M6 20h2 M16 20h2 M4 13h2 M18 9h2',
  tree: 'M12 20v-6 M12 14c-4 0-6-2.2-6-5s2.7-5 6-5 6 2.2 6 5-2 5-6 5Z M9 20h6 M12 14l-2.5-2.5 M12 12.5l2-2',
  mountain: 'M2.5 19 9 9l3 4.5L15 9.5l6.5 9.5Z M9 9l1.3 2 M15 9.5l1.2 1.8 M17.5 5.5a1.5 1.5 0 1 0 0-.1',
  wave: 'M3 14c2.2 0 2.2-2 4.5-2s2.3 2 4.5 2 2.3-2 4.5-2 2.3 2 4.5 2 M3 18c2.2 0 2.2-2 4.5-2s2.3 2 4.5 2 2.3-2 4.5-2 2.3 2 4.5 2 M12 9c1.5-1.5 2-3.5 1.5-5.5',
  lantern: 'M9 6h6 M10 6V4.5h4V6 M8 8c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2Z M12 10.5c.9.8 1.2 1.6.8 2.5-.3.6-1.3.6-1.6 0-.4-.9-.1-1.7.8-2.5Z M9 17v2.5h6V17',
  leaf: 'M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z M5 19 14 10',
  return: 'M19 12a7 7 0 1 1-2.1-5 M17 3.5V7h-3.5',
  breath: 'M3 9h10a2.5 2.5 0 1 0-2.5-2.5 M3 13h14a2.5 2.5 0 1 1-2.5 2.5 M3 17h6',
  flame: 'M12 20c3.3 0 5.5-2.2 5.5-5.2 0-3.3-2.6-5.4-3.6-8.8-1.4 1.6-1.8 3.2-1.6 4.7C11 9.6 9.7 8.4 9.3 6.5 7.4 8.6 6.5 11.2 6.5 14.8 6.5 17.8 8.7 20 12 20Z M12 20c-1.4 0-2.3-.9-2.3-2.2 0-1.5 1.2-2.4 2.3-3.8 1.1 1.4 2.3 2.3 2.3 3.8 0 1.3-.9 2.2-2.3 2.2Z',
}

export function BadgeEmblem({ glyph, earned, size = 64, progress = 0 }: { glyph: Glyph; earned: boolean; size?: number; progress?: number }) {
  const r = 28
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden focusable="false">
      <circle cx="32" cy="32" r="30" fill={earned ? '#efe4cc' : '#ebe7dc'} />
      <circle cx="32" cy="32" r={r} fill="none" stroke={earned ? '#c6a66b' : '#d8d4c8'} strokeWidth="2" />
      {!earned && progress > 0 && (
        <circle cx="32" cy="32" r={r} fill="none" stroke="#788b68" strokeWidth="2" strokeLinecap="round" strokeDasharray={`${c * progress} ${c}`} transform="rotate(-90 32 32)" />
      )}
      <g transform="translate(16 16) scale(1.333)">
        <path d={GLYPHS[glyph]} fill="none" stroke={earned ? '#244b3a' : '#8c9483'} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
