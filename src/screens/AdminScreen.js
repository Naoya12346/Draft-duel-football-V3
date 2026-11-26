import React, { useMemo, useState } from 'react';
import {
  Clipboard,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

import { useGame } from '../context/GameContext';
import { useRouter } from '../navigation/Router';
import { CARD_TYPES, POSITIONS, POS_GROUPS } from '../data/constants';
import { isAuctionEligible, TYPE_COLORS } from '../data/playerDB';
import { norm, posColor } from '../utils/gameLogic';
import Screen from '../components/Screen';
import PressableScale from '../components/PressableScale';
import GameButton from '../components/GameButton';
import AppModal from '../components/AppModal';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';
import { C, F } from '../theme';

const TABS = [
  ['cards', 'CARDS'],
  ['players', 'PLAYERS'],
  ['add', 'ADD'],
  ['tools', 'TOOLS'],
];

const FILTERS = [
  ['all', 'ALL'],
  ['card', 'CARD'],
  ['custom', 'CUSTOM'],
  ['edit', 'EDITED'],
  ['auc', 'IN AUC'],
  ['noauc', 'OUT AUC'],
];

const GROUPS = ['ALL', 'GK', 'DEF', 'MID', 'FWD'];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function Field({ label, value, onChange, placeholder, keyboardType, autoCapitalize = 'words', maxLength }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.dim}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        style={styles.input}
      />
    </View>
  );
}

function NumberBox({ value, onChange, min = 1, max = 99, step = 1 }) {
  const set = (n) => onChange(clamp(n, min, max));
  return (
    <View style={styles.numberBox}>
      <PressableScale onPress={() => set(value - step)} style={{ width: 40 }} scaleTo={0.9}>
        <View style={styles.numBtn}>
          <Icon name="minus" size={18} color="#e2e8f0" />
        </View>
      </PressableScale>
      <TextInput
        value={String(value)}
        onChangeText={(t) => {
          const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
          if (!Number.isNaN(n)) set(n);
        }}
        keyboardType="numeric"
        selectTextOnFocus
        style={styles.numInput}
      />
      <PressableScale onPress={() => set(value + step)} style={{ width: 40 }} scaleTo={0.9}>
        <View style={styles.numBtn}>
          <Icon name="plus" size={18} color="#e2e8f0" />
        </View>
      </PressableScale>
    </View>
  );
}

function Chip({ label, color, active, onPress, small }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.94} style={small ? styles.chipSmall : styles.chipWrap}>
      <View
        style={[
          styles.chip,
          small && styles.chipCompact,
          active && { borderColor: color, backgroundColor: `${color}22` },
        ]}
      >
        <Text style={[styles.chipText, small && styles.chipTextSmall, active && { color }]}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

function TypeGrid({ value, onPick }) {
  const list = [['AUTO', C.muted], ...CARD_TYPES];
  return (
    <View style={styles.typeGrid}>
      {list.map(([name, color]) => (
        <Chip
          key={name}
          label={name}
          color={color}
          active={value === name}
          onPress={() => onPick(name)}
          small
        />
      ))}
    </View>
  );
}

export default function AdminScreen() {
  const {
    admin,
    db,
    addCustomPlayer,
    editPlayer,
    deletePlayer,
    setAuctionEligible,
    setCard,
    removeCard,
    setRule,
    restoreBackup,
    resetAdmin,
  } = useGame();
  const router = useRouter();
  const toast = useToast();

  const [tab, setTab] = useState('cards');
  const [pending, setPending] = useState([]);
  const [typeTarget, setTypeTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignQ, setAssignQ] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ n: '', p: 'CM', o: 80, t: 'AUTO' });
  const [confirm, setConfirm] = useState(null);
  const [playerQ, setPlayerQ] = useState('');
  const [playerFilter, setPlayerFilter] = useState('all');
  const [playerGroup, setPlayerGroup] = useState('ALL');
  const [restoreText, setRestoreText] = useState('');
  const [addForm, setAddForm] = useState({
    pn: '',
    tn: '',
    c: '',
    y: '2024',
    p: 'ST',
    o: 80,
  });

  const playerById = useMemo(
    () => Object.fromEntries(db.players.map((p) => [p.id, p])),
    [db.players],
  );

  const customSet = useMemo(() => {
    const set = new Set();
    (admin.custom || []).forEach((e) => {
      if (!e || !e.p || !e.p.n) return;
      set.add(`${e.p.n}${String(e.c || 'xx').slice(0, 3)}${e.y}`);
    });
    return set;
  }, [admin.custom]);

  const filteredPlayers = useMemo(() => {
    const q = norm(playerQ.trim());
    const group = POS_GROUPS[playerGroup];
    return db.players
      .filter((p) => {
        if (q && !norm(`${p.n} ${p.tn} ${p.y}`).includes(q)) return false;
        if (group && !group.includes(p.p)) return false;
        const inAuc = isAuctionEligible(p, db.cardMap, admin.auctionOff, admin.cap);
        if (playerFilter === 'card' && !db.cardMap[p.id]) return false;
        if (playerFilter === 'custom' && !customSet.has(p.id)) return false;
        if (playerFilter === 'edit' && !admin.edits[p.id]) return false;
        if (playerFilter === 'auc' && !inAuc) return false;
        if (playerFilter === 'noauc' && inAuc) return false;
        return true;
      })
      .sort((a, b) => b.o - a.o);
  }, [db.players, db.cardMap, playerQ, playerGroup, playerFilter, admin.auctionOff, admin.cap, admin.edits, customSet]);

  const assignPlayers = useMemo(() => {
    const q = norm(assignQ.trim());
    return db.players
      .filter((p) => !q || norm(`${p.n} ${p.tn} ${p.y}`).includes(q))
      .sort((a, b) => b.o - a.o)
      .slice(0, 60);
  }, [db.players, assignQ]);

  const dataKb = Math.round(JSON.stringify(admin).length / 1024);

  /* ── Card actions ──────────────────────────────────────────────────────── */

  const pickImages = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        toast('Photo access is needed to add cards', 'error');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });
      if (res.canceled || !res.assets) return;
      const additions = res.assets.map((a, i) => ({
        key: `p-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        uri: a.uri,
        w: a.width || 1,
        h: a.height || 1,
        name: String(a.fileName || 'card').replace(/\.[^.]+$/, ''),
        type: 'SPECIAL',
      }));
      setPending((prev) => prev.concat(additions));
      toast(`${additions.length} image(s) ready — pick a player`, 'success');
    } catch (e) {
      toast('Could not open the gallery', 'error');
    }
  };

  const persistImage = async (asset) => {
    const dir = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}cards/` : null;
    if (!dir) return { img: asset.uri, w: asset.w, h: asset.h };
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const actions = asset.w > 640 ? [{ resize: { width: 640 } }] : [];
    const edited = await ImageManipulator.manipulateAsync(asset.uri, actions, {
      compress: 0.92,
      format: ImageManipulator.SaveFormat.PNG,
    });
    const dest = `${dir}card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.png`;
    await FileSystem.copyAsync({ from: edited.uri, to: dest });
    return { img: dest, w: edited.width, h: edited.height };
  };

  const assignCard = async (player) => {
    if (!assignTarget) return;
    try {
      const saved = await persistImage(assignTarget);
      setCard(player.id, {
        ...saved,
        type: assignTarget.type,
        col: TYPE_COLORS[assignTarget.type] || '#fbbf24',
      });
      setPending((prev) => prev.filter((x) => x.key !== assignTarget.key));
      setAssignTarget(null);
      setAssignQ('');
      toast(`Card assigned to ${player.n}`, 'success');
    } catch (e) {
      toast('Could not save that image', 'error');
    }
  };

  const changeType = (name) => {
    if (!typeTarget) return;
    if (typeTarget.kind === 'pending') {
      setPending((prev) => prev.map((x) => (x.key === typeTarget.key ? { ...x, type: name } : x)));
    } else {
      const card = (admin.cards || []).find((c) => c.pid === typeTarget.pid);
      if (card) {
        setCard(card.pid, { ...card, type: name, col: TYPE_COLORS[name] || '#fbbf24' });
      }
    }
    setTypeTarget(null);
  };

  /* ── Player actions ────────────────────────────────────────────────────── */

  const openEdit = (player) => {
    const edited = admin.edits[player.id];
    setEditTarget(player);
    setEditForm({
      n: player.n,
      p: player.p,
      o: player.o,
      t: (edited && edited.t) || 'AUTO',
    });
  };

  const saveEdit = () => {
    if (!editTarget) return;
    editPlayer(editTarget.id, {
      n: editForm.n.trim() || editTarget.n,
      p: editForm.p,
      o: clamp(editForm.o, 1, 99),
      t: editForm.t === 'AUTO' ? null : editForm.t,
    });
    setEditTarget(null);
    toast('Player updated', 'success');
  };

  const toggleEligible = (player) => {
    const eligible = isAuctionEligible(player, db.cardMap, admin.auctionOff, admin.cap);
    setAuctionEligible(player.id, !eligible);
  };

  /* ── Add player ────────────────────────────────────────────────────────── */

  const addPlayer = () => {
    const pn = addForm.pn.trim();
    const tn = addForm.tn.trim();
    const code = addForm.c.trim().toLowerCase().slice(0, 3);
    const year = addForm.y.trim();
    if (!pn || !tn || !code || !year) {
      toast('Name, team, code and year are required', 'error');
      return;
    }
    const id = `${pn}${code}${year}`;
    if (db.players.some((p) => p.id === id)) {
      toast('That player already exists', 'error');
      return;
    }
    addCustomPlayer({
      n: tn,
      c: code,
      y: year,
      p: { n: pn, p: addForm.p, o: clamp(addForm.o, 1, 99) },
    });
    setAddForm({ pn: '', tn: '', c: '', y: year, p: 'ST', o: 80 });
    toast('Custom player added', 'success');
  };

  /* ── Tools ─────────────────────────────────────────────────────────────── */

  const copyBackup = () => {
    const payload = {
      cd: admin.cards,
      ed: admin.edits,
      dl: admin.deleted,
      pa: admin.auctionOff,
      xp: admin.custom,
      cap: admin.cap,
      fq: admin.specialChance,
      sz: admin.size,
      salt: admin.salt,
    };
    const text = JSON.stringify(payload);
    try {
      if (Clipboard && Clipboard.setString) {
        Clipboard.setString(text);
        toast('Backup copied to clipboard', 'success');
      } else {
        setRestoreText(text);
        toast('Backup placed in the restore box');
      }
    } catch (e) {
      setRestoreText(text);
      toast('Backup placed in the restore box');
    }
  };

  const doRestore = () => {
    try {
      const d = JSON.parse(restoreText);
      restoreBackup({
        cards: d.cd || [],
        edits: d.ed || {},
        deleted: d.dl || [],
        auctionOff: d.pa || {},
        custom: d.xp || [],
        cap: Number(d.cap) || 92,
        size: Number(d.sz) || 400,
        salt: d.salt || 'a',
        specialChance: d.fq === undefined ? 20 : Number(d.fq),
      });
      setRestoreText('');
      toast('Backup restored', 'success');
    } catch (e) {
      toast('That backup text is invalid', 'error');
    }
  };

  const ask = (title, text, label, action, danger = false) =>
    setConfirm({ title, text, label, action, danger });

  /* ── Render helpers ────────────────────────────────────────────────────── */

  const renderCardItem = (card) => {
    const player = playerById[card.pid];
    const ratio = (card.h || 1) / (card.w || 1);
    return (
      <View key={card.pid} style={styles.cardRow}>
        <Image
          source={{ uri: card.img }}
          style={[styles.cardThumb, { height: Math.min(78, 56 * ratio) }]}
          resizeMode="contain"
        />
        <View style={styles.cardBody}>
          <Text numberOfLines={1} style={styles.cardName}>
            {player ? player.n : '(missing player)'}
          </Text>
          <Text numberOfLines={1} style={styles.cardSub}>
            {player ? `${player.p} · ${player.o} OVR · ${player.tn} ${player.y}` : 'Player not found'}
          </Text>
          <PressableScale
            onPress={() => setTypeTarget({ kind: 'card', pid: card.pid, type: card.type || 'SPECIAL' })}
            style={{ alignSelf: 'flex-start' }}
            scaleTo={0.94}
          >
            <View style={[styles.typeChip, { borderColor: `${card.col || '#fbbf24'}88` }]}>
              <Text style={[styles.typeChipText, { color: card.col || '#fbbf24' }]}>
                {card.type || 'SPECIAL'}
              </Text>
            </View>
          </PressableScale>
        </View>
        <PressableScale
          onPress={() =>
            ask(
              'Delete this card?',
              `${player ? player.n : 'This player'}'s card image will be removed.`,
              'DELETE',
              () => {
                removeCard(card.pid);
                toast('Card deleted', 'success');
              },
              true,
            )
          }
          style={{ width: 40 }}
          scaleTo={0.9}
        >
          <View style={styles.dangerMini}>
            <Icon name="trash" size={16} color="#fca5a5" />
          </View>
        </PressableScale>
      </View>
    );
  };

  const renderPending = (item) => {
    const ratio = (item.h || 1) / (item.w || 1);
    const color = TYPE_COLORS[item.type] || '#fbbf24';
    return (
      <View key={item.key} style={styles.cardRow}>
        <Image
          source={{ uri: item.uri }}
          style={[styles.cardThumb, { height: Math.min(78, 56 * ratio) }]}
          resizeMode="contain"
        />
        <View style={styles.cardBody}>
          <Text numberOfLines={1} style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardSub}>New upload · not assigned</Text>
          <PressableScale
            onPress={() => setTypeTarget({ kind: 'pending', key: item.key, type: item.type })}
            style={{ alignSelf: 'flex-start' }}
            scaleTo={0.94}
          >
            <View style={[styles.typeChip, { borderColor: `${color}88` }]}>
              <Text style={[styles.typeChipText, { color }]}>{item.type}</Text>
            </View>
          </PressableScale>
        </View>
        <View style={styles.pendingActions}>
          <PressableScale onPress={() => setAssignTarget(item)} style={{ width: 40 }} scaleTo={0.9}>
            <View style={styles.goldMini}>
              <Icon name="user" size={16} color="#161000" />
            </View>
          </PressableScale>
          <PressableScale
            onPress={() => setPending((prev) => prev.filter((x) => x.key !== item.key))}
            style={{ width: 40 }}
            scaleTo={0.9}
          >
            <View style={styles.dangerMini}>
              <Icon name="close" size={16} color="#fca5a5" />
            </View>
          </PressableScale>
        </View>
      </View>
    );
  };

  const renderPlayerRow = ({ item: p }) => {
    const eligible = isAuctionEligible(p, db.cardMap, admin.auctionOff, admin.cap);
    const hasCard = !!db.cardMap[p.id];
    const isCustom = customSet.has(p.id);
    const isEdited = !!admin.edits[p.id];
    const color = posColor(p.p);
    return (
      <View style={styles.playerRow}>
        <PressableScale onPress={() => openEdit(p)} style={styles.playerMainWrap} scaleTo={0.99} haptic="light">
          <View style={styles.playerMain}>
            <View style={[styles.posTag, { borderColor: `${color}88`, backgroundColor: `${color}22` }]}>
              <Text style={[styles.posTagText, { color }]}>{p.p}</Text>
            </View>
            <View style={styles.playerText}>
              <Text numberOfLines={1} style={styles.playerName}>{p.n}</Text>
              <View style={styles.playerSubRow}>
                <Text numberOfLines={1} style={styles.playerSub}>{p.tn} {p.y}</Text>
                {hasCard ? <Text style={styles.badgeCard}>CARD</Text> : null}
                {isCustom ? <Text style={styles.badgeCustom}>CUSTOM</Text> : null}
                {isEdited ? <Text style={styles.badgeEdit}>EDIT</Text> : null}
              </View>
            </View>
            <Text style={styles.playerOvr}>{p.o}</Text>
          </View>
        </PressableScale>
        <View style={styles.rowActions}>
          <PressableScale onPress={() => toggleEligible(p)} style={{ width: 34 }} scaleTo={0.9} haptic="light">
            <View
              style={[
                styles.toggleBtn,
                eligible
                  ? { borderColor: 'rgba(34,197,94,0.6)', backgroundColor: 'rgba(34,197,94,0.14)' }
                  : { borderColor: 'rgba(100,116,139,0.5)', backgroundColor: 'rgba(2,6,23,0.5)' },
              ]}
            >
              <Text style={[styles.toggleText, { color: eligible ? '#4ade80' : C.dim }]}>
                {eligible ? 'IN' : 'OUT'}
              </Text>
            </View>
          </PressableScale>
          <PressableScale
            onPress={() =>
              ask(
                'Delete player?',
                `${p.n} will be removed from drafts and auctions. You can restore deleted players in Tools.`,
                'DELETE',
                () => {
                  deletePlayer(p.id);
                  toast('Player deleted', 'success');
                },
                true,
              )
            }
            style={{ width: 34 }}
            scaleTo={0.9}
          >
            <View style={styles.toggleBtn}>
              <Icon name="trash" size={14} color="#fca5a5" />
            </View>
          </PressableScale>
        </View>
      </View>
    );
  };

  const cardsCount = (admin.cards || []).length;

  return (
    <Screen scroll={false} contentContainerStyle={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <View style={styles.header}>
          <PressableScale onPress={() => router.back()} style={{ width: 44 }} scaleTo={0.9}>
            <View style={styles.iconBtn}>
              <Icon name="arrowLeft" size={20} color="#cbd5e1" />
            </View>
          </PressableScale>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>ADMIN</Text>
            <Text style={styles.subtitle}>AUTO-SAVED · {dataKb} KB</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.tabs}>
          {TABS.map(([key, label]) => {
            const active = tab === key;
            return (
              <PressableScale key={key} onPress={() => setTab(key)} style={styles.tabCell} scaleTo={0.96}>
                <View style={[styles.tab, active && styles.tabOn]}>
                  <Text style={[styles.tabText, active && styles.tabTextOn]}>{label}</Text>
                  {key === 'cards' && pending.length ? (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{pending.length}</Text>
                    </View>
                  ) : null}
                </View>
              </PressableScale>
            );
          })}
        </View>

        {tab === 'cards' ? (
          <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
            <GameButton
              label="UPLOAD CARD IMAGES"
              variant="gold"
              size="md"
              slant
              icon={<Icon name="upload" size={20} color="#161000" />}
              onPress={pickImages}
            />
            <Text style={styles.hint}>
              Upload transparent PNG cards, pick a type, then assign each image to a player.
              Assigned cards replace the generated card in drafts and auctions.
            </Text>

            {pending.length ? (
              <>
                <Text style={styles.sectionTitle}>READY TO ASSIGN ({pending.length})</Text>
                {pending.map(renderPending)}
              </>
            ) : null}

            <Text style={styles.sectionTitle}>ASSIGNED CARDS ({cardsCount})</Text>
            {cardsCount === 0 ? (
              <Text style={styles.empty}>No custom cards yet.</Text>
            ) : (
              (admin.cards || []).map(renderCardItem)
            )}
          </ScrollView>
        ) : null}

        {tab === 'players' ? (
          <View style={styles.fill}>
            <View style={styles.searchWrap}>
              <Icon name="search" size={18} color={C.dim} />
              <TextInput
                value={playerQ}
                onChangeText={setPlayerQ}
                placeholder="Search name, team or year"
                placeholderTextColor={C.dim}
                style={styles.searchInput}
                autoCapitalize="none"
              />
              <Text style={styles.countText}>{filteredPlayers.length}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
            >
              {FILTERS.map(([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  color={C.gold}
                  active={playerFilter === key}
                  onPress={() => setPlayerFilter(key)}
                  small
                />
              ))}
            </ScrollView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
            >
              {GROUPS.map((g) => (
                <Chip
                  key={g}
                  label={g}
                  color={C.blue}
                  active={playerGroup === g}
                  onPress={() => setPlayerGroup(g)}
                  small
                />
              ))}
            </ScrollView>
            <FlatList
              data={filteredPlayers}
              keyExtractor={(item) => item.id}
              renderItem={renderPlayerRow}
              initialNumToRender={16}
              maxToRenderPerBatch={16}
              windowSize={7}
              getItemLayout={(_, index) => ({ length: 60, offset: 60 * index, index })}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.empty}>No players match those filters.</Text>}
            />
          </View>
        ) : null}

        {tab === 'add' ? (
          <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>ADD CUSTOM PLAYER</Text>
            <View style={styles.panel}>
              <Field
                label="PLAYER NAME"
                value={addForm.pn}
                onChange={(v) => setAddForm((f) => ({ ...f, pn: v }))}
                placeholder="e.g. Diego Maradona"
                maxLength={28}
              />
              <Field
                label="TEAM / SQUAD NAME"
                value={addForm.tn}
                onChange={(v) => setAddForm((f) => ({ ...f, tn: v }))}
                placeholder="e.g. Argentina 1986"
                maxLength={28}
              />
              <View style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="COUNTRY CODE"
                    value={addForm.c}
                    onChange={(v) => setAddForm((f) => ({ ...f, c: v.toLowerCase() }))}
                    placeholder="ar"
                    autoCapitalize="none"
                    maxLength={3}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="YEAR"
                    value={addForm.y}
                    onChange={(v) => setAddForm((f) => ({ ...f, y: v.replace(/[^0-9]/g, '') }))}
                    placeholder="1986"
                    keyboardType="numeric"
                    autoCapitalize="none"
                    maxLength={4}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>POSITION</Text>
              <View style={styles.posGrid}>
                {POSITIONS.map((pos) => (
                  <Chip
                    key={pos}
                    label={pos}
                    color={posColor(pos)}
                    active={addForm.p === pos}
                    onPress={() => setAddForm((f) => ({ ...f, p: pos }))}
                    small
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>OVERALL</Text>
              <NumberBox
                value={addForm.o}
                onChange={(o) => setAddForm((f) => ({ ...f, o }))}
                min={1}
                max={99}
              />

              <GameButton
                label="ADD PLAYER"
                variant="blue"
                size="md"
                icon={<Icon name="plus" size={18} color="#fff" />}
                onPress={addPlayer}
                style={{ marginTop: 16 }}
              />
            </View>
            <Text style={styles.hint}>
              Custom players join the draft and auction pools with the rest of the database.
              Use a 2–3 letter country or club code.
            </Text>
          </ScrollView>
        ) : null}

        {tab === 'tools' ? (
          <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.statsRow}>
              {[
                [cardsCount, 'CARDS'],
                [(admin.custom || []).length, 'CUSTOM'],
                [(admin.deleted || []).length, 'DELETED'],
                [Object.keys(admin.auctionOff || {}).length, 'RULES'],
              ].map(([value, label]) => (
                <View key={label} style={styles.statBox}>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>AUCTION RULES</Text>

              <Text style={styles.ruleLabel}>Exclude from auction when OVR is at least</Text>
              <NumberBox
                value={admin.cap}
                onChange={(v) => setRule('cap', v)}
                min={50}
                max={99}
              />

              <Text style={[styles.ruleLabel, { marginTop: 12 }]}>Players in the auction pool</Text>
              <NumberBox
                value={admin.size}
                onChange={(v) => setRule('size', v)}
                min={60}
                max={1200}
                step={20}
              />

              <Text style={[styles.ruleLabel, { marginTop: 12 }]}>Special card chance</Text>
              <View style={styles.ruleRow}>
                <NumberBox
                  value={admin.specialChance}
                  onChange={(v) => setRule('specialChance', v)}
                  min={0}
                  max={60}
                  step={5}
                />
                <Text style={styles.percent}>%</Text>
              </View>

              <GameButton
                label="NEW POOL SET"
                variant="dark"
                size="sm"
                icon={<Icon name="refresh" size={16} color="#e2e8f0" />}
                onPress={() => {
                  setRule('salt', String(Math.random()));
                  toast('New auction set generated', 'success');
                }}
                style={{ marginTop: 14 }}
              />
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>BACKUP</Text>
              <GameButton
                label="COPY BACKUP"
                variant="blue"
                size="md"
                icon={<Icon name="upload" size={18} color="#fff" />}
                onPress={copyBackup}
              />
              <TextInput
                value={restoreText}
                onChangeText={setRestoreText}
                placeholder="Paste backup JSON here to restore"
                placeholderTextColor={C.dim}
                multiline
                style={styles.restoreInput}
              />
              <GameButton
                label="RESTORE BACKUP"
                variant="dark"
                size="md"
                onPress={doRestore}
                style={{ marginTop: 8 }}
              />
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>DANGER ZONE</Text>
              <GameButton
                label="RESTORE DELETED PLAYERS"
                variant="ghost"
                size="md"
                icon={<Icon name="refresh" size={18} color="#cbd5e1" />}
                onPress={() =>
                  ask(
                    'Restore deleted players?',
                    'Every player you deleted will return to the database.',
                    'RESTORE',
                    () => {
                      setRule('deleted', []);
                      toast('Deleted players restored', 'success');
                    },
                  )
                }
              />
              <GameButton
                label="RESET EVERYTHING"
                variant="danger"
                size="md"
                icon={<Icon name="trash" size={18} color="#fff" />}
                onPress={() =>
                  ask(
                    'Reset all admin data?',
                    'Cards, edits, custom players, deleted players and auction rules will be wiped.',
                    'RESET',
                    () => {
                      resetAdmin();
                      toast('Admin data reset', 'success');
                    },
                    true,
                  )
                }
                style={{ marginTop: 8 }}
              />
            </View>
          </ScrollView>
        ) : null}
      </KeyboardAvoidingView>

      <AppModal
        visible={!!typeTarget}
        onClose={() => setTypeTarget(null)}
        title="CARD TYPE"
        footer={
          <GameButton
            label="CLOSE"
            variant="dark"
            size="md"
            onPress={() => setTypeTarget(null)}
            style={{ marginTop: 12 }}
          />
        }
      >
        <Text style={styles.modalHint}>Choose the rarity shown on the card.</Text>
        <TypeGrid
          value={typeTarget ? typeTarget.type : 'SPECIAL'}
          onPick={changeType}
        />
      </AppModal>

      <AppModal
        visible={!!assignTarget}
        onClose={() => {
          setAssignTarget(null);
          setAssignQ('');
        }}
        title="ASSIGN CARD"
        footer={
          <GameButton
            label="CANCEL"
            variant="dark"
            size="md"
            onPress={() => {
              setAssignTarget(null);
              setAssignQ('');
            }}
            style={{ marginTop: 10 }}
          />
        }
      >
        {assignTarget ? (
          <>
            <View style={styles.assignHead}>
              <Image
                source={{ uri: assignTarget.uri }}
                style={styles.assignThumb}
                resizeMode="contain"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.assignName} numberOfLines={1}>{assignTarget.name}</Text>
                <Text style={styles.assignSub}>Tap a player to assign this card.</Text>
              </View>
            </View>
            <View style={styles.searchWrap}>
              <Icon name="search" size={18} color={C.dim} />
              <TextInput
                value={assignQ}
                onChangeText={setAssignQ}
                placeholder="Search players"
                placeholderTextColor={C.dim}
                style={styles.searchInput}
                autoCapitalize="none"
              />
            </View>
            <ScrollView style={styles.assignList} showsVerticalScrollIndicator={false}>
              {assignPlayers.map((p) => (
                <PressableScale key={p.id} onPress={() => assignCard(p)} scaleTo={0.98} haptic="light">
                  <View style={styles.assignRow}>
                    <View style={[styles.posTag, { borderColor: `${posColor(p.p)}88`, backgroundColor: `${posColor(p.p)}22` }]}>
                      <Text style={[styles.posTagText, { color: posColor(p.p) }]}>{p.p}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={styles.assignPlayer}>{p.n}</Text>
                      <Text numberOfLines={1} style={styles.assignSub}>{p.tn} {p.y}</Text>
                    </View>
                    {db.cardMap[p.id] ? <Text style={styles.badgeCard}>HAS CARD</Text> : null}
                    <Text style={styles.assignOvr}>{p.o}</Text>
                  </View>
                </PressableScale>
              ))}
            </ScrollView>
          </>
        ) : null}
      </AppModal>

      <AppModal
        visible={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="EDIT PLAYER"
        footer={
          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <GameButton label="CANCEL" variant="dark" size="md" onPress={() => setEditTarget(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <GameButton label="SAVE" variant="gold" size="md" onPress={saveEdit} />
            </View>
          </View>
        }
      >
        {editTarget ? (
          <ScrollView style={{ maxHeight: 430 }} showsVerticalScrollIndicator={false}>
            <Field
              label="PLAYER NAME"
              value={editForm.n}
              onChange={(v) => setEditForm((f) => ({ ...f, n: v }))}
              maxLength={28}
            />
            <Text style={styles.fieldLabel}>POSITION</Text>
            <View style={styles.posGrid}>
              {POSITIONS.map((pos) => (
                <Chip
                  key={pos}
                  label={pos}
                  color={posColor(pos)}
                  active={editForm.p === pos}
                  onPress={() => setEditForm((f) => ({ ...f, p: pos }))}
                  small
                />
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>OVERALL</Text>
            <NumberBox
              value={editForm.o}
              onChange={(o) => setEditForm((f) => ({ ...f, o }))}
              min={1}
              max={99}
            />
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>CARD TYPE</Text>
            <TypeGrid
              value={editForm.t}
              onPick={(t) => setEditForm((f) => ({ ...f, t }))}
            />
            <Text style={styles.hint}>
              Card type is used when the player has no uploaded card image.
            </Text>
          </ScrollView>
        ) : null}
      </AppModal>

      <AppModal
        visible={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm ? confirm.title : ''}
        footer={
          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <GameButton label="CANCEL" variant="dark" size="md" onPress={() => setConfirm(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <GameButton
                label={confirm ? confirm.label : 'OK'}
                variant={confirm && confirm.danger ? 'danger' : 'gold'}
                size="md"
                onPress={() => {
                  const action = confirm ? confirm.action : null;
                  setConfirm(null);
                  if (action) action();
                }}
              />
            </View>
          </View>
        }
      >
        <Text style={styles.modalText}>{confirm ? confirm.text : ''}</Text>
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 4 },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  headerCenter: { alignItems: 'center' },
  title: { fontFamily: F.italicExtra, fontSize: 28, color: '#fff', letterSpacing: 1.4 },
  subtitle: { fontFamily: F.extra, fontSize: 9, letterSpacing: 1.6, color: C.dim },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: 'rgba(15,23,42,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabs: {
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: 14,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    backgroundColor: 'rgba(15,23,42,0.85)',
    marginBottom: 10,
  },
  tabCell: { flex: 1 },
  tab: {
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  tabOn: { backgroundColor: C.gold },
  tabText: { fontFamily: F.extra, fontSize: 13, letterSpacing: 0.8, color: C.muted },
  tabTextOn: { color: '#161000' },
  tabBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { fontFamily: F.extra, fontSize: 9, color: '#fff' },

  tabContent: { paddingHorizontal: 14, paddingBottom: 40 },
  hint: { fontFamily: F.bold, fontSize: 12, color: C.dim, lineHeight: 16, marginTop: 8, marginBottom: 6 },
  sectionTitle: {
    fontFamily: F.extra,
    fontSize: 11,
    letterSpacing: 1.8,
    color: C.muted,
    marginTop: 16,
    marginBottom: 8,
  },
  empty: { fontFamily: F.bold, fontSize: 13, color: C.dim, textAlign: 'center', paddingVertical: 18 },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
    backgroundColor: 'rgba(15,23,42,0.85)',
    padding: 8,
    marginBottom: 8,
  },
  cardThumb: { width: 56, borderRadius: 8, backgroundColor: 'rgba(2,6,23,0.6)' },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: { fontFamily: F.italicExtra, fontSize: 18, color: '#fff', lineHeight: 20 },
  cardSub: { fontFamily: F.bold, fontSize: 11, color: C.dim, marginBottom: 4 },
  typeChip: {
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 0.5,
  },
  typeChipText: { fontFamily: F.extra, fontSize: 9, letterSpacing: 1 },
  pendingActions: { flexDirection: 'row', gap: 4 },
  goldMini: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.gold,
    backgroundColor: 'rgba(250,204,21,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerMini: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.5)',
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    backgroundColor: 'rgba(2,6,23,0.6)',
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, fontFamily: F.bold, fontSize: 15, color: '#e2e8f0', paddingVertical: 9 },
  countText: { fontFamily: F.extra, fontSize: 11, color: C.dim },
  chipScroll: { gap: 6, paddingHorizontal: 14, paddingBottom: 6 },
  chipWrap: {},
  chipSmall: {},
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(71,85,105,0.8)',
    backgroundColor: 'rgba(2,6,23,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipCompact: { paddingHorizontal: 7, paddingVertical: 3 },
  chipText: { fontFamily: F.extra, fontSize: 12, letterSpacing: 0.8, color: C.muted },
  chipTextSmall: { fontSize: 10 },

  listContent: { paddingHorizontal: 14, paddingBottom: 30 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingLeft: 6,
    paddingRight: 4,
  },
  playerMainWrap: { flex: 1 },
  playerMain: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  posTag: {
    width: 34,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posTagText: { fontFamily: F.extra, fontSize: 11, letterSpacing: 0.4 },
  playerText: { flex: 1, minWidth: 0 },
  playerName: { fontFamily: F.italicExtra, fontSize: 16, color: '#fff', lineHeight: 18 },
  playerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  playerSub: { fontFamily: F.bold, fontSize: 10, color: C.dim, flexShrink: 1 },
  badgeCard: { fontFamily: F.extra, fontSize: 8, letterSpacing: 0.6, color: C.gold },
  badgeCustom: { fontFamily: F.extra, fontSize: 8, letterSpacing: 0.6, color: '#c084fc' },
  badgeEdit: { fontFamily: F.extra, fontSize: 8, letterSpacing: 0.6, color: C.blue },
  playerOvr: { fontFamily: F.italicExtra, fontSize: 18, color: '#e2e8f0', marginRight: 4 },
  rowActions: { flexDirection: 'row', gap: 3 },
  toggleBtn: {
    width: 32,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(71,85,105,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { fontFamily: F.extra, fontSize: 9, letterSpacing: 0.4 },

  panel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    backgroundColor: 'rgba(15,23,42,0.85)',
    padding: 14,
    marginBottom: 12,
  },
  panelTitle: { fontFamily: F.italicExtra, fontSize: 22, color: '#fff', marginBottom: 8 },
  field: { marginBottom: 10 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontFamily: F.extra, fontSize: 10, letterSpacing: 1.6, color: C.muted, marginBottom: 5 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    backgroundColor: 'rgba(2,6,23,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: F.bold,
    fontSize: 16,
    color: '#f8fafc',
  },
  numberBox: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  numBtn: {
    width: 40,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(71,85,105,0.8)',
    backgroundColor: 'rgba(2,6,23,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numInput: {
    width: 62,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    backgroundColor: 'rgba(2,6,23,0.6)',
    textAlign: 'center',
    fontFamily: F.italicExtra,
    fontSize: 20,
    color: C.gold,
    paddingVertical: 0,
  },
  posGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 },
  ruleLabel: { fontFamily: F.bold, fontSize: 12, color: C.muted, marginBottom: 6 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  percent: { fontFamily: F.extra, fontSize: 14, color: C.muted },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
    backgroundColor: 'rgba(15,23,42,0.85)',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: { fontFamily: F.italicExtra, fontSize: 24, color: C.gold, lineHeight: 26 },
  statLabel: { fontFamily: F.extra, fontSize: 8, letterSpacing: 1.2, color: C.dim },
  restoreInput: {
    minHeight: 76,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    backgroundColor: 'rgba(2,6,23,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: F.bold,
    fontSize: 13,
    color: '#e2e8f0',
    textAlignVertical: 'top',
  },

  modalHint: { fontFamily: F.bold, fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 8 },
  modalText: { fontFamily: F.bold, fontSize: 16, color: C.muted, textAlign: 'center', lineHeight: 21 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  assignHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  assignThumb: { width: 54, height: 72, borderRadius: 8, backgroundColor: 'rgba(2,6,23,0.6)' },
  assignName: { fontFamily: F.italicExtra, fontSize: 20, color: '#fff' },
  assignSub: { fontFamily: F.bold, fontSize: 12, color: C.dim },
  assignList: { maxHeight: 300, marginTop: 4 },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
    backgroundColor: 'rgba(2,6,23,0.55)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 5,
  },
  assignPlayer: { fontFamily: F.italicExtra, fontSize: 16, color: '#fff', lineHeight: 18 },
  assignOvr: { fontFamily: F.italicExtra, fontSize: 18, color: C.gold },
});
