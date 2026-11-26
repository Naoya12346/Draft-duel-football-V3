/**
 * Thin AsyncStorage wrapper with JSON safety and app-wide defaults.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  stats: 'dd_stats',
  settings: 'dd_settings',
  cards: 'dd_cards',
  edits: 'dd_ed',
  deleted: 'dd_dl',
  auctionOff: 'dd_pa',
  custom: 'dd_xp',
  faces: 'dd_faces',
  cap: 'dd_cap',
  size: 'dd_sz',
  salt: 'dd_salt',
  specialChance: 'dd_fq',
};

export const DEFAULT_SETTINGS = {
  sound: true,
  timer: 0, // 0 = off, else seconds
  bigBids: false,
  motion: 'auto', // auto | lite | full
  showFps: false,
};

export async function getJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export async function setJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export async function removeKeys(keys) {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (e) {
    /* ignore */
  }
}

export async function loadAdminData() {
  const [cards, edits, deleted, auctionOff, custom, cap, size, salt, specialChance] = await Promise.all([
    getJSON(KEYS.cards, []),
    getJSON(KEYS.edits, {}),
    getJSON(KEYS.deleted, []),
    getJSON(KEYS.auctionOff, {}),
    getJSON(KEYS.custom, []),
    getJSON(KEYS.cap, 92),
    getJSON(KEYS.size, 400),
    getJSON(KEYS.salt, 'a'),
    getJSON(KEYS.specialChance, 20),
  ]);
  return {
    cards,
    edits,
    deleted,
    auctionOff,
    custom,
    cap,
    size,
    salt,
    specialChance,
  };
}

export async function saveAdminData(data) {
  const map = {
    cards: KEYS.cards,
    edits: KEYS.edits,
    deleted: KEYS.deleted,
    auctionOff: KEYS.auctionOff,
    custom: KEYS.custom,
    cap: KEYS.cap,
    size: KEYS.size,
    salt: KEYS.salt,
    specialChance: KEYS.specialChance,
  };
  const entries = Object.entries(map)
    .filter(([field]) => data[field] !== undefined)
    .map(([field, key]) => [key, JSON.stringify(data[field])]);
  try {
    await AsyncStorage.multiSet(entries);
  } catch (e) {
    /* ignore */
  }
}

export async function loadStats() {
  const stats = await getJSON(KEYS.stats, { matches: 0 });
  return { matches: Number(stats.matches) || 0 };
}

export async function bumpMatches() {
  const stats = await loadStats();
  stats.matches += 1;
  await setJSON(KEYS.stats, stats);
  return stats;
}

export async function loadSettings() {
  const saved = await getJSON(KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function saveSettings(settings) {
  await setJSON(KEYS.settings, settings);
}
