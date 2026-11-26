/**
 * Builds the runtime player/team database by layering admin edits, custom
 * players, deletions and custom cards on top of the shipped squads.
 */
import { TEAMS, CHAMPIONS, TEAM_COLORS } from './teams';
import { CARD_TYPES } from './constants';
import { hashString, tierName } from '../utils/gameLogic';

export const TYPE_COLORS = Object.fromEntries(CARD_TYPES);
export const DEFAULT_ADMIN = {
  cards: [],
  edits: {},
  deleted: [],
  auctionOff: {},
  custom: [],
  cap: 92,
  size: 400,
  salt: 'a',
  specialChance: 20,
};

export function mergeAdmin(raw) {
  return { ...DEFAULT_ADMIN, ...(raw || {}) };
}

/**
 * @returns {{ teams: Array, players: Array, cardMap: Object, teamByKey: Object }}
 */
export function buildDatabase(adminData = DEFAULT_ADMIN) {
  const admin = mergeAdmin(adminData);
  const deleted = new Set(admin.deleted || []);
  const edits = admin.edits || {};
  const cards = admin.cards || [];

  const teams = TEAMS.map((t) => ({
    ...t,
    pl: t.pl.map((p) => ({ ...p })),
  }));

  // Layer in custom players.
  (admin.custom || []).forEach((entry) => {
    if (!entry || !entry.p || !entry.p.n) return;
    const c = String(entry.c || 'xx').slice(0, 3);
    const n = String(entry.n || 'Custom XI');
    const y = String(entry.y || '2024');
    let team = teams.find((t) => t.c === c && t.n === n && String(t.y) === y);
    if (!team) {
      team = { c, n, y, k: c.length > 2 ? 1 : 0, pl: [] };
      teams.push(team);
    }
    team.pl.push({
      n: String(entry.p.n).trim(),
      p: String(entry.p.p || 'ST').toUpperCase(),
      o: Math.max(1, Math.min(99, Number(entry.p.o) || 70)),
    });
  });

  // Remove deleted, apply edits, derive metadata.
  teams.forEach((t) => {
    t.pl = t.pl
      .filter((p) => !deleted.has(`${p.n}${t.c}${t.y}`))
      .map((p) => {
        const id = `${p.n}${t.c}${t.y}`;
        const edit = edits[id];
        const player = {
          n: p.n,
          p: p.p,
          o: p.o,
          id,
          c: t.c,
          y: t.y,
          tn: t.n,
          k: t.k,
        };
        if (edit) {
          if (edit.n) player.n = edit.n;
          if (edit.p) player.p = edit.p;
          if (edit.o) player.o = edit.o;
          if (edit.c) player.c = edit.c;
        }
        return player;
      });
  });

  // Drop empty teams.
  const aliveTeams = teams.filter((t) => t.pl.length > 0);
  const players = aliveTeams.flatMap((t) => t.pl);

  const cardMap = {};
  cards.forEach((card) => {
    if (card && card.pid) cardMap[card.pid] = card;
  });

  const teamByKey = {};
  aliveTeams.forEach((t) => {
    teamByKey[`${t.c}|${t.n}|${t.y}`] = t;
  });

  return { teams: aliveTeams, players, cardMap, teamByKey };
}

export function hasCard(cardMap, id) {
  return !!cardMap[id];
}

/** [name, color] for a player card / tier badge. */
export function typeFor(player, cardMap, edits) {
  const card = cardMap[player.id];
  if (card) {
    const name = card.type || 'SPECIAL';
    return [name, card.col || TYPE_COLORS[name] || '#fbbf24'];
  }
  const edit = edits && edits[player.id];
  if (edit && edit.t) return [edit.t, TYPE_COLORS[edit.t] || '#fbbf24'];
  return tierName(player.o);
}

export function isAuctionEligible(player, cardMap, auctionOff, cap) {
  const override = auctionOff ? auctionOff[player.id] : undefined;
  if (override !== undefined) return !!override;
  return player.o < cap || !!cardMap[player.id];
}

/** Full auction pool: forced/card players first, then a salted random slice. */
export function buildAuctionPool(players, cardMap, adminData) {
  const admin = mergeAdmin(adminData);
  const off = admin.auctionOff || {};
  const eligible = players.filter((p) => isAuctionEligible(p, cardMap, off, admin.cap));
  const always = eligible.filter((p) => off[p.id] === true || cardMap[p.id]);
  const rest = eligible
    .filter((p) => !(off[p.id] === true || cardMap[p.id]))
    .sort((a, b) => hashString(a.id + admin.salt) - hashString(b.id + admin.salt))
    .slice(0, Math.max(0, admin.size - always.length));
  return always.concat(rest);
}

export function teamPool(teams, mode) {
  if (mode === 'N') return teams.filter((t) => !t.k);
  if (mode === 'C') return teams.filter((t) => !!t.k);
  return teams;
}

export function isChampion(team) {
  return CHAMPIONS.has(`${team.c}|${team.y}`);
}

export function teamColors(code) {
  return TEAM_COLORS[code] || ['#334155', '#e2e8f0'];
}

export function teamMaxOvr(team) {
  return team.pl.reduce((m, p) => Math.max(m, p.o), 0);
}
