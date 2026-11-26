import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { useGame } from '../context/GameContext';
import { useRouter } from '../navigation/Router';
import { basePrice, flagEmoji, shortName } from '../utils/gameLogic';
import { playSound, tapHaptic, warnHaptic } from '../utils/feedback';
import Screen from '../components/Screen';
import PressableScale from '../components/PressableScale';
import GameButton from '../components/GameButton';
import Icon from '../components/Icon';
import PlayerCard from '../components/PlayerCard';
import AppModal from '../components/AppModal';
import StatBars from '../components/StatBars';
import { C, F } from '../theme';

const K = [C.gold, C.blue];

function BudgetPanel({ index, name, budget, total, count, needed, leading }) {
  const pct = Math.max(0, Math.min(100, (budget / Math.max(1, total)) * 100));
  return (
    <View style={[styles.budgetPanel, leading && { borderColor: K[index] }]}>
      <View style={styles.budgetHead}>
        <Text numberOfLines={1} style={styles.budgetName}>{name}</Text>
        {leading ? (
          <View style={[styles.topBid, { backgroundColor: K[index] }]}>
            <Text style={styles.topBidText}>TOP BID</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.budgetLine}>
        <View style={styles.budgetMoney}>
          <Icon name="coin" size={14} color={K[index]} />
          <Text style={[styles.budgetValue, { color: K[index] }]}>{budget}M</Text>
        </View>
        <Text style={styles.budgetCount}>{count}/{needed}</Text>
      </View>
      <View style={styles.budgetTrack}>
        <View style={[styles.budgetFill, { width: `${pct}%`, backgroundColor: K[index] }]} />
      </View>
    </View>
  );
}

function BidButton({ label, amount, color, disabled, selected, onPress }) {
  return (
    <PressableScale onPress={onPress} disabled={disabled} style={styles.bidCell} scaleTo={0.93} overlayRadius={12}>
      <View
        style={[
          styles.bidBtn,
          { borderColor: disabled ? '#334155' : color },
          disabled && styles.bidOff,
          selected && {
            borderColor: '#ffffff',
            backgroundColor: `${color}2e`,
            shadowColor: color,
            shadowOpacity: 0.6,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <Text style={styles.bidLabel}>{label}</Text>
        <Text style={[styles.bidAmount, { color: disabled ? '#64748b' : color }]}>{amount}M</Text>
      </View>
    </PressableScale>
  );
}

export default function AuctionScreen() {
  const {
    auction,
    settings,
    db,
    displayName,
    typeFor,
    auctionBid,
    auctionPass,
    maxBidFor,
    resetFlow,
  } = useGame();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [showExit, setShowExit] = useState(false);
  const [statsPlayer, setStatsPlayer] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [passOn, setPassOn] = useState(false);
  const pushedRef = useRef(false);
  const bar = useSharedValue(1);
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));

  const current = auction.current;
  const { push: navPush, replace: navReplace, reset: navReset } = router;

  useEffect(() => {
    if (auction.phase === 'sold' && !pushedRef.current) {
      pushedRef.current = true;
      navPush('Sold');
    } else if (auction.phase === 'auction') {
      pushedRef.current = false;
    } else if (auction.phase === 'result') {
      navReplace('Result');
    }
  }, [auction.phase, navPush, navReplace]);

  useEffect(() => {
    if (!current || !settings.timer || auction.phase !== 'auction') return undefined;
    bar.value = 1;
    bar.value = withTiming(0, {
      duration: settings.timer * 1000,
      easing: Easing.linear,
    });
    const timer = setTimeout(() => {
      auctionPass();
    }, settings.timer * 1000);
    return () => {
      clearTimeout(timer);
      cancelAnimation(bar);
    };
  }, [current, settings.timer, auction.phase, auctionPass, bar]);

  useEffect(() => {
    setHighlight(null);
    setPassOn(false);
  }, [current]);

  if (!current) {
    return (
      <Screen scroll={false} contentContainerStyle={styles.loading}>
        <Text style={styles.loadingText}>DEALING THE NEXT LOT…</Text>
      </Screen>
    );
  }

  const player = current.player;
  const bid = current.bid;
  const lead = current.lead;
  const turn = current.turn;
  const base = basePrice(player.o);
  const price = bid || base;
  const max = maxBidFor(turn);
  const big = settings.bigBids;
  const incs = bid ? (big ? [2, 5, 10, 25] : [1, 2, 5, 10]) : big ? [0, 5, 10, 25] : [0, 2, 5, 10];
  const [tierLabel, tierColor] = typeFor(player);
  const cardW = Math.max(118, Math.min(150, width * 0.33));

  const doBid = (amount) => {
    if (auctionBid(amount)) {
      playSound('bid');
      tapHaptic('medium');
    } else {
      warnHaptic();
    }
  };

  const doPass = () => {
    playSound('tick');
    auctionPass();
  };

  const history = current.history || [];

  return (
    <Screen scroll={false} contentContainerStyle={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.header}>
          <View style={styles.headerDeco}>
            <Text style={styles.decoText}>≪</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>LOT {auction.lot}</Text>
            <Text style={styles.headerSub}>
              {auction.cnt[0]} / {auction.N}  ·  {auction.cnt[1]} / {auction.N}
            </Text>
          </View>
          <PressableScale onPress={() => setShowExit(true)} style={{ width: 44 }} scaleTo={0.9}>
            <View style={styles.iconBtn}>
              <Icon name="close" size={20} color="#cbd5e1" />
            </View>
          </PressableScale>
        </View>

        <View style={styles.budgetRow}>
          {[0, 1].map((t) => (
            <BudgetPanel
              key={t}
              index={t}
              name={displayName(t)}
              budget={auction.budget[t]}
              total={auction.totalBudget}
              count={auction.cnt[t]}
              needed={auction.N}
              leading={lead === t}
            />
          ))}
        </View>

        <View style={styles.lotArea}>
          <PlayerCard
            rating={player.o}
            position={player.p}
            club={player.c}
            name={player.n}
            tier={tierLabel}
            image={db.cardMap[player.id] && db.cardMap[player.id].img}
            width={cardW}
            animate
            onPress={() => setStatsPlayer(player)}
          />
          <View style={styles.lotInfo}>
            <View style={[styles.tierChip, { borderColor: `${tierColor}88`, backgroundColor: `${tierColor}1f` }]}>
              <Text style={[styles.tierText, { color: tierColor }]}>{tierLabel}</Text>
            </View>
            <Text style={styles.bidCaption}>{bid ? 'CURRENT BID' : 'BASE PRICE'}</Text>
            <Animated.Text
              key={price}
              entering={ZoomIn.duration(180)}
              style={styles.price}
            >
              {price}M
            </Animated.Text>
            <Text style={styles.clubLine} numberOfLines={1}>
              {player.c.length <= 2 ? `${flagEmoji(player.c)} ` : ''}{player.tn} · {player.y}
            </Text>
            {lead >= 0 ? (
              <Text style={[styles.leader, { color: K[lead] }]} numberOfLines={1}>
                {shortName(displayName(lead), 12).toUpperCase()} LEADS
              </Text>
            ) : (
              <Text style={styles.noBids}>NO BIDS YET</Text>
            )}
            <Text style={styles.baseLine}>BASE {base}M · MIN NEXT {bid ? bid + 1 : base}M</Text>
          </View>
        </View>

        <View style={styles.historyPanel}>
          <View style={styles.historyHead}>
            <Text style={styles.historyLabel}>BID HISTORY</Text>
            {history.length >= 4 ? (
              <View style={styles.warChip}>
                <Text style={styles.warText}>BID WAR</Text>
              </View>
            ) : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
            {history.length === 0 ? (
              <Text style={styles.historyEmpty}>No bids yet</Text>
            ) : (
              history.map(([t, amount], i) => (
                <Animated.View key={`${i}-${amount}`} entering={FadeIn.duration(160)}>
                  <View
                    style={[
                      styles.historyChip,
                      { borderColor: `${K[t]}88`, backgroundColor: `${K[t]}18` },
                    ]}
                  >
                    <Text numberOfLines={1} style={[styles.historyTeam, { color: K[t] }]}>
                      {shortName(displayName(t), 7)}
                    </Text>
                    <Text style={styles.historyAmount}>
                      {amount < 0 ? 'PASS' : `${amount}M`}
                    </Text>
                  </View>
                </Animated.View>
              ))
            )}
          </ScrollView>
        </View>

        {settings.timer > 0 ? (
          <View style={styles.timerWrap}>
            <View style={styles.timerTrack}>
              <Animated.View style={[styles.timerFill, barStyle]} />
            </View>
            <Text style={styles.timerText}>AUTO-PASS IN {settings.timer}s</Text>
          </View>
        ) : null}

        <View style={[styles.turnBanner, { borderColor: `${K[turn]}66` }]}>
          <View style={[styles.turnDot, { backgroundColor: K[turn] }]} />
          <Text style={styles.turnText} numberOfLines={1}>
            {displayName(turn).toUpperCase()} TO BID
          </Text>
          <Text style={[styles.maxText, { color: K[turn] }]}>MAX {max}M</Text>
        </View>

        <View style={styles.bidGrid}>
          {incs.map((inc) => {
            const amount = price + inc;
            const disabled = amount > max || amount < base || (bid > 0 && amount <= bid);
            return (
              <BidButton
                key={inc}
                label={inc ? `+${inc}` : 'OPEN'}
                amount={amount}
                color={K[turn]}
                disabled={disabled}
                selected={highlight === inc}
                onPress={() => {
                  setHighlight(inc);
                  doBid(amount);
                }}
              />
            );
          })}
        </View>

        <PressableScale
          onPress={() => {
            setPassOn(true);
            doPass();
          }}
          scaleTo={0.97}
          overlayRadius={14}
        >
          <View style={[styles.passBtn, passOn && styles.passOn]}>
            <View style={styles.passShine} />
            <Text style={styles.passLabel}>{lead >= 0 ? 'PASS · SELL' : 'PASS / SKIP'}</Text>
            <Text style={styles.passSub} numberOfLines={1}>
              {lead >= 0
                ? `${displayName(lead)} wins it for ${bid}M`
                : 'No bids yet — skip this lot'}
            </Text>
          </View>
        </PressableScale>
      </ScrollView>

      <AppModal
        visible={!!statsPlayer}
        onClose={() => setStatsPlayer(null)}
        title="PLAYER PROFILE"
        footer={
          <GameButton
            label="CLOSE"
            variant="dark"
            size="md"
            onPress={() => setStatsPlayer(null)}
            style={{ marginTop: 14 }}
          />
        }
      >
        {statsPlayer ? (
          <View style={styles.statsBody}>
            <PlayerCard
              rating={statsPlayer.o}
              position={statsPlayer.p}
              club={statsPlayer.c}
              name={statsPlayer.n}
              width={138}
            />
            <View style={styles.statsBars}>
              <Text style={styles.statsName} numberOfLines={1}>{statsPlayer.n}</Text>
              <Text style={styles.statsMeta} numberOfLines={1}>
                {statsPlayer.tn} {statsPlayer.y} · {statsPlayer.p}
              </Text>
              <StatBars player={statsPlayer} compact />
            </View>
          </View>
        ) : null}
      </AppModal>

      <AppModal
        visible={showExit}
        onClose={() => setShowExit(false)}
        title="Leave the auction?"
        footer={
          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <GameButton label="STAY" variant="dark" size="md" onPress={() => setShowExit(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <GameButton
                label="LEAVE"
                variant="danger"
                size="md"
                onPress={() => {
                  setShowExit(false);
                  resetFlow();
                  navReset('Home');
                }}
              />
            </View>
          </View>
        }
      >
        <Text style={styles.modalText}>
          The current lot and every purchase will be discarded. You can start a fresh auction anytime.
        </Text>
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 30 },
  loading: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: F.italicExtra, fontSize: 22, color: C.muted, letterSpacing: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerCenter: { alignItems: 'center' },
  headerDeco: { width: 44, alignItems: 'flex-start' },
  decoText: { fontFamily: F.italicExtra, fontSize: 26, color: C.gold, letterSpacing: -8, marginTop: -4 },
  headerTitle: { fontFamily: F.italicExtra, fontSize: 28, color: '#fff', letterSpacing: 0.8 },
  headerSub: { fontFamily: F.extra, fontSize: 10, letterSpacing: 1.6, color: C.dim },
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
  lotChip: {
    minWidth: 44,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.4)',
    backgroundColor: 'rgba(2,6,23,0.6)',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  lotChipText: { fontFamily: F.italicExtra, fontSize: 18, color: C.blue, lineHeight: 19 },
  lotChipSub: { fontFamily: F.extra, fontSize: 8, letterSpacing: 1.2, color: C.dim },

  budgetRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  budgetPanel: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(51,65,85,0.9)',
    backgroundColor: 'rgba(15,23,42,0.9)',
    padding: 9,
  },
  budgetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 15 },
  budgetName: { flex: 1, fontFamily: F.bold, fontSize: 12, color: C.muted, letterSpacing: 0.4 },
  topBid: { borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginLeft: 4 },
  topBidText: { fontFamily: F.extra, fontSize: 8, color: '#0b1224', letterSpacing: 0.6 },
  budgetLine: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 1 },
  budgetMoney: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  budgetValue: { fontFamily: F.italicExtra, fontSize: 24, lineHeight: 26 },
  budgetCount: { fontFamily: F.extra, fontSize: 12, color: C.dim, marginBottom: 3 },
  budgetTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(30,41,59,0.9)',
    overflow: 'hidden',
    marginTop: 4,
  },
  budgetFill: { height: '100%', borderRadius: 999 },

  lotArea: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  lotInfo: { flex: 1 },
  tierChip: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginBottom: 4,
  },
  tierText: { fontFamily: F.extra, fontSize: 11, letterSpacing: 1.4 },
  bidCaption: { fontFamily: F.extra, fontSize: 10, letterSpacing: 2, color: C.dim },
  price: { fontFamily: F.italicExtra, fontSize: 46, color: C.gold, lineHeight: 48 },
  leader: { fontFamily: F.extra, fontSize: 13, letterSpacing: 0.8, marginTop: -2 },
  noBids: { fontFamily: F.extra, fontSize: 13, letterSpacing: 0.8, color: C.dim, marginTop: -2 },
  clubLine: { fontFamily: F.bold, fontSize: 12, color: '#e2e8f0', marginTop: 3 },
  baseLine: { fontFamily: F.bold, fontSize: 11, color: C.dim, marginTop: 4 },

  historyPanel: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
    backgroundColor: 'rgba(2,6,23,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 58,
  },
  historyHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  historyLabel: { fontFamily: F.extra, fontSize: 10, letterSpacing: 1.8, color: C.dim },
  warChip: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.7)',
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginRight: 6,
  },
  warText: { fontFamily: F.extra, fontSize: 8, color: '#fca5a5', letterSpacing: 1 },
  historyScroll: { alignItems: 'center', gap: 6, paddingRight: 8 },
  historyEmpty: { fontFamily: F.bold, fontSize: 12, color: C.dim },
  historyChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyTeam: { fontFamily: F.bold, fontSize: 11, maxWidth: 60 },
  historyAmount: { fontFamily: F.extra, fontSize: 12, color: '#e2e8f0' },

  timerWrap: { marginTop: 10 },
  timerTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(30,41,59,0.9)',
    overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 999, backgroundColor: C.gold },
  timerText: { fontFamily: F.extra, fontSize: 9, letterSpacing: 1.6, color: C.dim, marginTop: 3, textAlign: 'right' },

  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(2,6,23,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 10,
  },
  turnDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  turnText: { flex: 1, fontFamily: F.extra, fontSize: 14, color: '#e2e8f0', letterSpacing: 0.8 },
  maxText: { fontFamily: F.italicExtra, fontSize: 15, letterSpacing: 0.6 },

  bidGrid: { flexDirection: 'row', gap: 7, marginTop: 8 },
  bidCell: { flex: 1 },
  bidBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.6)',
    backgroundColor: 'rgba(15,23,42,0.95)',
    alignItems: 'center',
    paddingVertical: 7,
  },
  bidOff: { opacity: 0.4 },
  bidLabel: { fontFamily: F.extra, fontSize: 11, letterSpacing: 1.2, color: '#cbd5e1' },
  bidAmount: { fontFamily: F.italicExtra, fontSize: 21, lineHeight: 23 },

  passBtn: {
    marginTop: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderBottomWidth: 4,
    borderBottomColor: '#450a0a',
    backgroundColor: '#b91c1c',
    paddingVertical: 9,
    alignItems: 'center',
    overflow: 'hidden',
  },
  passOn: {
    borderColor: '#ffffff',
    backgroundColor: '#dc2626',
    shadowColor: '#ef4444',
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  passShine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '48%',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  passLabel: { fontFamily: F.italicExtra, fontSize: 22, color: '#fff', letterSpacing: 1 },
  passSub: { fontFamily: F.bold, fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: -2 },

  statsBody: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  statsBars: { flex: 1 },
  statsName: { fontFamily: F.italicExtra, fontSize: 22, color: '#fff', lineHeight: 24 },
  statsMeta: { fontFamily: F.bold, fontSize: 12, color: C.muted, marginBottom: 6 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalText: { fontFamily: F.bold, fontSize: 16, color: C.muted, textAlign: 'center', lineHeight: 21 },
});
