import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGame } from '../context/GameContext';
import { useRouter } from '../navigation/Router';
import { FORMATION_SLOTS, POS_GROUPS } from '../data/constants';
import { teamPool } from '../data/playerDB';
import { canPick, posColor } from '../utils/gameLogic';
import { playSound, successHaptic, tapHaptic, warnHaptic } from '../utils/feedback';
import Screen from '../components/Screen';
import PressableScale from '../components/PressableScale';
import GameButton from '../components/GameButton';
import Icon from '../components/Icon';
import HexPlayerCard from '../components/HexPlayerCard';
import Pitch from '../components/Pitch';
import SpinReel from '../components/SpinReel';
import AppModal from '../components/AppModal';
import StatBars from '../components/StatBars';
import Confetti from '../components/Confetti';
import TeamBadge from '../components/TeamBadge';
import { useToast } from '../components/Toast';
import { C, F } from '../theme';

const K = [C.gold, C.blue];
const TABS = ['ALL', 'GK', 'DEF', 'MID', 'FWD'];
const SHEET_HEADER = 96;

function TeamBar({ index, name, total, active }) {
  return (
    <View
      style={[
        styles.teamBar,
        active && {
          borderColor: K[index],
          backgroundColor: 'rgba(15,23,42,0.95)',
          shadowColor: K[index],
          shadowOpacity: 0.3,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    >
      <View style={styles.teamBarBody}>
        <Text numberOfLines={1} style={styles.teamBarName}>{name}</Text>
        <Text style={styles.teamBarFormation}>4-3-3</Text>
      </View>
      <Text style={[styles.teamBarTotal, { color: K[index] }]}>{total}</Text>
    </View>
  );
}

const PlayerRow = React.memo(function PlayerRow({ player, used, lineup, onSelect }) {
  const pickable = canPick(used, lineup, player);
  const drafted = used.has(player.id);
  return (
    <PressableScale onPress={() => onSelect(player)} disabled={!pickable} scaleTo={0.98} haptic="light">
      <View style={[styles.playerRow, !pickable && styles.playerRowOff]}>
        <View style={[styles.posBar, { backgroundColor: posColor(player.p) }]} />
        <View style={styles.playerBody}>
          <Text numberOfLines={1} style={styles.playerName}>{player.n}</Text>
          <View style={styles.playerSubRow}>
            <Text style={[styles.playerPos, { color: posColor(player.p) }]}>{player.p}</Text>
            <Text style={styles.playerTeam} numberOfLines={1}>{player.tn} {player.y}</Text>
            {drafted ? <Text style={styles.draftedTag}>DRAFTED</Text> : null}
          </View>
        </View>
        <Text style={[styles.playerOvr, player.o >= 85 && styles.playerOvrHot]}>{player.o}</Text>
      </View>
    </PressableScale>
  );
});

function DraftSheet({ cur, lineup, used, onSelect, height, bottomInset }) {
  const [expanded, setExpanded] = useState(true);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('ALL');
  const translate = useSharedValue(height);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translate.value }] }));

  useEffect(() => {
    translate.value = withTiming(0, { duration: 320 });
  }, []);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    translate.value = withTiming(next ? 0 : height - SHEET_HEADER, { duration: 240 });
  };

  const openSlots = useMemo(
    () => FORMATION_SLOTS.map((pos, i) => (!lineup[i] ? pos : null)).filter(Boolean),
    [lineup],
  );

  const players = useMemo(() => {
    const query = q.trim().toLowerCase();
    const group = POS_GROUPS[tab];
    return cur.pl
      .filter((p) => (!group || group.includes(p.p)) && (!query || p.n.toLowerCase().includes(query)))
      .sort((a, b) => b.o - a.o);
  }, [cur, q, tab]);

  const renderRow = useCallback(
    ({ item }) => <PlayerRow player={item} used={used} lineup={lineup} onSelect={onSelect} />,
    [used, lineup, onSelect],
  );

  return (
    <Animated.View
      style={[styles.sheet, { height, paddingBottom: bottomInset }, animatedStyle]}
    >
      <PressableScale onPress={toggle} scaleTo={0.99} haptic={null}>
        <View style={styles.sheetHandleRow}>
          <Icon name={expanded ? 'chevronDown' : 'chevronUp'} size={24} color="#60a5fa" />
        </View>
        <View style={styles.sheetHeader}>
          <TeamBadge code={cur.c} size={30} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.sheetTeam}>
              {cur.n} <Text style={styles.sheetYear}>{cur.y}</Text>
            </Text>
            <Text numberOfLines={1} style={styles.sheetSlots}>
              Open: {openSlots.join(' · ') || 'FULL'}
            </Text>
          </View>
        </View>
      </PressableScale>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color={C.dim} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search players..."
            placeholderTextColor="#64748b"
            style={styles.searchInput}
            selectionColor={C.gold}
          />
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <PressableScale key={t} onPress={() => setTab(t)} style={styles.tabCell} scaleTo={0.94}>
              <View style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t}</Text>
              </View>
            </PressableScale>
          );
        })}
      </View>

      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
        renderItem={renderRow}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No players found</Text>
        }
      />
    </Animated.View>
  );
}

function PickOverlay({ pick, onReady, displayName }) {
  const accent = K[pick.by];
  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.overlay}>
      <Confetti color={accent} count={54} />
      <Text style={styles.overlayKicker}>{(displayName(pick.by) || '').toUpperCase()} PICKED</Text>
      <Animated.View entering={ZoomIn.springify().damping(13)} style={[styles.overlayCard, { borderTopColor: accent }]}>
        <HexPlayerCard player={pick.player} width={158} />
        <Text style={[styles.overlayOvr, { color: accent }]}>
          {pick.player.o} <Text style={styles.overlayOvrLabel}>OVR</Text>
        </Text>
      </Animated.View>
      <Text style={styles.overlayPass}>PASS THE PHONE TO</Text>
      <Text style={[styles.overlayNext, { color: K[pick.by ^ 1] }]}>
        {displayName(pick.by ^ 1).toUpperCase()}
      </Text>
      <View style={styles.overlayBtn}>
        <GameButton
          label={pick.done ? 'SEE RESULT' : 'READY'}
          variant="gold"
          size="lg"
          onPress={onReady}
        />
      </View>
    </Animated.View>
  );
}

export default function DraftScreen() {
  const {
    draft,
    lineups,
    totals,
    db,
    mode,
    displayName,
    spinDraft,
    revealSpin,
    draftPick,
    slotsForPlayer,
    resetFlow,
  } = useGame();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [reelTeam, setReelTeam] = useState(null);
  const [spinKey, setSpinKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [slotChoice, setSlotChoice] = useState(null);
  const [statsPlayer, setStatsPlayer] = useState(null);

  const prevTurn = useRef(draft.t);
  useEffect(() => {
    if (prevTurn.current !== draft.t) {
      prevTurn.current = draft.t;
      setReelTeam(null);
      setSpinKey(0);
      setSpinning(false);
    }
  }, [draft.t]);

  const used = useMemo(() => new Set(draft.used), [draft.used]);
  const pool = useMemo(() => teamPool(db.teams, mode), [db.teams, mode]);
  const lineup = lineups[draft.t];
  const displayTeam = reelTeam || draft.cur;
  const sheetHeight = Math.min(windowHeight * 0.62, 560);

  const startSpin = (respin) => {
    if (draft.busy) return;
    const res = spinDraft(respin);
    if (!res) {
      toast('No teams left to spin', 'error');
      return;
    }
    setReelTeam(res.team);
    setSpinning(true);
    setSpinKey((k) => k + 1);
  };

  const finishSpin = () => {
    if (reelTeam) revealSpin(reelTeam);
    setSpinning(false);
    playSound('bid');
    tapHaptic('medium');
  };

  const doPick = useCallback(
    (player, slot) => {
      const res = draftPick(player, slot);
      setSlotChoice(null);
      if (!res.ok) {
        warnHaptic();
        return;
      }
      playSound('pick');
      successHaptic();
      setConfirm({ player, by: res.by, done: res.done });
    },
    [draftPick],
  );

  const selectPlayer = useCallback(
    (player) => {
      const slots = slotsForPlayer(player);
      if (!slots.length) return;
      if (slots.length === 1) {
        doPick(player, slots[0]);
      } else {
        setSlotChoice({ player, slots });
      }
    },
    [slotsForPlayer, doPick],
  );

  const onReady = () => {
    const done = confirm && confirm.done;
    setConfirm(null);
    if (done) router.replace('Result');
  };

  const exitDraft = () => {
    resetFlow();
    router.reset('Home');
  };

  return (
    <Screen scroll={false} contentContainerStyle={styles.root} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bars}>
          <TeamBar index={0} name={displayName(0)} total={totals[0]} active={draft.t === 0} />
          <TeamBar index={1} name={displayName(1)} total={totals[1]} active={draft.t === 1} />
        </View>

        <View style={styles.turnRow}>
          <View style={{ width: 34 }} />
          <Text style={[styles.turnText, { color: K[draft.t] }]}>
            {displayName(draft.t).toUpperCase()}'S TURN • ROUND {Math.min(draft.r, 11)}/11
          </Text>
          <PressableScale onPress={exitDraft} style={{ width: 34 }} scaleTo={0.9}>
            <View style={styles.exitBtn}>
              <Icon name="close" size={17} color="#cbd5e1" />
            </View>
          </PressableScale>
        </View>

        <SpinReel
          spinKey={spinKey}
          finalTeam={displayTeam}
          pool={pool}
          onFinish={finishSpin}
          height={76}
          duration={3000}
        />

        <View style={styles.actionRow}>
          {draft.cur ? (
            <GameButton
              label={`RE-SPIN  ${draft.respins[draft.t]}`}
              variant="purple"
              size="md"
              icon={<Icon name="refresh" size={18} color="#fff" />}
              onPress={() => startSpin(true)}
              disabled={draft.respins[draft.t] < 1 || spinning}
            />
          ) : (
            <GameButton
              label={spinning || draft.busy ? 'SPINNING…' : 'SPIN'}
              variant="gold"
              size="lg"
              onPress={() => startSpin(false)}
              disabled={spinning || draft.busy}
            />
          )}
        </View>

        {draft.cur ? (
          <Text style={styles.hint}>Tap a player below to draft</Text>
        ) : (
          <Text style={styles.hint}>Spin to reveal a squad</Text>
        )}

        <Pitch
          lineup={lineup}
          accent={K[draft.t]}
          height={Math.min(430, windowHeight * 0.5)}
          onPlayerPress={setStatsPlayer}
          animate
        />
      </ScrollView>

      {draft.cur ? (
        <DraftSheet
          key={`${draft.cur.c}-${draft.cur.y}`}
          cur={draft.cur}
          lineup={lineup}
          used={used}
          onSelect={selectPlayer}
          height={sheetHeight}
          bottomInset={insets.bottom}
        />
      ) : null}

      {confirm ? (
        <PickOverlay pick={confirm} onReady={onReady} displayName={displayName} />
      ) : null}

      <AppModal
        visible={!!slotChoice}
        onClose={() => setSlotChoice(null)}
        title="Choose position"
        footer={
          <GameButton
            label="CANCEL"
            variant="dark"
            size="sm"
            onPress={() => setSlotChoice(null)}
            style={{ marginTop: 10 }}
          />
        }
      >
        <Text style={styles.modalSub}>
          {slotChoice ? slotChoice.player.n : ''} can play in multiple slots
        </Text>
        <View style={styles.slotGrid}>
          {slotChoice
            ? slotChoice.slots.map((slot) => {
                const pos = FORMATION_SLOTS[slot];
                const natural = pos === slotChoice.player.p;
                return (
                  <PressableScale
                    key={slot}
                    onPress={() => doPick(slotChoice.player, slot)}
                    style={styles.slotCell}
                    scaleTo={0.94}
                  >
                    <View style={[styles.slotBtn, natural && styles.slotBtnNatural]}>
                      <Text style={styles.slotBtnText}>{pos}</Text>
                      {natural ? <Text style={styles.slotNatural}>NATURAL</Text> : null}
                    </View>
                  </PressableScale>
                );
              })
            : null}
        </View>
      </AppModal>

      <AppModal visible={!!statsPlayer} onClose={() => setStatsPlayer(null)}>
        {statsPlayer ? (
          <View style={styles.statsModal}>
            <HexPlayerCard player={statsPlayer} width={150} />
            <View style={styles.statsModalBody}>
              <Text style={styles.statsModalName}>{statsPlayer.n.toUpperCase()}</Text>
              <Text style={styles.statsModalMeta}>
                {statsPlayer.p} • {statsPlayer.o} OVR • {statsPlayer.tn} {statsPlayer.y}
              </Text>
              <StatBars player={statsPlayer} />
            </View>
            <GameButton label="CLOSE" variant="blue" size="sm" onPress={() => setStatsPlayer(null)} />
          </View>
        ) : null}
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 26 },
  bars: { flexDirection: 'row', gap: 8 },
  teamBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(51,65,85,0.8)',
    backgroundColor: 'rgba(15,23,42,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  teamBarBody: { flex: 1, minWidth: 0 },
  teamBarName: { fontFamily: F.italicExtra, fontSize: 20, color: '#e2e8f0', lineHeight: 21 },
  teamBarFormation: { fontFamily: F.bold, fontSize: 12, color: C.muted },
  teamBarTotal: { fontFamily: F.italicExtra, fontSize: 30, lineHeight: 32 },
  turnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12 },
  turnText: { flex: 1, textAlign: 'center', fontFamily: F.extra, fontSize: 15, letterSpacing: 1.2 },
  exitBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: 'rgba(15,23,42,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: { marginTop: 14, alignItems: 'center' },
  hint: {
    textAlign: 'center',
    marginTop: 8,
    fontFamily: F.extra,
    fontSize: 12,
    letterSpacing: 2,
    color: C.dim,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(11,18,36,0.99)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandleRow: { alignItems: 'center', paddingTop: 6 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  sheetTeam: { fontFamily: F.italicExtra, fontSize: 23, color: '#fff', lineHeight: 25 },
  sheetYear: { color: C.gold, fontSize: 19 },
  sheetSlots: { fontFamily: F.bold, fontSize: 12, color: C.muted },
  searchRow: { paddingHorizontal: 14, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'rgba(2,6,23,0.8)',
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontFamily: F.bold, fontSize: 16, color: '#fff', paddingVertical: 0 },
  tabs: { flexDirection: 'row', gap: 5, paddingHorizontal: 14, paddingBottom: 8 },
  tabCell: { flex: 1 },
  tab: {
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'rgba(30,41,59,0.7)',
    alignItems: 'center',
  },
  tabActive: { borderColor: '#60a5fa', backgroundColor: 'rgba(37,99,235,0.24)' },
  tabText: { fontFamily: F.italic, fontSize: 14, color: C.muted },
  tabTextActive: { color: '#93c5fd' },
  listContent: { paddingHorizontal: 14, paddingBottom: 20 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingRight: 10,
    paddingVertical: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  playerRowOff: { opacity: 0.34 },
  posBar: { width: 5, alignSelf: 'stretch', borderRadius: 3, marginLeft: 2 },
  playerBody: { flex: 1, minWidth: 0 },
  playerName: { fontFamily: F.italicExtra, fontSize: 20, color: '#fff', lineHeight: 22 },
  playerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playerPos: { fontFamily: F.extra, fontSize: 12, letterSpacing: 1 },
  draftedTag: {
    fontFamily: F.extra,
    fontSize: 9,
    color: '#fca5a5',
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  playerTeam: { fontFamily: F.bold, fontSize: 10, color: C.dim, flexShrink: 1 },
  playerOvr: { fontFamily: F.italicExtra, fontSize: 34, color: '#fff', lineHeight: 36 },
  playerOvrHot: { color: C.teal, textShadowColor: 'rgba(45,212,191,0.5)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
  emptyText: { textAlign: 'center', fontFamily: F.bold, fontSize: 16, color: C.dim, marginTop: 30 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    zIndex: 200,
  },
  overlayKicker: { fontFamily: F.extra, fontSize: 15, letterSpacing: 2.4, color: C.muted, marginBottom: 14 },
  overlayCard: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    borderTopWidth: 4,
    backgroundColor: 'rgba(15,23,42,0.9)',
    padding: 18,
  },
  overlayOvr: { fontFamily: F.italicExtra, fontSize: 40, marginTop: 10 },
  overlayOvrLabel: { fontSize: 18, color: C.muted },
  overlayPass: { fontFamily: F.extra, fontSize: 13, letterSpacing: 2.4, color: C.muted, marginTop: 24 },
  overlayNext: { fontFamily: F.italicExtra, fontSize: 38, letterSpacing: 0.5, marginTop: 2 },
  overlayBtn: { width: '100%', marginTop: 22 },
  modalSub: { fontFamily: F.bold, fontSize: 15, color: C.muted, textAlign: 'center', marginBottom: 12 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotCell: { minWidth: 78, flexGrow: 1 },
  slotBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: 'rgba(30,41,59,0.9)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  slotBtnNatural: { borderColor: C.gold, backgroundColor: 'rgba(250,204,21,0.14)' },
  slotBtnText: { fontFamily: F.italicExtra, fontSize: 22, color: '#fff' },
  slotNatural: { fontFamily: F.extra, fontSize: 8, letterSpacing: 1, color: C.gold },
  statsModal: { alignItems: 'center', gap: 12 },
  statsModalBody: { width: '100%' },
  statsModalName: { fontFamily: F.italicExtra, fontSize: 24, color: '#fff', textAlign: 'center' },
  statsModalMeta: { fontFamily: F.bold, fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 8 },
});
