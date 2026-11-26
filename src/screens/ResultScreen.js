import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useGame } from '../context/GameContext';
import { useRouter } from '../navigation/Router';
import { teamStrength } from '../utils/gameLogic';
import Screen from '../components/Screen';
import PressableScale from '../components/PressableScale';
import GameButton from '../components/GameButton';
import Icon from '../components/Icon';
import PlayerCard from '../components/PlayerCard';
import Pitch from '../components/Pitch';
import { C, F } from '../theme';

const K = [C.gold, C.blue];

function Placeholder({ height, accent, label }) {
  return (
    <View style={[styles.placeholder, { height, borderColor: `${accent}55` }]}>
      <View style={[styles.placeholderGlow, { backgroundColor: `${accent}14` }]} />
      <Text style={[styles.placeholderText, { color: accent }]}>{label}</Text>
    </View>
  );
}

export default function ResultScreen() {
  const {
    lineups,
    totals,
    auction,
    db,
    typeFor,
    displayName,
    startMatch,
    startDraft,
    resetFlow,
  } = useGame();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { push: navPush, replace: navReplace, reset: navReset } = router;
  const [step, setStep] = useState(0);

  const isAuction = auction.active;

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 260);
    const t2 = setTimeout(() => setStep(2), 980);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const pitchH = Math.round(Math.max(300, Math.min(410, (width - 32) * 1.02)));
  const total0 = totals[0];
  const total1 = totals[1];
  const sum = Math.max(1, total0 + total1);
  const p0 = Math.min(0.85, Math.max(0.15, total0 / sum));
  const canPlay = lineups[0].some(Boolean) && lineups[1].some(Boolean);

  const kickoff = () => {
    startMatch();
    navPush('Match');
  };

  const home = () => {
    resetFlow();
    navReset('Home');
  };

  const newDraft = () => {
    startDraft();
    navReplace('Draft');
  };

  const newAuction = () => {
    resetFlow();
    navReplace('AuctionSetup');
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <PressableScale onPress={home} style={{ width: 44 }} scaleTo={0.9}>
          <View style={styles.iconBtn}>
            <Icon name="close" size={20} color="#cbd5e1" />
          </View>
        </PressableScale>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>THE SQUADS</Text>
          <Text style={styles.subtitle}>
            {isAuction ? 'AUCTION COMPLETE' : 'DRAFT COMPLETE'} · 4-3-3 LOCKED
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <Animated.View entering={FadeIn.duration(360)} style={styles.vsCard}>
        <View style={styles.vsSide}>
          <Text numberOfLines={1} style={styles.vsName}>{displayName(0)}</Text>
          <Text style={[styles.vsTotal, { color: K[0] }]}>{total0}</Text>
          <Text style={styles.vsLabel}>
            {isAuction ? `${auction.spent[0]}M SPENT` : 'OVR TOTAL'}
          </Text>
        </View>
        <View style={styles.vsBadge}>
          <Text style={styles.vsBadgeText}>VS</Text>
        </View>
        <View style={styles.vsSide}>
          <Text numberOfLines={1} style={styles.vsName}>{displayName(1)}</Text>
          <Text style={[styles.vsTotal, { color: K[1] }]}>{total1}</Text>
          <Text style={styles.vsLabel}>
            {isAuction ? `${auction.spent[1]}M SPENT` : 'OVR TOTAL'}
          </Text>
        </View>

        <View style={styles.powerTrack}>
          <View style={[styles.powerFill, { flex: p0, backgroundColor: K[0] }]} />
          <View style={[styles.powerFill, { flex: 1 - p0, backgroundColor: K[1] }]} />
        </View>
      </Animated.View>

      {[0, 1].map((t) => {
        const lineup = lineups[t];
        const filled = lineup.filter(Boolean).length;
        const star = lineup
          .filter(Boolean)
          .slice()
          .sort((a, b) => b.o - a.o)[0];
        const strength = teamStrength(lineup);
        return (
          <View key={t} style={styles.teamBlock}>
            <View style={styles.teamHead}>
              <View style={[styles.teamDot, { backgroundColor: K[t] }]} />
              <Text numberOfLines={1} style={styles.teamName}>{displayName(t)}</Text>
              <View style={[styles.teamChip, { borderColor: `${K[t]}66` }]}>
                <Text style={[styles.teamChipText, { color: K[t] }]}>
                  {filled}/{isAuction ? auction.N : 11}
                </Text>
              </View>
            </View>
            <View style={styles.teamMetaRow}>
              {star ? (
                <PlayerCard
                  width={46}
                  rating={star.o}
                  position={star.p}
                  club={star.c}
                  name={star.n}
                  tier={typeFor(star)[0]}
                  image={star.image || (db.cardMap[star.id] && db.cardMap[star.id].img)}
                />
              ) : null}
              <Text style={styles.teamMeta} numberOfLines={1}>
                {star ? `★ ${star.n} ${star.o}` : 'No players yet'}
              </Text>
              <Text style={styles.teamMeta}>
                ATT {Math.round(strength.attack)} · DEF {Math.round(strength.defence)}
              </Text>
            </View>

            {step > t ? (
              <Pitch lineup={lineup} accent={K[t]} animate height={pitchH} />
            ) : (
              <Placeholder
                height={pitchH}
                accent={K[t]}
                label={step === 0 ? 'REVEALING SQUADS…' : 'SETTING THE LINEUP…'}
              />
            )}
          </View>
        );
      })}

      <GameButton
        label="KICK OFF"
        variant="gold"
        size="lg"
        slant
        disabled={!canPlay}
        icon={<Icon name="whistle" size={24} color="#161000" />}
        onPress={kickoff}
        style={{ marginTop: 18 }}
      />
      {!canPlay ? (
        <Text style={styles.warn}>Both teams need at least one player to kick off.</Text>
      ) : null}

      <View style={styles.secondaryRow}>
        <GameButton label="HOME" variant="dark" size="md" onPress={home} style={styles.half} />
        <GameButton
          label={isAuction ? 'NEW AUCTION' : 'NEW DRAFT'}
          variant="ghost"
          size="md"
          onPress={isAuction ? newAuction : newDraft}
          style={styles.half}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 6, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerCenter: { alignItems: 'center' },
  title: { fontFamily: F.italicExtra, fontSize: 28, color: '#fff', letterSpacing: 0.8 },
  subtitle: { fontFamily: F.extra, fontSize: 10, letterSpacing: 1.8, color: C.dim },
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

  vsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: 'rgba(15,23,42,0.9)',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },
  vsSide: { flex: 1, alignItems: 'center' },
  vsName: { fontFamily: F.extra, fontSize: 14, color: '#e2e8f0', letterSpacing: 0.4, maxWidth: '100%' },
  vsTotal: { fontFamily: F.italicExtra, fontSize: 40, lineHeight: 42 },
  vsLabel: { fontFamily: F.extra, fontSize: 9, letterSpacing: 1.4, color: C.dim },
  vsBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(2,6,23,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsBadgeText: { fontFamily: F.italicExtra, fontSize: 18, color: C.muted },
  powerTrack: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 6,
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: 'rgba(30,41,59,0.9)',
  },
  powerFill: { height: '100%' },

  teamBlock: { marginBottom: 16 },
  teamHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  teamDot: { width: 9, height: 9, borderRadius: 5, marginRight: 7 },
  teamName: { flex: 1, fontFamily: F.italicExtra, fontSize: 22, color: '#fff' },
  teamChip: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 0.5 },
  teamChipText: { fontFamily: F.extra, fontSize: 11, letterSpacing: 0.8 },
  teamMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  teamMeta: { fontFamily: F.bold, fontSize: 11, color: C.muted, flexShrink: 1 },

  placeholder: {
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(2,6,23,0.5)',
  },
  placeholderGlow: { ...StyleSheet.absoluteFillObject },
  placeholderText: { fontFamily: F.italicExtra, fontSize: 18, letterSpacing: 2 },

  warn: { fontFamily: F.bold, fontSize: 12, color: '#fca5a5', textAlign: 'center', marginTop: 6 },
  secondaryRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  half: { flex: 1 },
});
