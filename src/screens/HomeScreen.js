import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGame } from '../context/GameContext';
import { useRouter } from '../navigation/Router';
import { MODES } from '../data/constants';
import PressableScale from '../components/PressableScale';
import GameButton from '../components/GameButton';
import Icon from '../components/Icon';
import PlayerCard from '../components/PlayerCard';
import { C, F, M3 } from '../theme';

function LevelRing({ progress, matches }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <View style={styles.levelRing}>
      <Svg width={66} height={66}>
        <Circle cx={33} cy={33} r={radius} stroke="#334155" strokeWidth={4} fill="none" />
        <Circle
          cx={33}
          cy={33}
          r={radius}
          stroke={C.gold}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference * progress} ${circumference}`}
          transform="rotate(-90 33 33)"
        />
      </Svg>
      <View style={styles.levelCenter}>
        <Icon name="trophy" size={22} color={C.gold} />
      </View>
      <View style={styles.levelBadge}>
        <Text style={styles.levelBadgeText}>{1 + Math.floor(matches / 3)}</Text>
      </View>
    </View>
  );
}

function VsBadge() {
  return (
    <View style={styles.vs}>
      <Text style={styles.vsText}>VS</Text>
    </View>
  );
}

export default function HomeScreen() {
  const {
    names,
    setName,
    mode,
    stats,
    startDraft,
    settings,
  } = useGame();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardW = Math.min(152, Math.max(118, (width - 84) / 2));

  const matches = stats.matches;
  const progress = (matches % 3) / 3;

  const onPlay = () => {
    if (mode === 'A') {
      router.push('AuctionSetup');
    } else {
      startDraft();
      router.push('Draft');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(M3.motion.long)} style={styles.topRow}>
          <LevelRing progress={progress} matches={matches} />
          <View style={styles.topMeta}>
            <Text style={styles.levelText}>LV. {1 + Math.floor(matches / 3)}</Text>
            <View style={styles.xpRow}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.xpBar, i < matches % 3 && styles.xpBarOn]} />
              ))}
            </View>
          </View>
          <View style={{ flex: 1 }} />
          <View style={styles.matchesChip}>
            <Icon name="coin" size={17} color={C.gold} />
            <Text style={styles.matchesText}>{matches}</Text>
          </View>
          <PressableScale onPress={() => router.push('Settings')} style={styles.iconBtn} scaleTo={0.9}>
            <View style={styles.iconBtnInner}>
              <Icon name="settings" size={20} color="#cbd5e1" />
            </View>
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.logoBlock}>
          <View style={styles.tagRow}>
            <View style={styles.tagLine} />
            <Text style={styles.tagText}>ULTIMATE FOOTBALL DRAFT</Text>
            <View style={[styles.tagLine, { transform: [{ scaleX: -1 }] }]} />
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.titleWhite}>DRAFT</Text>
            <Text style={styles.titleGold}>DUEL</Text>
          </View>
        </Animated.View>

        <View style={styles.hero}>
          <PlayerCard
            width={cardW}
            home={{ side: 0, label: 'P1', name: names[0], onChange: (v) => setName(0, v) }}
          />
          <PlayerCard
            width={cardW}
            home={{ side: 1, label: 'P2', name: names[1], onChange: (v) => setName(1, v) }}
          />
          <VsBadge />
        </View>

      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(260).duration(450)}
        style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(2,6,23,0)', 'rgba(2,6,23,0.97) 55%']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.dockRow}>
          <View style={styles.dockSide}>
            <GameButton label="TEAMS" variant="blue" size="sm" icon={<Icon name="teams" size={17} color="#fff" />} onPress={() => router.push('Teams')} slant />
          </View>
          <View style={styles.dockPlay}>
            <GameButton label="PLAY" variant="gold" size="lg" onPress={onPlay} slant />
          </View>
          <View style={styles.dockSide}>
            <GameButton
              label="MODE"
              variant="blue"
              size="sm"
              icon={<Icon name="modes" size={16} color="#fff" />}
              onPress={() => router.push('Modes')}
              slant
            />
          </View>
        </View>
        <Text style={styles.dockHint}>
          {settings.sound ? 'SOUND ON' : 'SOUND OFF'} · {MODES[mode].label} MODE
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 220 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelRing: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center' },
  levelCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 5,
    borderRadius: 12,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#020617',
  },
  levelBadgeText: { fontFamily: F.extra, fontSize: 14, color: '#111' },
  topMeta: { marginLeft: 2 },
  levelText: { fontFamily: F.italicExtra, fontSize: 22, color: '#fff', letterSpacing: 0.5 },
  xpRow: { flexDirection: 'row', gap: 3, marginTop: 5 },
  xpBar: { width: 24, height: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#475569', transform: [{ skewX: '-22deg' }] },
  xpBarOn: { backgroundColor: C.gold, borderColor: '#fde68a' },
  matchesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: M3.shape.md,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.4)',
    backgroundColor: 'rgba(2,6,23,0.8)',
  },
  matchesText: { fontFamily: F.extra, fontSize: 20, color: '#fff' },
  iconBtn: { width: M3.touch },
  iconBtnInner: {
    width: M3.touch,
    height: M3.touch,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    backgroundColor: 'rgba(15,23,42,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBlock: { alignItems: 'center', marginTop: 16 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagLine: { width: 30, height: 2, backgroundColor: 'rgba(96,165,250,0.8)' },
  tagText: { fontFamily: F.extra, fontSize: 11, letterSpacing: 3.2, color: '#93c5fd' },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  titleWhite: {
    fontFamily: F.italicExtra,
    fontSize: 58,
    color: '#fff',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  titleGold: {
    fontFamily: F.italicExtra,
    fontSize: 58,
    color: C.gold,
    letterSpacing: -1,
    marginLeft: 8,
    textShadowColor: 'rgba(250,204,21,0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    height: 212,
  },
  heroCard: {
    width: 146,
    height: 196,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 12,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  heroGloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '42%', backgroundColor: 'rgba(255,255,255,0.16)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { fontFamily: F.italicExtra, fontSize: 30, color: '#fff', lineHeight: 32 },
  heroSub: { fontFamily: F.extra, fontSize: 9, letterSpacing: 1.6, color: 'rgba(255,255,255,0.8)' },
  heroAvatar: {
    alignSelf: 'center',
    marginTop: 8,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: { fontFamily: F.italicExtra, fontSize: 24, color: '#fff' },
  heroInput: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: F.italicExtra,
    fontSize: 21,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 2,
  },
  heroFormation: {
    textAlign: 'center',
    marginTop: 5,
    fontFamily: F.extra,
    fontSize: 11,
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.85)',
  },
  vs: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e2231a',
    borderWidth: 2,
    borderColor: '#ffd27a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff5028',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
    zIndex: 5,
  },
  vsText: { fontFamily: F.italicExtra, fontSize: 21, color: '#fff' },
  modeGrid: { flexDirection: 'row', gap: 8, marginTop: 8 },
  modeCell: { flex: 1 },
  modeTile: {
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(148,163,184,0.25)',
    backgroundColor: 'rgba(8,14,32,0.85)',
    gap: 2,
  },
  modeTileActive: {
    borderColor: C.gold,
    backgroundColor: 'rgba(250,204,21,0.16)',
    shadowColor: C.gold,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  modeLabel: { fontFamily: F.italicExtra, fontSize: 13, color: C.muted, letterSpacing: 0.4 },
  modeCount: { fontFamily: F.bold, fontSize: 11, color: C.dim },
  modeBlurb: { textAlign: 'center', marginTop: 10, fontFamily: F.bold, fontSize: 14, letterSpacing: 1, color: C.muted },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 30,
  },
  dockRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  dockSide: { flex: 0.82 },
  dockPlay: { flex: 1.7 },
  dockHint: {
    textAlign: 'center',
    marginTop: 8,
    fontFamily: F.extra,
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(148,163,184,0.7)',
  },
});
