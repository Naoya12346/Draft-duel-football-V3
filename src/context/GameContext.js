/**
 * Global game state: profile, settings, admin data, draft, auction and match.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ALT_COMPAT,
  FORMATION_SLOTS,
} from '../data/constants';
import {
  buildAuctionPool,
  buildDatabase,
  mergeAdmin,
  teamMaxOvr,
  teamPool,
  typeFor,
} from '../data/playerDB';
import {
  basePrice,
  canPick,
  compatibleSlots,
  packSquad,
  simulateMatch,
  slotFor,
  totalOvr,
} from '../utils/gameLogic';
import {
  DEFAULT_SETTINGS,
  bumpMatches,
  loadAdminData,
  loadSettings,
  loadStats,
  saveAdminData,
  saveSettings,
} from '../utils/storage';
import { configureAudio, setSoundEnabled } from '../utils/feedback';

const GameContext = createContext(null);

const freshLineups = () => [Array(11).fill(null), Array(11).fill(null)];

const freshDraft = () => ({
  active: false,
  t: 0,
  r: 1,
  cur: null,
  respins: [1, 1],
  busy: false,
  pending: null,
  tab: 'ALL',
  q: '',
  used: [],
});

const freshAuction = () => ({
  active: false,
  budget: [200, 200],
  totalBudget: 200,
  N: 11,
  cnt: [0, 0],
  spent: [0, 0],
  un: [],
  used: [],
  pr: {},
  lot: 0,
  dry: 0,
  pool: [],
  current: null,
  phase: 'idle',
  sold: null,
});

const initialState = {
  ready: false,
  stats: { matches: 0 },
  settings: DEFAULT_SETTINGS,
  admin: mergeAdmin(null),
  names: ['', ''],
  mode: 'ALL',
  lineups: freshLineups(),
  draft: freshDraft(),
  auction: freshAuction(),
  lastPick: null,
  match: null,
  statsBumped: false,
};

/* ── Auction helpers ──────────────────────────────────────────────────────── */

const isFull = (a, t) => a.cnt[t] >= a.N;
const maxBid = (a, t) => (isFull(a, t) ? -1 : a.budget[t] - (a.N - a.cnt[t] - 1));
const canBuy = (a, lineups, t, player) =>
  !isFull(a, t) && slotFor(lineups[t], player.p) >= 0;
const canBidFor = (a, lineups, t) => {
  const player = a.current && a.current.player;
  if (!player) return false;
  return canBuy(a, lineups, t, player) && maxBid(a, t) >= basePrice(player.o);
};

function soldAuction(a, lineups) {
  const c = a.current;
  const t = c.lead;
  const player = c.player;
  const nextLineups = lineups.map((l) => l.slice());
  const slot = slotFor(nextLineups[t], player.p);
  if (slot >= 0) nextLineups[t][slot] = player;
  const budget = a.budget.slice();
  budget[t] -= c.bid;
  const spent = a.spent.slice();
  spent[t] += c.bid;
  const cnt = a.cnt.slice();
  cnt[t] += 1;
  const used = [...a.used, player.id];
  const un = [...a.un, player.n.toLowerCase()];
  return {
    a: {
      ...a,
      budget,
      spent,
      cnt,
      used,
      un,
      pr: { ...a.pr, [player.id]: c.bid },
      current: null,
      phase: 'sold',
      sold: { team: t, player, price: c.bid },
    },
    lineups: nextLineups,
  };
}

function unsoldAuction(a) {
  const player = a.current.player;
  return {
    a: {
      ...a,
      current: null,
      phase: 'sold',
      un: [...a.un, player.n.toLowerCase()],
      sold: { team: -1, player, price: 0 },
    },
    lineups: null,
  };
}

/** Computes the next lot, or flips to the result phase when the auction ends. */
function makeLot(a, lineups, db) {
  if (isFull(a, 0) && isFull(a, 1)) {
    return { ...a, current: null, phase: 'result' };
  }

  const needed = [];
  [0, 1].forEach((t) => {
    if (isFull(a, t)) return;
    FORMATION_SLOTS.forEach((pos, idx) => {
      if (!lineups[t][idx]) needed.push(pos);
    });
  });
  if (!needed.length) return { ...a, current: null, phase: 'result' };

  const free = (p) => !a.used.includes(p.id) && !a.un.includes(p.n.toLowerCase());
  const affordable = (p) =>
    [0, 1].some((t) => canBuy(a, lineups, t, p) && maxBid(a, t) >= basePrice(p.o));

  const tryPositions = [...needed].sort(() => Math.random() - 0.5);
  let candidates = [];
  let chosenSlot = tryPositions[0];
  for (let i = 0; i < tryPositions.length; i += 1) {
    const pos = tryPositions[i];
    const list = a.pool.filter(
      (p) => (ALT_COMPAT[pos] || []).includes(p.p) && free(p) && affordable(p),
    );
    if (list.length) {
      candidates = list;
      chosenSlot = pos;
      break;
    }
  }
  if (!candidates.length) {
    candidates = a.pool.filter((p) => free(p) && affordable(p));
  }
  if (!candidates.length) return { ...a, current: null, phase: 'result' };

  // Tier weighting, nudged towards stars after a dry run of low-rated lots.
  let tier;
  if (a.dry >= 3) {
    tier = Math.random() < 0.4 ? [92, 99] : [86, 99];
  } else {
    const roll = Math.random();
    if (roll < 0.15) tier = [92, 99];
    else if (roll < 0.45) tier = [86, 91];
    else if (roll < 0.8) tier = [78, 85];
    else tier = [0, 77];
  }
  let pool = candidates.filter((p) => p.o >= tier[0] && p.o <= tier[1]);
  if (!pool.length) pool = candidates;

  const db2 = db || {};
  const cardPlayers = pool.filter((p) => db2.cardMap && db2.cardMap[p.id]);
  const specialChance = (db2.admin && db2.admin.specialChance) || 0;
  const player =
    cardPlayers.length && Math.random() * 100 < specialChance
      ? cardPlayers[Math.floor(Math.random() * cardPlayers.length)]
      : pool[Math.floor(Math.random() * pool.length)];

  let turn = a.lot % 2 ? 0 : 1;
  const canBid = (t) =>
    canBuy(a, lineups, t, player) && maxBid(a, t) >= basePrice(player.o);
  if (!canBid(turn)) turn ^= 1;
  if (!canBid(turn)) return { ...a, current: null, phase: 'result' };

  const auctionPlayer = {
    ...player,
    image: db2.cardMap && db2.cardMap[player.id] ? db2.cardMap[player.id].img : undefined,
  };

  return {
    ...a,
    lot: a.lot + 1,
    dry: player.o >= 86 ? 0 : a.dry + 1,
    current: {
      player: auctionPlayer,
      slot: chosenSlot,
      bid: 0,
      lead: -1,
      turn,
      passed: 0,
      history: [],
    },
    phase: 'auction',
  };
}

/* ── Provider ─────────────────────────────────────────────────────────────── */

export function GameProvider({ children }) {
  const [state, setState] = useState(initialState);
  const ref = useRef(state);
  ref.current = state;

  const db = useMemo(() => buildDatabase(state.admin), [state.admin]);
  const dbRef = useRef(db);
  dbRef.current = db;

  const adminRef = useRef(state.admin);
  adminRef.current = state.admin;

  useEffect(() => {
    let alive = true;
    (async () => {
      const [stats, settings, adminRaw] = await Promise.all([
        loadStats(),
        loadSettings(),
        loadAdminData(),
      ]);
      if (!alive) return;
      setSoundEnabled(settings.sound);
      configureAudio();
      setState((s) => ({
        ...s,
        ready: true,
        stats,
        settings,
        admin: mergeAdmin(adminRaw),
      }));
    })();
    return () => {
      alive = false;
    };
  }, []);

  const displayName = useCallback((index) => {
    const value = (ref.current.names[index] || '').trim();
    return value || `Player ${index + 1}`;
  }, []);

  const setName = useCallback((index, value) => {
    setState((s) => {
      const names = s.names.slice();
      names[index] = value;
      return { ...s, names };
    });
  }, []);

  const setMode = useCallback((mode) => {
    setState((s) => ({ ...s, mode }));
  }, []);

  const updateSettings = useCallback((patch) => {
    setState((s) => {
      const settings = { ...s.settings, ...patch };
      saveSettings(settings);
      if (patch.sound !== undefined) setSoundEnabled(patch.sound);
      return { ...s, settings };
    });
  }, []);

  const updateAdmin = useCallback((patch) => {
    setState((s) => {
      const admin = { ...s.admin, ...patch };
      adminRef.current = admin;
      saveAdminData(patch);
      return { ...s, admin };
    });
  }, []);

  const setRule = useCallback((key, value) => {
    setState((s) => {
      const admin = { ...s.admin, [key]: value };
      adminRef.current = admin;
      saveAdminData({ [key]: value });
      return { ...s, admin };
    });
  }, []);

  const addCustomPlayer = useCallback((entry) => {
    setState((s) => {
      const admin = { ...s.admin, custom: [...(s.admin.custom || []), entry] };
      adminRef.current = admin;
      saveAdminData({ custom: admin.custom });
      return { ...s, admin };
    });
  }, []);

  const editPlayer = useCallback((id, patch) => {
    setState((s) => {
      const edits = { ...(s.admin.edits || {}), [id]: { ...(s.admin.edits || {})[id], ...patch } };
      const admin = { ...s.admin, edits };
      adminRef.current = admin;
      saveAdminData({ edits });
      return { ...s, admin };
    });
  }, []);

  const deletePlayer = useCallback((id) => {
    setState((s) => {
      const deleted = Array.from(new Set([...(s.admin.deleted || []), id]));
      const admin = { ...s.admin, deleted };
      adminRef.current = admin;
      saveAdminData({ deleted });
      return { ...s, admin };
    });
  }, []);

  const toggleAuction = useCallback((id) => {
    setState((s) => {
      const off = { ...(s.admin.auctionOff || {}) };
      const current = off[id];
      off[id] = current === undefined ? true : !current;
      const admin = { ...s.admin, auctionOff: off };
      adminRef.current = admin;
      saveAdminData({ auctionOff: off });
      return { ...s, admin };
    });
  }, []);

  const setAuctionEligible = useCallback((id, eligible) => {
    const player = dbRef.current.players.find((p) => p.id === id);
    setState((s) => {
      const byDefault =
        !!player && (player.o < s.admin.cap || !!dbRef.current.cardMap[id]);
      const off = { ...(s.admin.auctionOff || {}) };
      if (eligible === byDefault) delete off[id];
      else off[id] = !!eligible;
      const admin = { ...s.admin, auctionOff: off };
      adminRef.current = admin;
      saveAdminData({ auctionOff: off });
      return { ...s, admin };
    });
  }, []);

  const setCard = useCallback((playerId, card) => {
    setState((s) => {
      const cards = (s.admin.cards || []).filter((c) => c.pid !== playerId);
      if (card) cards.push({ ...card, pid: playerId });
      const admin = { ...s.admin, cards };
      adminRef.current = admin;
      saveAdminData({ cards });
      return { ...s, admin };
    });
  }, []);

  const removeCard = useCallback((playerId) => {
    setState((s) => {
      const cards = (s.admin.cards || []).filter((c) => c.pid !== playerId);
      const admin = { ...s.admin, cards };
      adminRef.current = admin;
      saveAdminData({ cards });
      return { ...s, admin };
    });
  }, []);

  const restoreBackup = useCallback((data) => {
    const admin = mergeAdmin({
      cards: data.cards || [],
      edits: data.edits || {},
      deleted: data.deleted || [],
      auctionOff: data.auctionOff || {},
      custom: data.custom || [],
      cap: data.cap || 92,
      size: data.size || 400,
      salt: data.salt || 'a',
      specialChance: data.specialChance ?? 20,
    });
    setState((s) => ({ ...s, admin }));
    saveAdminData(admin);
  }, []);

  const resetAdmin = useCallback(() => {
    const admin = mergeAdmin(null);
    setState((s) => ({ ...s, admin }));
    saveAdminData(admin);
  }, []);

  const resetProgress = useCallback(() => {
    setState((s) => ({ ...s, stats: { matches: 0 } }));
    import('@react-native-async-storage/async-storage').then((mod) =>
      mod.default.removeItem('dd_stats').catch(() => {}),
    );
  }, []);

  /* ── Draft ──────────────────────────────────────────────────────────────── */

  const startDraft = useCallback(() => {
    setState((s) => ({
      ...s,
      lineups: freshLineups(),
      draft: { ...freshDraft(), active: true },
      auction: freshAuction(),
      lastPick: null,
      match: null,
      statsBumped: false,
    }));
  }, []);

  const spinDraft = useCallback((respin) => {
    const s = ref.current;
    const d = s.draft;
    if (d.busy) return null;
    if (respin && d.respins[d.t] < 1) return null;

    const used = new Set(d.used);
    const lineup = s.lineups[d.t];
    const eligible = teamPool(dbRef.current.teams, s.mode).filter(
      (team) => team.pl.length >= 11 && team.pl.some((p) => canPick(used, lineup, p)),
    );
    if (!eligible.length) return null;

    const weighted = [];
    eligible.forEach((team) => {
      const top = teamMaxOvr(team);
      const weight = top >= 95 ? 1 : top >= 90 ? 3 : top >= 85 ? 5 : 8;
      for (let i = 0; i < weight; i += 1) weighted.push(team);
    });
    const team = weighted[Math.floor(Math.random() * weighted.length)];
    const respins = d.respins.slice();
    if (respin) respins[d.t] -= 1;

    setState((prev) => ({
      ...prev,
      draft: {
        ...prev.draft,
        busy: true,
        pending: team,
        cur: null,
        respins,
        tab: 'ALL',
        q: '',
      },
    }));
    return { team, teamIndex: d.t };
  }, []);

  const revealSpin = useCallback((team) => {
    const squad = packSquad(team);
    squad.pl = squad.pl.map((p) => ({
      ...p,
      image: dbRef.current.cardMap[p.id] ? dbRef.current.cardMap[p.id].img : undefined,
    }));
    setState((s) => ({
      ...s,
      draft: { ...s.draft, busy: false, pending: null, cur: squad },
    }));
  }, []);

  const draftPick = useCallback((player, slotIndex) => {
    const s = ref.current;
    const d = s.draft;
    const t = d.t;
    if (!player || !canPick(new Set(d.used), s.lineups[t], player)) {
      return { ok: false };
    }
    let slot = slotIndex;
    if (slot == null) slot = slotFor(s.lineups[t], player.p);
    if (slot == null || slot < 0) return { ok: false };

    const lineups = s.lineups.map((l) => l.slice());
    lineups[t][slot] = player;
    const used = [...d.used, player.id];
    let round = d.r;
    if (t === 1) round += 1;
    const nextTurn = t ^ 1;
    const done = round > 11;

    setState((prev) => ({
      ...prev,
      lineups,
      draft: {
        ...prev.draft,
        t: nextTurn,
        r: round,
        cur: null,
        busy: false,
        pending: null,
        used,
        tab: 'ALL',
        q: '',
      },
      lastPick: { player, by: t },
    }));
    return { ok: true, slot, done, player, by: t, round };
  }, []);

  const slotsForPlayer = useCallback((player) => {
    const s = ref.current;
    return compatibleSlots(s.lineups[s.draft.t], player.p);
  }, []);

  /* ── Auction ────────────────────────────────────────────────────────────── */

  const startAuction = useCallback((budget, perTeam) => {
    const admin = adminRef.current;
    const database = buildDatabase(admin);
    const pool = buildAuctionPool(database.players, database.cardMap, admin);
    const lineups = freshLineups();
    let auction = {
      ...freshAuction(),
      active: true,
      budget: [budget, budget],
      totalBudget: budget,
      N: perTeam,
      pool,
    };
    auction = makeLot(auction, lineups, { ...database, admin });
    setState((prev) => ({
      ...prev,
      lineups,
      draft: freshDraft(),
      auction,
      lastPick: null,
      match: null,
      statsBumped: false,
    }));
  }, []);

  const auctionBid = useCallback((amount) => {
    const s = ref.current;
    const a = s.auction;
    const c = a.current;
    if (!c || a.phase !== 'auction') return false;
    const t = c.turn;
    if (amount > maxBid(a, t) || (c.bid && amount <= c.bid) || amount < basePrice(c.player.o)) {
      return false;
    }
    let next = {
      ...a,
      current: {
        ...c,
        bid: amount,
        lead: t,
        passed: 0,
        history: [...c.history, [t, amount]],
      },
    };
    if (canBidFor(next, s.lineups, t ^ 1)) {
      next.current.turn = t ^ 1;
      setState((prev) => ({ ...prev, auction: next }));
    } else {
      const result = soldAuction(next, s.lineups);
      setState((prev) => ({ ...prev, auction: result.a, lineups: result.lineups }));
    }
    return true;
  }, []);

  const auctionPass = useCallback(() => {
    const s = ref.current;
    const a = s.auction;
    const c = a.current;
    if (!c || a.phase !== 'auction') return;
    if (c.lead >= 0) {
      const result = soldAuction(a, s.lineups);
      setState((prev) => ({ ...prev, auction: result.a, lineups: result.lineups }));
      return;
    }
    const other = c.turn ^ 1;
    if (c.passed || !canBidFor(a, s.lineups, other)) {
      const result = unsoldAuction(a);
      setState((prev) => ({ ...prev, auction: result.a }));
      return;
    }
    setState((prev) => ({
      ...prev,
      auction: {
        ...a,
        current: {
          ...c,
          turn: other,
          passed: 1,
          history: [...c.history, [c.turn, -1]],
        },
      },
    }));
  }, []);

  const auctionNext = useCallback(() => {
    const s = ref.current;
    const a = s.auction;
    if (isFull(a, 0) && isFull(a, 1)) {
      setState((prev) => ({ ...prev, auction: { ...prev.auction, current: null, phase: 'result' } }));
      return 'result';
    }
    const next = makeLot({ ...a, phase: 'auction', sold: null }, s.lineups, {
      ...dbRef.current,
      admin: adminRef.current,
    });
    setState((prev) => ({ ...prev, auction: next }));
    return next.phase;
  }, []);

  /* ── Match / result ─────────────────────────────────────────────────────── */

  const startMatch = useCallback(() => {
    const s = ref.current;
    const match = simulateMatch(s.lineups[0], s.lineups[1], displayName(0), displayName(1));
    setState((prev) => ({ ...prev, match, statsBumped: false }));
    return match;
  }, [displayName]);

  const registerResult = useCallback(() => {
    if (ref.current.statsBumped) return;
    setState((s) => ({ ...s, statsBumped: true }));
    bumpMatches().then((stats) => setState((s) => ({ ...s, stats })));
  }, []);

  const resetFlow = useCallback(() => {
    setState((s) => ({
      ...s,
      lineups: freshLineups(),
      draft: freshDraft(),
      auction: freshAuction(),
      lastPick: null,
      match: null,
      statsBumped: false,
    }));
  }, []);

  const totals = useMemo(
    () => [totalOvr(state.lineups[0]), totalOvr(state.lineups[1])],
    [state.lineups],
  );

  const value = useMemo(
    () => ({
      ...state,
      db,
      totals,
      displayName,
      setName,
      setMode,
      updateSettings,
      updateAdmin,
      setRule,
      addCustomPlayer,
      editPlayer,
      deletePlayer,
      toggleAuction,
      setAuctionEligible,
      setCard,
      removeCard,
      restoreBackup,
      resetAdmin,
      resetProgress,
      startDraft,
      spinDraft,
      revealSpin,
      draftPick,
      slotsForPlayer,
      startAuction,
      auctionBid,
      auctionPass,
      auctionNext,
      startMatch,
      registerResult,
      resetFlow,
      typeFor: (player) => typeFor(player, db.cardMap, state.admin.edits),
      maxBidFor: (t) => maxBid(state.auction, t),
    }),
    [
      state,
      db,
      totals,
      displayName,
      setName,
      setMode,
      updateSettings,
      updateAdmin,
      setRule,
      addCustomPlayer,
      editPlayer,
      deletePlayer,
      toggleAuction,
      setAuctionEligible,
      setCard,
      removeCard,
      restoreBackup,
      resetAdmin,
      resetProgress,
      startDraft,
      spinDraft,
      revealSpin,
      draftPick,
      slotsForPlayer,
      startAuction,
      auctionBid,
      auctionPass,
      auctionNext,
      startMatch,
      registerResult,
      resetFlow,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
