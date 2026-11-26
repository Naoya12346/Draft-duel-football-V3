/** Design tokens: legacy aliases + Material 3 (Material You) dark-game roles. */

export const C = {
  bg: '#050816',
  bgDeep: '#02040c',
  panel: 'rgba(15,23,42,0.92)',
  panelSolid: '#0b1224',
  panelSoft: '#111c33',
  line: 'rgba(148,163,184,0.22)',
  text: '#f8fafc',
  muted: '#94a3b8',
  dim: '#64748b',
  gold: '#FFC800',
  goldDeep: '#eab308',
  goldDark: '#854d0e',
  blue: '#4db8ff',
  blueDeep: '#2563eb',
  green: '#22c55e',
  red: '#E53935',
  purple: '#a855f7',
  teal: '#2dd4bf',
};

/** Material 3 roles — tonal navy surfaces instead of large elevation shadows. */
export const M3 = {
  color: {
    surface: '#050816',
    surfaceContainerLow: '#0a1022',
    surfaceContainer: '#101830',
    surfaceContainerHigh: '#18223d',
    surfaceContainerHighest: '#222e4b',
    primary: '#FFC800',
    onPrimary: '#3a2800',
    primaryContainer: '#3b2f00',
    onPrimaryContainer: '#ffe9a8',
    secondary: '#4db8ff',
    onSecondary: '#03243a',
    secondaryContainer: '#0e3450',
    onSecondaryContainer: '#d5efff',
    error: '#E53935',
    onError: '#ffffff',
    outline: '#3b4a63',
    outlineVariant: '#253045',
    onSurface: '#f8fafc',
    onSurfaceVariant: '#a8b6cc',
    stateHover: 'rgba(255,255,255,0.08)',
    statePressed: 'rgba(255,255,255,0.12)',
  },
  shape: { sm: 12, md: 18, lg: 28, pill: 999, button: 20 },
  type: {
    display: 56,
    headline: 30,
    title: 22,
    label: 12,
    number: 44,
    tracking: 2.2,
  },
  motion: {
    short: 200,
    medium: 300,
    long: 400,
    easing: [0.2, 0, 0, 1],
  },
  touch: 48,
};

export const F = {
  regular: 'BarlowCondensed_400Regular',
  bold: 'BarlowCondensed_700Bold',
  extra: 'BarlowCondensed_800ExtraBold',
  italic: 'BarlowCondensed_700Bold_Italic',
  italicExtra: 'BarlowCondensed_800ExtraBold_Italic',
};

export const GRADIENTS = {
  gold: ['#fff3a8', '#f5c93a', '#e0a824', '#b98512'],
  blue: ['#d6efff', '#4db8ff', '#2a8de0', '#1b5fb0'],
  goldSoft: ['#fef08a', '#eab308'],
  blueDeep: ['#60a5fa', '#1d4ed8'],
  purple: ['#c084fc', '#6d28d9'],
  danger: ['#fca5a5', '#b91c1c'],
  panel: ['rgba(30,41,59,0.95)', 'rgba(8,14,32,0.98)'],
  pitch: ['#1a8a44', '#0f5c2e'],
};

/** Kept small: tonal surfaces are preferred over glow shadows. */
export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
};

export const EASE = {
  out: [0.22, 1, 0.36, 1],
  spring: [0.34, 1.56, 0.64, 1],
  emphasized: [0.2, 0, 0, 1],
};
