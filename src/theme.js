/** Shared design tokens for the whole app. */

export const C = {
  bg: '#020617',
  bgDeep: '#01040e',
  panel: 'rgba(15,23,42,0.92)',
  panelSolid: '#0b1224',
  panelSoft: '#111c33',
  line: 'rgba(148,163,184,0.22)',
  text: '#f8fafc',
  muted: '#94a3b8',
  dim: '#64748b',
  gold: '#facc15',
  goldDeep: '#eab308',
  goldDark: '#854d0e',
  blue: '#38bdf8',
  blueDeep: '#2563eb',
  green: '#22c55e',
  red: '#ef4444',
  purple: '#a855f7',
  teal: '#2dd4bf',
};

export const F = {
  regular: 'BarlowCondensed_400Regular',
  bold: 'BarlowCondensed_700Bold',
  extra: 'BarlowCondensed_800ExtraBold',
  italic: 'BarlowCondensed_700Bold_Italic',
  italicExtra: 'BarlowCondensed_800ExtraBold_Italic',
};

export const GRADIENTS = {
  gold: ['#ffe45c', '#f5a300'],
  goldSoft: ['#fef08a', '#eab308'],
  blue: ['#60a5fa', '#1d4ed8'],
  purple: ['#c084fc', '#6d28d9'],
  danger: ['#fca5a5', '#b91c1c'],
  panel: ['rgba(30,41,59,0.95)', 'rgba(8,14,32,0.98)'],
  pitch: ['#1a8a44', '#0f5c2e'],
};

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  glowGold: {
    shadowColor: '#facc15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
};

export const EASE = {
  out: [0.22, 1, 0.36, 1],
  spring: [0.34, 1.56, 0.64, 1],
};
