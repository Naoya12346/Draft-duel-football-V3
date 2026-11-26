/**
 * DraftDuel – pure game helpers shared by draft, auction and match.
 */

import {
  ALT_COMPAT,
  FORMATION_SLOTS,
  OVR_OFFSETS,
  PLAYER_COLORS,
  STAT_LABELS,
} from '../data/constants';

/** Small deterministic string hash (FNV-1a). */
export function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic 0..1 generator seeded from a string. */
export function seeded(value) {
  let h = hashString(String(value));
  h += 0x6d2b79f5;
  let t = h;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Derives a stable five-stat spread from a player's overall rating. */
export function getPlayerStats(player) {
  const ovr = player.o;
  const pos = player.p;
  const offsets = OVR_OFFSETS[pos] || OVR_OFFSETS.CM;
  const labels = pos === 'GK' ? STAT_LABELS.GK : STAT_LABELS.OUT;
  return labels.map((label, i) => {
    const jitter = Math.round((seeded(`${player.id || player.n}-${label}`) - 0.5) * 6);
    return [label, Math.max(35, Math.min(99, ovr + offsets[i] + jitter))];
  });
}

export function posColor(position) {
  return PLAYER_COLORS[position] || '#a855f7';
}

export function tierName(ovr) {
  if (ovr >= 95) return ['ICON', '#c084fc'];
  if (ovr >= 92) return ['ELITE', '#facc15'];
  if (ovr >= 86) return ['GOLD', '#facc15'];
  if (ovr >= 78) return ['SILVER', '#cbd5e1'];
  return ['BRONZE', '#d6955b'];
}

export function tierColors(ovr) {
  if (ovr >= 95) return ['#f3e8ff', '#a855f7', '#5b21b6', '#2e1065'];
  if (ovr >= 92) return ['#fff7cf', '#f5c518', '#b0800a', '#3d2600'];
  if (ovr >= 86) return ['#fff5bd', '#f1c232', '#b0800a', '#4a3000'];
  if (ovr >= 78) return ['#f1f5f9', '#aab4c3', '#64748b', '#1e293b'];
  return ['#fde0c5', '#c98a5a', '#8a5a2b', '#3b2210'];
}

export function basePrice(ovr) {
  if (ovr >= 95) return 15;
  if (ovr >= 90) return 10;
  if (ovr >= 85) return 6;
  if (ovr >= 80) return 4;
  if (ovr >= 75) return 2;
  return 1;
}

export function getFormationSlots() {
  return FORMATION_SLOTS;
}

/** First empty slot that accepts the player's position. */
export function slotFor(lineup, pos) {
  for (let i = 0; i < FORMATION_SLOTS.length; i += 1) {
    if (!lineup[i] && FORMATION_SLOTS[i] === pos) return i;
  }
  for (let i = 0; i < FORMATION_SLOTS.length; i += 1) {
    if (!lineup[i]) {
      const compat = ALT_COMPAT[FORMATION_SLOTS[i]];
      if (compat && compat.includes(pos)) return i;
    }
  }
  return -1;
}

/** Every empty slot that accepts the player's position. */
export function compatibleSlots(lineup, pos) {
  const out = [];
  for (let i = 0; i < FORMATION_SLOTS.length; i += 1) {
    if (lineup[i]) continue;
    const compat = ALT_COMPAT[FORMATION_SLOTS[i]];
    if (compat && compat.includes(pos)) out.push(i);
  }
  return out;
}

export function canPick(used, lineup, player) {
  if (!player) return false;
  if (used instanceof Set ? used.has(player.id) : used[player.id]) return false;
  return slotFor(lineup, player.p) !== -1;
}

export function totalOvr(lineup) {
  return lineup.reduce((sum, p) => sum + (p ? p.o : 0), 0);
}

export function maxBidFor(budget, slotsLeft) {
  if (slotsLeft <= 0) return -1;
  return budget - (slotsLeft - 1);
}

export function packSquad(team) {
  return {
    c: team.c,
    n: team.n,
    y: team.y,
    k: team.k,
    tot: team.pl.length,
    pl: team.pl.slice(),
  };
}

export function norm(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function shortName(name, max = 10) {
  const value = String(name);
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

const FLAG_OVERRIDES = { gb: '🇬🇧', xx: '🏳️' };

export function flagEmoji(code) {
  if (FLAG_OVERRIDES[code]) return FLAG_OVERRIDES[code];
  if (!code || code.length > 2) return '🏳️';
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('');
}

export function money(value) {
  return `${value}M`;
}

/* ── Match simulation ─────────────────────────────────────────────────────── */

function unitStrength(lineup, positions, fallback = 62) {
  const picked = lineup.filter((p) => p && positions.includes(p.p));
  if (!picked.length) return fallback;
  return picked.reduce((sum, p) => sum + p.o, 0) / picked.length;
}

export function teamStrength(lineup) {
  const attack = unitStrength(lineup, ['ST', 'LW', 'RW', 'AM', 'LM', 'RM']);
  const defence = (unitStrength(lineup, ['CB', 'LB', 'RB', 'DM']) + unitStrength(lineup, ['GK'])) / 2;
  return { attack, defence, total: totalOvr(lineup) };
}

/**
 * Pre-computes a full 90-minute match with commentary events.
 * @returns {{score:[number,number], events:Array, winner:number, penalties:boolean}}
 */
export function simulateMatch(lineup1, lineup2, name1 = 'Team 1', name2 = 'Team 2') {
  const names = [name1, name2];
  const A = [lineup1.filter(Boolean), lineup2.filter(Boolean)];
  const S = [teamStrength(lineup1), teamStrength(lineup2)];
  const score = [0, 0];
  const events = [];

  const pickScorer = (team) => {
    const attackers = A[team].filter((p) => ['ST', 'LW', 'RW', 'AM', 'LM', 'RM', 'CM'].includes(p.p));
    const pool = attackers.length ? attackers : A[team];
    if (!pool.length) return null;
    const weights = pool.map((p) => Math.pow(p.o / 50, 6) * (['ST', 'LW', 'RW'].includes(p.p) ? 3 : 1.4));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  };

  const keeper = (team) => (A[team].find((p) => p.p === 'GK') || { n: 'the keeper' }).n;

  for (let minute = 1; minute <= 90; minute += 1) {
    if (Math.random() > 0.075) continue;
    const team = Math.random() < S[0].attack / (S[0].attack + S[1].attack) ? 0 : 1;
    const other = team ^ 1;
    const scorer = pickScorer(team);
    if (!scorer) continue;
    const chance = Math.min(
      0.62,
      Math.max(0.06, 0.2 * Math.pow((S[team].attack + 8) / (S[other].defence + 8), 4.4)),
    );
    if (Math.random() < chance) {
      score[team] += 1;
      events.push({
        minute,
        type: 'GOAL',
        team,
        player: scorer.n,
        text: `GOAL! ${scorer.n} (${names[team]})`,
      });
    } else if (Math.random() < 0.5) {
      events.push({
        minute,
        type: 'SAVE',
        team: other,
        player: keeper(other),
        text: `${keeper(other)} saves from ${scorer.n}`,
      });
    } else {
      events.push({
        minute,
        type: 'MISS',
        team,
        player: scorer.n,
        text: `${scorer.n} fires just wide`,
      });
    }
  }

  let winner = score[0] > score[1] ? 0 : score[1] > score[0] ? 1 : -1;
  let penalties = false;
  if (winner < 0) {
    penalties = true;
    const p0 = S[0].total + Math.random() * 12;
    const p1 = S[1].total + Math.random() * 12;
    winner = p0 >= p1 ? 0 : 1;
    events.push({
      minute: 90,
      type: 'PENS',
      team: winner,
      player: '',
      text: `${names[winner]} wins the shootout`,
    });
  }

  events.sort((a, b) => a.minute - b.minute);
  return { score, events, winner, penalties };
}
