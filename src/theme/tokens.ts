/**
 * Tonight Design System — Token Layer
 * ─────────────────────────────────────
 * All raw values live here.
 * Never import tokens directly in components; use `theme` instead.
 */

// ─── Colors ───────────────────────────────────────────────────────────────────

export const colorTokens = {
  // Backgrounds
  bg: '#0B0B0F',
  surface: '#15151C',
  surfaceElevated: '#1D1D26',
  surfaceHighlight: '#232330',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#52525B',
  textInverse: '#0B0B0F',

  // Borders
  border: '#2A2A35',
  borderSubtle: '#1F1F2A',

  // Accent — Violet. Single brand color across the whole app.
  accent: '#8B5CF6',
  accentMuted: '#2D1F4E',
  accentForeground: '#FFFFFF',

  // Destructive
  destructive: '#EF4444',
  destructiveMuted: '#3B1010',

  // Success
  success: '#22C55E',

  // Vibe accent colors — used ONLY for vibe badges/indicators
  vibes: {
    funny: '#FACC15',      // amber-yellow
    party: '#EC4899',      // hot pink
    date: '#F97316',       // warm orange
    'deep-talk': '#3B82F6', // calm blue
    chaos: '#EF4444',      // red
    chill: '#22C55E',      // soft green
  },

  // Overlay
  overlay: 'rgba(0,0,0,0.6)',

  // Static
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radiusTokens = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

/** Font sizes in dp */
export const fontSizeTokens = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const fontWeightTokens = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

export const lineHeightTokens = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.6,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadowTokens = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  glow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ─── Animation ────────────────────────────────────────────────────────────────

export const durationTokens = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

export const easingNames = {
  standard: 'easeInOut',
  decelerate: 'easeOut',
  accelerate: 'easeIn',
} as const;

// ─── Motion ───────────────────────────────────────────────────────────────────

export const motionTokens = {
  duration: {
    instant: 120,
    fast: 220,
    normal: 320,
    slow: 450,
    celebration: 650,
  },
  scale: {
    pressed: 0.97,
    activeCard: 0.98,
    badge: 1.05,
  },
} as const;

// ─── Touch targets ────────────────────────────────────────────────────────────

export const touchTargetTokens = {
  sm: 36,
  md: 48,
  lg: 56,
} as const;
