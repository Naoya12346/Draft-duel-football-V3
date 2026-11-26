/**
 * DraftDuel – Game constants.
 * The draft always plays in a 4-3-3, so there is a single canonical formation.
 */

export const FORMATION = '4-3-3';

// Rows ordered from attack → defence.
export const FORMATION_ROWS = [
  ['LW', 'ST', 'RW'],
  ['CM', 'CM', 'CM'],
  ['LB', 'CB', 'CB', 'RB'],
  ['GK'],
];

// Flat slot list, same order as the pitch renders.
export const FORMATION_SLOTS = FORMATION_ROWS.flat();

export const POS_GROUPS = {
  ALL: null,
  GK: ['GK'],
  DEF: ['CB', 'LB', 'RB', 'DF'],
  MID: ['DM', 'CM', 'AM', 'LM', 'RM', 'MF'],
  FWD: ['LW', 'RW', 'ST', 'FW'],
};

// Which player positions can fill a given slot (first = best fit).
export const ALT_COMPAT = {
  GK: ['GK'],
  CB: ['CB', 'DF'],
  LB: ['LB', 'RB', 'DF'],
  RB: ['RB', 'LB', 'DF'],
  DM: ['DM', 'CM', 'MF'],
  CM: ['CM', 'DM', 'AM', 'MF', 'LM', 'RM'],
  AM: ['AM', 'CM', 'LW', 'RW', 'ST', 'LM', 'RM', 'MF'],
  LM: ['LM', 'RM', 'LW', 'RW', 'MF'],
  RM: ['RM', 'LM', 'RW', 'LW', 'MF'],
  LW: ['LW', 'RW', 'LM', 'RM', 'ST', 'AM', 'FW'],
  RW: ['RW', 'LW', 'RM', 'LM', 'ST', 'AM', 'FW'],
  ST: ['ST', 'LW', 'RW', 'AM', 'FW'],
};

// Five-stat offsets used to derive an attribute spread from overall rating.
export const OVR_OFFSETS = {
  ST: [4, -6, -2, -30, 0],
  LW: [-2, -2, 4, -26, -8],
  AM: [-3, 5, 5, -20, -8],
  CM: [-8, 4, 0, -8, -2],
  DM: [-18, 2, -6, 2, 2],
  CB: [-32, -8, -14, 4, 3],
  LB: [-24, -4, -4, 0, -4],
  RB: [-24, -4, -4, 0, -4],
  LM: [-2, -2, 4, -26, -8],
  RM: [-2, -2, 4, -26, -8],
  RW: [-2, -2, 4, -26, -8],
  GK: [0, 0, 0, 0, 0],
};

export const STAT_LABELS = {
  GK: ['DIV', 'HAN', 'KIC', 'REF', 'POS'],
  OUT: ['PAC', 'SHO', 'PAS', 'DEF', 'PHY'],
};

export const PLAYER_COLORS = {
  GK: '#facc15',
  CB: '#3b82f6',
  LB: '#3b82f6',
  RB: '#3b82f6',
  DF: '#3b82f6',
  DM: '#10b981',
  CM: '#10b981',
  AM: '#10b981',
  LM: '#10b981',
  RM: '#10b981',
  MF: '#10b981',
  LW: '#ef4444',
  RW: '#ef4444',
  ST: '#ef4444',
  FW: '#ef4444',
};

export const TEAM_ACCENT = ['#facc15', '#38bdf8'];

export const POSITIONS = ['ST', 'LW', 'RW', 'AM', 'CM', 'DM', 'LM', 'RM', 'LB', 'CB', 'RB', 'GK'];

export const MODES = {
  ALL: { label: 'CLASSIC', blurb: 'National + club squads from every era' },
  N: { label: 'NATIONAL', blurb: 'Country squads from every era' },
  C: { label: 'CLUB', blurb: 'Iconic club squads' },
  A: { label: 'AUCTION', blurb: 'Set a budget and bid for players' },
};

export const CARD_TYPES = [
  ['BRONZE', '#d6955b'],
  ['SILVER', '#cbd5e1'],
  ['GOLD', '#facc15'],
  ['ICON', '#c084fc'],
  ['LEGEND', '#f87171'],
  ['HERO', '#22d3ee'],
  ['MYTHIC', '#fb923c'],
  ['TOTY', '#3b82f6'],
  ['TOTS', '#10b981'],
  ['POTM', '#ec4899'],
  ['FUTURE STAR', '#84cc16'],
  ['CAPTAIN', '#eab308'],
  ['RECORD BREAKER', '#ef4444'],
  ['SPECIAL', '#fbbf24'],
];
