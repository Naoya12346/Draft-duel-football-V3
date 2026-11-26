/**
 * Lazily resolves a player photo from Wikipedia and caches it forever.
 * Falls back silently (the card renders a generated avatar).
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { norm } from '../utils/gameLogic';

const KEY = 'dd_faces';
let memory = null;
let loading = null;
const inflight = {};

async function loadCache() {
  if (memory) return memory;
  if (!loading) {
    loading = AsyncStorage.getItem(KEY)
      .then((raw) => {
        memory = raw ? JSON.parse(raw) : {};
        return memory;
      })
      .catch(() => {
        memory = {};
        return memory;
      });
  }
  return loading;
}

function saveCache() {
  if (!memory) return;
  AsyncStorage.setItem(KEY, JSON.stringify(memory)).catch(() => {});
}

async function fetchFace(player) {
  const cache = await loadCache();
  const key = player.id;
  if (key in cache) return cache[key] || null;
  if (inflight[key]) return inflight[key];

  const run = (async () => {
    try {
      const search = `${player.n} ${player.tn || ''} footballer`;
      const url =
        'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
        '&prop=pageimages&piprop=thumbnail&pithumbsize=360&redirects=1' +
        '&generator=search&gsrnamespace=0&gsrlimit=5&gsrsearch=' +
        encodeURIComponent(search);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      const json = await res.json();
      const pages = Object.values((json.query && json.query.pages) || {}).sort(
        (a, b) => (a.index || 0) - (b.index || 0),
      );
      const surname = norm(player.n.split(' ').pop());
      const match =
        pages.find((p) => norm(p.title || '').includes(surname) && p.thumbnail) ||
        pages.find((p) => p.thumbnail);
      const src = match && match.thumbnail ? match.thumbnail.source : '';
      cache[key] = src || '';
      saveCache();
      return src || null;
    } catch (e) {
      return null;
    } finally {
      delete inflight[key];
    }
  })();

  inflight[key] = run;
  return run;
}

export function usePlayerFace(player) {
  const [face, setFace] = useState(null);
  useEffect(() => {
    let alive = true;
    if (!player || !player.id) return () => {};
    loadCache().then((cache) => {
      if (!alive) return;
      if (cache[player.id]) {
        setFace(cache[player.id]);
        return;
      }
      fetchFace(player).then((src) => {
        if (alive && src) setFace(src);
      });
    });
    return () => {
      alive = false;
    };
  }, [player && player.id]);
  return face;
}

export function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
